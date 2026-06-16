<?php

namespace App\Enums;

enum TransactionType: string
{
    case Debit = 'debit';
    case Credit = 'credit';
}
