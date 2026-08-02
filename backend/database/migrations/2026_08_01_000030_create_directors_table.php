<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('directors', function (Blueprint $table) {
            $table->id();
            // role: 'president' | 'office' | 'administration'
            $table->string('role')->default('office');
            $table->string('title_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->string('name_ar')->nullable()->default('');
            $table->string('name_en')->nullable()->default('');
            $table->string('img', 512)->nullable()->default('');
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });

        // Seed default data
        $now = now();

        // President
        DB::table('directors')->insert([
            'role'        => 'president',
            'title_ar'    => 'رئيس الهيئة',
            'title_en'    => 'Head of the Authority',
            'name_ar'     => '',
            'name_en'     => '',
            'img'         => '',
            'order_index' => 0,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // Offices
        $offices = [
            [1, 'مكتب مشروعات الانشاءات و الصيانة', 'Construction & Maintenance Projects Office'],
            [2, 'مكتب المراجعه الداخلية',             'Internal Audit Office'],
            [3, 'مكتب مشروع الخطة الوطنية',           'National Plan Project Office'],
            [4, 'مكتب الرئيس',                        "President's Office"],
            [5, 'مكتب التعاون الدولي',                'International Cooperation Office'],
            [6, 'مكتب المتابعة التنفيدية',             'Executive Follow-up Office'],
        ];
        foreach ($offices as [$idx, $ar, $en]) {
            DB::table('directors')->insert([
                'role'        => 'office',
                'title_ar'    => $ar,
                'title_en'    => $en,
                'name_ar'     => '',
                'name_en'     => '',
                'img'         => '',
                'order_index' => $idx,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        }

        // Administrations
        $admins = [
            [1, 'ادارة نظم المعلومات الجغرافية و التوثيق', 'GIS & Documentation Administration'],
            [2, 'ادارة القانونية',                          'Legal Administration'],
            [3, 'ادارة الموارد البشرية',                    'Human Resources Administration'],
            [4, 'ادارة المالية',                            'Finance Administration'],
            [5, 'ادارة الشؤون الادارية',                    'Administrative Affairs Administration'],
            [6, 'ادارة شؤون الفروع',                        'Branches Affairs Administration'],
            [7, 'ادارة التخطيط الطبيعي',                    'Physical Planning Administration'],
            [8, 'ادارة التخطيط الحضري',                     'Urban Planning Administration'],
            [9, 'ادارة التفتيش و المتابعه',                  'Inspection & Follow-up Administration'],
        ];
        foreach ($admins as [$idx, $ar, $en]) {
            DB::table('directors')->insert([
                'role'        => 'administration',
                'title_ar'    => $ar,
                'title_en'    => $en,
                'name_ar'     => '',
                'name_en'     => '',
                'img'         => '',
                'order_index' => $idx,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('directors');
    }
};
