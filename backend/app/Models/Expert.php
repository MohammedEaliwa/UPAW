<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expert extends Model
{
    protected $table = 'experts';

    protected $fillable = [
        'name', 'email', 'phone', 'specialty', 'nationality',
        'bio_ar', 'bio_en', 'cv_file', 'photo', 'status', 'admin_notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
