<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'ride_id',
        'amount',
        'platform_fee',
        'driver_amount',
        'tax_amount',
        'currency',
        'payment_method',
        'status',
        'transaction_id',
        'paid_at',
        'refunded_at',
        'applied_commission_rate',
        'company_commission',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'driver_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'applied_commission_rate' => 'decimal:4',
            'company_commission' => 'decimal:2',
            'status' => PaymentStatus::class,
            'paid_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }
}
