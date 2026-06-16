<?php

namespace App\Providers;

use App\Events\DriverArrived;
use App\Events\RideAccepted;
use App\Events\RideCancelled;
use App\Events\RideCompleted;
use App\Events\RideRequested;
use App\Events\RideStarted;
use App\Events\UserRegistered;
use App\Listeners\CreateUserWallet;
use App\Listeners\SendDriverArrivedNotification;
use App\Listeners\SendRideAcceptedNotification;
use App\Listeners\SendRideCancelledNotification;
use App\Listeners\SendRideCompletedNotification;
use App\Listeners\SendRideRequestedNotification;
use App\Listeners\SendRideStartedNotification;
use App\Listeners\ProcessRidePayment;
use App\Listeners\LogUserActivity;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        UserRegistered::class => [
            CreateUserWallet::class,
        ],
        RideRequested::class => [
            SendRideRequestedNotification::class,
        ],
        RideAccepted::class => [
            SendRideAcceptedNotification::class,
        ],
        DriverArrived::class => [
            SendDriverArrivedNotification::class,
        ],
        RideStarted::class => [
            SendRideStartedNotification::class,
        ],
        RideCompleted::class => [
            ProcessRidePayment::class,
            SendRideCompletedNotification::class,
        ],
        RideCancelled::class => [
            SendRideCancelledNotification::class,
        ],
        Login::class => [
            LogUserActivity::class,
        ],
        Logout::class => [
            LogUserActivity::class,
        ],
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
