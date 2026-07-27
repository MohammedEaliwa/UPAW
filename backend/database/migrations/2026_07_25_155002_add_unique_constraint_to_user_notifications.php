<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Clean up any duplicate entries in user_notifications first
        // This ensures the unique constraint won't fail to apply due to pre-existing duplicates.
        DB::statement("
            DELETE t1 FROM user_notifications t1
            INNER JOIN user_notifications t2 
            WHERE t1.id < t2.id 
              AND t1.user_id = t2.user_id 
              AND t1.notification_id = t2.notification_id
        ");

        // 2. Add the unique constraint
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->unique(['user_id', 'notification_id'], 'un_user_notification_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropUnique('un_user_notification_unique');
        });
    }
};
