<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Log;

class LogUserActivity
{
    public function handle(Login|Logout $event): void
    {
        Log::info('User activity', [
            'user_id' => $event->user?->id,
            'event' => $event instanceof Login ? 'login' : 'logout',
            'ip' => request()->ip(),
        ]);
    }

    public function subscribe(): array
    {
        return [
            Login::class => 'handle',
            Logout::class => 'handle',
        ];
    }
}
