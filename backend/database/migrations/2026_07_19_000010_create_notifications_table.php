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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message')->nullable();
            $table->string('type', 50)->default('info');
            $table->string('entity_type', 100)->default('');
            $table->integer('entity_id')->nullable();
            $table->string('link', 191)->default('');
            $table->tinyInteger('is_read')->default(0);
            $table->unsignedBigInteger('target_role')->nullable();
            $table->unsignedBigInteger('target_user')->nullable();
            $table->dateTime('created_at')->nullable();

            $table->index('target_role');
            $table->index('target_user');
            $table->index('is_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
