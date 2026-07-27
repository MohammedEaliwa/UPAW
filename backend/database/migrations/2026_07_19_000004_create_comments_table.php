<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id')->nullable(); // matches news.id type
            $table->string('author_name')->nullable();
            $table->text('content')->nullable();
            $table->string('date')->nullable();

            // Index
            $table->index('post_id');

            // Foreign key
            $table->foreign('post_id')
                  ->references('id')
                  ->on('news')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
