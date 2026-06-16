<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\DriverDebt;
use Illuminate\Database\Eloquent\Collection;

class DriverDebtService
{
    public function getTotalOutstanding(int $driverId): float
    {
        return (float) DriverDebt::where('driver_id', $driverId)
            ->whereNull('paid_at')
            ->sum('amount');
    }

    public function getDebts(int $driverId): Collection
    {
        return DriverDebt::where('driver_id', $driverId)
            ->whereNull('paid_at')
            ->get();
    }

    public function markAsPaid(int $debtId): bool
    {
        return DriverDebt::where('id', $debtId)->update(['paid_at' => now()]);
    }
}
