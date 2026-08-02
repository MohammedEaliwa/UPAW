<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * CachePublicApiResponse — Caches GET API responses for public (read-only) endpoints.
 *
 * Applied selectively to routes that:
 *  - Use the GET method only
 *  - Return public data that changes infrequently (pages, news, gallery, etc.)
 *  - Do NOT require authentication
 *
 * Cache is automatically invalidated when data changes (via cache tags or TTL expiry).
 * TTL defaults to RESPONSE_CACHE_TTL env variable (default: 300 seconds = 5 minutes).
 */
class CachePublicApiResponse
{
    /** Paths that should NEVER be cached */
    private const SKIP_PATHS = [
        'api/visitors/count',   // tracks unique visitors per request
        'api/login',
        'api/register',
        'api/audit-logs',
    ];

    public function handle(Request $request, Closure $next, int $ttl = 0): Response
    {
        // Only cache GET requests
        if (!$request->isMethod('GET')) {
            return $next($request);
        }

        // Skip paths that must never be cached
        foreach (self::SKIP_PATHS as $path) {
            if ($request->is($path) || str_starts_with($request->path(), ltrim($path, '/'))) {
                return $next($request);
            }
        }

        $cacheTtl = $ttl > 0 ? $ttl : (int) config('app.response_cache_ttl', env('RESPONSE_CACHE_TTL', 300));
        $cacheKey = 'api_response_' . md5($request->fullUrl());

        // Return cached response if available
        if (Cache::has($cacheKey)) {
            $cached = Cache::get($cacheKey);
            return response()->json(
                json_decode($cached['body'], true),
                $cached['status']
            )->withHeaders([
                'X-Cache'         => 'HIT',
                'X-Cache-TTL'     => $cacheTtl,
                'Cache-Control'   => "public, max-age={$cacheTtl}",
            ]);
        }

        /** @var Response $response */
        $response = $next($request);

        // Only cache successful JSON responses
        if (
            $response->getStatusCode() === 200
            && str_contains($response->headers->get('Content-Type', ''), 'application/json')
        ) {
            Cache::put($cacheKey, [
                'body'   => $response->getContent(),
                'status' => $response->getStatusCode(),
            ], $cacheTtl);

            $response->headers->set('X-Cache', 'MISS');
            $response->headers->set('Cache-Control', "public, max-age={$cacheTtl}");
        }

        return $response;
    }
}
