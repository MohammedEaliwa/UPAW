<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    protected $table = 'gallery';
    protected $fillable = ['title_ar', 'title_en', 'category', 'image_url', 'is_visible', 'display_order'];
    public $timestamps = false;
}
