<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BanHistory extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'reason',
        'acted_by',
        'auto_blocked',
    ];

    protected function casts(): array
    {
        return [
            'auto_blocked' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function actedBy()
    {
        return $this->belongsTo(User::class, 'acted_by');
    }
}
