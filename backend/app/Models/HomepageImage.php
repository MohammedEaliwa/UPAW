<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomepageImage extends Model
{
    protected $table = 'homepage_images';
    protected $fillable = ['image_url', 'display_order'];
    public $timestamps = false;
}
