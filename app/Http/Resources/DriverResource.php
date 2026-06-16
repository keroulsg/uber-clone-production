<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'userId' => (string) $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'licenseNumber' => $this->license_number,
            'isOnline' => $this->is_online,
            'isApproved' => $this->is_approved,
            'isVerified' => $this->is_verified,
            'status' => $this->status,
            'averageRating' => (float) $this->average_rating,
            'totalRides' => $this->total_rides,
            'totalEarnings' => (float) $this->total_earnings,
            'currentBalance' => (float) $this->current_balance,
            'acceptanceRate' => (float) $this->acceptance_rate,
            'completionRate' => (float) $this->completion_rate,
            'vehicle' => $this->whenLoaded('vehicles', fn() => new VehicleResource($this->vehicles->first())),
            'profilePhotoUrl' => $this->profile_photo_url,
            'licenseFrontImage' => $this->license_front_image,
            'licenseBackImage' => $this->license_back_image,
            'identityFrontImage' => $this->identity_front_image,
            'identityBackImage' => $this->identity_back_image,
            'criminalRecord' => $this->criminal_record,
            'verificationDocument' => $this->verification_document,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
