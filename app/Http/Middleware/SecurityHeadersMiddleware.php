<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Ensure we are working with a Symfony response object that supports headers
        if (method_exists($response, 'header') || (isset($response->headers) && method_exists($response->headers, 'set'))) {
            $headers = method_exists($response, 'header') ? null : $response->headers;

            $set = function ($key, $value) use ($response, $headers) {
                if ($headers) {
                    $headers->set($key, $value);
                } else {
                    $response->header($key, $value);
                }
            };

            // Set secure headers
            $set('X-Frame-Options', 'DENY');
            $set('X-Content-Type-Options', 'nosniff');
            $set('Referrer-Policy', 'strict-origin-when-cross-origin');
            $set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
            
            // Content-Security-Policy: safe for API and SPAs (with Vite support)
            $set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss: http: https:; font-src 'self' data:; frame-ancestors 'none';");

            // Strict-Transport-Security only on secure HTTPS requests
            if ($request->isSecure()) {
                $set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            }
        }

        return $response;
    }
}
