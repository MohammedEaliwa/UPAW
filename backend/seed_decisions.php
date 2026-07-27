<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasTable('decisions')) {
    Schema::create('decisions', function (Blueprint $table) {
        $table->id();
        $table->string('title_ar');
        $table->string('title_en')->nullable();
        $table->string('number')->nullable();
        $table->string('year')->nullable();
        $table->string('category')->default('قرارات');
        $table->text('file_url');
        $table->string('author')->default('Aya');
        $table->string('author_role')->default('مدخل بيانات');
        $table->timestamps();
    });
    echo "Created table decisions\n";
} else {
    echo "Table decisions already exists\n";
}

DB::table('decisions')->truncate();

$decisions = [
    [
        'title_ar' => 'القرار (121) 2024 بشأن إعادة تشكيل اللجنة الفنية',
        'title_en' => 'Decision (121) 2024 Reconstituting Technical Committee',
        'number' => '121/2024',
        'year' => '2024',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار (121) 2024 بشأن إعادة تشكيل اللجنة الفنية.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار (128) 2024 بشأن تكليف الموظف يعقوب عبدالوهاب عبدالحميد بمهام رئيس فرع المصلحة المرج',
        'title_en' => 'Decision (128) 2024 Appointing Yaqoob Abdulwahab Head of Al Marj Branch',
        'number' => '128/2024',
        'year' => '2024',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار (128) 2024 بشأن تكليف الموظف يعقوب عبدالوهاب عبدالحميد بمهام رئيس فرع المصلحة المرج.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار (132) 2024 بشأن تسوية الاوضاع الوظيفية من حيث الدرجة',
        'title_en' => 'Decision (132) 2024 Adjusting Employee Grades and Status',
        'number' => '132/2024',
        'year' => '2024',
        'category' => 'لوائح',
        'file_url' => '/uploads/' . rawurlencode('القرار (132) 2024 بشأن تسوية الاوضاع الوظيفية من حيث الدرجة.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار (72) 2024 بشأن إعادة تشكيل لجنة المشتريات',
        'title_en' => 'Decision (72) 2024 Reconstituting Procurement Committee',
        'number' => '72/2024',
        'year' => '2024',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار (72) 2024 بشأن إعادة تشكيل لجنة المشتريات.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار (74) 2024 بشأن نقل الموظف عبدالحكيم نصر القرقوزي',
        'title_en' => 'Decision (74) 2024 Transferring Employee Abdulhakim Al-Qargoozi',
        'number' => '74/2024',
        'year' => '2024',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار (74) 2024 بشأن نقل الموظف عبدالحكيم نصر القرقوزي.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار (76) 2024 بشأن تسمية المدير التنفيذي لمشروع الخطة القصيرة',
        'title_en' => 'Decision (76) 2024 Appointing Executive Manager for Short Term Project',
        'number' => '76/2024',
        'year' => '2024',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار (76) 2024 بشأن تسمية المدير التنفيذي لمشروع الخطة القصيرة.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار (80) 2024 بشأن تكليف الموظفة للاهم جمعة بلعيد بمهام مدير ادارة التخطيط الطبيعي',
        'title_en' => 'Decision (80) 2024 Appointing Lahasem Jumaa Belaid Director of Physical Planning',
        'number' => '80/2024',
        'year' => '2024',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار (80) 2024 بشأن تكليف الموظفة للاهم جمعة بلعيد بمهام مدير ادارة التخطيط الطبيعي.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار رقم (45) 2024م بشأن تشكيل لجنة في اعادة النظر في عقود الترسية',
        'title_en' => 'Decision (45) 2024 Forming Committee to Review Awarded Contracts',
        'number' => '45/2024',
        'year' => '2024',
        'category' => 'تشريعات',
        'file_url' => '/uploads/' . rawurlencode('القرار رقم (45)2024م بشأن تشكيل لجنة في اعادة النظر في عقود الترسية.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار رقم (47) لسنة 2025 بشأن تعيين موظفين بالهيئة الوطنية للتخطيط العمراني',
        'title_en' => 'Decision (47) 2025 Appointing Employees at National Urban Planning Authority',
        'number' => '47/2025',
        'year' => '2025',
        'category' => 'قوانين',
        'file_url' => '/uploads/' . rawurlencode('القرار رقم (47) لسنة 2025 بشأن تعيين موظفين بالهيئة الوطنية للتخطيط العمراني.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار رقم (58) 2024 بشأن تكليف السيد شرف الدين علي شرف الدين بمهام مدير مكتب حي الاندلس',
        'title_en' => 'Decision (58) 2024 Appointing Sharafeddin Ali Manager of Hay Al Andalus Office',
        'number' => '58/2024',
        'year' => '2024',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار رقم (58) 2024 بشأن تكليف السيد شرف الدين علي شرف الدين بمهام مدير مكتب حي الاندلس.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار رقم (60) 2024 بشأن تشكيل لجنة تتولى دراسة ملاحظات هيئة الادارية على اللائحة التنفيذية',
        'title_en' => 'Decision (60) 2024 Forming Committee to Study Administrative Board Notes',
        'number' => '60/2024',
        'year' => '2024',
        'category' => 'لوائح',
        'file_url' => '/uploads/' . rawurlencode('القرار رقم (60) 2024 بشأن تشكيل لجنة تتولى دراسة ملاحظات هيئة الادارية على اللائحة التنفيذية.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار رقم (67) 2024 بشأن تشكيل لجنة تتولى متابعة والاشراف على العقود المبرمة بشأن تحوير مبنى وصيانة المقار الخاصة للمصلحة',
        'title_en' => 'Decision (67) 2024 Supervising Renovation and Maintenance Contracts',
        'number' => '67/2024',
        'year' => '2024',
        'category' => 'تشريعات',
        'file_url' => '/uploads/' . rawurlencode('القرار رقم (67) 2024 بشأن تشكيل لجنة تتولى متابعة والاشراف على العقود المبرمة بشأن تحوير مبنى وصيانة المقار الخاصة للمصلحة.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار رقم (78) لسنة 2025 بشأن تكليف موظف جلال مصطفى محمد افتيتة رئيس فرع الهيئة بنغازي',
        'title_en' => 'Decision (78) 2025 Appointing Jalal Mustafa Head of Benghazi Branch',
        'number' => '78/2025',
        'year' => '2025',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار رقم (78) لسنة 2025 بشأن تكليف موظف جلال مصطفى محمد افتيتة رئيس فرع الهيئة بنغازي.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'title_ar' => 'القرار رقم (8) 2024م بشأن تكليف موظفين برئاسة اقسام',
        'title_en' => 'Decision (8) 2024 Appointing Heads of Department',
        'number' => '8/2024',
        'year' => '2024',
        'category' => 'قرارات',
        'file_url' => '/uploads/' . rawurlencode('القرار رقم (8) 2024م بشأن تكليف موظفين برئاسة اقسام.pdf'),
        'author' => 'Aya',
        'author_role' => 'مدخل بيانات',
        'created_at' => now(),
        'updated_at' => now(),
    ],
];

foreach ($decisions as $d) {
    DB::table('decisions')->insert($d);
}

echo "Successfully seeded 14 decisions into database with author 'Aya'!\n";
