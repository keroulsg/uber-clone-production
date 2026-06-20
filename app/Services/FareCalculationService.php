<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\VehicleType;

class FareCalculationService
{
    public function calculateEstimatedFare(
        VehicleType $vehicleType,
        float $distanceKm,
        int $durationMin,
        ?Vehicle $vehicle = null,
        ?float $pickupDistanceKm = null,
        float $surgeMultiplier = 1.0,
        bool $isPeak = false,
        bool $isNight = false,
        bool $isFemaleDriver = false,
    ): array {
        $fuelPrice = (float) (Setting::where('key', 'default_fuel_price')->first()?->value ?? 20);
        $fuelConsumption = (float) (Setting::where('key', 'default_fuel_consumption')->first()?->value ?? 8.5);
        $fuelCost = $this->calculateFuelCost($distanceKm, $fuelPrice, $fuelConsumption);
        $classMultiplier = $this->getVehicleClassMultiplier($vehicle?->vehicle_class);

        $vehicleTypeCommissionRate = $vehicleType->commission_rate
            ? (float) $vehicleType->commission_rate / 100
            : $this->getCommissionRate($pickupDistanceKm);

        $baseFare = (float) $vehicleType->base_fare;
        $distanceFare = $distanceKm * (float) $vehicleType->per_km_rate;
        $timeFare = $durationMin * (float) $vehicleType->per_minute_rate;

        $subtotal = ($baseFare + $distanceFare + $timeFare + $fuelCost) * $classMultiplier;
        $subtotal = round($subtotal, 2);

        $totalFare = round(max($subtotal, (float) $vehicleType->minimum_fare), 2);

        $pickupCompensation = 0;
        if ($pickupDistanceKm !== null && $pickupDistanceKm > 2) {
            $threshold = 2;
            $excessKm = $pickupDistanceKm - $threshold;
            if ($pickupDistanceKm <= 5) {
                $pickupComp = (float) (Setting::where('key', 'pickup_comp_rate_2_5')->first()?->value ?? 3);
                $pickupCompensation = round($excessKm * $pickupComp, 2);
            } else {
                $pickupComp = (float) (Setting::where('key', 'pickup_comp_rate_5_plus')->first()?->value ?? 5);
                $pickupCompensation = round($excessKm * $pickupComp, 2);
            }
            $totalFare = round($totalFare + $pickupCompensation, 2);
        }

        if ($surgeMultiplier > 1.0) {
            $totalFare = round($totalFare * $surgeMultiplier, 2);
        }

        if ($isPeak) {
            $peakRate = (float) (Setting::where('key', 'peak_surcharge_rate')->first()?->value ?? 10);
            $totalFare = round($totalFare * (1 + $peakRate / 100), 2);
        }

        if ($isNight) {
            $nightRate = (float) (Setting::where('key', 'night_surcharge_rate')->first()?->value ?? 15);
            $totalFare = round($totalFare * (1 + $nightRate / 100), 2);
        }

        $femaleSurcharge = 0;
        if ($isFemaleDriver) {
            $femaleRate = (float) (Setting::where('key', 'female_driver_surcharge_rate')->first()?->value ?? 10);
            $minSurcharge = (float) (Setting::where('key', 'female_minimum_surcharge')->first()?->value ?? 10);
            $femaleSurcharge = round(max($totalFare * $femaleRate / 100, $minSurcharge), 2);
            $totalFare = round($totalFare + $femaleSurcharge, 2);
            $femaleCommRate = (float) (Setting::where('key', 'female_commission_rate')->first()?->value ?? 12);
            $vehicleTypeCommissionRate = $femaleCommRate / 100;
        }

        $finalFare = round($totalFare, 2);

        $companyCommission = round($finalFare * $vehicleTypeCommissionRate, 2);
        $driverAmount = round($finalFare - $companyCommission, 2);

        $minDriverProfit = (float) (Setting::where('key', 'minimum_driver_profit')->first()?->value ?? 20);
        $netProfit = $driverAmount - $fuelCost;
        if ($netProfit < $minDriverProfit) {
            $shortfall = round($minDriverProfit - $netProfit, 2);
            $finalFare = round($finalFare + $shortfall, 2);
            $companyCommission = round($finalFare * $vehicleTypeCommissionRate, 2);
            $driverAmount = round($finalFare - $companyCommission, 2);
        }

        return [
            'base' => $baseFare,
            'distance' => round($distanceFare, 2),
            'time' => round($timeFare, 2),
            'base_fare' => $baseFare,
            'distance_fare' => round($distanceFare, 2),
            'time_fare' => round($timeFare, 2),
            'fuel_cost' => round($fuelCost, 2),
            'class_multiplier' => $classMultiplier,
            'subtotal' => $subtotal,
            'pickup_compensation' => $pickupCompensation,
            'female_surcharge' => $femaleSurcharge,
            'surge_multiplier' => $surgeMultiplier,
            'surge_amount' => 0,
            'waiting_fee' => 0,
            'total_fare' => $finalFare,
            'commission_rate' => round($vehicleTypeCommissionRate * 100, 2),
            'company_commission' => $companyCommission,
            'driver_amount' => $driverAmount,
            'fuel_price' => $fuelPrice,
            'fuel_consumption' => $fuelConsumption,
            'net_driver_profit' => round($driverAmount - $fuelCost, 2),
        ];
    }

    public function getCommissionRate(?float $driverPickupDistanceKm = null): float
    {
        $defaultRate = (float) (Setting::where('key', 'default_commission_rate')->first()?->value ?? 10);
        $rate = $defaultRate / 100;

        if ($driverPickupDistanceKm !== null) {
            $threshold = (float) (Setting::where('key', 'long_pickup_threshold_km')->first()?->value ?? 2);
            if ($driverPickupDistanceKm > $threshold) {
                $longRate = (float) (Setting::where('key', 'long_pickup_commission_rate')->first()?->value ?? 8);
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

    private function calculateFuelCost(float $distanceKm, float $fuelPrice, float $fuelConsumption): float
    {
        return round(($distanceKm * $fuelConsumption / 100) * $fuelPrice, 2);
    }

    private function getVehicleClassMultiplier(?string $vehicleClass): float
    {
        if (!$vehicleClass) return 1.0;
        $multiplier = Setting::where('key', "vehicle_class_{$vehicleClass}_multiplier")->first();
        return $multiplier ? (float) $multiplier->value : 1.0;
    }
}
