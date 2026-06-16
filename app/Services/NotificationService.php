<?php

namespace App\Services;

use App\Models\User;
use App\Models\Ride;
use App\Models\Notification;

class NotificationService
{
    public function sendToUser(int $userId, string $type, array $data = []): void
    {
        Notification::create([
            'type' => $type,
            'notifiable_type' => User::class,
            'notifiable_id' => $userId,
            'data' => $data,
        ]);
    }

    public function sendRideNotification(int $userId, string $type, Ride $ride): void
    {
        $this->sendToUser($userId, $type, [
            'ride_id' => $ride->id,
            'status' => $ride->status->value,
            'message' => $this->getMessageForType($type),
        ]);
    }

    private function getMessageForType(string $type): string
    {
        return match ($type) {
            'ride_requested' => 'Your ride has been requested.',
            'ride_accepted' => 'A driver has accepted your ride.',
            'driver_arrived' => 'Your driver has arrived.',
            'ride_started' => 'Your ride has started.',
            'ride_completed' => 'Your ride has been completed.',
            'ride_cancelled' => 'Your ride has been cancelled.',
            'payment_received' => 'Payment received.',
            default => 'You have a new notification.',
        };
    }
}
