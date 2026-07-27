<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    protected $table = 'user_notifications';

    public $timestamps = false;

    protected $fillable = ['user_id', 'notification_id', 'is_read', 'is_deleted'];

    protected $casts = [
        'user_id'         => 'integer',
        'notification_id' => 'integer',
        'is_read'         => 'boolean',
        'is_deleted'      => 'boolean',
    ];

    /**
     * Relationship: belongs to a user.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relationship: belongs to a notification.
     */
    public function notification()
    {
        return $this->belongsTo(Notification::class, 'notification_id');
    }
}
