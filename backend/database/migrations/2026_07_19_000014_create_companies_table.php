<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->nullable();
            $table->string('registration_date')->nullable();
            $table->string('company_name')->nullable();
            $table->string('activity_type')->nullable();
            $table->string('founding_meeting_date')->nullable();
            $table->string('founding_contract_date')->nullable();
            $table->string('commercial_license_number')->nullable();
            $table->string('commercial_license_issue_date')->nullable();
            $table->string('commercial_license_expiry')->nullable();
            $table->string('commercial_registry_number')->nullable();
            $table->string('commercial_registry_issue_date')->nullable();
            $table->string('commercial_registry_expiry')->nullable();
            $table->string('chamber_registration_number')->nullable();
            $table->string('chamber_registration_issue_date')->nullable();
            $table->string('chamber_registration_expiry')->nullable();
            $table->string('subscribed_capital')->nullable();
            $table->string('paid_capital')->nullable();
            $table->string('shareholders_count')->nullable();
            $table->string('experience_years')->nullable();
            $table->string('company_nationality')->nullable();
            $table->string('professional_license_number')->nullable();
            $table->string('tax_file_number')->nullable();
            $table->string('social_insurance_number')->nullable();
            $table->string('last_approved_budget')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_branch')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('agent_name')->nullable();
            $table->string('email', 191)->nullable();
            $table->string('address')->nullable();
            $table->string('phone1')->nullable();
            $table->string('phone2')->nullable();
            $table->string('phone3')->nullable();
            $table->string('country')->nullable();
            $table->string('website')->nullable();
            $table->string('status', 50)->default('pending');
            $table->text('notes')->nullable();
            $table->dateTime('created_at')->nullable();

            $table->index('status');
            $table->index('company_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
