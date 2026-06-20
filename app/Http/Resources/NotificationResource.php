<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    private function getTitle(): string
    {
        $titles = [
            'ride_requested' => 'Ride Requested',
            'ride_accepted' => 'Ride Accepted',
            'driver_assigned' => 'Driver Accepted',
            'driver_arrived' => 'Driver Arrived',
            'ride_started' => 'Ride Started',
            'ride_completed' => 'Ride Completed',
            'ride_cancelled' => 'Ride Cancelled',
            'wallet_topup' => 'Wallet Top-up',
            'wallet_debit' => 'Wallet Debit',
            'wallet_debited' => 'Wallet Debited',
            'wallet_credited' => 'Wallet Credited',
            'payment_completed' => 'Payment Completed',
            'payment_received' => 'Payment Received',
            'refund' => 'Refund Processed',
            'cash_change_credit' => 'Cash Change Credit',
            'commission_debt' => 'Commission Recorded',
            'cash_change_liability' => 'Cash Change Liability',
            'new_ride_request' => 'New Ride Request',
            'rating_received' => 'New Rating',
            'ticket_created' => 'Ticket Created',
            'ticket_replied' => 'Ticket Replied',
            'ticket_closed' => 'Ticket Closed',
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
            'ride_requested' => $rideId ? "Your ride #{$rideId} has been requested." : 'Your ride has been requested.',
            'ride_accepted' => $rideId ? "A driver accepted your ride #{$rideId}." : 'A driver accepted your ride.',
            'driver_assigned' => $rideId ? "A driver accepted your ride #{$rideId}." : 'A driver accepted your ride.',
            'driver_arrived' => $rideId ? "Your driver has arrived for ride #{$rideId}." : 'Your driver has arrived.',
            'ride_started' => $rideId ? "Your ride #{$rideId} has started." : 'Your ride has started.',
            'ride_completed' => $rideId ? "Your ride #{$rideId} has been completed." : 'Your ride has been completed.',
            'ride_cancelled' => $rideId ? "Ride #{$rideId} was cancelled." : 'A ride was cancelled.',
            'wallet_topup' => $amount ? "Your wallet has been topped up with {$amount}." : 'Wallet topped up.',
            'wallet_debit' => $amount ? "{$amount} has been deducted from your wallet." : 'Wallet debited.',
            'wallet_debited' => $amount ? "{$amount} has been deducted from your wallet." : 'Wallet debited.',
            'wallet_credited' => $amount ? "Your wallet has been credited with {$amount}." : 'Wallet credited.',
            'payment_completed' => $rideId ? "Payment completed for ride #{$rideId}." : 'Payment completed.',
            'payment_received' => $amount ? "Payment of {$amount} received." : 'Payment received.',
            'refund' => $rideId ? "Refund processed for ride #{$rideId}." : 'Refund processed.',
            'cash_change_credit' => $amount ? "Cash change credit of {$amount} added to your wallet." : 'Cash change credited.',
            'commission_debt' => $rideId ? "Commission debt recorded for ride #{$rideId}." : 'Commission debt recorded.',
            'cash_change_liability' => $amount ? "Cash change liability of {$amount} recorded." : 'Cash change liability recorded.',
            'new_ride_request' => 'You have a new ride request.',
            'rating_received' => $data['rating'] ? "You received a {$data['rating']}-star rating." : 'You received a new rating.',
            'ticket_created' => 'Your support ticket has been created.',
            'ticket_replied' => 'You have a new reply on your support ticket.',
            'ticket_closed' => 'Your support ticket has been closed.',
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
