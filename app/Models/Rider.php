<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rider extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'gender',
        'total_rides',
        'total_spent',
        'average_rating',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'total_rides' => 'integer',
            'total_spent' => 'decimal:2',
            'average_rating' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class);
    }
}
