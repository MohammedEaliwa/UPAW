<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id', 'username', 'email', 'role',
        'action', 'severity', 'module',
        'model_type', 'model_id', 'description',
        'old_values', 'new_values',
        'ip_address', 'user_agent', 'browser', 'operating_system',
        'device_type', 'session_id', 'request_method', 'request_url',
        'route_name', 'response_status', 'execution_time',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'execution_time' => 'decimal:4',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ─── Severity Constants ───────────────────────────────────────────────────

    const SEVERITY_CRITICAL      = 'critical';
    const SEVERITY_HIGH          = 'high';
    const SEVERITY_MEDIUM        = 'medium';
    const SEVERITY_LOW           = 'low';
    const SEVERITY_INFORMATIONAL = 'informational';

    // ─── Action Constants ─────────────────────────────────────────────────────

    const ACTION_LOGIN               = 'login';
    const ACTION_LOGOUT              = 'logout';
    const ACTION_LOGIN_FAILED        = 'login_failed';
    const ACTION_REGISTER            = 'register';
    const ACTION_CREATE              = 'create';
    const ACTION_UPDATE              = 'update';
    const ACTION_DELETE              = 'delete';
    const ACTION_FORCE_DELETE        = 'force_delete';
    const ACTION_RESTORE             = 'restore';
    const ACTION_UPLOAD_FILE         = 'upload_file';
    const ACTION_DELETE_FILE         = 'delete_file';
    const ACTION_EXPORT              = 'export';
    const ACTION_IMPORT              = 'import';
    const ACTION_ROLE_CHANGE         = 'role_change';
    const ACTION_ACCOUNT_ACTIVATE    = 'account_activate';
    const ACTION_ACCOUNT_DEACTIVATE  = 'account_deactivate';
    const ACTION_SETTINGS_CHANGE     = 'settings_change';
    const ACTION_UNAUTHORIZED        = 'unauthorized_access';
    const ACTION_FORBIDDEN           = 'forbidden';
    const ACTION_NOT_FOUND           = 'not_found';
    const ACTION_SERVER_ERROR        = 'server_error';
    const ACTION_APPROVE             = 'approve';
    const ACTION_REJECT              = 'reject';
    const ACTION_VIEW                = 'view';

    // ─── Relationships ────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeOfSeverity($query, string $severity)
    {
        return $query->where('severity', $severity);
    }

    public function scopeOfAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeOfModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeCritical($query)
    {
        return $query->where('severity', self::SEVERITY_CRITICAL);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function getSeverityColorAttribute(): string
    {
        return match($this->severity) {
            self::SEVERITY_CRITICAL      => '#dc3545',
            self::SEVERITY_HIGH          => '#fd7e14',
            self::SEVERITY_MEDIUM        => '#ffc107',
            self::SEVERITY_LOW           => '#20c997',
            self::SEVERITY_INFORMATIONAL => '#0dcaf0',
            default                      => '#6c757d',
        };
    }
}
