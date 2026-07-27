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
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();         // matches users.id
            $table->unsignedBigInteger('notification_id')->nullable(); // matches notifications.id
            $table->tinyInteger('is_read')->default(0);
            $table->tinyInteger('is_deleted')->default(0);

            // Indexes
            $table->index('user_id');
            $table->index('notification_id');

            // Foreign keys
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->foreign('notification_id')
                  ->references('id')
                  ->on('notifications')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
