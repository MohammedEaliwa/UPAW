<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('map_locations', 'color')) {
            Schema::table('map_locations', function (Blueprint $table) {
                $table->string('color', 30)->nullable()->default('#003087');
            });
        }

        if (!Schema::hasColumn('map_kml_features', 'color')) {
            Schema::table('map_kml_features', function (Blueprint $table) {
                $table->string('color', 30)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('map_locations', 'color')) {
            Schema::table('map_locations', function (Blueprint $table) {
                $table->dropColumn('color');
            });
        }

        if (Schema::hasColumn('map_kml_features', 'color')) {
            Schema::table('map_kml_features', function (Blueprint $table) {
                $table->dropColumn('color');
            });
        }
    }
};
