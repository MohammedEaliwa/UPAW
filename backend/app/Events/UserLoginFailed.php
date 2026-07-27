<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserLoginFailed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $username,
        public readonly string $ip,
        public readonly string $userAgent,
    ) {}
}
