<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
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

        if (!in_array('admin', $roles) && !(method_exists($user, 'hasRole') && $user->hasRole('admin'))) {
            return response()->json(['success' => false, 'message' => 'Forbidden: admin only'], 403);
        }

        return $next($request);
    }
}
