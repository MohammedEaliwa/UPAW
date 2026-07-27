<?php

namespace App\Services;

use App\Jobs\WriteAuditLogJob;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * AuditLogService — Central entry point for all audit logging.
 *
 * Follows the Single Responsibility Principle: this class is the ONLY
 * place in the codebase that decides how/when to write an audit record.
 * Controllers, Observers, Middleware, and Listeners call this service.
 */
class AuditLogService
{
    private ?Request $request = null;
    private float $requestStartTime = 0.0;

    // ─── Severity map: action → severity ─────────────────────────────────────

    private const SEVERITY_MAP = [
        // Critical
        AuditLog::ACTION_LOGIN_FAILED   => AuditLog::SEVERITY_CRITICAL,
        AuditLog::ACTION_UNAUTHORIZED   => AuditLog::SEVERITY_CRITICAL,
        AuditLog::ACTION_SERVER_ERROR   => AuditLog::SEVERITY_CRITICAL,

        // High
        AuditLog::ACTION_FORCE_DELETE   => AuditLog::SEVERITY_HIGH,
        AuditLog::ACTION_ROLE_CHANGE    => AuditLog::SEVERITY_HIGH,
        AuditLog::ACTION_ACCOUNT_DEACTIVATE => AuditLog::SEVERITY_HIGH,
        AuditLog::ACTION_FORBIDDEN      => AuditLog::SEVERITY_HIGH,
        AuditLog::ACTION_SETTINGS_CHANGE => AuditLog::SEVERITY_HIGH,
        AuditLog::ACTION_DELETE         => AuditLog::SEVERITY_HIGH,

        // Medium
        AuditLog::ACTION_CREATE         => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_UPDATE         => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_UPLOAD_FILE    => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_DELETE_FILE    => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_EXPORT         => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_IMPORT         => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_APPROVE        => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_REJECT         => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_RESTORE        => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_ACCOUNT_ACTIVATE => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_REGISTER       => AuditLog::SEVERITY_MEDIUM,
        AuditLog::ACTION_NOT_FOUND      => AuditLog::SEVERITY_MEDIUM,

        // Low
        AuditLog::ACTION_VIEW           => AuditLog::SEVERITY_LOW,

        // Informational
        AuditLog::ACTION_LOGIN          => AuditLog::SEVERITY_INFORMATIONAL,
        AuditLog::ACTION_LOGOUT         => AuditLog::SEVERITY_INFORMATIONAL,
    ];

    // ─── Module map: model short name → module label ──────────────────────────

    private const MODULE_MAP = [
        'User'            => 'المستخدمون',
        'Role'            => 'الأدوار',
        'News'            => 'الأخبار',
        'Gallery'         => 'المعرض',
        'Page'            => 'الصفحات',
        'Company'         => 'الشركات',
        'WorkingPaper'    => 'ورقات العمل',
        'Book'            => 'المكتبة',
        'Statistic'       => 'الإحصائيات',
        'MapLocation'     => 'خرائط المواقع',
        'MapKmlFeature'   => 'خرائط KML',
        'HomepageImage'   => 'صور الرئيسية',
        'Notification'    => 'الإشعارات',
        'Complaint'       => 'الشكاوى',
        'Expert'          => 'الخبراء',
        'EmployeeRequest' => 'طلبات الموظفين',
        'DocumentTemplate' => 'قوالب الوثائق',
        'Visitor'         => 'الزوار',
        'Comment'         => 'التعليقات',
        'AuditLog'        => 'سجلات التدقيق',
    ];

    // ─── Setters injected by Middleware ───────────────────────────────────────

    public function setRequest(Request $request): void
    {
        $this->request = $request;
    }

    public function setStartTime(float $time): void
    {
        $this->requestStartTime = $time;
    }

    public function getStartTime(): float
    {
        return $this->requestStartTime;
    }

    // ─── Primary log entry point ──────────────────────────────────────────────

    /**
     * Record a single audit event.
     *
     * @param string      $action      One of AuditLog::ACTION_* constants
     * @param string      $description Human-readable description (Arabic OK)
     * @param array       $context     Optional overrides / extra data
     */
    public function log(string $action, string $description, array $context = []): void
    {
        $userId   = $context['user_id']   ?? null;
        $username = $context['username']  ?? null;
        $email    = $context['email']     ?? null;
        $role     = $context['role']      ?? null;

        // If not explicitly given, try to resolve from request header
        if (!$userId && $this->request) {
            $userId   = $this->request->header('X-User-Id');
            $username = $this->request->header('X-Username');
            $email    = $this->request->header('X-User-Email');
            $role     = $this->request->header('X-User-Role');
        }

        $modelClass = $context['model_type'] ?? null;
        $modelId    = $context['model_id']   ?? null;

        $module = $context['module'] ?? $this->resolveModule($modelClass);
        $severity = $context['severity'] ?? $this->resolveSeverity($action, $context['response_status'] ?? null);

        $ip        = $this->request?->ip() ?? ($context['ip'] ?? '');
        $userAgent = $this->request?->userAgent() ?? ($context['user_agent'] ?? '');
        $parsed    = $this->parseUserAgent($userAgent);

        $executionTime = $context['execution_time']
            ?? ($this->requestStartTime > 0 ? round(microtime(true) - $this->requestStartTime, 4) : null);

        $data = [
            'user_id'          => $userId,
            'username'         => $username,
            'email'            => $email,
            'role'             => $role,
            'action'           => $action,
            'severity'         => $severity,
            'module'           => $module,
            'model_type'       => $modelClass,
            'model_id'         => (string)$modelId,
            'description'      => $description,
            'old_values'       => isset($context['old_values']) ? json_encode($context['old_values'], JSON_UNESCAPED_UNICODE) : null,
            'new_values'       => isset($context['new_values']) ? json_encode($context['new_values'], JSON_UNESCAPED_UNICODE) : null,
            'ip_address'       => $ip,
            'user_agent'       => $userAgent,
            'browser'          => $parsed['browser'],
            'operating_system' => $parsed['os'],
            'device_type'      => $parsed['device'],
            'session_id'       => ($this->request && $this->request->hasSession()) ? $this->request->session()->getId() : ($context['session_id'] ?? null),
            'request_method'   => $this->request?->method() ?? ($context['request_method'] ?? null),
            'request_url'      => $this->request?->fullUrl() ?? ($context['request_url'] ?? null),
            'route_name'       => $this->request?->route()?->getName() ?? null,
            'response_status'  => $context['response_status'] ?? null,
            'execution_time'   => $executionTime,
        ];

        // Dispatch async if queue is configured, otherwise write synchronously
        if (config('queue.default') !== 'sync') {
            WriteAuditLogJob::dispatch($data);
        } else {
            WriteAuditLogJob::dispatchSync($data);
        }

        // Notify super admin for critical events
        if (in_array($severity, [AuditLog::SEVERITY_CRITICAL, AuditLog::SEVERITY_HIGH])) {
            $this->notifySuperAdmin($action, $description, $severity, $userId);
        }
    }

    // ─── Convenience wrappers ─────────────────────────────────────────────────

    public function logLogin(array $user, string $ip, string $userAgent): void
    {
        $this->log(AuditLog::ACTION_LOGIN, "تسجيل دخول ناجح للمستخدم: {$user['username']}", [
            'user_id'  => $user['id'],
            'username' => $user['username'],
            'email'    => $user['email'] ?? '',
            'role'     => $user['role_name'] ?? ($user['role']['name'] ?? ''),
            'ip'       => $ip,
            'user_agent' => $userAgent,
            'module'   => 'المصادقة',
        ]);
    }

    public function logLogout(array $user, string $ip, string $userAgent): void
    {
        $this->log(AuditLog::ACTION_LOGOUT, "تسجيل خروج المستخدم: {$user['username']}", [
            'user_id'  => $user['id'],
            'username' => $user['username'],
            'email'    => $user['email'] ?? '',
            'role'     => $user['role']['name'] ?? '',
            'ip'       => $ip,
            'user_agent' => $userAgent,
            'module'   => 'المصادقة',
        ]);
    }

    public function logLoginFailed(string $username, string $ip, string $userAgent): void
    {
        $this->log(AuditLog::ACTION_LOGIN_FAILED, "محاولة دخول فاشلة للمستخدم: {$username}", [
            'username' => $username,
            'ip'       => $ip,
            'user_agent' => $userAgent,
            'module'   => 'المصادقة',
            'severity' => AuditLog::SEVERITY_CRITICAL,
        ]);

        // Check for multiple failed attempts from same IP in last 10 minutes
        $recentFailures = AuditLog::where('action', AuditLog::ACTION_LOGIN_FAILED)
            ->where('ip_address', $ip)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->count();

        if ($recentFailures >= 5) {
            $this->notifySuperAdmin(
                AuditLog::ACTION_LOGIN_FAILED,
                "تحذير أمني: {$recentFailures} محاولات دخول فاشلة من IP: {$ip}",
                AuditLog::SEVERITY_CRITICAL,
                null
            );
        }
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    private function resolveSeverity(string $action, ?int $statusCode): string
    {
        // Status code takes precedence for HTTP errors
        if ($statusCode !== null) {
            return match(true) {
                $statusCode >= 500 => AuditLog::SEVERITY_CRITICAL,
                $statusCode === 403 => AuditLog::SEVERITY_HIGH,
                $statusCode === 401 => AuditLog::SEVERITY_HIGH,
                $statusCode === 404 => AuditLog::SEVERITY_MEDIUM,
                default => self::SEVERITY_MAP[$action] ?? AuditLog::SEVERITY_INFORMATIONAL,
            };
        }

        return self::SEVERITY_MAP[$action] ?? AuditLog::SEVERITY_INFORMATIONAL;
    }

    private function resolveModule(?string $modelClass): string
    {
        if (!$modelClass) return 'النظام';
        $shortName = class_basename($modelClass);
        return self::MODULE_MAP[$shortName] ?? $shortName;
    }

    /**
     * Parse User-Agent string into browser, OS, and device type.
     */
    private function parseUserAgent(string $userAgent): array
    {
        $browser = 'Unknown';
        $os      = 'Unknown';
        $device  = 'Desktop';

        // Browser detection
        $browsers = [
            'Edg'     => 'Microsoft Edge',
            'OPR'     => 'Opera',
            'Opera'   => 'Opera',
            'Chrome'  => 'Chrome',
            'Safari'  => 'Safari',
            'Firefox' => 'Firefox',
            'MSIE'    => 'Internet Explorer',
            'Trident' => 'Internet Explorer',
        ];
        foreach ($browsers as $key => $name) {
            if (str_contains($userAgent, $key)) {
                $browser = $name;
                break;
            }
        }

        // OS detection
        $systems = [
            'Windows NT 10' => 'Windows 10/11',
            'Windows NT 6'  => 'Windows Vista/7/8',
            'Windows'       => 'Windows',
            'Macintosh'     => 'macOS',
            'Ubuntu'        => 'Ubuntu',
            'Linux'         => 'Linux',
            'Android'       => 'Android',
            'iPhone'        => 'iOS',
            'iPad'          => 'iPadOS',
        ];
        foreach ($systems as $key => $name) {
            if (str_contains($userAgent, $key)) {
                $os = $name;
                break;
            }
        }

        // Device type
        if (preg_match('/(Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini)/i', $userAgent)) {
            $device = 'Mobile';
        } elseif (preg_match('/(iPad|Tablet)/i', $userAgent)) {
            $device = 'Tablet';
        }

        return ['browser' => $browser, 'os' => $os, 'device' => $device];
    }

    /**
     * Insert a notification for the super admin (role_id = 1).
     */
    private function notifySuperAdmin(string $action, string $description, string $severity, ?int $userId): void
    {
        try {
            $severityLabel = match($severity) {
                AuditLog::SEVERITY_CRITICAL => '🔴 حرج',
                AuditLog::SEVERITY_HIGH     => '🟠 مرتفع',
                default                     => '⚠️ تحذير',
            };

            DB::table('notifications')->insert([
                'title'       => "{$severityLabel}: حدث أمني يستوجب المراجعة",
                'message'     => $description,
                'type'        => 'warning',
                'entity_type' => 'audit_log',
                'entity_id'   => null,
                'link'        => '/dashboard/audit-logs',
                'is_read'     => 0,
                'target_role' => 1, // Super Admin
                'target_user' => null,
                'created_at'  => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            // Silently fail — never let notification failure break the main flow
        }
    }
}
