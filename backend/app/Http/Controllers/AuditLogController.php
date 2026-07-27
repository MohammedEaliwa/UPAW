<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * AuditLogController — Read-only API for the audit dashboard.
 *
 * Provides paginated/filtered log listing, stats, single detail,
 * and export endpoints.
 */
class AuditLogController extends Controller
{
    public function __construct(private readonly AuditLogService $service) {}

    // ─── GET /api/audit-logs/stats ────────────────────────────────────────────

    public function stats(): \Illuminate\Http\JsonResponse
    {
        $total        = AuditLog::count();
        $today        = AuditLog::today()->count();
        $critical     = AuditLog::critical()->count();
        $failedLogins = AuditLog::ofAction(AuditLog::ACTION_LOGIN_FAILED)->count();
        $todayCritical = AuditLog::today()->critical()->count();

        // Count unique IPs from failed logins in last hour
        $suspiciousIps = AuditLog::where('action', AuditLog::ACTION_LOGIN_FAILED)
            ->where('created_at', '>=', now()->subHour())
            ->distinct('ip_address')
            ->count('ip_address');

        // Severity distribution
        $severityDist = AuditLog::select('severity', DB::raw('count(*) as count'))
            ->groupBy('severity')
            ->pluck('count', 'severity');

        // Action distribution (top 10)
        $actionDist = AuditLog::select('action', DB::raw('count(*) as count'))
            ->groupBy('action')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Recent activity (last 7 days per day)
        $dailyActivity = AuditLog::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count')
        )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'total'          => $total,
            'today'          => $today,
            'critical'       => $critical,
            'failed_logins'  => $failedLogins,
            'today_critical' => $todayCritical,
            'suspicious_ips' => $suspiciousIps,
            'severity_dist'  => $severityDist,
            'action_dist'    => $actionDist,
            'daily_activity' => $dailyActivity,
        ]);
    }

    // ─── GET /api/audit-logs ──────────────────────────────────────────────────

    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = AuditLog::query()->latest();

        // Apply filters
        if ($request->filled('user_id'))     $query->where('user_id', $request->user_id);
        if ($request->filled('username'))     $query->where('username', 'like', '%' . $request->username . '%');
        if ($request->filled('role'))         $query->where('role', $request->role);
        if ($request->filled('action'))       $query->where('action', $request->action);
        if ($request->filled('severity'))     $query->where('severity', $request->severity);
        if ($request->filled('module'))       $query->where('module', $request->module);
        if ($request->filled('model_type'))   $query->where('model_type', 'like', '%' . $request->model_type . '%');
        if ($request->filled('ip_address'))   $query->where('ip_address', $request->ip_address);
        if ($request->filled('response_status')) $query->where('response_status', $request->response_status);
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(fn($q) => $q
                ->where('description', 'like', $s)
                ->orWhere('username', 'like', $s)
                ->orWhere('email', 'like', $s)
                ->orWhere('ip_address', 'like', $s)
                ->orWhere('module', 'like', $s)
            );
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Sorting
        $sortBy  = in_array($request->sort_by, ['created_at', 'severity', 'action', 'username', 'module', 'response_status'])
            ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $limit = (int)($request->limit ?? 25);
        $page  = (int)($request->page ?? 1);
        $total = $query->count();
        $rows  = $query->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'total'   => $total,
            'page'    => $page,
            'limit'   => $limit,
            'hasMore' => ($page * $limit) < $total,
            'rows'    => $rows,
        ]);
    }

    // ─── GET /api/audit-logs/{id} ─────────────────────────────────────────────

    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        $log = AuditLog::findOrFail($id);
        return response()->json($log);
    }

    // ─── DELETE /api/audit-logs/{id} (Super Admin only) ──────────────────────

    public function destroy(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $role = $request->header('X-User-Role', '');
        if ($role !== 'admin') {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        AuditLog::findOrFail($id)->delete();

        $this->service->log(
            AuditLog::ACTION_DELETE,
            "حذف سجل تدقيق رقم {$id}",
            ['module' => 'سجلات التدقيق', 'model_type' => AuditLog::class, 'model_id' => $id]
        );

        return response()->json(['success' => true]);
    }

    // ─── GET /api/audit-logs/export ───────────────────────────────────────────

    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $format = $request->query('format', 'csv');

        // Build same query as index but without pagination
        $query = AuditLog::query()->latest();
        if ($request->filled('severity'))    $query->where('severity', $request->severity);
        if ($request->filled('action'))      $query->where('action', $request->action);
        if ($request->filled('module'))      $query->where('module', $request->module);
        if ($request->filled('date_from'))   $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->filled('date_to'))     $query->whereDate('created_at', '<=', $request->date_to);

        $logs = $query->limit(10000)->get();

        // Log the export action
        $this->service->log(AuditLog::ACTION_EXPORT, "تصدير سجلات التدقيق ({$logs->count()} سجل) بصيغة {$format}", [
            'module' => 'سجلات التدقيق',
        ]);

        if ($format === 'csv') {
            return $this->exportCsv($logs);
        }

        return $this->exportJson($logs);
    }

    // ─── GET /api/audit-logs/user-trail/{userId} ─────────────────────────────

    public function getUserTrail($userId): \Illuminate\Http\JsonResponse
    {
        $logs = AuditLog::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(200)
            ->get();

        // Calculate session durations where possible
        $user = DB::table('users')->where('id', $userId)->select('id', 'username', 'email')->first();

        return response()->json([
            'user' => $user,
            'trail' => $logs,
        ]);
    }

    // ─── IP Blocking Endpoints ────────────────────────────────────────────────

    public function getBlockedIps(): \Illuminate\Http\JsonResponse
    {
        $ips = \App\Models\BlockedIp::orderBy('created_at', 'desc')->get();
        return response()->json($ips);
    }

    public function blockIp(Request $request): \Illuminate\Http\JsonResponse
    {
        $ip = $request->input('ip_address');
        if (!$ip) {
            return response()->json(['error' => 'عنوان IP مطلوب'], 422);
        }

        $blocked = \App\Models\BlockedIp::firstOrCreate(
            ['ip_address' => $ip],
            [
                'reason' => $request->input('reason', 'حظر أمني من لوحة التحكم'),
                'blocked_by' => $request->input('blocked_by', 'مسؤول النظام'),
            ]
        );

        $this->service->log('block_ip', "تم حظر الجهاز / IP: {$ip}", [
            'module' => 'سجلات التدقيق',
            'severity' => AuditLog::SEVERITY_HIGH,
        ]);

        return response()->json(['success' => true, 'data' => $blocked]);
    }

    public function unblockIp($ip): \Illuminate\Http\JsonResponse
    {
        $decodedIp = urldecode($ip);
        \App\Models\BlockedIp::where('ip_address', $decodedIp)->delete();

        $this->service->log('unblock_ip', "تم فك حظر الجهاز / IP: {$decodedIp}", [
            'module' => 'سجلات التدقيق',
            'severity' => AuditLog::SEVERITY_MEDIUM,
        ]);

        return response()->json(['success' => true]);
    }

    // ─── Filter options ───────────────────────────────────────────────────────

    public function filterOptions(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'actions'   => AuditLog::distinct()->orderBy('action')->pluck('action'),
            'severities' => AuditLog::distinct()->pluck('severity'),
            'modules'   => AuditLog::distinct()->whereNotNull('module')->orderBy('module')->pluck('module'),
            'roles'     => AuditLog::distinct()->whereNotNull('role')->pluck('role'),
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function exportCsv($logs): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="audit_logs_' . date('Y-m-d_H-i-s') . '.csv"',
        ];

        return response()->streamDownload(function () use ($logs) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'ID', 'المستخدم', 'البريد', 'الدور', 'الإجراء', 'الخطورة',
                'الوحدة', 'النموذج', 'الوصف', 'IP', 'المتصفح',
                'نظام التشغيل', 'الجهاز', 'الطريقة', 'الرابط', 'الحالة', 'وقت التنفيذ', 'التاريخ',
            ]);

            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->id, $log->username, $log->email, $log->role,
                    $log->action, $log->severity, $log->module,
                    class_basename((string)$log->model_type) . ($log->model_id ? ":{$log->model_id}" : ''),
                    $log->description, $log->ip_address, $log->browser,
                    $log->operating_system, $log->device_type,
                    $log->request_method, $log->request_url,
                    $log->response_status, $log->execution_time,
                    $log->created_at,
                ]);
            }

            fclose($handle);
        }, 'audit_logs_' . date('Y-m-d') . '.csv', $headers);
    }

    private function exportJson($logs): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-Type'        => 'application/json',
            'Content-Disposition' => 'attachment; filename="audit_logs_' . date('Y-m-d_H-i-s') . '.json"',
        ];

        return response()->streamDownload(function () use ($logs) {
            echo $logs->toJson(JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }, 'audit_logs_' . date('Y-m-d') . '.json', $headers);
    }
}
