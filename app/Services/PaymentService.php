<?php

namespace App\Services;

use App\Models\Ride;
use App\Models\Payment;
use App\Models\LedgerEntry;
use App\Models\DriverDebt;
use App\Models\Notification;
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

    public function processPayment(Ride $ride, float $actualDistanceKm, int $actualDurationMin): Payment
    {
        $ride->refresh();

        $commissionRate = $this->fareCalc->getCommissionRate($ride->driver_pickup_distance_km);
        $waitingFee = $ride->waiting_started_at
            ? $this->fareCalc->calculateWaitingFee(now()->diffInMinutes($ride->waiting_started_at))
            : 0;

        $actualFare = $ride->actual_fare ?? $ride->estimated_fare;
        $totalFare = round($actualFare + $waitingFee, 2);
        $commission = round($totalFare * $commissionRate, 2);
        $driverAmount = round($totalFare - $commission, 2);

        $payment = Payment::create([
            'ride_id' => $ride->id,
            'amount' => $totalFare,
            'platform_fee' => $commission,
            'driver_amount' => $ride->payment_method === 'cash' ? 0 : $driverAmount,
            'tax_amount' => 0,
            'currency' => 'USD',
            'payment_method' => $ride->payment_method,
            'status' => PaymentStatus::Completed,
            'applied_commission_rate' => $commissionRate,
            'company_commission' => $commission,
            'paid_at' => now(),
        ]);

        if ($ride->payment_method === 'wallet') {
            $this->walletRepo->deductBalance($ride->rider_id, $totalFare);

            $this->walletRepo->addBalance($ride->driver->user_id, $driverAmount);

            LedgerEntry::create([
                'user_id' => $ride->rider_id,
                'type' => 'debit',
                'amount' => $totalFare,
                'balance_before' => 0,
                'balance_after' => 0,
                'reference_type' => Ride::class,
                'reference_id' => $ride->id,
                'description' => "Ride payment #{$ride->id}",
            ]);
        } else {
            LedgerEntry::create([
                'user_id' => $ride->rider_id,
                'type' => 'cash_payment',
                'amount' => $totalFare,
                'balance_before' => 0,
                'balance_after' => 0,
                'reference_type' => Ride::class,
                'reference_id' => $ride->id,
                'description' => "Cash ride #{$ride->id}",
            ]);
        }

        DriverDebt::create([
            'driver_id' => $ride->driver_id,
            'ride_id' => $ride->id,
            'type' => 'commission',
            'amount' => $commission,
        ]);

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

        $ride->update([
            'actual_fare' => $totalFare,
            'payment_status' => 'completed',
        ]);

        return $payment;
    }
}
