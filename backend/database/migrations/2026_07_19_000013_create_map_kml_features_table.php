<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('map_kml_features', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('folder')->nullable();
            $table->string('type', 50)->nullable();
            $table->longText('coordinates')->nullable();
            $table->text('details')->nullable();

            $table->index('folder');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('map_kml_features');
    }
};
