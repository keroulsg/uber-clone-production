<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Rider = 'rider';
    case Driver = 'driver';
}
