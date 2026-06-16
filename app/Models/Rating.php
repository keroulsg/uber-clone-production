<?php

namespace App\Models;

use App\Enums\RatingType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    use HasFactory;

    protected $fillable = [
        'ride_id',
        'rater_id',
        'rater_type',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rater_type' => RatingType::class,
            'rating' => 'integer',
        ];
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }

    public function rater()
    {
        return $this->morphTo();
    }
}
