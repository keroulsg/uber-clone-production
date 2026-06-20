<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CancellationReason extends Model
{
    protected $fillable = [
        'actor',
        'reason',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function scopeForActor($query, string $actor)
    {
        return $query->where('actor', $actor)->where('is_active', true)->orderBy('sort_order');
    }
}
