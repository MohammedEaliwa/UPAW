<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'companies';
    protected $fillable = ['serial_number', 'registration_date', 'company_name', 'activity_type', 'founding_meeting_date', 'founding_contract_date', 'commercial_license_number', 'commercial_license_issue_date', 'commercial_license_expiry', 'commercial_registry_number', 'commercial_registry_issue_date', 'commercial_registry_expiry', 'chamber_registration_number', 'chamber_registration_issue_date', 'chamber_registration_expiry', 'subscribed_capital', 'paid_capital', 'shareholders_count', 'experience_years', 'company_nationality', 'professional_license_number', 'tax_file_number', 'social_insurance_number', 'last_approved_budget', 'bank_name', 'bank_branch', 'bank_account', 'agent_name', 'email', 'address', 'phone1', 'phone2', 'phone3', 'country', 'website', 'status', 'notes'];
    public $timestamps = false;
}
