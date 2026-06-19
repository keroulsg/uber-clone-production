<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $type = $this->type;
        if (is_object($type) && method_exists($type, 'value')) {
            $type = $type->value;
        }

        return [
            'id' => (string) $this->id,
            'type' => $type,
            'amount' => (float) $this->amount,
            'balanceBefore' => (float) $this->balance_before,
            'balanceAfter' => (float) $this->balance_after,
            'description' => $this->description,
            'referenceType' => $this->reference_type,
            'referenceId' => (string) $this->reference_id,
            'status' => $this->status ?? 'completed',
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
