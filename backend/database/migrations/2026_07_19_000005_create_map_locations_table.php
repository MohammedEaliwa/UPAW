<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('map_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar')->nullable();
            $table->string('name_en')->nullable();
            $table->string('category')->nullable();
            $table->double('latitude', 15, 10)->nullable();
            $table->double('longitude', 15, 10)->nullable();
            $table->text('details_ar')->nullable();
            $table->text('details_en')->nullable();
            $table->integer('created_by')->nullable();
            $table->tinyInteger('is_approved')->default(1);
            $table->text('rejection_comment')->nullable();

            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('map_locations');
    }
};
