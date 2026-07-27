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
        Schema::create('users', function (Blueprint $table) {
            $table->id(); // bigint unsigned auto_increment PK
            $table->string('username')->nullable();
            $table->string('email', 191)->nullable();
            $table->string('phone')->nullable();
            $table->string('job_number')->nullable();
            $table->string('password')->nullable();
            $table->unsignedBigInteger('role_id')->nullable(); // matches roles.id type
            $table->tinyInteger('is_active')->default(1);
            $table->string('branch')->nullable();

            // Indexes for performance
            $table->index('email');
            $table->index('role_id');

            // Foreign key constraint
            $table->foreign('role_id')
                  ->references('id')
                  ->on('roles')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
