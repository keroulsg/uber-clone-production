<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordReset extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'email',
        'phone',
        'token',
        'otp',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }
}
