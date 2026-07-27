<?php

namespace App\Listeners;

use App\Events\UserLoggedIn;
use App\Services\AuditLogService;

class LogUserLoginListener
{
    public function __construct(private readonly AuditLogService $service) {}

    public function handle(UserLoggedIn $event): void
    {
        $this->service->logLogin($event->user, $event->ip, $event->userAgent);
    }
}
