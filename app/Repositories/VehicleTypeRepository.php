<?php

namespace App\Repositories;

use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Collection;

class VehicleTypeRepository
{
    public function findById(int $id): ?VehicleType
    {
        return VehicleType::find($id);
    }

    public function findBySlug(string $slug): ?VehicleType
    {
        return VehicleType::where('slug', $slug)->first();
    }

    public function all(): Collection
    {
        return VehicleType::where('is_active', true)->get();
    }
}
