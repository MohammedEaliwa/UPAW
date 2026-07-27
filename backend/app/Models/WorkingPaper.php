<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkingPaper extends Model
{
    protected $table = 'working_papers';
    protected $fillable = ['title_ar', 'title_en', 'category', 'date', 'size', 'type', 'desc_ar', 'desc_en', 'author_ar', 'author_en', 'file_url', 'allow_download'];
    public $timestamps = false;
}
