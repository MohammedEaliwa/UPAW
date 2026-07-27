<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeRequest extends Model
{
    protected $table = 'employee_requests';

    protected $fillable = [
        'name', 'email', 'phone', 'position', 'qualification',
        'experience', 'cv_file', 'cover_letter', 'status', 'admin_notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
