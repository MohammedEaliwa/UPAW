<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // User Information
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('username', 191)->nullable();
            $table->string('email', 191)->nullable();
            $table->string('role', 100)->nullable();

            // Action Information
            $table->string('action', 100)->index();
            $table->string('severity', 50)->default('informational')->index();
            $table->string('module', 100)->nullable()->index();

            // Model Information
            $table->string('model_type', 191)->nullable()->index();
            $table->string('model_id', 100)->nullable();
            $table->text('description')->nullable();

            // Data Capture
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            // Request Information
            $table->string('ip_address', 45)->nullable()->index();
            $table->text('user_agent')->nullable();
            $table->string('browser', 100)->nullable();
            $table->string('operating_system', 100)->nullable();
            $table->string('device_type', 50)->nullable();
            $table->string('session_id', 191)->nullable();
            $table->string('request_method', 10)->nullable();
            $table->text('request_url')->nullable();
            $table->string('route_name', 191)->nullable();

            // Response Information
            $table->smallInteger('response_status')->nullable()->index();
            $table->decimal('execution_time', 10, 4)->nullable();

            $table->timestamps();

            // Composite indexes for common query patterns
            $table->index(['user_id', 'created_at']);
            $table->index(['action', 'severity']);
            $table->index(['module', 'created_at']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
