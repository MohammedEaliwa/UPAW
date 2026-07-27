<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $table = 'comments';

    public $timestamps = false;

    protected $fillable = ['post_id', 'author_name', 'content', 'date'];

    protected $casts = [
        'post_id' => 'integer',
    ];

    /**
     * Relationship: comment belongs to a news post.
     */
    public function post()
    {
        return $this->belongsTo(News::class, 'post_id');
    }
}
