<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'balance' => (float) $this->balance,
            'currency' => $this->currency,
            'isActive' => $this->is_active,
            'lastTransactionAt' => $this->last_transaction_at?->toISOString(),
        ];
    }
}
