<?php

namespace App\Listeners;

use App\Events\UserLoginFailed;
use App\Services\AuditLogService;

class LogUserLoginFailedListener
{
    public function __construct(private readonly AuditLogService $service) {}

    public function handle(UserLoginFailed $event): void
    {
        $this->service->logLoginFailed($event->username, $event->ip, $event->userAgent);
    }
}
