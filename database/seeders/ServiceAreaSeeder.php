<?php

namespace Database\Seeders;

use App\Models\ServiceArea;
use Illuminate\Database\Seeder;

class ServiceAreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            [
                'name' => 'Cairo',
                'slug' => 'cairo',
                'city' => 'Cairo',
                'governorate' => 'Cairo',
                'center_latitude' => 30.0444,
                'center_longitude' => 31.2357,
                'radius_km' => 50,
                'cities' => json_encode(['Cairo', 'Nasr City', 'Heliopolis', 'Maadi', 'Zamalek', 'Mohandeseen', 'Dokki', 'Garden City']),
                'is_active' => true,
            ],
            [
                'name' => 'Giza',
                'slug' => 'giza',
                'city' => 'Giza',
                'governorate' => 'Giza',
                'center_latitude' => 30.0131,
                'center_longitude' => 31.2089,
                'radius_km' => 50,
                'cities' => json_encode(['Giza', 'Haram', 'Faisal', 'October City', 'Sheikh Zayed', '6th October']),
                'is_active' => true,
            ],
        ];

        foreach ($areas as $area) {
            ServiceArea::updateOrCreate(
                ['slug' => $area['slug']],
                $area
            );
        }
    }
}
