<?php

namespace App\Http\Controllers;

use App\Events\UserLoggedIn;
use App\Events\UserLoggedOut;
use App\Events\UserLoginFailed;
use App\Services\AiTranslationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApiController extends Controller
{
    // ─── helpers ────────────────────────────────────────────────────────────

    /** Return base URL for uploaded files */
    private function uploadsUrl(string $filename): string
    {
        return rtrim(config('app.url'), '/') . '/uploads/' . $filename;
    }

    /**
     * Normalize any stored image/file URL so it always uses the current APP_URL.
     * This rewrites stale localhost:PORT references stored in the database.
     */
    private function normalizeUrl(?string $url): ?string
    {
        if (!$url) return $url;
        // Rewrite any http://localhost:PORT/uploads/... to current APP_URL
        if (preg_match('#^https?://localhost(?::\d+)?(/uploads/.+)$#i', $url, $m)) {
            return rtrim(config('app.url'), '/') . $m[1];
        }
        return $url;
    }

    /**
     * Normalize all image/file URL fields in a collection of DB rows.
     * $fields = list of column names that may contain upload URLs.
     */
    private function normalizeRows($rows, array $fields): \Illuminate\Support\Collection
    {
        return collect($rows)->map(function ($row) use ($fields) {
            $row = (array) $row;
            foreach ($fields as $field) {
                if (isset($row[$field])) {
                    $row[$field] = $this->normalizeUrl($row[$field]);
                }
            }
            return (object) $row;
        });
    }

    /**
     * Normalize any stored image/file URL inside HTML content blocks.
     */
    private function normalizeHtml(?string $html): ?string
    {
        if (!$html) return $html;
        $currentAppUrl = rtrim(config('app.url'), '/');
        return preg_replace('#https?://localhost(?::\d+)?(/uploads/)#i', $currentAppUrl . '$1', $html);
    }

    /** Compress / resize uploaded image with GD and save as JPEG. Returns filename. */
    private function compressImage($file): string
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];

        $uniqueName = time() . '-' . mt_rand(100000000, 999999999) . '.jpg';
        $destDir    = public_path('uploads');
        if (!file_exists($destDir)) {
            mkdir($destDir, 0755, true);
        }
        $destPath = $destDir . '/' . $uniqueName;

        if (!in_array($ext, $allowed)) {
            // Just move file as-is but keep .jpg name
            $file->move($destDir, $uniqueName);
            return $uniqueName;
        }

        $srcPath = $file->getRealPath();

        switch ($ext) {
            case 'png':
                $img = @imagecreatefrompng($srcPath);
                break;
            case 'webp':
                $img = @imagecreatefromwebp($srcPath);
                break;
            default:
                $img = @imagecreatefromjpeg($srcPath);
        }

        if (!$img) {
            $file->move($destDir, $uniqueName);
            return $uniqueName;
        }

        $w = imagesx($img);
        $h = imagesy($img);
        $max = 1200;

        if ($w > $max || $h > $max) {
            if ($w >= $h) {
                $nw = $max;
                $nh = (int)round($h * ($max / $w));
            } else {
                $nh = $max;
                $nw = (int)round($w * ($max / $h));
            }
            $resized = imagecreatetruecolor($nw, $nh);
            imagecopyresampled($resized, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
            imagedestroy($img);
            $img = $resized;
        }

        imagejpeg($img, $destPath, 80);
        imagedestroy($img);

        return $uniqueName;
    }

    /** Update news counters table */
    private function updateNewsCounters(): void
    {
        $total   = DB::table('news')->count();
        $visible = DB::table('news')->where('is_visible', 1)->count();
        $hidden  = DB::table('news')->where('is_visible', 0)->count();
        DB::table('news_counters')->updateOrInsert(['key' => 'total'],   ['value' => $total]);
        DB::table('news_counters')->updateOrInsert(['key' => 'visible'], ['value' => $visible]);
        DB::table('news_counters')->updateOrInsert(['key' => 'hidden'],  ['value' => $hidden]);
    }

    // ─── File upload ─────────────────────────────────────────────────────────

    public function uploadFile(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file uploaded'], 400);
        }
        $file     = $request->file('file');
        $ext      = strtolower($file->getClientOriginalExtension());

        // SECURITY WAF: Block dangerous executable extensions
        $dangerousExts = ['php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'phar', 'exe', 'bat', 'cmd', 'sh', 'cgi', 'pl', 'asp', 'aspx', 'jsp', 'dll', 'so', 'htaccess', 'env'];
        if (in_array($ext, $dangerousExts) || str_contains($ext, 'php')) {
            return response()->json([
                'error' => 'جدار حماية الهيئة (WAF): تم منع ورفض هذا الملف لحماية السيرفر من النشر غير الآمن.'
            ], 403);
        }

        $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'kml', 'kmz', 'txt', 'csv', 'zip', 'rar'];
        if (!in_array($ext, $allowedExts)) {
            return response()->json([
                'error' => 'نوع الملف غير مدعوم للنشر.'
            ], 400);
        }

        $imgExts  = ['jpg', 'jpeg', 'png', 'webp'];

        if (in_array($ext, $imgExts)) {
            $filename = $this->compressImage($file);
        } else {
            $filename = time() . '-' . mt_rand(100000000, 999999999) . '.' . $ext;
            $file->move(public_path('uploads'), $filename);
        }

        return response()->json([
            'url'      => $this->uploadsUrl($filename),
            'filename' => $filename,
        ]);
    }

    // ─── Visitors ────────────────────────────────────────────────────────────

    public function getVisitorCount(Request $request)
    {
        $ip   = $request->ip();
        $today = date('Y-m-d');
        $exists = DB::table('visitors')->where('ip', $ip)->where('date', $today)->exists();
        if (!$exists) {
            DB::table('visitors')->insert(['ip' => $ip, 'date' => $today]);
        }
        $count = DB::table('visitors')->distinct('ip')->count('ip');
        return response()->json(['count' => $count, 'total' => $count]);
    }

    public function getVisitorStats()
    {
        $today  = date('Y-m-d');
        $week   = date('Y-m-d', strtotime('-7 days'));
        $month  = date('Y-m-d', strtotime('-30 days'));

        // Build last 14 days chart data
        $chartData = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $dayLabel = date('d/m', strtotime($date));
            $count = DB::table('visitors')->where('date', $date)->distinct('ip')->count('ip');
            $chartData[] = ['date' => $dayLabel, 'count' => $count, 'full_date' => $date];
        }

        return response()->json([
            'today'  => DB::table('visitors')->where('date', $today)->distinct('ip')->count('ip'),
            'week'   => DB::table('visitors')->where('date', '>=', $week)->distinct('ip')->count('ip'),
            'month'  => DB::table('visitors')->where('date', '>=', $month)->distinct('ip')->count('ip'),
            'total'  => DB::table('visitors')->distinct('ip')->count('ip'),
            'chart'  => $chartData,
        ]);
    }

    // ─── Decisions ──────────────────────────────────────────────────────────

    public function getDecisions()
    {
        $decisions = DB::table('decisions')->orderBy('id', 'asc')->get();
        return response()->json($this->normalizeRows($decisions, ['file_url']));
    }

    // ─── Document Templates ──────────────────────────────────────────────────

    public function getDocuments()
    {
        return response()->json(DB::table('document_templates')->get());
    }

    public function createDocument(Request $request)
    {
        $id = DB::table('document_templates')->insertGetId($request->only(['title', 'fields', 'size']));
        return response()->json(['id' => $id, 'success' => true]);
    }

    public function updateDocument(Request $request, $id)
    {
        DB::table('document_templates')->where('id', $id)->update($request->only(['title', 'fields', 'size']));
        return response()->json(['success' => true]);
    }

    public function deleteDocument($id)
    {
        DB::table('document_templates')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── Auth / Users ────────────────────────────────────────────────────────

    public function login(Request $request)
    {
        $username = trim((string) $request->input('username'));
        $password = trim((string) $request->input('password'));

        // First find matching user by username, email, or job_number
        $user = DB::table('users')
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->select('users.*', 'roles.name as role_name', 'roles.slug as role_slug')
            ->where(function ($q) use ($username) {
                $q->where('users.username', $username)
                  ->orWhere('users.job_number', $username)
                  ->orWhere('users.email', $username);
            })
            ->where('users.password', $password)
            ->first();

        if (!$user) {
            event(new UserLoginFailed($username, $request->ip(), $request->userAgent() ?? ''));
            return response()->json(['error' => 'اسم المستخدم أو كلمة المرور غير صحيحة'], 401);
        }

        if (!$user->is_active) {
            event(new UserLoginFailed($username, $request->ip(), $request->userAgent() ?? ''));
            return response()->json(['error' => 'الحساب غير مفعّل وفي انتظار موافقة الإدارة'], 403);
        }

        $userArr = (array)$user;
        $userArr['role'] = [
            'name' => $user->role_name ?? ($user->role_id == 1 ? 'مسؤول' : ($user->role_id == 2 ? 'مدخل بيانات' : 'موظف')),
            'slug' => $user->role_slug ?? ($user->role_id == 1 ? 'admin' : ($user->role_id == 2 ? 'data_entry' : 'employee')),
        ];
        unset($userArr['role_name'], $userArr['role_slug']);

        // Fire successful login event — AuditLogService will log it automatically
        event(new UserLoggedIn($userArr, $request->ip(), $request->userAgent() ?? ''));

        return response()->json(['user' => $userArr]);
    }

    public function register(Request $request)
    {
        $fullName   = $request->input('fullName') ?? $request->input('username');
        $nationalId = $request->input('nationalId', '');
        $email      = $request->input('email', '');
        $password   = $request->input('password');
        $branch     = $request->input('branch', '');

        $id = DB::table('users')->insertGetId([
            'username'   => $fullName,
            'email'      => $email,
            'phone'      => '',
            'job_number' => $nationalId,
            'password'   => $password,
            'role_id'    => 3,
            'is_active'  => 0,
            'branch'     => $branch,
        ]);

        $this->createNotification([
            'title'      => "طلب تسجيل موظف جديد",
            'message'    => "الموظف: {$fullName} - " . ($branch ?: 'بدون فرع'),
            'type'       => 'add',
            'entityType' => 'user',
            'entityId'   => $id,
            'link'       => '/dashboard/user-management',
        ]);

        return response()->json(['id' => $id, 'success' => true]);
    }

    public function getUsers()
    {
        $users = DB::table('users')
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->select('users.*', 'roles.name as role_name', 'roles.slug as role_slug')
            ->get();
        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $id = DB::table('users')->insertGetId([
            'username'   => $request->input('username'),
            'email'      => $request->input('email'),
            'phone'      => $request->input('phone', ''),
            'job_number' => $request->input('job_number', ''),
            'password'   => $request->input('password'),
            'role_id'    => $request->input('role_id', 3),
            'is_active'  => $request->input('is_active', 1),
            'branch'     => $request->input('branch', ''),
        ]);
        return response()->json(['id' => $id, 'success' => true]);
    }

    public function updateUser(Request $request, $id)
    {
        // Validate that $id is a real integer (prevents "undefined" string from slipping through)
        $userId = (int) $id;
        if ($userId <= 0) {
            return response()->json(['error' => 'Invalid user ID'], 422);
        }

        $data = $request->only(['username', 'email', 'phone', 'job_number', 'role_id', 'is_active', 'branch']);

        // Explicitly cast is_active to int (0 or 1) to prevent MySQL datetime/integer mismatch errors
        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = $data['is_active'] ? 1 : 0;
        }

        if ($request->filled('password')) {
            $data['password'] = $request->input('password');
        }

        DB::table('users')->where('id', $userId)->update($data);
        return response()->json(['success' => true]);
    }

    public function deleteUser($id)
    {
        DB::table('users')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function getRoles()
    {
        return response()->json(DB::table('roles')->get());
    }

    // ─── Statistics ──────────────────────────────────────────────────────────

    public function getStatistics()
    {
        return response()->json(DB::table('statistics')->get());
    }

    public function createStatistic(Request $request)
    {
        $id = DB::table('statistics')->insertGetId($request->only(['label_ar', 'label_en', 'value', 'suffix', 'icon']));
        return response()->json(['id' => $id, 'success' => true]);
    }

    public function updateStatistic(Request $request, $id)
    {
        DB::table('statistics')->where('id', $id)->update($request->only(['label_ar', 'label_en', 'value', 'suffix', 'icon']));
        return response()->json(['success' => true]);
    }

    public function deleteStatistic($id)
    {
        DB::table('statistics')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── Books ───────────────────────────────────────────────────────────────

    public function getBooks()
    {
        // Use SIGNED (MySQL) not INTEGER (SQLite) for numeric cast
        $books = DB::table('books')->orderByRaw('CAST(serial_number AS SIGNED) ASC')->get(['id', 'serial_number', 'title']);
        return response()->json($books);
    }

    public function createBook(Request $request)
    {
        if (!$request->filled('title')) {
            return response()->json(['error' => 'Title is required'], 400);
        }
        $id = DB::table('books')->insertGetId([
            'serial_number' => $request->input('serial_number', ''),
            'title'         => $request->input('title'),
        ]);
        return response()->json(['id' => $id, 'serial_number' => $request->input('serial_number', ''), 'title' => $request->input('title')]);
    }

    public function updateBook(Request $request, $id)
    {
        if (!$request->filled('title')) {
            return response()->json(['error' => 'Title is required'], 400);
        }
        DB::table('books')->where('id', $id)->update([
            'serial_number' => $request->input('serial_number', ''),
            'title'         => $request->input('title'),
        ]);
        return response()->json(['success' => true]);
    }

    public function deleteBook($id)
    {
        DB::table('books')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── Working Papers ──────────────────────────────────────────────────────

    public function getWorkingPapers()
    {
        $rows = $this->normalizeRows(
            DB::table('working_papers')->orderBy('id', 'desc')->get(),
            ['file_url']
        );
        return response()->json($rows);
    }

    public function createWorkingPaper(Request $request)
    {
        $data = $request->only(['title_ar', 'title_en', 'category', 'date', 'size', 'type', 'desc_ar', 'desc_en', 'author_ar', 'author_en', 'allow_download']);
        AiTranslationService::autoTranslateData($data, [
            'title_ar'  => 'title_en',
            'desc_ar'   => 'desc_en',
            'author_ar' => 'author_en',
        ]);
        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $filename = time() . '-' . mt_rand(100000000, 999999999) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads'), $filename);
            $data['file_url'] = $this->uploadsUrl($filename);
            $data['size']     = round($file->getSize() / 1048576, 1) . ' MB';
        } else {
            $data['file_url'] = $request->input('file_url', '');
        }
        $id = DB::table('working_papers')->insertGetId($data);
        return response()->json(['id' => $id, 'success' => true]);
    }

    public function updateWorkingPaper(Request $request, $id)
    {
        $data = $request->only(['title_ar', 'title_en', 'category', 'date', 'size', 'type', 'desc_ar', 'desc_en', 'author_ar', 'author_en', 'allow_download']);
        AiTranslationService::autoTranslateData($data, [
            'title_ar'  => 'title_en',
            'desc_ar'   => 'desc_en',
            'author_ar' => 'author_en',
        ]);
        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $filename = time() . '-' . mt_rand(100000000, 999999999) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads'), $filename);
            $data['file_url'] = $this->uploadsUrl($filename);
            $data['size']     = round($file->getSize() / 1048576, 1) . ' MB';
        }
        DB::table('working_papers')->where('id', $id)->update($data);
        return response()->json(['success' => true]);
    }

    public function toggleWorkingPaperDownload(Request $request, $id)
    {
        $val = $request->input('allow_download', 1);
        DB::table('working_papers')->where('id', $id)->update(['allow_download' => $val ? 1 : 0]);
        return response()->json(['success' => true]);
    }

    public function deleteWorkingPaper($id)
    {
        $row = DB::table('working_papers')->where('id', $id)->first();
        if ($row && $row->file_url && str_contains($row->file_url, '/uploads/')) {
            $filename = basename($row->file_url);
            $path     = public_path('uploads/' . $filename);
            if (file_exists($path)) {
                unlink($path);
            }
        }
        DB::table('working_papers')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── Pages ───────────────────────────────────────────────────────────────

    public function getPages()
    {
        $pages = DB::table('pages')->get()->map(function ($page) {
            $page->content_ar = $this->normalizeHtml($page->content_ar);
            $page->content_en = $this->normalizeHtml($page->content_en);
            if (!empty($page->json_data)) {
                $page->json_data = $this->normalizeHtml($page->json_data);
            }
            return $page;
        });
        return response()->json($pages);
    }

    public function getPage($id)
    {
        $cleanId = trim($id, '-');
        $encodedClean = strtolower(rawurlencode($cleanId));
        $lowerClean = strtolower($cleanId);
        $encodedRaw = strtolower(rawurlencode($id));

        $page = DB::table('pages')
            ->where('id', $id)
            ->orWhere('id', $cleanId)
            ->orWhereRaw('LOWER(id) = ?', [$encodedClean])
            ->orWhereRaw('LOWER(id) = ?', [$lowerClean])
            ->orWhereRaw('LOWER(id) = ?', [$encodedRaw])
            ->orWhereRaw('LOWER(id) = ?', [strtolower($id)])
            ->first();

        if (!$page) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $res = [
            'id'          => $page->id,
            'title_ar'    => $page->title_ar ?? '',
            'title_en'    => $page->title_en ?? '',
            'content_ar'  => $this->normalizeHtml($page->content_ar ?? ''),
            'content_en'  => $this->normalizeHtml($page->content_en ?? ''),
            'is_visible'  => $page->is_visible !== 0,
            'parent_id'   => $page->parent_id ?? '',
            'order_index' => $page->order_index ?? 0,
            'wp_slug'     => $page->wp_slug ?? '',
        ];

        if (!empty($page->json_data)) {
            $json = json_decode($this->normalizeHtml($page->json_data), true);
            if (is_array($json)) {
                $res = array_merge($res, $json);
            }
        }

        return response()->json($res);
    }

    public function createPage(Request $request)
    {
        $id = $request->input('id');
        if (!$id) {
            return response()->json(['error' => 'id is required'], 422);
        }

        // Check if page already exists
        $exists = DB::table('pages')->where('id', $id)->exists();
        if ($exists) {
            return response()->json(['error' => 'Page ID already exists'], 409);
        }

        $data = [
            'id'          => $id,
            'title_ar'    => $request->input('title_ar', ''),
            'title_en'    => $request->input('title_en', ''),
            'content_ar'  => $request->input('content_ar', ''),
            'content_en'  => $request->input('content_en', ''),
            'is_visible'  => $request->input('is_visible', true) ? 1 : 0,
            'parent_id'   => $request->input('parent_id', null),
            'order_index' => $request->input('order_index', 0),
            'wp_slug'     => $request->input('wp_slug', ''),
        ];

        AiTranslationService::autoTranslateData($data, [
            'title_ar'   => 'title_en',
            'content_ar' => 'content_en',
        ]);

        // Store extra fields (sections, tasks, etc.) in json_data
        $stdCols = ['id', 'title_ar', 'title_en', 'content_ar', 'content_en', 'is_visible', 'order_index', 'parent_id', 'wp_slug'];
        $extra = [];
        foreach ($request->all() as $key => $val) {
            if (!in_array($key, $stdCols)) {
                $extra[$key] = $val;
            }
        }
        if (!empty($extra)) {
            $data['json_data'] = json_encode($extra, JSON_UNESCAPED_UNICODE);
        }

        DB::table('pages')->insert($data);

        return response()->json([
            'id'          => $data['id'],
            'title_ar'    => $data['title_ar'],
            'title_en'    => $data['title_en'],
            'content_ar'  => $data['content_ar'],
            'content_en'  => $data['content_en'],
            'is_visible'  => (bool) $data['is_visible'],
            'parent_id'   => $data['parent_id'],
            'order_index' => $data['order_index'],
        ], 201);
    }

    public function updatePage(Request $request, $id)
    {
        $stdCols = ['title_ar', 'title_en', 'content_ar', 'content_en', 'is_visible', 'order_index', 'parent_id', 'wp_slug'];
        
        $data = $request->only($stdCols);
        if ($request->has('is_visible')) {
            $data['is_visible'] = $request->input('is_visible') ? 1 : 0;
        }

        AiTranslationService::autoTranslateData($data, [
            'title_ar'   => 'title_en',
            'content_ar' => 'content_en',
        ]);

        // Gather all other properties into json_data
        $allInputs = $request->all();
        $extra = [];
        
        if ($request->filled('json_data')) {
            $jd = $request->input('json_data');
            $decoded = is_string($jd) ? json_decode($jd, true) : $jd;
            if (is_array($decoded)) {
                $extra = $decoded;
            }
        }

        foreach ($allInputs as $key => $val) {
            if (!in_array($key, $stdCols) && $key !== 'json_data' && $key !== 'id') {
                $extra[$key] = $val;
            }
        }

        if (!empty($extra)) {
            $data['json_data'] = json_encode($extra, JSON_UNESCAPED_UNICODE);
        }

        if ($request->has('image') && $request->hasFile('image')) {
            $filename = $this->compressImage($request->file('image'));
            $data['image'] = $this->uploadsUrl($filename);
        }

        DB::table('pages')->where('id', $id)->update($data);
        $updated = DB::table('pages')->where('id', $id)->first();
        
        $res = [
            'id'          => $updated->id,
            'title_ar'    => $updated->title_ar ?? '',
            'title_en'    => $updated->title_en ?? '',
            'content_ar'  => $updated->content_ar ?? '',
            'content_en'  => $updated->content_en ?? '',
            'is_visible'  => $updated->is_visible !== 0,
            'parent_id'   => $updated->parent_id ?? '',
            'order_index' => $updated->order_index ?? 0,
            'wp_slug'     => $updated->wp_slug ?? '',
        ];

        if (!empty($updated->json_data)) {
            $json = json_decode($updated->json_data, true);
            if (is_array($json)) {
                $res = array_merge($res, $json);
            }
        }

        return response()->json($res);
    }

    public function togglePageVisibility(Request $request, $id)
    {
        $val = $request->input('is_visible');
        DB::table('pages')->where('id', $id)->update(['is_visible' => $val ? 1 : 0]);
        return response()->json(['success' => true]);
    }

    public function deletePage($id)
    {
        DB::table('pages')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── Map Locations ───────────────────────────────────────────────────────

    public function getMapLocations(Request $request)
    {
        $query = DB::table('map_locations')
            ->leftJoin('users', 'map_locations.created_by', '=', 'users.id')
            ->select('map_locations.*', 'users.username as creator_name');

        if ($request->query('show_pending') || $request->query('all') || $request->has('all')) {
            // Show all map locations (0 = pending, 1 = approved, 2 = re-study)
        } else {
            $query->where('map_locations.is_approved', 1);
        }

        if ($request->filled('category')) {
            $query->where('map_locations.category', $request->query('category'));
        }

        $locations = $query->get()->map(function ($item) {
            $item->id = (int) $item->id;
            $item->is_approved = (int) $item->is_approved;
            $item->latitude = (float) $item->latitude;
            $item->longitude = (float) $item->longitude;
            $item->color = $item->color ?? '#003087';
            return $item;
        });

        return response()->json($locations);
    }

    public function createMapLocation(Request $request)
    {
        $data = $request->only(['name_ar', 'name_en', 'category', 'latitude', 'longitude', 'details_ar', 'details_en', 'created_by', 'is_approved', 'color']);
        AiTranslationService::autoTranslateData($data, [
            'name_ar'    => 'name_en',
            'details_ar' => 'details_en',
        ]);
        if (!isset($data['is_approved'])) {
            $data['is_approved'] = 0;
        } else {
            $data['is_approved'] = (int) $data['is_approved'];
        }

        $id = DB::table('map_locations')->insertGetId($data);

        $name = $data['name_ar'] ?? 'معلم جديد';

        if ($data['is_approved'] === 0) {
            $this->createNotification([
                'title'      => 'طلب إضافة معلم جديد (قيد المراجعة)',
                'message'    => "تم تقديم طلب إضافة المعلم \"{$name}\" وهو بانتظار المراجعة والاعتماد.",
                'type'       => 'add',
                'entityType' => 'map',
                'entityId'   => $id,
                'targetRole' => 1,
                'link'       => "/dashboard/manage-map?review={$id}",
            ]);
        } else {
            $this->createNotification([
                'title'      => 'تم إضافة معلم جديد على الخريطة',
                'message'    => "تمت إضافة المعلم \"{$name}\" بنجاح على الخريطة العمرانية.",
                'type'       => 'add',
                'entityType' => 'map',
                'entityId'   => $id,
                'link'       => '/dashboard/manage-map',
            ]);
        }

        return response()->json(['id' => $id, 'success' => true]);
    }

    public function updateMapLocation(Request $request, $id)
    {
        $location = DB::table('map_locations')->where('id', $id)->first();
        if (!$location) {
            return response()->json(['error' => 'المعلم غير موجود'], 404);
        }

        $data = $request->only(['name_ar', 'name_en', 'category', 'latitude', 'longitude', 'details_ar', 'details_en', 'is_approved', 'rejection_comment', 'color']);
        AiTranslationService::autoTranslateData($data, [
            'name_ar'    => 'name_en',
            'details_ar' => 'details_en',
        ]);
        if (isset($data['is_approved'])) {
            $data['is_approved'] = (int)$data['is_approved'];
        }

        DB::table('map_locations')->where('id', $id)->update($data);

        $newApproved = isset($data['is_approved']) ? (int)$data['is_approved'] : (int)$location->is_approved;
        $oldApproved = (int)$location->is_approved;
        $name = !empty($data['name_ar']) ? $data['name_ar'] : ($location->name_ar ?? 'معلم جغرافي');

        if ($location->created_by) {
            if ($newApproved === 1 && $oldApproved !== 1) {
                // Approved by admin -> Notify user who created it
                $this->createNotification([
                    'title'      => 'تمت الموافقة على المعلم الجغرافي',
                    'message'    => "تمت الموافقة على المعلم \"{$name}\" ونشره بنجاح على الخريطة العمرانية.",
                    'type'       => 'add',
                    'entityType' => 'map',
                    'entityId'   => (int)$id,
                    'targetUser' => (int)$location->created_by,
                    'link'       => '/dashboard/manage-map',
                ]);
            } else if ($newApproved === 2 && $oldApproved !== 2) {
                // Rejected / Re-study requested -> Notify user who created it
                $rejectionReason = !empty($data['rejection_comment']) ? $data['rejection_comment'] : 'يرجى مراجعة تفاصيل الموقع والتعديل عليه.';
                $this->createNotification([
                    'title'      => 'إعادة دراسة معلم جغرافي',
                    'message'    => "تمت إعادة المعلم \"{$name}\" لإعادة الدراسة. السبب: {$rejectionReason}",
                    'type'       => 'warning',
                    'entityType' => 'map',
                    'entityId'   => (int)$id,
                    'targetUser' => (int)$location->created_by,
                    'link'       => "/dashboard/manage-map?re_study={$id}",
                ]);
            } else if ($newApproved === 0 && $oldApproved === 2) {
                // Resubmitted by employee -> Notify admins
                $this->createNotification([
                    'title'      => 'تم إعادة إرسال معلم للمراجعة',
                    'message'    => "قام الموظف بتعديل وإعادة إرسال المعلم \"{$name}\" للمراجعة والاعتماد.",
                    'type'       => 'info',
                    'entityType' => 'map',
                    'entityId'   => (int)$id,
                    'targetRole' => 1,
                    'link'       => "/dashboard/manage-map?review={$id}",
                ]);
            }
        }

        return response()->json(['success' => true]);
    }

    public function deleteMapLocation($id)
    {
        DB::table('map_locations')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── KML ─────────────────────────────────────────────────────────────────

    public function getKmlFeatures()
    {
        return response()->json(DB::table('map_kml_features')->get());
    }

    public function updateKmlFeatureColor(Request $request, $id)
    {
        $color = $request->input('color');
        DB::table('map_kml_features')->where('id', $id)->update(['color' => $color]);
        return response()->json(['success' => true]);
    }

    public function updateKmlFolderColor(Request $request)
    {
        $folder = $request->input('folder');
        $color  = $request->input('color');
        if ($folder) {
            DB::table('map_kml_features')->where('folder', $folder)->update(['color' => $color]);
        }
        return response()->json(['success' => true]);
    }

    public function clearKmlFeatures()
    {
        DB::table('map_kml_features')->delete();
        return response()->json(['success' => true]);
    }

    public function uploadKml(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file uploaded'], 400);
        }

        $file       = $request->file('file');
        $editorName = $request->query('editor_username', 'مدخل البيانات');
        $replace    = $request->query('replace') === 'true' || $request->input('replace') === true;
        $isKmz      = strtolower($file->getClientOriginalExtension()) === 'kmz';

        try {
            if ($isKmz) {
                $tmpDir = sys_get_temp_dir() . '/kml_' . time();
                mkdir($tmpDir, 0755, true);
                $zipPath = $file->getRealPath();
                $zip = new \ZipArchive();
                if ($zip->open($zipPath) === true) {
                    $zip->extractTo($tmpDir);
                    $zip->close();
                }
                $kmlPath = $tmpDir . '/doc.kml';
                if (!file_exists($kmlPath)) {
                    array_map('unlink', glob("$tmpDir/*.*"));
                    rmdir($tmpDir);
                    return response()->json(['error' => 'KMZ does not contain doc.kml'], 400);
                }
                $kmlContent = file_get_contents($kmlPath);
                array_map('unlink', glob("$tmpDir/*.*"));
                rmdir($tmpDir);
            } else {
                $kmlContent = file_get_contents($file->getRealPath());
            }

            if ($replace) {
                DB::table('map_kml_features')->delete();
            }

            $count = $this->parseKmlAndInsert($kmlContent);

            $this->createNotification([
                'title'      => "تم رفع ملف خرائط جديد بواسطة {$editorName}",
                'message'    => "تم تحليل واستيراد {$count} معلم جغرافي بنجاح.",
                'type'       => 'add',
                'entityType' => 'map',
                'link'       => '/dashboard/manage-map',
            ]);

            return response()->json(['success' => true, 'count' => $count]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error processing file: ' . $e->getMessage()], 500);
        }
    }

    private function parseKmlAndInsert(string $kmlContent): int
    {
        $count = 0;
        preg_match_all('/<Folder[^>]*>([\s\S]*?)<\/Folder>/i', $kmlContent, $folderMatches);

        foreach ($folderMatches[1] as $folderBlock) {
            preg_match('/<name>([\s\S]*?)<\/name>/i', $folderBlock, $nameM);
            $folderName = isset($nameM[1]) ? preg_replace('/\<!\[CDATA\[(.*?)\]\]\>/s', '$1', $nameM[1]) : 'عام';
            $folderName = trim($folderName);

            preg_match_all('/<Placemark[^>]*>([\s\S]*?)<\/Placemark>/i', $folderBlock, $placemarks);

            foreach ($placemarks[1] as $placemark) {
                preg_match('/<name>([\s\S]*?)<\/name>/i', $placemark, $pnM);
                $name = isset($pnM[1]) ? trim(preg_replace('/\<!\[CDATA\[(.*?)\]\]\>/s', '$1', $pnM[1])) : '';

                preg_match('/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i', $placemark, $descM);
                $details = isset($descM[1]) ? trim($descM[1]) : '';

                if (str_contains($placemark, '<Point>')) {
                    preg_match('/<Point>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i', $placemark, $cm);
                    if (isset($cm[1])) {
                        $parts = explode(',', trim($cm[1]));
                        if (count($parts) >= 2) {
                            $lng = (float)$parts[0];
                            $lat = (float)$parts[1];
                            if (!is_nan($lat) && !is_nan($lng)) {
                                DB::table('map_kml_features')->insert([
                                    'name'        => $name,
                                    'folder'      => $folderName,
                                    'type'        => 'Point',
                                    'coordinates' => json_encode([$lat, $lng]),
                                    'details'     => $details,
                                ]);
                                $count++;
                            }
                        }
                    }
                } elseif (str_contains($placemark, '<Polygon>')) {
                    preg_match('/<Polygon>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i', $placemark, $cm);
                    if (isset($cm[1])) {
                        $tokens    = preg_split('/\s+/', trim($cm[1]));
                        $coordsArr = [];
                        foreach ($tokens as $tok) {
                            $pts = explode(',', $tok);
                            if (count($pts) >= 2) {
                                $lng = (float)$pts[0];
                                $lat = (float)$pts[1];
                                if (!is_nan($lat) && !is_nan($lng)) {
                                    $coordsArr[] = [$lat, $lng];
                                }
                            }
                        }
                        if (count($coordsArr) > 0) {
                            DB::table('map_kml_features')->insert([
                                'name'        => $name,
                                'folder'      => $folderName,
                                'type'        => 'Polygon',
                                'coordinates' => json_encode($coordsArr),
                                'details'     => $details,
                            ]);
                            $count++;
                        }
                    }
                }
            }
        }

        return $count;
    }

    // ─── News ────────────────────────────────────────────────────────────────

    public function getNewsStats()
    {
        $counters = DB::table('news_counters')->pluck('value', 'key');
        return response()->json([
            'total'   => $counters['total']   ?? DB::table('news')->count(),
            'visible' => $counters['visible'] ?? DB::table('news')->where('is_visible', 1)->count(),
            'hidden'  => $counters['hidden']  ?? DB::table('news')->where('is_visible', 0)->count(),
        ]);
    }

    public function getNews(Request $request)
    {
        $query = DB::table('news');

        if ($request->filled('category'))       $query->where('category', $request->query('category'));
        if ($request->filled('target_audience')) $query->where('target_audience', $request->query('target_audience'));
        if ($request->filled('is_visible'))      $query->where('is_visible', (int)$request->query('is_visible'));
        if ($request->filled('search')) {
            $s = '%' . $request->query('search') . '%';
            $query->where(fn($q) => $q->where('title_ar', 'like', $s)->orWhere('excerpt_ar', 'like', $s));
        }

        $query->orderBy('id', 'desc');
        $limit = $request->filled('limit') ? (int)$request->query('limit') : null;
        if ($limit) {
            $page   = (int)($request->query('page', 1));
            $offset = ($page - 1) * $limit;
            $total  = $query->count();
            $rows   = $query->skip($offset)->take($limit)->get();
            $rows   = $this->normalizeRows($rows, ['image']);
            return response()->json(['total' => $total, 'rows' => $rows]);
        }

        $rows = $this->normalizeRows($query->get(), ['image']);
        return response()->json($rows);
    }

    public function createNews(Request $request)
    {
        $data = $request->only(['category', 'title_ar', 'title_en', 'date', 'image', 'excerpt_ar', 'excerpt_en', 'content_ar', 'content_en', 'target_audience', 'author_id']);
        $data['is_visible'] = $request->input('is_visible', true) ? 1 : 0;
        
        AiTranslationService::autoTranslateData($data, [
            'title_ar'   => 'title_en',
            'excerpt_ar' => 'excerpt_en',
            'content_ar' => 'content_en',
        ]);

        $id = DB::table('news')->insertGetId($data);
        $authorId = $request->input('author_id');
        $user = $authorId ? DB::table('users')->where('id', $authorId)->first() : null;
        $authorName = $user ? $user->username : 'مدخل البيانات';

        $this->createNotification([
            'title'      => "تمت إضافة خبر جديد بواسطة {$authorName}",
            'message'    => $data['title_ar'] ?? '',
            'type'       => 'add',
            'entityType' => 'news',
            'entityId'   => $id,
            'link'       => '/dashboard/manage-news',
            'targetRole' => ($request->input('target_audience') === 'الموظفين') ? 3 : null,
        ]);
        $this->updateNewsCounters();

        return response()->json(['id' => $id]);
    }

    public function getNewsItem($id)
    {
        $item = DB::table('news')->where('id', $id)->first();
        if (!$item) {
            return response()->json(['error' => 'Not found'], 404);
        }
        $item->image = $this->normalizeUrl($item->image);
        return response()->json($item);
    }

    public function updateNews(Request $request, $id)
    {
        $data = $request->only(['category', 'title_ar', 'title_en', 'image', 'excerpt_ar', 'excerpt_en', 'content_ar', 'content_en', 'target_audience']);
        if ($request->has('is_visible')) {
            $data['is_visible'] = $request->input('is_visible') ? 1 : 0;
        }
        
        AiTranslationService::autoTranslateData($data, [
            'title_ar'   => 'title_en',
            'excerpt_ar' => 'excerpt_en',
            'content_ar' => 'content_en',
        ]);

        DB::table('news')->where('id', $id)->update($data);
        $editorName = $request->input('editor_username', 'مدخل البيانات');
        $this->createNotification([
            'title'      => "تم تعديل خبر بواسطة {$editorName}",
            'message'    => $data['title_ar'] ?? '',
            'type'       => 'edit',
            'entityType' => 'news',
            'entityId'   => $id,
            'link'       => '/dashboard/manage-news',
            'targetRole' => 1,
        ]);
        $this->updateNewsCounters();
        return response()->json(['success' => true]);
    }

    public function deleteNews(Request $request, $id)
    {
        $editorName = $request->query('editor_username', 'مدخل البيانات');
        $row = DB::table('news')->where('id', $id)->first();
        DB::table('news')->where('id', $id)->delete();
        $this->createNotification([
            'title'      => "تم حذف خبر بواسطة {$editorName}",
            'message'    => $row ? ($row->title_ar ?? '') : '',
            'type'       => 'delete',
            'entityType' => 'news',
            'link'       => '/dashboard/manage-news',
            'targetRole' => 1,
        ]);
        $this->updateNewsCounters();
        return response()->json(['success' => true]);
    }

    public function toggleNewsVisibility(Request $request, $id)
    {
        $val = $request->input('is_visible');
        DB::table('news')->where('id', $id)->update(['is_visible' => $val ? 1 : 0]);
        $this->updateNewsCounters();
        return response()->json(['success' => true]);
    }

    public function getNewsComments($id)
    {
        return response()->json(DB::table('comments')->where('post_id', $id)->orderBy('id')->get());
    }

    public function createNewsComment(Request $request, $id)
    {
        $authorName = $request->input('author_name');
        $content    = $request->input('content');
        $date       = date('Y-m-d');
        $newId      = DB::table('comments')->insertGetId([
            'post_id'     => $id,
            'author_name' => $authorName,
            'content'     => $content,
            'date'        => $date,
        ]);
        $this->createNotification([
            'title'      => "تعليق جديد من {$authorName}",
            'message'    => $content,
            'type'       => 'info',
            'entityType' => 'comment',
            'entityId'   => $newId,
            'link'       => '/dashboard/internal-news',
            'targetRole' => 1,
        ]);
        return response()->json(['id' => $newId, 'post_id' => $id, 'author_name' => $authorName, 'content' => $content, 'date' => $date]);
    }

    // ─── Notifications ───────────────────────────────────────────────────────

    public function getNotifications(Request $request)
    {
        $limit   = (int)($request->query('limit', 30));
        $roleId  = $request->query('role_id');
        $userId  = $request->query('user_id');
        $userIdV = $userId ?? 0;

        $query = DB::table('notifications as n')
            ->leftJoin('user_notifications as un', function ($join) use ($userIdV) {
                $join->on('un.notification_id', '=', 'n.id')
                     ->where('un.user_id', '=', $userIdV);
            })
            ->selectRaw('n.*, COALESCE(un.is_read, 0) as is_read')
            ->where(fn($q) => $q->whereNull('un.is_deleted')->orWhere('un.is_deleted', 0));

        if ($roleId || $userId) {
            $query->where(function ($q) use ($roleId, $userId) {
                if ($roleId) $q->orWhere('n.target_role', $roleId);
                if ($userId) $q->orWhere('n.target_user', $userId);
                $q->orWhere(fn($q2) => $q2->whereNull('n.target_role')->whereNull('n.target_user'));
            });
        }

        $rows = $query->orderBy('n.id', 'desc')->limit($limit)->get();
        return response()->json($rows);
    }

    public function getNotificationsUnreadCount(Request $request)
    {
        $roleId  = $request->query('role_id');
        $userId  = $request->query('user_id');
        $userIdV = $userId ?? 0;

        // Cache per-user unread count for 15 seconds to reduce repeated DB hits
        $cacheKey = 'notif_unread_' . ($userId ?? 'guest') . '_' . ($roleId ?? 'all');
        $count = \Illuminate\Support\Facades\Cache::remember($cacheKey, 15, function () use ($roleId, $userId, $userIdV) {
            $query = DB::table('notifications as n')
                ->leftJoin('user_notifications as un', function ($join) use ($userIdV) {
                    $join->on('un.notification_id', '=', 'n.id')
                         ->where('un.user_id', '=', $userIdV);
                })
                ->where(fn($q) => $q->whereNull('un.is_deleted')->orWhere('un.is_deleted', 0))
                ->where(function ($q) {
                    $q->whereNull('un.is_read')
                      ->orWhere('un.is_read', 0);
                });

            if ($roleId || $userId) {
                $query->where(function ($q) use ($roleId, $userId) {
                    if ($roleId) $q->orWhere('n.target_role', $roleId);
                    if ($userId) $q->orWhere('n.target_user', $userId);
                    $q->orWhere(fn($q2) => $q2->whereNull('n.target_role')->whereNull('n.target_user'));
                });
            }

            return $query->count();
        });

        return response()->json(['count' => $count]);
    }


    public function createNotificationHttp(Request $request)
    {
        $this->createNotification($request->all());
        return response()->json(['success' => true]);
    }

    private function createNotification(array $data): void
    {
        DB::table('notifications')->insert([
            'title'       => $data['title']       ?? '',
            'message'     => $data['message']     ?? '',
            'type'        => $data['type']         ?? 'info',
            'entity_type' => $data['entityType']   ?? $data['entity_type'] ?? '',
            'entity_id'   => $data['entityId']     ?? $data['entity_id'] ?? null,
            'link'        => $data['link']          ?? '',
            'is_read'     => 0,
            'target_role' => $data['targetRole']   ?? $data['target_role'] ?? null,
            'target_user' => $data['targetUser']   ?? $data['target_user'] ?? null,
            'created_at'  => date('Y-m-d H:i:s'),
        ]);
    }

    public function markNotificationRead(Request $request, $id)
    {
        $userId = $request->query('user_id');
        if ($userId) {
            DB::table('user_notifications')->upsert(
                [['user_id' => $userId, 'notification_id' => $id, 'is_read' => 1]],
                ['user_id', 'notification_id'],
                ['is_read']
            );
        } else {
            DB::table('notifications')->where('id', $id)->update(['is_read' => 1]);
        }
        return response()->json(['success' => true]);
    }

    public function markAllNotificationsRead(Request $request)
    {
        $roleId = $request->query('role_id');
        $userId = $request->query('user_id');

        if ($userId) {
            // Bulk upsert in one query instead of a per-row loop
            $notifIds = DB::table('notifications')
                ->where(fn($q) => $q->where('target_user', $userId)
                    ->orWhere('target_role', $roleId)
                    ->orWhere(fn($q2) => $q2->whereNull('target_role')->whereNull('target_user')))
                ->pluck('id');

            if ($notifIds->isNotEmpty()) {
                $upsertRows = $notifIds->map(fn($nId) => [
                    'user_id'         => $userId,
                    'notification_id' => $nId,
                    'is_read'         => 1,
                ])->toArray();

                // Chunk to avoid exceeding max query parameter limit
                foreach (array_chunk($upsertRows, 500) as $chunk) {
                    DB::table('user_notifications')->upsert(
                        $chunk,
                        ['user_id', 'notification_id'],
                        ['is_read']
                    );
                }
            }
        } else {
            DB::table('notifications')->where('is_read', 0)->update(['is_read' => 1]);
        }
        return response()->json(['success' => true]);
    }

    public function deleteNotification(Request $request, $id)
    {
        $userId = $request->query('user_id');
        if ($userId) {
            DB::table('user_notifications')->upsert(
                [['user_id' => $userId, 'notification_id' => $id, 'is_deleted' => 1]],
                ['user_id', 'notification_id'],
                ['is_deleted']
            );
        } else {
            DB::table('notifications')->where('id', $id)->delete();
        }
        return response()->json(['success' => true]);
    }

    public function clearAllNotifications(Request $request)
    {
        $userId = $request->query('user_id');
        $roleId = $request->query('role_id');

        if ($userId) {
            // Soft-delete: mark all relevant notifications as deleted for this user
            $notifIds = DB::table('notifications')
                ->where(fn($q) => $q->where('target_user', $userId)
                    ->orWhere('target_role', $roleId)
                    ->orWhere(fn($q2) => $q2->whereNull('target_role')->whereNull('target_user')))
                ->pluck('id');

            if ($notifIds->isNotEmpty()) {
                $upsertRows = $notifIds->map(fn($nId) => [
                    'user_id'         => $userId,
                    'notification_id' => $nId,
                    'is_deleted'      => 1,
                    'is_read'         => 1,
                ])->toArray();

                foreach (array_chunk($upsertRows, 500) as $chunk) {
                    DB::table('user_notifications')->upsert(
                        $chunk,
                        ['user_id', 'notification_id'],
                        ['is_deleted', 'is_read']
                    );
                }
            }
        } else {
            // Hard delete all (admin action)
            DB::table('notifications')->delete();
        }
        return response()->json(['success' => true]);
    }

    // ─── Companies ───────────────────────────────────────────────────────────

    public function getCompanies(Request $request)
    {
        $query = DB::table('companies');
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('search')) {
            $s = '%' . $request->query('search') . '%';
            $query->where(fn($q) => $q->where('company_name', 'like', $s)
                ->orWhere('country', 'like', $s)
                ->orWhere('activity_type', 'like', $s));
        }
        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function createCompany(Request $request)
    {
        $data = $request->except(['_token']);
        if (!$request->filled('company_name')) {
            return response()->json(['error' => 'اسم الشركة مطلوب'], 400);
        }
        $year = date('Y');
        $cnt  = DB::table('companies')->whereYear('created_at', $year)->count();
        $seq  = str_pad($cnt + 1, 3, '0', STR_PAD_LEFT);
        $serialNumber = "REG-{$year}-{$seq}";

        $data['serial_number']    = $serialNumber;
        $data['registration_date'] = $data['registration_date'] ?? date('Y-m-d');
        $data['status']           = 'pending';

        $id = DB::table('companies')->insertGetId($data);

        $this->createNotification([
            'title'      => "طلب تسجيل شركة جديدة: {$data['company_name']}",
            'message'    => "تقدمت شركة \"{$data['company_name']}\" بطلب تسجيل جديد برقم {$serialNumber}",
            'type'       => 'info',
            'entityType' => 'company',
            'entityId'   => $id,
            'link'       => '/dashboard/companies',
            'targetRole' => 1,
        ]);
        return response()->json(['success' => true, 'id' => $id, 'serial_number' => $serialNumber]);
    }

    public function updateCompany(Request $request, $id)
    {
        $data = $request->except(['_token']);
        if (empty($data)) {
            return response()->json(['error' => 'No data provided'], 400);
        }
        DB::table('companies')->where('id', $id)->update($data);
        return response()->json(['success' => true]);
    }

    public function updateCompanyStatus(Request $request, $id)
    {
        $status = $request->input('status');
        if (!in_array($status, ['pending', 'approved', 'rejected'])) {
            return response()->json(['error' => 'Invalid status'], 400);
        }
        $updated = DB::table('companies')->where('id', $id)->update([
            'status' => $status,
            'notes'  => $request->input('notes', ''),
        ]);
        if (!$updated) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json(['success' => true]);
    }

    public function deleteCompany($id)
    {
        $deleted = DB::table('companies')->where('id', $id)->delete();
        if (!$deleted) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json(['success' => true]);
    }

    public function getCompaniesSummary()
    {
        // Single aggregated query instead of 4 separate COUNT() calls
        $rows = DB::table('companies')
            ->selectRaw('status, COUNT(*) as cnt')
            ->groupBy('status')
            ->get()
            ->pluck('cnt', 'status');

        $total = array_sum($rows->toArray());
        return response()->json([
            'total'    => $total,
            'pending'  => $rows['pending']  ?? 0,
            'approved' => $rows['approved'] ?? 0,
            'rejected' => $rows['rejected'] ?? 0,
        ]);
    }

    // ─── Gallery ─────────────────────────────────────────────────────────────

    public function getGallery(Request $request)
    {
        $query      = DB::table('gallery')->where('is_visible', 1);
        $category   = $request->query('category');
        if ($category && $category !== 'all' && $category !== 'الكل') {
            $query->where('category', $category);
        }
        $page   = (int)($request->query('page', 1));
        $limit  = (int)($request->query('limit', 10));
        $offset = ($page - 1) * $limit;
        $total  = $query->count();
        $rows   = $this->normalizeRows(
            $query->orderByRaw('display_order ASC, created_at DESC')->skip($offset)->take($limit)->get(),
            ['image_url']
        );
        return response()->json([
            'total'   => $total,
            'page'    => $page,
            'limit'   => $limit,
            'hasMore' => $offset + count($rows) < $total,
            'rows'    => $rows,
        ]);
    }

    public function getGalleryAll(Request $request)
    {
        $query    = DB::table('gallery');
        $category = $request->query('category');
        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }
        $rows = $this->normalizeRows(
            $query->orderByRaw('display_order ASC, created_at DESC')->get(),
            ['image_url']
        );
        return response()->json($rows);
    }

    public function getGalleryCategories()
    {
        $cats = DB::table('gallery')->distinct()->orderBy('category')->pluck('category');
        return response()->json($cats);
    }

    public function createGallery(Request $request)
    {
        $imageUrl = $request->input('image_url', '');
        if ($request->hasFile('image')) {
            $filename = $this->compressImage($request->file('image'));
            $imageUrl = $this->uploadsUrl($filename);
        }
        if (!$imageUrl) {
            return response()->json(['error' => 'Image is required'], 400);
        }
        $id = DB::table('gallery')->insertGetId([
            'title_ar'      => $request->input('title_ar', ''),
            'title_en'      => $request->input('title_en', ''),
            'category'      => $request->input('category', 'عام'),
            'image_url'     => $imageUrl,
            'display_order' => $request->input('display_order', 0),
            'is_visible'    => 1,
        ]);
        return response()->json(['success' => true, 'id' => $id, 'image_url' => $imageUrl]);
    }

    public function updateGallery(Request $request, $id)
    {
        $data = [];
        if ($request->has('title_ar'))      $data['title_ar']      = $request->input('title_ar');
        if ($request->has('title_en'))      $data['title_en']      = $request->input('title_en');
        if ($request->has('category'))      $data['category']      = $request->input('category');
        if ($request->has('is_visible'))    $data['is_visible']    = $request->input('is_visible');
        if ($request->has('display_order')) $data['display_order'] = $request->input('display_order');
        if ($request->hasFile('image')) {
            $filename         = $this->compressImage($request->file('image'));
            $data['image_url'] = $this->uploadsUrl($filename);
        }
        if (empty($data)) {
            return response()->json(['error' => 'No data to update'], 400);
        }
        $updated = DB::table('gallery')->where('id', $id)->update($data);
        if (!$updated) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json(['success' => true]);
    }

    public function toggleGalleryVisibility($id)
    {
        DB::statement('UPDATE gallery SET is_visible = CASE WHEN is_visible = 1 THEN 0 ELSE 1 END WHERE id = ?', [$id]);
        $row = DB::table('gallery')->where('id', $id)->first();
        return response()->json(['success' => true, 'is_visible' => $row?->is_visible]);
    }

    public function deleteGallery($id)
    {
        $row = DB::table('gallery')->where('id', $id)->first();
        if (!$row) {
            return response()->json(['error' => 'Not found'], 404);
        }
        if ($row->image_url && str_contains($row->image_url, '/uploads/')) {
            $filename = basename($row->image_url);
            $path     = public_path('uploads/' . $filename);
            if (file_exists($path)) {
                unlink($path);
            }
        }
        DB::table('gallery')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    public function bulkDeleteGallery(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['error' => 'Invalid or empty IDs array'], 400);
        }
        $total = 0;
        foreach (array_chunk($ids, 500) as $chunk) {
            $rows = DB::table('gallery')->whereIn('id', $chunk)->get(['image_url']);
            foreach ($rows as $row) {
                if ($row->image_url && str_contains($row->image_url, '/uploads/')) {
                    $path = public_path('uploads/' . basename($row->image_url));
                    if (file_exists($path)) {
                        unlink($path);
                    }
                }
            }
            $total += DB::table('gallery')->whereIn('id', $chunk)->delete();
        }
        return response()->json(['success' => true, 'count' => $total]);
    }

    public function bulkUpdateGalleryCategory(Request $request)
    {
        $ids      = $request->input('ids', []);
        $category = $request->input('category');
        if (!is_array($ids) || count($ids) === 0 || !$category) {
            return response()->json(['error' => 'Invalid or missing fields'], 400);
        }
        $total = 0;
        foreach (array_chunk($ids, 500) as $chunk) {
            $total += DB::table('gallery')->whereIn('id', $chunk)->update(['category' => $category]);
        }
        return response()->json(['success' => true, 'count' => $total]);
    }

    public function bulkUpdateGalleryVisibility(Request $request)
    {
        $ids       = $request->input('ids', []);
        $isVisible = $request->input('is_visible');
        if (!is_array($ids) || count($ids) === 0 || $isVisible === null) {
            return response()->json(['error' => 'Invalid or missing fields'], 400);
        }
        $val   = $isVisible ? 1 : 0;
        $total = 0;
        foreach (array_chunk($ids, 500) as $chunk) {
            $total += DB::table('gallery')->whereIn('id', $chunk)->update(['is_visible' => $val]);
        }
        return response()->json(['success' => true, 'count' => $total]);
    }

    // ─── Homepage Images ─────────────────────────────────────────────────────

    public function getHomepageImages()
    {
        $images = $this->normalizeRows(
            DB::table('homepage_images')->orderByRaw('display_order ASC, id DESC')->get(),
            ['image_url']
        );
        return response()->json($images)
            ->header('Cache-Control', 'public, max-age=300')
            ->header('Vary', 'Accept-Encoding');
    }

    public function createHomepageImage(Request $request)
    {
        if (!$request->hasFile('image')) {
            return response()->json(['error' => 'Image is required'], 400);
        }
        $filename  = $this->compressImage($request->file('image'));
        $imageUrl  = $this->uploadsUrl($filename);
        $id        = DB::table('homepage_images')->insertGetId([
            'image_url'     => $imageUrl,
            'display_order' => $request->input('display_order', 0),
        ]);
        return response()->json(['success' => true, 'id' => $id, 'image_url' => $imageUrl]);
    }

    public function deleteHomepageImage($id)
    {
        $row = DB::table('homepage_images')->where('id', $id)->first();
        if (!$row) {
            return response()->json(['error' => 'Image not found'], 404);
        }
        if ($row->image_url && str_contains($row->image_url, '/uploads/')) {
            $path = public_path('uploads/' . basename($row->image_url));
            if (file_exists($path)) {
                unlink($path);
            }
        }
        DB::table('homepage_images')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── Complaints ──────────────────────────────────────────────────────────

    public function getComplaints()
    {
        $rows = DB::table('complaints')->orderBy('created_at', 'desc')->get();
        return response()->json($rows);
    }

    public function createComplaint(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:255',
            'id_number'      => 'nullable|string|max:255',
            'complaint_type' => 'nullable|string|max:255',
            'subject'        => 'nullable|string|max:255',
            'message'        => 'required|string',
        ]);

        $data['status']     = 'pending';
        $data['created_at'] = date('Y-m-d H:i:s');

        $id = DB::table('complaints')->insertGetId($data);

        $this->createNotification([
            'title'      => "شكوى جديدة من: {$data['name']}",
            'message'    => "الموضوع: " . ($data['subject'] ?? 'بدون موضوع'),
            'type'       => 'warning',
            'entityType' => 'complaint',
            'entityId'   => $id,
            'link'       => '/dashboard/requests',
            'targetRole' => 1,
        ]);

        return response()->json(['success' => true, 'id' => $id]);
    }

    public function updateComplaintStatus(Request $request, $id)
    {
        $status = $request->input('status');
        if (!in_array($status, ['pending', 'approved', 'rejected'])) {
            return response()->json(['error' => 'Invalid status'], 400);
        }
        
        DB::table('complaints')->where('id', $id)->update([
            'status' => $status,
            'notes'  => $request->input('notes', ''),
        ]);

        return response()->json(['success' => true]);
    }

    public function deleteComplaint($id)
    {
        DB::table('complaints')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── Experts ─────────────────────────────────────────────────────────────

    public function getExperts()
    {
        $rows = DB::table('experts')->orderBy('created_at', 'desc')->get();
        return response()->json($rows);
    }

    public function createExpert(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'specialty'        => 'nullable|string|max:255',
            'experience_years' => 'nullable|integer',
            'degree'           => 'nullable|string|max:255',
            'license_number'   => 'nullable|string|max:255',
            'email'            => 'nullable|email|max:255',
            'phone'            => 'nullable|string|max:255',
            'address'          => 'nullable|string|max:255',
            'attachments'      => 'nullable|string', // JSON array of uploaded file URLs
        ]);

        $year = date('Y');
        $cnt  = DB::table('experts')->whereYear('created_at', $year)->count();
        $seq  = str_pad($cnt + 1, 3, '0', STR_PAD_LEFT);
        $serialNumber = "EXP-{$year}-{$seq}";

        $data['serial_number'] = $serialNumber;
        $data['status']        = 'pending';
        $data['created_at']    = date('Y-m-d H:i:s');

        $id = DB::table('experts')->insertGetId($data);

        $this->createNotification([
            'title'      => "طلب تسجيل خبير جديد: {$data['name']}",
            'message'    => "التخصص: " . ($data['specialty'] ?? 'غير محدد') . "، الخبرة: " . ($data['experience_years'] ?? 0) . " سنة",
            'type'       => 'info',
            'entityType' => 'expert',
            'entityId'   => $id,
            'link'       => '/dashboard/requests',
            'targetRole' => 1,
        ]);

        return response()->json(['success' => true, 'id' => $id, 'serial_number' => $serialNumber]);
    }

    public function updateExpertStatus(Request $request, $id)
    {
        $status = $request->input('status');
        if (!in_array($status, ['pending', 'approved', 'rejected'])) {
            return response()->json(['error' => 'Invalid status'], 400);
        }
        
        DB::table('experts')->where('id', $id)->update([
            'status' => $status,
            'notes'  => $request->input('notes', ''),
        ]);

        return response()->json(['success' => true]);
    }

    public function deleteExpert($id)
    {
        DB::table('experts')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // ─── Employee Requests ───────────────────────────────────────────────────

    public function getEmployeeRequests()
    {
        $rows = DB::table('employee_requests')->orderBy('created_at', 'desc')->get();
        return response()->json($rows);
    }

    public function createEmployeeRequest(Request $request)
    {
        $data = $request->validate([
            'employee_name'  => 'required|string|max:255',
            'employee_email' => 'nullable|email|max:255',
            'request_type'   => 'required|string|max:255',
            'subject'        => 'required|string|max:255',
            'message'        => 'required|string',
        ]);

        $data['status']     = 'pending';
        $data['created_at'] = date('Y-m-d H:i:s');

        $id = DB::table('employee_requests')->insertGetId($data);

        $this->createNotification([
            'title'      => "طلب موظف جديد من: {$data['employee_name']}",
            'message'    => "الموضوع: {$data['subject']}، النوع: {$data['request_type']}",
            'type'       => 'info',
            'entityType' => 'employee_request',
            'entityId'   => $id,
            'link'       => '/dashboard/requests',
            'targetRole' => 1,
        ]);

        return response()->json(['success' => true, 'id' => $id]);
    }

    public function updateEmployeeRequestStatus(Request $request, $id)
    {
        $status = $request->input('status');
        if (!in_array($status, ['pending', 'approved', 'rejected'])) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        DB::table('employee_requests')->where('id', $id)->update([
            'status' => $status,
            'notes'  => $request->input('notes', ''),
        ]);

        return response()->json(['success' => true]);
    }

    public function deleteEmployeeRequest($id)
    {
        DB::table('employee_requests')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}

