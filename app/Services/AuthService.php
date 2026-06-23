<?php

namespace App\Services;

use App\DTOs\RegisterUserDTO;
use App\DTOs\LoginDTO;
use App\Models\User;
use App\Models\Rider;
use App\Models\Driver;
use App\Models\Wallet;
use App\Enums\DriverStatus;
use App\Repositories\UserRepository;
use App\Repositories\WalletRepository;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
class AuthService
{
    public function __construct(
        private UserRepository $userRepo,
        private WalletRepository $walletRepo,
    ) {}

    public function register(RegisterUserDTO $dto): array
    {
        $user = $this->userRepo->create([
            'name' => $dto->name,
            'email' => $dto->email,
            'phone' => $dto->phone,
            'password' => Hash::make($dto->password),
            'gender' => $dto->gender,
        ]);

        $role = Role::findOrCreate($dto->role);
        $user->roles()->attach($role->id);

        if ($dto->role === 'rider') {
            Rider::create(['user_id' => $user->id]);
        } elseif ($dto->role === 'driver') {
            Driver::create(['user_id' => $user->id]);
        }

        $this->walletRepo->createForUser($user->id);

        $token = $user->createToken('auth-token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    public function login(LoginDTO $dto): array
    {
        $user = $this->userRepo->findByEmail($dto->email);

        if (!$user || !Hash::check($dto->password, $user->password)) {
            abort(401, 'The provided credentials are incorrect.');
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }
    }
}
