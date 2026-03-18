<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogRequest
{
    public function handle(Request $request, Closure $next)
    {
        if (str_contains($request->path(), 'webhook')) {
            Log::info('Incoming Webhook', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'headers' => $request->headers->all(),
                'content' => $request->getContent(),
            ]);
        }
        return $next($request);
    }
}
