<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverWarning extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'issued_by',
        'reason',
    ];

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
