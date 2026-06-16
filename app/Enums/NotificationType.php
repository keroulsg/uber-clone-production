<?php

namespace App\Enums;

enum NotificationType: string
{
    case InApp = 'in_app';
    case Email = 'email';
    case SMS = 'sms';
}
