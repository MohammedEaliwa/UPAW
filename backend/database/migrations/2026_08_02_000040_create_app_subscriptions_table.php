<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('contact'); // Email or Phone number
            $table->string('locale', 10)->default('ar');
            $table->string('app_name')->default('Balegh');
            $table->ipAddress('ip_address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_subscriptions');
    }
};
