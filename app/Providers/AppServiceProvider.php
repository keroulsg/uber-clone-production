<?php

namespace App\Providers;

use App\Broadcasting\TestBroadcaster;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Broadcast::extend('test', fn ($app) => new TestBroadcaster);
    }
}
