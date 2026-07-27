<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('working_papers', function (Blueprint $table) {
            $table->id();
            $table->string('title_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->string('category')->nullable();
            $table->string('date')->nullable();
            $table->string('size')->default('1.5 MB');
            $table->string('type', 20)->default('pdf');
            $table->text('desc_ar')->nullable();
            $table->text('desc_en')->nullable();
            $table->string('author_ar')->nullable();
            $table->string('author_en')->nullable();
            $table->text('file_url')->nullable();
            $table->tinyInteger('allow_download')->default(1);
            $table->dateTime('created_at')->nullable();

            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('working_papers');
    }
};
