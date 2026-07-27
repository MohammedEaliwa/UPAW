<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserLoggedOut
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly array $user,
        public readonly string $ip,
        public readonly string $userAgent,
    ) {}
}
