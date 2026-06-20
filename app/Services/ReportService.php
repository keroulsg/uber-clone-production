<?php

namespace App\Services;

use App\Models\Ride;
use App\Models\Payment;
use App\Models\Driver;
use App\Models\User;
use App\Models\DriverDebt;
use App\Enums\RideStatus;
use App\Enums\PaymentStatus;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function daily(): array
    {
        $date = today();
        return $this->metricsForRange($date, $date);
    }

    public function weekly(): array
    {
        return $this->metricsForRange(now()->startOfWeek(), now()->endOfWeek());
    }

    public function monthly(): array
    {
        return $this->metricsForRange(now()->startOfMonth(), now()->endOfMonth());
    }

    public function custom(string $from, string $to): array
    {
        return $this->metricsForRange($from, $to);
    }

    public function revenue(): array
    {
        $completedPayments = Payment::where('status', PaymentStatus::Completed);

        $total = (float) (clone $completedPayments)->sum('amount');
        $cashRevenue = (float) (clone $completedPayments)->where('payment_method', 'cash')->sum('amount');
        $walletRevenue = (float) (clone $completedPayments)->where('payment_method', 'wallet')->sum('amount');
        $commissions = (float) (clone $completedPayments)->sum('company_commission');

        $byMonth = (clone $completedPayments)
            ->select(DB::raw("strftime('%Y-%m', paid_at) as month"), DB::raw('sum(amount) as revenue'))
            ->whereNotNull('paid_at')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->toArray();

        return compact('total', 'cashRevenue', 'walletRevenue', 'commissions', 'byMonth');
    }

    public function charts(string $period = 'daily'): array
    {
        $days = match($period) {
            'weekly' => 7,
            'monthly' => 30,
            default => 1,
        };

        $labels = [];
        $revenue = [];
        $rides = [];
        $users = [];
        $drivers = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $labels[] = now()->subDays($i)->format('M d');
            $revenue[] = (float) Payment::whereDate('paid_at', $date)
                ->where('status', PaymentStatus::Completed)->sum('amount');
            $rides[] = Ride::whereDate('completed_at', $date)
                ->where('status', RideStatus::RideCompleted)->count();
            $users[] = User::whereDate('created_at', $date)->count();
            $drivers[] = Driver::whereDate('created_at', $date)->count();
        }

        return compact('labels', 'revenue', 'rides', 'users', 'drivers');
    }

    public function export(string $from, string $to): array
    {
        $rides = Ride::with('rider', 'driver.user', 'vehicleType', 'payment')
            ->whereBetween('created_at', [$from, $to])
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'booking_id' => $r->booking_id,
                'status' => $r->status->value,
                'rider' => $r->rider?->user?->name ?? 'N/A',
                'driver' => $r->driver?->user?->name ?? 'N/A',
                'pickup' => $r->pickup_address,
                'destination' => $r->destination_address,
                'payment_method' => $r->payment_method,
                'fare' => (float) ($r->actual_fare ?? $r->estimated_fare ?? 0),
                'commission' => (float) ($r->payment?->company_commission ?? 0),
                'driver_payout' => (float) ($r->payment?->driver_amount ?? 0),
                'created_at' => $r->created_at?->toISOString(),
                'completed_at' => $r->completed_at?->toISOString(),
            ]);

        $drivers = Driver::with('user')
            ->whereBetween('created_at', [$from, $to])
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'name' => $d->user?->name ?? 'N/A',
                'email' => $d->user?->email ?? 'N/A',
                'status' => $d->status,
                'is_online' => $d->is_online,
                'total_rides' => Ride::where('driver_id', $d->id)->count(),
                'total_earnings' => (float) Payment::whereHas('ride', fn($q) => $q->where('driver_id', $d->id))
                    ->where('status', PaymentStatus::Completed)->sum('driver_amount'),
                'created_at' => $d->created_at?->toISOString(),
            ]);

        $users = User::whereBetween('created_at', [$from, $to])->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'created_at' => $u->created_at?->toISOString(),
            ]);

        $payments = Payment::with('ride.rider', 'ride.driver.user')
            ->whereBetween('paid_at', [$from, $to])
            ->where('status', PaymentStatus::Completed)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'booking_id' => $p->ride?->booking_id ?? 'N/A',
                'rider' => $p->ride?->rider?->user?->name ?? 'N/A',
                'driver' => $p->ride?->driver?->user?->name ?? 'N/A',
                'amount' => (float) $p->amount,
                'commission' => (float) $p->company_commission,
                'driver_payout' => (float) $p->driver_amount,
                'method' => $p->payment_method,
                'paid_at' => $p->paid_at?->toISOString(),
            ]);

        $settlements = \App\Models\DriverSettlement::with('driver.user')
            ->whereBetween('created_at', [$from, $to])
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'driver' => $s->driver?->user?->name ?? 'N/A',
                'amount' => (float) $s->amount,
                'method' => $s->method,
                'status' => $s->status,
                'created_at' => $s->created_at?->toISOString(),
            ]);

        $summary = $this->metricsForRange($from, $to);

        return compact('rides', 'drivers', 'users', 'payments', 'settlements', 'summary');
    }

    private function metricsForRange(string $from, string $to): array
    {
        $completedRides = Ride::where('status', RideStatus::RideCompleted)
            ->whereBetween('completed_at', [$from, $to]);
        $completedRideIds = (clone $completedRides)->pluck('id');

        $completedPayments = Payment::whereIn('ride_id', $completedRideIds)
            ->where('status', PaymentStatus::Completed);

        return [
            'rides' => (clone $completedRides)->count(),
            'total_rides' => Ride::whereBetween('created_at', [$from, $to])->count(),
            'cancelled_rides' => Ride::whereIn('status', [
                RideStatus::Cancelled->value,
                RideStatus::CancelledByRider->value,
                RideStatus::CancelledByDriver->value,
            ])->whereBetween('created_at', [$from, $to])->count(),
            'completed_rides' => (clone $completedRides)->count(),
            'revenue' => (float) (clone $completedPayments)->sum('amount'),
            'cash_revenue' => (float) (clone $completedPayments)->where('payment_method', 'cash')->sum('amount'),
            'wallet_revenue' => (float) (clone $completedPayments)->where('payment_method', 'wallet')->sum('amount'),
            'commissions' => (float) (clone $completedPayments)->sum('company_commission'),
            'avg_fare' => (clone $completedRides)->avg('actual_fare') ?? 0,
            'avg_driver_earnings' => (float) (clone $completedPayments)->avg('driver_amount') ?? 0,
            'active_drivers' => Driver::where('is_online', true)->count(),
            'total_drivers' => Driver::count(),
            'total_riders' => \App\Models\Rider::count(),
            'new_users' => User::whereBetween('created_at', [$from, $to])->count(),
            'outstanding_debt' => (float) DriverDebt::whereNull('paid_at')->sum('amount'),
        ];
    }
}
