<?php

namespace App\Services;

use App\Models\User;
use App\Models\Driver;
use App\Models\Ride;
use App\Models\Setting;
use App\Models\LedgerEntry;
use App\Repositories\UserRepository;
use App\Repositories\DriverRepository;
use App\Repositories\RideRepository;
use App\Enums\RideStatus;
use Illuminate\Support\Facades\DB;

class AdminService
{
    public function __construct(
        private UserRepository $userRepo,
        private DriverRepository $driverRepo,
        private RideRepository $rideRepo,
    ) {}

    public function dashboard(): array
    {
        return [
            'total_users' => User::count(),
            'total_drivers' => Driver::count(),
            'total_rides' => Ride::count(),
            'active_drivers' => Driver::where('is_online', true)->count(),
            'today_revenue' => Ride::whereDate('completed_at', today())
                ->where('status', RideStatus::RideCompleted)
                ->sum('actual_fare'),
            'weekly_revenue' => Ride::whereBetween('completed_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->where('status', RideStatus::RideCompleted)
                ->sum('actual_fare'),
            'monthly_revenue' => Ride::whereMonth('completed_at', now()->month)
                ->where('status', RideStatus::RideCompleted)
                ->sum('actual_fare'),
            'total_revenue' => Ride::where('status', RideStatus::RideCompleted)->sum('actual_fare'),
        ];
    }

    public function getSettings(): array
    {
        return Setting::all()->keyBy('key')->toArray();
    }

    public function updateSetting(string $key, string $value): bool
    {
        return Setting::updateOrCreate(['key' => $key], ['value' => $value]) ? true : false;
    }
}
