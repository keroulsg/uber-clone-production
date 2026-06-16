<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardStatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'totalUsers' => $this->total_users ?? 0,
            'totalDrivers' => $this->total_drivers ?? 0,
            'totalRides' => $this->total_rides ?? 0,
            'activeDrivers' => $this->active_drivers ?? 0,
            'onlineRiders' => $this->online_riders ?? 0,
            'todayRevenue' => (float) ($this->today_revenue ?? 0),
            'weeklyRevenue' => (float) ($this->weekly_revenue ?? 0),
            'monthlyRevenue' => (float) ($this->monthly_revenue ?? 0),
            'totalRevenue' => (float) ($this->total_revenue ?? 0),
            'growthPercentages' => [
                'users' => (float) ($this->user_growth ?? 0),
                'drivers' => (float) ($this->driver_growth ?? 0),
                'rides' => (float) ($this->ride_growth ?? 0),
                'revenue' => (float) ($this->revenue_growth ?? 0),
            ],
        ];
    }
}
