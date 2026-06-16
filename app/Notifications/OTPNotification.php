<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OTPNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $otp,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'otp' => $this->otp,
            'title' => 'Your OTP',
            'message' => 'Your verification code is: ' . $this->otp,
        ];
    }
}
