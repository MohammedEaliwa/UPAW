<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';

    public $timestamps = false;

    protected $fillable = [
        'title', 'message', 'type', 'entity_type', 'entity_id',
        'link', 'is_read', 'target_role', 'target_user', 'created_at',
    ];

    protected $casts = [
        'is_read'   => 'boolean',
        'entity_id' => 'integer',
        'target_role' => 'integer',
        'target_user' => 'integer',
    ];

    /**
     * Relationship: notification has many user_notifications.
     */
    public function userNotifications()
    {
        return $this->hasMany(UserNotification::class, 'notification_id');
    }
}
