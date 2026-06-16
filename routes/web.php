<?php

use Illuminate\Support\Facades\Route;

$frontendBuildPath = base_path('resources/react-app/dist');

$serveFrontendFile = function (string $relativePath) use ($frontendBuildPath) {
    $buildRealPath = realpath($frontendBuildPath);
    $candidatePath = realpath($frontendBuildPath.'/'.ltrim($relativePath, '/'));

    if ($buildRealPath && $candidatePath && str_starts_with($candidatePath, $buildRealPath) && is_file($candidatePath)) {
        $extension = strtolower(pathinfo($candidatePath, PATHINFO_EXTENSION));
        $contentTypes = [
            'css' => 'text/css; charset=utf-8',
            'js' => 'application/javascript; charset=utf-8',
            'mjs' => 'application/javascript; charset=utf-8',
            'json' => 'application/json; charset=utf-8',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
        ];

        $headers = [];

        if (isset($contentTypes[$extension])) {
            $headers['Content-Type'] = $contentTypes[$extension];
        }

        return response()->file($candidatePath, $headers);
    }

    $indexPath = $frontendBuildPath.'/index.html';

    return response(file_get_contents($indexPath), 200, [
        'Content-Type' => 'text/html; charset=utf-8',
    ]);
};

Route::get('/password/reset/{token}', function (string $token) use ($serveFrontendFile) {
    return $serveFrontendFile('index.html');
})->name('password.reset');

Route::get('/', function () use ($serveFrontendFile) {
    return $serveFrontendFile('index.html');
});

Route::get('/favicon.ico', function () {
    return response(file_get_contents(base_path('resources/react-app/dist/favicon.svg')), 200, [
        'Content-Type' => 'image/svg+xml',
        'Cache-Control' => 'public, max-age=86400',
    ]);
});

Route::get('/{path}', function (string $path) use ($serveFrontendFile) {
    return $serveFrontendFile($path);
})->where('path', '^(?!api(?:/|$)).*');
