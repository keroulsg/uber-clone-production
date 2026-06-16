<?php

namespace App\Repositories;

use App\Models\PromoCode;

class PromoCodeRepository
{
    public function findByCode(string $code): ?PromoCode
    {
        return PromoCode::where('code', $code)->where('is_active', true)->first();
    }

    public function incrementUsed(int $id): bool
    {
        return PromoCode::where('id', $id)->increment('used_count');
    }
}
