<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MapKmlFeature extends Model
{
    protected $table = 'map_kml_features';
    protected $fillable = ['name', 'folder', 'type', 'coordinates', 'details'];
    public $timestamps = false;
}
