<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * news_counters uses a string primary key ("key" column).
     */
    public function up(): void
    {
        Schema::create('news_counters', function (Blueprint $table) {
            $table->string('key', 255)->primary();
            $table->integer('value')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_counters');
    }
};
