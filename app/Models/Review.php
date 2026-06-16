<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'ride_id',
        'reviewer_id',
        'reviewer_type',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }

    public function reviewer()
    {
        return $this->morphTo();
    }
}
