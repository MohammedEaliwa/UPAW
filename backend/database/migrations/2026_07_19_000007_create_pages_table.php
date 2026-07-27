<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * pages uses a string primary key (slug-based ID), not auto-increment.
     */
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->string('id', 255)->primary(); // slug-based string PK
            $table->string('title_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->longText('content_ar')->nullable();
            $table->longText('content_en')->nullable();
            $table->tinyInteger('is_visible')->default(1);
            $table->string('parent_id', 255)->nullable(); // references pages.id
            $table->integer('order_index')->default(0);
            $table->string('wp_slug', 255)->nullable();
            $table->longText('json_data')->nullable();

            $table->index('parent_id');
            $table->index('is_visible');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
