<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $table = 'pages';
    protected $fillable = ['id', 'title_ar', 'title_en', 'content_ar', 'content_en', 'is_visible', 'parent_id', 'order_index', 'wp_slug', 'json_data'];
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
}
