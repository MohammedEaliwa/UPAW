<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Statistic extends Model
{
    protected $table = 'statistics';
    protected $fillable = ['label_ar', 'label_en', 'value', 'suffix', 'icon'];
    public $timestamps = false;
}
