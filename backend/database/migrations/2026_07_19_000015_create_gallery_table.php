<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery', function (Blueprint $table) {
            $table->id();
            $table->string('title_ar')->nullable()->default('');
            $table->string('title_en')->nullable()->default('');
            $table->string('category')->nullable()->default('عام');
            $table->text('image_url')->nullable();
            $table->tinyInteger('is_visible')->default(1);
            $table->integer('display_order')->default(0);
            $table->dateTime('created_at')->nullable();

            $table->index('category');
            $table->index('is_visible');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery');
    }
};
