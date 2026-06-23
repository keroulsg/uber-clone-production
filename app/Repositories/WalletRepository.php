<?php

namespace App\Repositories;

use App\Models\Wallet;

class WalletRepository
{
    public function findByUser(int $userId, bool $lock = false): ?Wallet
    {
        $query = Wallet::where('user_id', $userId);
        if ($lock) {
            $query->lockForUpdate();
        }
        return $query->first();
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
        $wallet = $this->findByUser($userId, true);
        if (!$wallet || $wallet->balance < $amount) {
            return false;
        }
        $wallet->balance -= $amount;
        $wallet->last_transaction_at = now();
        return $wallet->save();
    }

    public function addBalance(int $userId, float $amount): bool
    {
        $wallet = $this->findByUser($userId, true);
        if (!$wallet) {
            return false;
        }
        $wallet->balance += $amount;
        $wallet->last_transaction_at = now();
        return $wallet->save();
    }
}
