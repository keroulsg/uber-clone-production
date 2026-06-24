<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);

        $middleware->alias([
            'role_or_profile' => \App\Http\Middleware\RoleOrProfile::class,
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'feature' => \App\Http\Middleware\CheckFeatureFlag::class,
            'not_suspended' => \App\Http\Middleware\EnsureUserNotSuspended::class,
        ]);

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (\Illuminate\Database\QueryException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                \Illuminate\Support\Facades\Log::error('Database Query Error masked: ' . $e->getMessage(), [
                    'sql' => $e->getSql(),
                    'bindings' => $e->getBindings(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'A database error occurred. Please try again later.',
                ], 500);
            }
        });
    })->create();
