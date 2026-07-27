<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$pageId = '%d8%a7%d9%84%d9%82%d8%b1%d8%a7%d8%b1%d8%a7%d8%aa-%d9%88-%d8%a7%d9%84%d9%84%d9%88%d8%a7%d8%a6%d8%ad';

$items = [
    [
        'id' => 1,
        'title' => 'لائحة استعمال و تصنيف المناطق للمخططات.',
    ],
    [
        'id' => 2,
        'title' => 'قانون رقم 3 بشأن التخطيط العمراني.',
    ],
    [
        'id' => 3,
        'title' => 'قانون رقم 80 لسنة 2003 بشأن تحديد إختصاصات.',
    ],
    [
        'id' => 4,
        'title' => 'الاجراءات المتخدة بشأن تطوير مصلحة التخطيط العمراني',
    ],
    [
        'id' => 5,
        'title' => 'التشريعات الخاصة بالتخطيط العمراني . الجزء الاول',
    ],
    [
        'id' => 6,
        'title' => 'التشريعات الخاصة بالتخطيط العمراني .الجزء الثاني',
    ],
    [
        'id' => 7,
        'title' => 'القرارات الصادرة بشان تبعية مصلحة التخطيط العمراني',
    ],
    [
        'id' => 8,
        'title' => 'القرار (121) 2024 بشأن إعادة تشكيل اللجنة الفنية',
    ],
    [
        'id' => 9,
        'title' => 'القرار (128) 2024 بشأن تكليف الموظف يعقوب عبدالوهاب عبدالحميد بمهام رئيس فرع المصلحة المرج',
    ],
    [
        'id' => 10,
        'title' => 'القرار (132) 2024 بشأن تسوية الاوضاع الوظيفية من حيث الدرجة',
    ],
    [
        'id' => 11,
        'title' => 'القرار (72) 2024 بشأن إعادة تشكيل لجنة المشتريات',
    ],
    [
        'id' => 12,
        'title' => 'القرار (74) 2024 بشأن نقل الموظف عبدالحكيم نصر القرقوزي',
    ],
    [
        'id' => 13,
        'title' => 'القرار (76) 2024 بشأن تسمية المدير التنفيذي لمشروع الخطة القصيرة',
    ],
    [
        'id' => 14,
        'title' => 'القرار (80) 2024 بشأن تكليف الموظفة للاهم جمعة بلعيد بمهام مدير ادارة التخطيط الطبيعي',
    ],
    [
        'id' => 15,
        'title' => 'القرار رقم (45) 2024م بشأن تشكيل لجنة في اعادة النظر في عقود الترسية',
    ],
    [
        'id' => 16,
        'title' => 'القرار رقم (47) لسنة 2025 بشأن تعيين موظفين بالهيئة الوطنية للتخطيط العمراني',
    ],
    [
        'id' => 17,
        'title' => 'القرار رقم (58) 2024 بشأن تكليف السيد شرف الدين علي شرف الدين بمهام مدير مكتب حي الاندلس',
    ],
    [
        'id' => 18,
        'title' => 'القرار رقم (60) 2024 بشأن تشكيل لجنة تتولى دراسة ملاحظات هيئة الادارية على اللائحة التنفيذية',
    ],
    [
        'id' => 19,
        'title' => 'القرار رقم (67) 2024 بشأن تشكيل لجنة تتولى متابعة والاشراف على العقود المبرمة بشأن تحوير مبنى وصيانة المقار الخاصة للمصلحة',
    ],
    [
        'id' => 20,
        'title' => 'القرار رقم (78) لسنة 2025 بشأن تكليف موظف جلال مصطفى محمد افتيتة رئيس فرع الهيئة بنغازي',
    ],
    [
        'id' => 21,
        'title' => 'القرار رقم (8) 2024م بشأن تكليف موظفين برئاسة اقسام',
    ],
];

$html = '<div style="font-family: Cairo, Tajawal, sans-serif; line-height: 1.8; user-select: none;">';
$html .= '<h2 style="color: #38bdf8; font-weight: 900; margin-bottom: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">القرارات واللوائح الرسمية</h2>';
$html .= '<div style="overflow-x: auto; background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);">';
$html .= '<table style="width: 100%; border-collapse: separate; border-spacing: 0 8px; color: #f8fafc;">';
$html .= '<thead><tr style="background: rgba(30, 41, 59, 0.8); color: #38bdf8; font-weight: 800;"><th style="padding: 12px 16px; border-radius: 8px 0 0 8px; text-align: center; width: 60px;">#</th><th style="padding: 12px 16px; text-align: right;">الموضوع / عنوان القرار</th><th style="padding: 12px 16px; border-radius: 0 8px 8px 0; text-align: center; width: 140px;">العرض</th></tr></thead>';
$html .= '<tbody>';

foreach ($items as $item) {
    $html .= '<tr style="background: rgba(30, 41, 59, 0.4); border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 600; font-size: 0.95rem;">';
    $html .= '<td style="padding: 14px 16px; text-align: center; font-weight: 800; color: #38bdf8;">' . $item['id'] . '</td>';
    $html .= '<td style="padding: 14px 16px; color: #f1f5f9; line-height: 1.6;">' . htmlspecialchars($item['title']) . '</td>';
    $html .= '<td style="padding: 14px 16px; text-align: center;">';
    $html .= '<a href="/decisions" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; transition: all 0.2s; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);">👁️ عرض القرار</a>';
    $html .= '</td>';
    $html .= '</tr>';
}

$html .= '</tbody></table></div></div>';

DB::table('pages')->where('id', $pageId)->update([
    'content_ar' => $html,
    'title_ar' => 'القرارات و اللوائح',
]);

echo "Successfully updated page 'القرارات و اللوائح' with hidden author and protected view buttons!\n";
