<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CancellationReason;

class CancellationReasonSeeder extends Seeder
{
    public function run(): void
    {
        $riderReasons = [
            'Driver is taking too long',
            'Changed my mind',
            'Found another ride',
            'Pickup location mistake',
            'Destination mistake',
            'Payment issue',
            'Safety concern',
            'Other',
        ];

        $driverReasons = [
            'Rider is not reachable',
            'Rider not at pickup location',
            'Traffic / route issue',
            'Vehicle issue',
            'Personal emergency',
            'Safety concern',
            'Payment method issue',
            'Other',
        ];

        foreach ($riderReasons as $i => $reason) {
            CancellationReason::create([
                'actor' => 'rider',
                'reason' => $reason,
                'sort_order' => $i,
            ]);
        }

        foreach ($driverReasons as $i => $reason) {
            CancellationReason::create([
                'actor' => 'driver',
                'reason' => $reason,
                'sort_order' => $i,
            ]);
        }
    }
}
