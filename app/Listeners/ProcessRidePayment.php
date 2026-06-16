<?php

namespace App\Listeners;

use App\Events\RideCompleted;
use App\Services\PaymentService;

class ProcessRidePayment
{
    public function __construct(
        private PaymentService $paymentService,
    ) {}

    public function handle(RideCompleted $event): void
    {
        $this->paymentService->processPayment(
            $event->ride,
            $event->ride->actual_distance ?? 0,
            $event->ride->actual_duration ?? 0
        );
    }
}
