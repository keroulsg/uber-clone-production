<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserNotSuspended
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Allow logout requests to bypass suspension check
        if ($request->is('api/v1/auth/logout') || $request->is('api/v1/logout') || $request->routeIs('logout')) {
            return $next($request);
        }

        // Admins bypass the suspension checks to manage user and driver profiles
        $roles = $user->roles ?? [];
        if ($roles instanceof \Illuminate\Support\Collection) {
            $roles = $roles->map(fn($r) => is_object($r) ? ($r->name ?? '') : (string) $r)->toArray();
        } elseif (is_array($roles)) {
            $roles = array_map(fn($r) => is_object($r) ? ($r->name ?? '') : (string) $r, $roles);
        } else {
            $roles = [];
        }

        if (in_array('admin', $roles) || (method_exists($user, 'hasRole') && $user->hasRole('admin'))) {
            return $next($request);
        }

        // 1. Check if the root User is inactive (blocked)
        if (isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is blocked. Please contact support.',
            ], 403);
        }

        // 2. Check if driver profile is suspended or inactive
        if ($user->driver) {
            $driver = $user->driver;
            if (isset($driver->is_active) && !$driver->is_active || (isset($driver->status) && $driver->status === 'suspended')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is suspended. You cannot perform this action.',
                ], 403);
            }
        }

        // 3. Check if rider profile is suspended or inactive
        if ($user->rider) {
            $rider = $user->rider;
            if (isset($rider->is_active) && !$rider->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is suspended. You cannot perform this action.',
                ], 403);
            }
        }

        return $next($request);
    }
}
