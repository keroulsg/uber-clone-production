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

        if (!in_array('admin', $roles)) {
            return response()->json(['success' => false, 'message' => 'Forbidden: admin only'], 403);
        }

        return $next($request);
    }
}
