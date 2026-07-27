<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stores expert registration requests submitted from the main website.
     */
    public function up(): void
    {
        Schema::create('experts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email', 191)->nullable();
            $table->string('phone')->nullable();
            $table->string('specialty')->nullable();
            $table->string('nationality')->nullable();
            $table->text('bio_ar')->nullable();
            $table->text('bio_en')->nullable();
            $table->string('cv_file')->nullable();
            $table->string('photo')->nullable();
            $table->string('status', 50)->default('pending'); // pending | approved | rejected
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
        Schema::dropIfExists('experts');
    }
};
