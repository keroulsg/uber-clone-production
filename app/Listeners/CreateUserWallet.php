<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Repositories\WalletRepository;

class CreateUserWallet
{
    public function __construct(
        private WalletRepository $walletRepo,
    ) {}

    public function handle(UserRegistered $event): void
    {
        $this->walletRepo->createForUser($event->user->id);
    }
}
