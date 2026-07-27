<?php

// Database URL Cleanup Script
// This script updates all absolute URLs pointing to the old Node.js port (localhost:5000)
// to point to the new Laravel server port (localhost:8000).

$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile)) {
    die("Error: .env file not found at $envFile\n");
}

// Parse .env file
$env = [];
$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) {
        $env[trim($parts[0])] = trim($parts[1]);
    }
}

$mysqlHost = $env['DB_HOST'] ?? '127.0.0.1';
$mysqlPort = $env['DB_PORT'] ?? '3306';
$mysqlUser = $env['DB_USERNAME'] ?? 'root';
$mysqlPass = $env['DB_PASSWORD'] ?? 'Joker@3153015';
$mysqlDb   = $env['DB_DATABASE'] ?? 'upaw_db';

try {
    $mysql = new PDO("mysql:host=$mysqlHost;port=$mysqlPort;dbname=$mysqlDb", $mysqlUser, $mysqlPass);
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to MySQL database: $mysqlDb\n";
} catch (Exception $e) {
    die("MySQL Connection Error: " . $e->getMessage() . "\n");
}

$oldUrl = 'http://localhost:5000';
$newUrl = 'http://localhost:8000';

$updates = [
    'gallery' => [
        'image_url' => "UPDATE `gallery` SET `image_url` = REPLACE(`image_url`, '$oldUrl', '$newUrl')"
    ],
    'homepage_images' => [
        'image_url' => "UPDATE `homepage_images` SET `image_url` = REPLACE(`image_url`, '$oldUrl', '$newUrl')"
    ],
    'news' => [
        'image' => "UPDATE `news` SET `image` = REPLACE(`image`, '$oldUrl', '$newUrl')",
        'content_ar' => "UPDATE `news` SET `content_ar` = REPLACE(`content_ar`, '$oldUrl', '$newUrl')",
        'content_en' => "UPDATE `news` SET `content_en` = REPLACE(`content_en`, '$oldUrl', '$newUrl')",
        'excerpt_ar' => "UPDATE `news` SET `excerpt_ar` = REPLACE(`excerpt_ar`, '$oldUrl', '$newUrl')",
        'excerpt_en' => "UPDATE `news` SET `excerpt_en` = REPLACE(`excerpt_en`, '$oldUrl', '$newUrl')"
    ],
    'pages' => [
        'content_ar' => "UPDATE `pages` SET `content_ar` = REPLACE(`content_ar`, '$oldUrl', '$newUrl')",
        'content_en' => "UPDATE `pages` SET `content_en` = REPLACE(`content_en`, '$oldUrl', '$newUrl')",
        'json_data' => "UPDATE `pages` SET `json_data` = REPLACE(`json_data`, '$oldUrl', '$newUrl')"
    ],
    'working_papers' => [
        'file_url' => "UPDATE `working_papers` SET `file_url` = REPLACE(`file_url`, '$oldUrl', '$newUrl')"
    ]
];

foreach ($updates as $table => $queries) {
    foreach ($queries as $column => $sql) {
        try {
            $affected = $mysql->exec($sql);
            echo "Updated table `$table` column `$column`: $affected rows affected.\n";
        } catch (Exception $e) {
            echo "Error updating table `$table` column `$column`: " . $e->getMessage() . "\n";
        }
    }
}

echo "\nDatabase URL cleanup finished successfully!\n";
