<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Services\AuditLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * AuditRequestMiddleware — Wraps every API request.
 *
 * Uses the TWO-PHASE pattern for zero-latency impact:
 *  1. handle()    → inject context + pass request through (no blocking)
 *  2. terminate() → runs AFTER the response has been sent to the browser
 *
 * This means every API response reaches the client immediately, and
 * audit logging happens in the background without adding any latency.
 */
class AuditRequestMiddleware
{
    /** @var array<int, array> Pending log entries keyed by request object hash */
    private static array $pending = [];

    public function __construct(private readonly AuditLogService $service) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Inject context so AuditLogService can resolve it without needing the Request object
        $this->service->setRequest($request);
        $this->service->setStartTime(microtime(true));

        /** @var Response $response */
        $response = $next($request);

        // Store what we need to log — do NOT write to DB here
        self::$pending[spl_object_id($request)] = [
            'request'  => $request,
            'response' => $response,
            'start'    => $this->service->getStartTime(),
        ];

        return $response;
    }

    /**
     * Called by Laravel automatically AFTER the HTTP response has been sent.
     * Writing audit logs here means zero added latency for the end user.
     */
    public function terminate(Request $request, Response $response): void
    {
        $key = spl_object_id($request);
        if (!isset(self::$pending[$key])) {
            return;
        }

        $ctx = self::$pending[$key];
        unset(self::$pending[$key]);

        // Re-inject context (request may differ in terminate phase)
        $this->service->setRequest($ctx['request']);
        $this->service->setStartTime($ctx['start']);

        $this->logResponseErrors($ctx['request'], $ctx['response']);
        $this->logFileUploads($ctx['request'], $ctx['response']);
    }

    // ─── Log HTTP error responses ──────────────────────────────────────────────

    private function logResponseErrors(Request $request, Response $response): void
    {
        $status = $response->getStatusCode();

        // Only log error-level statuses
        if ($status < 400) return;

        // Skip 422 (validation) to avoid excessive noise
        if ($status === 422) return;

        $action = match(true) {
            $status === 401 => AuditLog::ACTION_UNAUTHORIZED,
            $status === 403 => AuditLog::ACTION_FORBIDDEN,
            $status === 404 => AuditLog::ACTION_NOT_FOUND,
            $status >= 500  => AuditLog::ACTION_SERVER_ERROR,
            default         => AuditLog::ACTION_UNAUTHORIZED,
        };

        $descriptions = [
            401 => 'محاولة وصول غير مصادق',
            403 => 'محاولة وصول محظور (403 Forbidden)',
            404 => 'طلب مورد غير موجود (404 Not Found)',
        ];
        $description = $descriptions[$status] ?? "خطأ في الخادم (HTTP {$status})";

        $this->service->log($action, $description, [
            'response_status' => $status,
            'module'          => 'الأمان',
        ]);
    }

    // ─── Log file upload attempts ──────────────────────────────────────────────

    private function logFileUploads(Request $request, Response $response): void
    {
        if (!$request->hasFile('image') && !$request->hasFile('file')) return;

        $status  = $response->getStatusCode();
        $success = $status >= 200 && $status < 300;
        $action  = AuditLog::ACTION_UPLOAD_FILE;

        $files = array_merge(
            $request->hasFile('image') ? [$request->file('image')] : [],
            $request->hasFile('file')  ? [$request->file('file')]  : []
        );

        foreach ($files as $file) {
            if (!$file) continue;
            $this->service->log(
                $action,
                $success
                    ? "تم رفع الملف: {$file->getClientOriginalName()}"
                    : "فشل رفع الملف: {$file->getClientOriginalName()}",
                [
                    'response_status' => $status,
                    'module'          => 'الملفات',
                    'new_values'      => [
                        'filename'  => $file->getClientOriginalName(),
                        'size'      => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ],
                ]
            );
        }
    }
}
