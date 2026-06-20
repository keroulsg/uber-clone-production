<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FeatureFlag;

class SavedPlacesFeatureFlagSeeder extends Seeder
{
    public function run(): void
    {
        FeatureFlag::firstOrCreate(
            ['code' => 'saved_places'],
            [
                'name' => 'Saved Places',
                'description' => 'Enable saved/favorite places for riders',
                'category' => 'rider',
                'is_enabled' => true,
                'visible_in_admin' => true,
                'sort_order' => 10,
            ]
        );
    }
}
