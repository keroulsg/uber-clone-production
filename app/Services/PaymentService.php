<?php

namespace App\Services;

use App\Models\Ride;
use App\Models\Payment;
use App\Models\LedgerEntry;
use App\Models\DriverDebt;
use App\Models\Notification;
use App\Models\Setting;
use App\Enums\RideStatus;
use App\Enums\PaymentStatus;
use App\Repositories\WalletRepository;
use App\Repositories\RideRepository;
use App\Models\RideStatusHistory;
use App\Enums\TransactionType;

class PaymentService
{
    public function __construct(
        private FareCalculationService $fareCalc,
        private WalletRepository $walletRepo,
        private RideRepository $rideRepo,
    ) {}

    public function getCommissionRate(): float
    {
        return $this->fareCalc->getCommissionRate();
    }

    public function processPayment(Ride $ride, float $actualDistanceKm, int $actualDurationMin, ?float $cashReceived = null, bool $creditChange = false): Payment
    {
        $vehicleType = $ride->vehicleType ?? ($ride->vehicle_type_id ? app(\App\Repositories\VehicleTypeRepository::class)->findById($ride->vehicle_type_id) : null);
        $vehicle = $ride->vehicle;

        $freshFare = $this->fareCalc->calculateEstimatedFare($vehicleType, $actualDistanceKm, $actualDurationMin, $vehicle);

        $commissionRate = $this->fareCalc->getCommissionRate($ride->driver_pickup_distance_km);
        $waitingFee = $ride->waiting_started_at
            ? $this->fareCalc->calculateWaitingFee(now()->diffInMinutes($ride->waiting_started_at))
            : 0;

        $totalFare = round(max($freshFare['total_fare'] ?? 0, 0) + $waitingFee, 2);
        $commission = round($totalFare * $commissionRate, 2);
        $driverAmount = round($totalFare - $commission, 2);

        $payment = \Illuminate\Support\Facades\DB::transaction(function () use ($ride, $totalFare, $commission, $driverAmount, $commissionRate, $waitingFee, $cashReceived, $creditChange) {
            $existingPayment = Payment::where('ride_id', $ride->id)->lockForUpdate()->first();
            if ($existingPayment) {
                return $existingPayment;
            }

            $payment = Payment::create([
                'ride_id' => $ride->id,
                'amount' => $totalFare,
                'platform_fee' => $commission,
                'driver_amount' => $driverAmount,
                'tax_amount' => 0,
                'currency' => Setting::where('key', 'default_currency')->value('value') ?? 'EGP',
                'payment_method' => $ride->payment_method,
                'status' => PaymentStatus::Completed,
                'applied_commission_rate' => $commissionRate,
                'company_commission' => $commission,
                'paid_at' => now(),
            ]);

            \App\Services\AuditLogService::log(
                'payment_created',
                null,
                null,
                Payment::class,
                $payment->id,
                $totalFare,
                ['ride_id' => $ride->id, 'payment_method' => $ride->payment_method]
            );

            if ($ride->payment_method === 'wallet') {
                $riderWallet = $this->walletRepo->findByUser($ride->rider_id, true);
                $riderBalanceBefore = $riderWallet ? (float) $riderWallet->balance : 0;

                $deducted = $this->walletRepo->deductBalance($ride->rider_id, $totalFare);
                if (!$deducted) {
                    $payment->update(['status' => PaymentStatus::Failed]);
                    throw new \RuntimeException('Insufficient wallet balance');
                }

                $riderWalletAfter = $this->walletRepo->findByUser($ride->rider_id, true);
                $riderBalanceAfter = $riderWalletAfter ? (float) $riderWalletAfter->balance : 0;

                $driverWallet = $this->walletRepo->findByUser($ride->driver?->user_id, true);
                if (!$driverWallet) {
                    $this->walletRepo->createForUser($ride->driver?->user_id);
                    $driverWallet = $this->walletRepo->findByUser($ride->driver?->user_id, true);
                }
                $driverBalanceBefore = (float) $driverWallet->balance;
                $this->walletRepo->addBalance($ride->driver?->user_id, $driverAmount);
                $driverWalletAfter = $this->walletRepo->findByUser($ride->driver?->user_id, true);
                $driverBalanceAfter = $driverWalletAfter ? (float) $driverWalletAfter->balance : 0;

                LedgerEntry::create([
                    'user_id' => $ride->rider_id,
                    'type' => 'debit',
                    'amount' => $totalFare,
                    'balance_before' => $riderBalanceBefore,
                    'balance_after' => $riderBalanceAfter,
                    'reference_type' => Ride::class,
                    'reference_id' => $ride->id,
                    'description' => "Ride payment #{$ride->id}",
                ]);

                LedgerEntry::create([
                    'user_id' => $ride->driver?->user_id,
                    'type' => 'credit',
                    'amount' => $driverAmount,
                    'balance_before' => $driverBalanceBefore,
                    'balance_after' => $driverBalanceAfter,
                    'reference_type' => Payment::class,
                    'reference_id' => $payment->id,
                    'description' => "Driver earnings for ride #{$ride->id}",
                ]);
            } else {
                $changeDue = $cashReceived !== null ? max(0, $cashReceived - $totalFare) : 0;

                LedgerEntry::create([
                    'user_id' => $ride->rider_id,
                    'type' => 'cash_payment',
                    'amount' => $totalFare,
                    'balance_before' => 0,
                    'balance_after' => 0,
                    'reference_type' => Ride::class,
                    'reference_id' => $ride->id,
                    'description' => "Cash ride #{$ride->id}" . ($changeDue > 0 ? " (received {$cashReceived})" : ''),
                ]);

                if ($changeDue > 0 && $creditChange && $ride->rider_id) {
                    $riderWallet = $this->walletRepo->findByUser($ride->rider_id, true);
                    $riderBalanceBefore = $riderWallet ? (float) $riderWallet->balance : 0;
                    $this->walletRepo->addBalance($ride->rider_id, $changeDue);
                    $riderWalletAfter = $this->walletRepo->findByUser($ride->rider_id, true);
                    $riderBalanceAfter = $riderWalletAfter ? (float) $riderWalletAfter->balance : 0;

                    LedgerEntry::create([
                        'user_id' => $ride->rider_id,
                        'type' => 'cash_change_credit',
                        'amount' => $changeDue,
                        'balance_before' => $riderBalanceBefore,
                        'balance_after' => $riderBalanceAfter,
                        'reference_type' => Ride::class,
                        'reference_id' => $ride->id,
                        'description' => "Cash change credit for ride #{$ride->id}",
                    ]);

                    $debt1 = DriverDebt::create([
                        'driver_id' => $ride->driver_id,
                        'ride_id' => $ride->id,
                        'type' => 'cash_change_liability',
                        'amount' => $changeDue,
                    ]);

                    \App\Services\AuditLogService::log(
                        'driver_debt_created',
                        $ride->driver?->user_id,
                        'driver',
                        DriverDebt::class,
                        $debt1->id,
                        $changeDue,
                        ['type' => 'cash_change_liability', 'ride_id' => $ride->id]
                    );

                    if ($ride->driver) {
                        Notification::create([
                            'type' => 'cash_change_liability',
                            'notifiable_type' => \App\Models\User::class,
                            'notifiable_id' => $ride->driver->user_id,
                            'data' => ['ride_id' => $ride->id, 'amount' => $changeDue, 'message' => "Cash change liability of {$changeDue} recorded."],
                        ]);
                    }
                }
            }

            if ($ride->payment_method === 'cash') {
                $debt2 = DriverDebt::create([
                    'driver_id' => $ride->driver_id,
                    'ride_id' => $ride->id,
                    'type' => 'commission',
                    'amount' => $commission,
                ]);

                \App\Services\AuditLogService::log(
                    'driver_debt_created',
                    $ride->driver?->user_id,
                    'driver',
                    DriverDebt::class,
                    $debt2->id,
                    $commission,
                    ['type' => 'commission', 'ride_id' => $ride->id]
                );

                if ($ride->driver) {
                    Notification::create([
                        'type' => 'commission_debt',
                        'notifiable_type' => \App\Models\User::class,
                        'notifiable_id' => $ride->driver->user_id,
                        'data' => ['ride_id' => $ride->id, 'amount' => $commission, 'message' => 'Commission debt recorded.'],
                    ]);

                    LedgerEntry::create([
                        'user_id' => $ride->driver->user_id,
                        'type' => 'commission_debt',
                        'amount' => $commission,
                        'balance_before' => 0,
                        'balance_after' => 0,
                        'reference_type' => Payment::class,
                        'reference_id' => $payment->id,
                        'description' => "Commission debt for ride #{$ride->id}",
                    ]);
                }
            }

            $ride->update([
                'actual_fare' => $totalFare,
                'payment_status' => 'completed',
            ]);

            return $payment;
        });

        return $payment;
    }
}
