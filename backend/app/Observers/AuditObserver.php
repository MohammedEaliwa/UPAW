<?php

namespace App\Observers;

use App\Models\AuditLog;
use App\Services\AuditLogService;
use Illuminate\Database\Eloquent\Model;

/**
 * AuditObserver — Automatically registered for ALL Eloquent models.
 *
 * Intercepts created/updated/deleted/restored/forceDeleted events
 * and delegates to AuditLogService. No logging code in Controllers needed.
 */
class AuditObserver
{
    public function __construct(private readonly AuditLogService $service) {}

    // ─── Skip audit logging for the AuditLog model itself ─────────────────────

    private function shouldSkip(Model $model): bool
    {
        return $model instanceof AuditLog;
    }

    // ─── CRUD Events ──────────────────────────────────────────────────────────

    public function created(Model $model): void
    {
        if ($this->shouldSkip($model)) return;

        $name = $this->modelLabel($model);
        $this->service->log(
            AuditLog::ACTION_CREATE,
            "تم إنشاء سجل جديد في {$name}" . $this->idSuffix($model),
            [
                'model_type' => get_class($model),
                'model_id'   => $model->getKey(),
                'new_values' => $this->sanitize($model->toArray()),
            ]
        );
    }

    public function updated(Model $model): void
    {
        if ($this->shouldSkip($model)) return;

        $dirty = $model->getDirty();
        if (empty($dirty)) return;

        // Only capture fields that actually changed
        $oldValues = [];
        $newValues = [];
        foreach ($dirty as $field => $newVal) {
            $oldValues[$field] = $model->getOriginal($field);
            $newValues[$field] = $newVal;
        }

        $name = $this->modelLabel($model);
        $this->service->log(
            AuditLog::ACTION_UPDATE,
            "تم تحديث سجل في {$name}" . $this->idSuffix($model),
            [
                'model_type' => get_class($model),
                'model_id'   => $model->getKey(),
                'old_values' => $this->sanitize($oldValues),
                'new_values' => $this->sanitize($newValues),
            ]
        );
    }

    public function deleted(Model $model): void
    {
        if ($this->shouldSkip($model)) return;

        $name = $this->modelLabel($model);
        $this->service->log(
            AuditLog::ACTION_DELETE,
            "تم حذف سجل من {$name}" . $this->idSuffix($model),
            [
                'model_type' => get_class($model),
                'model_id'   => $model->getKey(),
                'old_values' => $this->sanitize($model->toArray()),
            ]
        );
    }

    public function restored(Model $model): void
    {
        if ($this->shouldSkip($model)) return;

        $name = $this->modelLabel($model);
        $this->service->log(
            AuditLog::ACTION_RESTORE,
            "تم استعادة سجل محذوف في {$name}" . $this->idSuffix($model),
            [
                'model_type' => get_class($model),
                'model_id'   => $model->getKey(),
                'new_values' => $this->sanitize($model->toArray()),
            ]
        );
    }

    public function forceDeleted(Model $model): void
    {
        if ($this->shouldSkip($model)) return;

        $name = $this->modelLabel($model);
        $this->service->log(
            AuditLog::ACTION_FORCE_DELETE,
            "تم الحذف النهائي لسجل في {$name}" . $this->idSuffix($model),
            [
                'model_type' => get_class($model),
                'model_id'   => $model->getKey(),
                'old_values' => $this->sanitize($model->toArray()),
                'severity'   => AuditLog::SEVERITY_HIGH,
            ]
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function modelLabel(Model $model): string
    {
        return class_basename($model);
    }

    private function idSuffix(Model $model): string
    {
        $key = $model->getKey();
        return $key ? " (ID: {$key})" : '';
    }

    /**
     * Remove sensitive fields before storing.
     */
    private function sanitize(array $data): array
    {
        $sensitiveFields = ['password', 'remember_token', 'api_token', 'token'];
        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '***';
            }
        }
        return $data;
    }
}
