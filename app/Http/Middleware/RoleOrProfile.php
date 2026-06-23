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
        if ($roles instanceof \Illuminate\Support\Collection) {
            $roles = $roles->map(fn($r) => is_object($r) ? ($r->name ?? '') : (string) $r)->toArray();
        } elseif (is_array($roles)) {
            $roles = array_map(fn($r) => is_object($r) ? ($r->name ?? '') : (string) $r, $roles);
        } else {
            $roles = [];
        }

        if (in_array($role, $roles) || (method_exists($user, 'hasRole') && $user->hasRole($role))) {
            return $next($request);
        }

        if ($profileClass && $user->{$role}()->exists()) {
            return $next($request);
        }

        return response()->json(['success' => false, 'message' => 'Forbidden: insufficient permissions'], 403);
    }
}
