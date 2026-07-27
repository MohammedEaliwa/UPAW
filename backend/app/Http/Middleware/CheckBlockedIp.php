<?php

namespace App\Http\Middleware;

use App\Models\BlockedIp;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBlockedIp
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ip = $request->ip();

        // Skip internal or unassigned requests
        if ($ip && BlockedIp::where('ip_address', $ip)->exists()) {
            return response()->json([
                'error' => 'تم حظر هذا الجهاز / عنوان IP من الوصول إلى النظام لحماية البيانات.'
            ], 403);
        }

        return $next($request);
    }
}
