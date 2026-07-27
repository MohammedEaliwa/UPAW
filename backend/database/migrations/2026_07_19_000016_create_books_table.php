<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number', 255)->nullable();
            $table->text('title')->nullable();

            $table->index('serial_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
