<?php

namespace App\Listeners;

use App\Events\UserLoggedOut;
use App\Services\AuditLogService;

class LogUserLogoutListener
{
    public function __construct(private readonly AuditLogService $service) {}

    public function handle(UserLoggedOut $event): void
    {
        $this->service->logLogout($event->user, $event->ip, $event->userAgent);
    }
}
