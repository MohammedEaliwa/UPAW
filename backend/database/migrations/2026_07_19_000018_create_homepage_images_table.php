<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('homepage_images', function (Blueprint $table) {
            $table->id();
            $table->text('image_url')->nullable();
            $table->integer('display_order')->default(0);
            $table->dateTime('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('homepage_images');
    }
};
