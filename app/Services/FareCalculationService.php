<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\VehicleType;

class FareCalculationService
{
    public function calculateEstimatedFare(VehicleType $vehicleType, float $distanceKm, int $durationMin, ?Vehicle $vehicle = null): array
    {
        $classMultiplier = $this->getVehicleClassMultiplier($vehicle?->vehicle_class);
        $fuelCost = $this->calculateFuelCost($distanceKm, $vehicle);
        $commissionRate = $this->getCommissionRate();

        $baseFare = $vehicleType->base_fare;
        $distanceFare = $distanceKm * $vehicleType->per_km_rate;
        $timeFare = $durationMin * $vehicleType->per_minute_rate;

        $subtotal = ($baseFare + $distanceFare + $timeFare + $fuelCost) * $classMultiplier;
        $subtotal = round($subtotal, 2);

        $waitingFee = 0;
        $totalFare = round(max($subtotal + $waitingFee, $vehicleType->minimum_fare), 2);
        $companyCommission = round($totalFare * $commissionRate, 2);
        $driverAmount = round($totalFare - $companyCommission, 2);

        return [
            'base' => $baseFare,
            'distance' => round($distanceFare, 2),
            'time' => round($timeFare, 2),
            'base_fare' => $baseFare,
            'distance_fare' => round($distanceFare, 2),
            'time_fare' => round($timeFare, 2),
            'fuel_cost' => $fuelCost,
            'class_multiplier' => $classMultiplier,
            'subtotal' => $subtotal,
            'waiting_fee' => $waitingFee,
            'total_fare' => $totalFare,
            'commission_rate' => $commissionRate,
            'company_commission' => $companyCommission,
            'driver_amount' => $driverAmount,
        ];
    }

    public function getCommissionRate(?float $driverPickupDistanceKm = null): float
    {
        $defaultRate = (float) (Setting::where('key', 'company_commission_rate')->first()?->value ?? 10);
        $rate = $defaultRate / 100;

        if ($driverPickupDistanceKm !== null) {
            $threshold = (float) (Setting::where('key', 'long_pickup_threshold_km')->first()?->value ?? 6);
            if ($driverPickupDistanceKm > $threshold) {
                $longRate = (float) (Setting::where('key', 'long_pickup_commission_rate')->first()?->value ?? 9);
                $rate = $longRate / 100;
            }
        }

        return $rate;
    }

    public function calculateWaitingFee(int $waitingMinutes): float
    {
        $freeMinutes = (int) (Setting::where('key', 'waiting_free_minutes')->first()?->value ?? 5);
        $perMinuteRate = (float) (Setting::where('key', 'waiting_fee_per_minute')->first()?->value ?? 0.50);

        if ($waitingMinutes <= $freeMinutes) {
            return 0;
        }

        return round(($waitingMinutes - $freeMinutes) * $perMinuteRate, 2);
    }

    private function getVehicleClassMultiplier(?string $vehicleClass): float
    {
        if (!$vehicleClass) {
            return 1.0;
        }

        $multiplier = Setting::where('key', "vehicle_class_{$vehicleClass}_multiplier")->first();
        return $multiplier ? (float) $multiplier->value : 1.0;
    }

    private function calculateFuelCost(float $distanceKm, ?Vehicle $vehicle): float
    {
        return 0;
    }
}
