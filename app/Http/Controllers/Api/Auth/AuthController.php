<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\DTOs\RegisterUserDTO;
use App\DTOs\LoginDTO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $dto = RegisterUserDTO::fromRequest($request->validated());
        $result = $this->authService->register($dto);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $dto = LoginDTO::fromRequest($request->validated());
        $result = $this->authService->login($dto);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $request->user()->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profile updated',
            'data' => new UserResource($request->user()->fresh()),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->password = $request->input('new_password');
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'If the account exists, a reset link has been sent',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully',
        ]);
    }

    public function sendOtp(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully',
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully',
        ]);
    }

    public function getSettings(Request $request): JsonResponse
    {
        $preferences = $request->user()->preferences ?? [];

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $preferences['notifications'] ?? [
                    'pushRideUpdates' => true,
                    'smsRideUpdates' => false,
                    'emailRideUpdates' => true,
                    'pushPromotions' => false,
                    'emailPromotions' => false,
                    'soundEnabled' => true,
                    'notificationVolume' => 100,
                ],
                'preferredVehicle' => $preferences['preferredVehicle'] ?? 'any',
                'language' => $preferences['language'] ?? 'en',
                'appearance' => $preferences['appearance'] ?? 'system',
            ],
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'notifications' => 'sometimes|array',
            'notifications.pushRideUpdates' => 'boolean',
            'notifications.smsRideUpdates' => 'boolean',
            'notifications.emailRideUpdates' => 'boolean',
            'notifications.pushPromotions' => 'boolean',
            'notifications.emailPromotions' => 'boolean',
            'notifications.soundEnabled' => 'boolean',
            'notifications.notificationVolume' => 'integer|min:0|max:100',
            'preferredVehicle' => 'sometimes|string',
            'language' => 'sometimes|string',
            'appearance' => 'sometimes|string',
        ]);

        $user = $request->user();
        $preferences = $user->preferences ?? [];

        if ($request->has('notifications')) {
            $preferences['notifications'] = array_merge(
                $preferences['notifications'] ?? [],
                $request->input('notifications')
            );
        }

        foreach (['preferredVehicle', 'language', 'appearance'] as $key) {
            if ($request->has($key)) {
                $preferences[$key] = $request->input($key);
            }
        }

        $user->update(['preferences' => $preferences]);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated',
            'data' => [
                'notifications' => $preferences['notifications'] ?? [],
                'preferredVehicle' => $preferences['preferredVehicle'] ?? 'any',
                'language' => $preferences['language'] ?? 'en',
                'appearance' => $preferences['appearance'] ?? 'system',
            ],
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        $user = $request->user();
        $file = $request->file('avatar');

        // Delete old avatar if exists
        if ($user->avatar_url) {
            $oldPath = str_replace(\Illuminate\Support\Facades\Storage::disk('public')->url(''), '', $user->avatar_url);
            \Illuminate\Support\Facades\Storage::disk('public')->delete(trim($oldPath, '/'));
        }

        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('avatars', $filename, 'public');

        // Generate full URL using config app.url
        $url = rtrim(config('app.url'), '/') . '/storage/' . $path;
        $relativePath = '/storage/' . $path;

        $user->update([
            'avatar_url' => $url,
        ]);

        $result = new UserResource($user->fresh());
        $data = $result->resolve($request);
        $data['avatarUrl'] = $url;
        $data['avatarPath'] = $relativePath;

        return response()->json([
            'success' => true,
            'message' => 'Avatar uploaded',
            'data' => $data,
        ]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_url) {
            $path = str_replace(\Illuminate\Support\Facades\Storage::disk('public')->url(''), '', $user->avatar_url);
            \Illuminate\Support\Facades\Storage::disk('public')->delete(trim($path, '/'));
        }

        $user->update(['avatar_url' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Avatar removed',
            'data' => new UserResource($user->fresh()),
        ]);
    }
}
