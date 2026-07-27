<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    protected $table = 'news';

    public $timestamps = false;

    protected $fillable = [
        'category', 'title_ar', 'title_en', 'date', 'image',
        'excerpt_ar', 'excerpt_en', 'content_ar', 'content_en',
        'target_audience', 'is_visible', 'author_id',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'author_id'  => 'integer',
    ];

    /**
     * Relationship: news belongs to an author (user).
     */
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Relationship: news has many comments.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class, 'post_id');
    }
}
