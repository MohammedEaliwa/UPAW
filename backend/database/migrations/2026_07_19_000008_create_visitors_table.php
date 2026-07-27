<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->string('ip', 45)->nullable();
            $table->string('date')->nullable();

            $table->index('date');
            $table->index('ip');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
