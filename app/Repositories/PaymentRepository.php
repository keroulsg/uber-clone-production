<?php

namespace App\Repositories;

use App\Models\Payment;
use App\Models\Ride;
use Illuminate\Database\Eloquent\Collection;

class PaymentRepository
{
    public function findById(int $id): ?Payment
    {
        return Payment::with('ride.rider', 'ride.driver.user')->find($id);
    }

    public function create(array $data): Payment
    {
        return Payment::create($data);
    }

    public function findByRide(int $rideId): ?Payment
    {
        return Payment::where('ride_id', $rideId)->first();
    }

    public function findByUser(int $userId): Collection
    {
        return Payment::whereHas('ride', fn($q) => $q->where('rider_id', $userId))
            ->orWhereHas('ride', fn($q) => $q->whereHas('driver', fn($dq) => $dq->where('user_id', $userId)))
            ->latest()
            ->get();
    }
}
