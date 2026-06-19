<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    private function getTitle(): string
    {
        $titles = [
            'ride_completed' => 'Ride Completed',
            'driver_arrived' => 'Driver Arrived',
            'driver_assigned' => 'Driver Accepted',
            'ride_started' => 'Ride Started',
            'ride_cancelled' => 'Ride Cancelled',
            'commission_debt' => 'Commission Recorded',
            'cash_change_liability' => 'Cash Change Liability',
            'new_ride_request' => 'New Ride Request',
            'payment_received' => 'Payment Received',
            'wallet_credited' => 'Wallet Credited',
            'wallet_debited' => 'Wallet Debited',
        ];

        return $titles[$this->type] ?? ucfirst(str_replace('_', ' ', $this->type));
    }

    private function getMessage(): string
    {
        $data = $this->data;
        $message = $data['message'] ?? '';

        if (!empty($message)) {
            return $message;
        }

        $rideId = $data['ride_id'] ?? $data['rideId'] ?? null;
        $amount = $data['amount'] ?? null;

        $messages = [
            'ride_completed' => $rideId ? "Your ride #{$rideId} has been completed." : 'Your ride has been completed.',
            'driver_arrived' => $rideId ? "Your driver has arrived for ride #{$rideId}." : 'Your driver has arrived.',
            'driver_assigned' => $rideId ? "A driver accepted your ride #{$rideId}." : 'A driver accepted your ride.',
            'ride_started' => $rideId ? "Your ride #{$rideId} has started." : 'Your ride has started.',
            'ride_cancelled' => $rideId ? "Ride #{$rideId} was cancelled." : 'A ride was cancelled.',
            'commission_debt' => $rideId ? "Commission debt recorded for ride #{$rideId}." : 'Commission debt recorded.',
            'cash_change_liability' => $amount ? "Cash change liability of {$amount} recorded." : 'Cash change liability recorded.',
            'new_ride_request' => 'You have a new ride request.',
            'payment_received' => $amount ? "Payment of {$amount} received." : 'Payment received.',
            'wallet_credited' => $amount ? "Your wallet has been credited with {$amount}." : 'Wallet credited.',
            'wallet_debited' => $amount ? "{$amount} has been deducted from your wallet." : 'Wallet debited.',
        ];

        return $messages[$this->type] ?? $message ?: 'Notification';
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'type' => $this->type,
            'title' => $this->getTitle(),
            'message' => $this->getMessage(),
            'data' => $this->data,
            'readAt' => $this->read_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
