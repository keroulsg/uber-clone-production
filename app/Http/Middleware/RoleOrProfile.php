<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleOrProfile
{
    public function handle(Request $request, Closure $next, string $role, string $profileClass): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $roles = $user->roles ?? [];

        if (in_array($role, $roles)) {
            return $next($request);
        }

        if ($profileClass && $user->{$role}()->exists()) {
            return $next($request);
        }

        return response()->json(['success' => false, 'message' => 'Forbidden: insufficient permissions'], 403);
    }
}
