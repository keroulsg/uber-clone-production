<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverSettlement extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'amount',
        'method',
        'reference',
        'note',
        'attachment_path',
        'status',
        'provider',
        'provider_reference',
        'provider_transaction_id',
        'verification_status',
        'verified_at',
        'webhook_payload',
        'gateway_fee',
        'net_amount',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'gateway_fee' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'verified_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'webhook_payload' => 'array',
        ];
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
