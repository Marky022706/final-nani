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
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // This is a JSON-only API (no server-rendered login page), so unauthenticated
        // requests must never attempt to redirect to a "login" route - always respond
        // with a plain 401 JSON error instead.
        $middleware->redirectGuestsTo(null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (\Illuminate\Database\QueryException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Database error encountered. Please verify the database service is running.',
                    'code' => 'DATABASE_ERROR',
                ], 503);
            }
        });

        $exceptions->render(function (\PDOException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Database connection failed. Please ensure the database server is running.',
                    'code' => 'DATABASE_CONNECTION_ERROR',
                ], 503);
            }
        });
    })->create();
