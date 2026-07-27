<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsCounter extends Model
{
    protected $table = 'news_counters';
    protected $fillable = ['key', 'value'];
    protected $primaryKey = 'key';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
}
