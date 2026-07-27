<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statistics', function (Blueprint $table) {
            $table->id();
            $table->string('label_ar')->nullable();
            $table->string('label_en')->nullable();
            $table->integer('value')->nullable();
            $table->string('suffix')->nullable();
            $table->string('icon')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('statistics');
    }
};
