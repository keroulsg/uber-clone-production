<?php

namespace App\Models;

use App\Enums\PaymentMethodType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'is_default',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'type' => PaymentMethodType::class,
            'is_default' => 'boolean',
            'details' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
