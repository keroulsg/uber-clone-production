<?php

namespace App\Repositories;

use App\Models\Wallet;

class WalletRepository
{
    public function findByUser(int $userId): ?Wallet
    {
        return Wallet::where('user_id', $userId)->first();
    }

    public function createForUser(int $userId, string $currency = 'USD'): Wallet
    {
        return Wallet::create([
            'user_id' => $userId,
            'balance' => 0,
            'currency' => $currency,
        ]);
    }

    public function updateBalance(int $userId, float $newBalance): bool
    {
        return Wallet::where('user_id', $userId)->update([
            'balance' => $newBalance,
            'last_transaction_at' => now(),
        ]);
    }

    public function getBalance(int $userId): float
    {
        $wallet = $this->findByUser($userId);
        return $wallet ? (float) $wallet->balance : 0;
    }

    public function deductBalance(int $userId, float $amount): bool
    {
        $wallet = $this->findByUser($userId);
        if (!$wallet || $wallet->balance < $amount) {
            return false;
        }
        return $this->updateBalance($userId, $wallet->balance - $amount);
    }

    public function addBalance(int $userId, float $amount): bool
    {
        $wallet = $this->findByUser($userId);
        if (!$wallet) {
            return false;
        }
        return $this->updateBalance($userId, $wallet->balance + $amount);
    }
}
