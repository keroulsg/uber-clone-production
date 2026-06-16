<?php

namespace App\Enums;

enum PaymentMethodType: string
{
    case Wallet = 'wallet';
    case Cash = 'cash';
}
