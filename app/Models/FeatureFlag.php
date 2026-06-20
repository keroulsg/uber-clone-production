<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $fillable = [
        'code', 'name', 'description', 'category',
        'is_enabled', 'visible_in_admin', 'sort_order',
        'rollout_percentage', 'environment',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'visible_in_admin' => 'boolean',
            'sort_order' => 'integer',
            'rollout_percentage' => 'decimal:2',
        ];
    }
}
