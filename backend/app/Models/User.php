<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'users';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'username',
        'email',
        'phone',
        'job_number',
        'password',
        'role_id',
        'is_active',
        'branch',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
    ];

    /**
     * No Laravel timestamps (created_at / updated_at) in this table.
     */
    public $timestamps = false;

    /**
     * Attribute casting.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'role_id'   => 'integer',
    ];

    /**
     * Relationship: a user belongs to a role.
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Relationship: a user has many news articles.
     */
    public function news()
    {
        return $this->hasMany(News::class, 'author_id');
    }

    /**
     * Relationship: a user has many user_notifications.
     */
    public function userNotifications()
    {
        return $this->hasMany(UserNotification::class, 'user_id');
    }
}
