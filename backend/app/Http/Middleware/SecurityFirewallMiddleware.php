<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\BlockedIp;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityFirewallMiddleware
{
    /**
     * Threat patterns for WAF inspection
     */
    private array $sqlPatterns = [
        '/(\b(union\s+select|select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+table|alter\s+table|truncate\s+table)\b)/i',
        '/(\b(exec|execute|information_schema|sysdatabases|sysobjects)\b)/i',
        '/(\'|\")\s*(or|and)\s*(\'|\")?\d+(\'|\")?\s*=\s*(\'|\")?\d+/i',
        '/(\'|\")\s*(or|and)\s*(\'|\")?[a-z0-9]+(\'|\")?\s*=\s*(\'|\")?[a-z0-9]+/i',
        '/;\s*(drop|delete|update|insert|select|alter)/i',
        '/\b(sleep|benchmark|delay)\s*\(/i',
    ];

    private array $xssPatterns = [
        '/<script\b[^>]*>(.*?)<\/script>/is',
        '/javascript\s*:/i',
        '/vbscript\s*:/i',
        '/onload\s*=/i',
        '/onerror\s*=/i',
        '/onclick\s*=/i',
        '/onmouseover\s*=/i',
        '/<iframe\b[^>]*>/i',
        '/<applet\b[^>]*>/i',
        '/<meta\b[^>]*>/i',
    ];

    private array $rcePatterns = [
        '/\b(eval|system|exec|passthru|shell_exec|popen|proc_open)\s*\(/i',
        '/base64_decode\s*\(/i',
    ];

    private array $pathTraversalPatterns = [
        '/\.\.\//',
        '/\.\.\\\/',
        '/\/etc\/passwd/i',
        '/c:\\\\windows\\\\system32/i',
        '/php:\/\/filter/i',
        '/data:\/\/text/i',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $ip = $request->ip() ?? '0.0.0.0';

        // 1. IP Blacklist Enforcement
        if ($ip && BlockedIp::where('ip_address', $ip)->exists()) {
            return response()->json([
                'error' => 'تم حظر جهازك / عنوان IP الخاص بك نهائياً من الوصول إلى منظومة الهيئة لحماية البيانات والنظام.',
                'security_status' => 'BLOCKED_BY_FIREWALL'
            ], 403);
        }

        // 2. Extract inputs to inspect
        $inputs = array_merge(
            $request->query(),
            $request->request->all(),
            $request->json() ? $request->json()->all() : []
        );

        $inputString = json_encode($inputs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // 3. Inspect SQL Injection Threats
        foreach ($this->sqlPatterns as $pattern) {
            if (preg_match($pattern, $inputString)) {
                return $this->blockThreat($request, $ip, 'SQL Injection Attack Detected', 'high');
            }
        }

        // 4. Inspect XSS & RCE Threats
        foreach ($this->xssPatterns as $pattern) {
            if (preg_match($pattern, $inputString)) {
                return $this->blockThreat($request, $ip, 'XSS / Script Injection Attempt Detected', 'high');
            }
        }

        foreach ($this->rcePatterns as $pattern) {
            if (preg_match($pattern, $inputString)) {
                return $this->blockThreat($request, $ip, 'Remote Code Execution (RCE) Attempt Detected', 'critical');
            }
        }

        // 5. Inspect Path Traversal
        foreach ($this->pathTraversalPatterns as $pattern) {
            if (preg_match($pattern, $inputString)) {
                return $this->blockThreat($request, $ip, 'Path Traversal / File Inclusion Attempt Detected', 'high');
            }
        }

        /** @var Response $response */
        $response = $next($request);

        // 6. Add Modern Security HTTP Response Headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Security-Firewall', 'Protected-By-UPA-WAF-v2');

        return $response;
    }

    private function blockThreat(Request $request, string $ip, string $reason, string $severity): Response
    {
        // Record Security Threat in Audit Log
        try {
            AuditLog::create([
                'user_id'         => null,
                'username'        => 'GUEST_THREAT',
                'email'           => null,
                'role'            => 'GUEST',
                'action'          => 'security_blocked',
                'severity'        => $severity,
                'module'          => 'Security Firewall (WAF)',
                'description'     => "تم التصدي لجدار حماية الهيئة: {$reason}",
                'ip_address'      => $ip,
                'user_agent'      => substr($request->userAgent() ?? '', 0, 255),
                'request_method'  => $request->method(),
                'request_url'     => substr($request->fullUrl(), 0, 255),
                'response_status' => 403,
            ]);
        } catch (\Throwable $e) {
            // Silence DB logging failures if any
        }

        return response()->json([
            'error' => "جدار حماية الهيئة (WAF): تم إيقاف وحظر هذا الاستعلام لاحتوائه على أنماط غير آمنة ({$reason}).",
            'security_code' => 'WAF_THREAT_BLOCKED'
        ], 403);
    }
}
