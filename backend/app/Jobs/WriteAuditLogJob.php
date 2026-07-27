<?php

namespace App\Jobs;

use App\Models\AuditLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * WriteAuditLogJob — Writes a single audit log record.
 *
 * Using a queue job ensures that heavy logging does not add
 * latency to the API response cycle. Falls back to sync on
 * environments without a queue driver configured.
 */
class WriteAuditLogJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(private readonly array $data) {}

    public function handle(): void
    {
        try {
            AuditLog::create($this->data);
        } catch (\Throwable $e) {
            // Never let audit logging crash the application
            \Illuminate\Support\Facades\Log::error('AuditLog write failed: ' . $e->getMessage(), $this->data);
        }
    }

    public function failed(\Throwable $exception): void
    {
        \Illuminate\Support\Facades\Log::error(
            'WriteAuditLogJob permanently failed: ' . $exception->getMessage()
        );
    }
}
