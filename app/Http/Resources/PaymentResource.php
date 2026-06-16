<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'rideId' => (string) $this->ride_id,
            'amount' => (float) $this->amount,
            'platformFee' => (float) $this->platform_fee,
            'driverAmount' => (float) $this->driver_amount,
            'taxAmount' => (float) $this->tax_amount,
            'currency' => $this->currency,
            'paymentMethod' => $this->payment_method,
            'status' => $this->status->value,
            'transactionId' => $this->transaction_id,
            'paidAt' => $this->paid_at?->toISOString(),
            'refundedAt' => $this->refunded_at?->toISOString(),
            'rider' => $this->relationLoaded('ride') && $this->ride && $this->ride->relationLoaded('rider')
                ? new UserBriefResource($this->ride->rider) : null,
            'driver' => $this->relationLoaded('ride') && $this->ride && $this->ride->relationLoaded('driver') && $this->ride->driver && $this->ride->driver->relationLoaded('user')
                ? new UserBriefResource($this->ride->driver->user) : null,
            'appliedCommissionRate' => $this->applied_commission_rate ? (float) $this->applied_commission_rate : null,
            'companyCommission' => (float) $this->company_commission,
        ];
    }
}
