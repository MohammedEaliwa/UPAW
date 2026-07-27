<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stores employee/job requests submitted from the main website.
     */
    public function up(): void
    {
        Schema::create('employee_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email', 191)->nullable();
            $table->string('phone')->nullable();
            $table->string('position')->nullable();      // requested job/position
            $table->string('qualification')->nullable(); // educational qualification
            $table->string('experience')->nullable();    // years of experience
            $table->string('cv_file')->nullable();       // uploaded CV filename
            $table->text('cover_letter')->nullable();
            $table->string('status', 50)->default('pending'); // pending | reviewed | accepted | rejected
            $table->text('admin_notes')->nullable();
            $table->dateTime('created_at')->nullable();
            $table->dateTime('updated_at')->nullable();

            $table->index('status');
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_requests');
    }
};
