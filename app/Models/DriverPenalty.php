<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverPenalty extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'issued_by',
        'reason',
        'amount',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
