<?php

namespace App\Services;

use App\Models\Ride;
use App\Enums\RideStatus;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function daily(): array
    {
        return [
            'rides' => Ride::whereDate('created_at', today())->count(),
            'completed' => Ride::whereDate('completed_at', today())->where('status', RideStatus::RideCompleted)->count(),
            'revenue' => Ride::whereDate('completed_at', today())->where('status', RideStatus::RideCompleted)->sum('actual_fare'),
        ];
    }

    public function weekly(): array
    {
        return [
            'rides' => Ride::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'completed' => Ride::whereBetween('completed_at', [now()->startOfWeek(), now()->endOfWeek()])->where('status', RideStatus::RideCompleted)->count(),
            'revenue' => Ride::whereBetween('completed_at', [now()->startOfWeek(), now()->endOfWeek()])->where('status', RideStatus::RideCompleted)->sum('actual_fare'),
        ];
    }

    public function monthly(): array
    {
        return [
            'rides' => Ride::whereMonth('created_at', now()->month)->count(),
            'completed' => Ride::whereMonth('completed_at', now()->month)->where('status', RideStatus::RideCompleted)->count(),
            'revenue' => Ride::whereMonth('completed_at', now()->month)->where('status', RideStatus::RideCompleted)->sum('actual_fare'),
        ];
    }

    public function revenue(): array
    {
        return [
            'total' => Ride::where('status', RideStatus::RideCompleted)->sum('actual_fare'),
            'by_month' => Ride::where('status', RideStatus::RideCompleted)
                ->select(DB::raw('strftime("%Y-%m", completed_at) as month'), DB::raw('sum(actual_fare) as revenue'))
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->toArray(),
        ];
    }
}
