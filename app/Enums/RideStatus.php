<?php

namespace App\Enums;

enum RideStatus: string
{
    case Pending = 'pending';
    case SearchingDriver = 'searching_driver';
    case DriverAssigned = 'driver_assigned';
    case DriverArrived = 'driver_arrived';
    case RideStarted = 'ride_started';
    case RideCompleted = 'ride_completed';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case CancelledByRider = 'cancelled_by_rider';
    case CancelledByDriver = 'cancelled_by_driver';
}
