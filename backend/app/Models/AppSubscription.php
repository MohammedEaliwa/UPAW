<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'contact',
        'locale',
        'app_name',
        'ip_address'
    ];
}
