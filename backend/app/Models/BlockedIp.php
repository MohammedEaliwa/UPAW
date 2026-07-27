<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    protected $table = 'blocked_ips';

    protected $fillable = [
        'ip_address',
        'reason',
        'blocked_by',
    ];
}
