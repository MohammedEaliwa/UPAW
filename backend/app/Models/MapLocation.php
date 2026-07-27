<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MapLocation extends Model
{
    protected $table = 'map_locations';
    protected $fillable = ['name_ar', 'name_en', 'category', 'latitude', 'longitude', 'details_ar', 'details_en', 'created_by', 'is_approved', 'rejection_comment'];
    public $timestamps = false;
}
