<?php
// Final comprehensive verification of SQLite → MySQL migration and API health

$sqlitePath = __DIR__ . '/database.sqlite';
$envFile    = __DIR__ . '/../.env';

// Parse .env
$env = [];
foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with(trim($line), '#')) continue;
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) $env[trim($parts[0])] = trim($parts[1]);
}

try {
    $sqlite = new PDO("sqlite:$sqlitePath");
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $mysql  = new PDO("mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname={$env['DB_DATABASE']}", $env['DB_USERNAME'], $env['DB_PASSWORD']);
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    die("DB Connection Error: " . $e->getMessage() . "\n");
}

echo "\n=== SQLite → MySQL Migration Report ===\n\n";

// 1. Table comparison
$tables = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")->fetchAll(PDO::FETCH_COLUMN);
$allMatch = true;
foreach ($tables as $t) {
    try {
        $sq = $sqlite->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        $my = $mysql->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        $ok = ($sq == $my);
        if (!$ok) $allMatch = false;
        printf("  %-26s SQLite: %-6d  MySQL: %-6d  %s\n", $t, $sq, $my, $ok ? '✅' : '❌ MISMATCH');
    } catch (Exception $e) {
        printf("  %-26s %-33s ❌ MISSING in MySQL\n", $t, '');
        $allMatch = false;
    }
}

echo "\n  " . ($allMatch ? "✅ All tables migrated successfully!" : "❌ Some tables have issues!") . "\n";

// 2. API health check
echo "\n=== API Endpoint Health Check ===\n\n";
$ctx = stream_context_create(['http' => ['timeout' => 5]]);
$endpoints = [
    '/api/homepage-images' => 'Homepage Slider Images',
    '/api/news'            => 'News Articles',
    '/api/gallery'         => 'Gallery Photos',
    '/api/pages'           => 'Dynamic Pages',
    '/api/statistics'      => 'Statistics',
    '/api/companies/stats/summary' => 'Companies Summary',
    '/api/books'           => 'Library Books',
    '/api/working-papers'  => 'Working Papers',
];

$base = 'http://127.0.0.1:8000';
foreach ($endpoints as $ep => $label) {
    $res = @file_get_contents($base . $ep, false, $ctx);
    if ($res === false) {
        printf("  %-30s ❌ UNREACHABLE\n", $label);
    } else {
        $data  = json_decode($res, true);
        $count = is_array($data) ? (isset($data['rows']) ? count($data['rows']) . " (page 1)" : count($data)) : 'N/A';
        printf("  %-30s ✅ %s records\n", $label, $count);
    }
}

// 3. Image files check
echo "\n=== Upload Files Availability ===\n\n";
$uploadsDir = __DIR__ . '/../public/uploads';
$fileCount  = count(glob("$uploadsDir/*"));
printf("  Files in backend/public/uploads: %d\n", $fileCount);

// Sample check on homepage images
$rows = $mysql->query("SELECT image_url FROM homepage_images LIMIT 4")->fetchAll(PDO::FETCH_COLUMN);
foreach ($rows as $url) {
    $fname = basename($url);
    $exists = file_exists("$uploadsDir/$fname");
    printf("  %-50s %s\n", $fname, $exists ? '✅ Exists' : '❌ Missing');
}

echo "\n=== DONE ===\n";
echo "  Backend:  http://localhost:8000\n";
echo "  Frontend: http://localhost:5173\n\n";
