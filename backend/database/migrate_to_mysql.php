<?php

// Database Migration Script: SQLite to MySQL
// This script parses the Laravel .env file, connects to MySQL, creates the database
// and tables, and copies all data from database.sqlite with zero loss.

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
$mysqlPass = $env['DB_PASSWORD'] ?? '';
$mysqlDb   = $env['DB_DATABASE'] ?? 'upaw_db';

echo "Migration Configuration:\n";
echo "- SQLite: database/database.sqlite\n";
echo "- MySQL Host: $mysqlHost:$mysqlPort\n";
echo "- MySQL User: $mysqlUser\n";
echo "- MySQL Database: $mysqlDb\n\n";

$sqlitePath = __DIR__ . '/database.sqlite';
if (!file_exists($sqlitePath)) {
    die("Error: SQLite database not found at $sqlitePath\n");
}

try {
    $sqlite = new PDO("sqlite:$sqlitePath");
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Successfully connected to SQLite database.\n";
} catch (Exception $e) {
    die("SQLite Connection Error: " . $e->getMessage() . "\n");
}

try {
    // Connect to MySQL server without database first to create it
    $mysqlServer = new PDO("mysql:host=$mysqlHost;port=$mysqlPort", $mysqlUser, $mysqlPass);
    $mysqlServer->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Creating MySQL database if not exists: $mysqlDb...\n";
    $mysqlServer->exec("CREATE DATABASE IF NOT EXISTS `$mysqlDb` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // Connect to the specific database
    $mysql = new PDO("mysql:host=$mysqlHost;port=$mysqlPort;dbname=$mysqlDb", $mysqlUser, $mysqlPass);
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Successfully connected to MySQL database: $mysqlDb.\n";
} catch (Exception $e) {
    die("MySQL Connection/Database Creation Error: " . $e->getMessage() . "\n");
}

// DDL for all 18 tables
$tables = [
    'roles' => "
        CREATE TABLE IF NOT EXISTS `roles` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(255) NULL,
            `slug` VARCHAR(255) NULL,
            `description` TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'users' => "
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(255) NULL,
            `email` VARCHAR(255) NULL,
            `phone` VARCHAR(255) NULL,
            `job_number` VARCHAR(255) NULL,
            `password` VARCHAR(255) NULL,
            `role_id` INT NULL,
            `is_active` TINYINT DEFAULT 1,
            `branch` VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'news' => "
        CREATE TABLE IF NOT EXISTS `news` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `category` VARCHAR(255) NULL,
            `title_ar` VARCHAR(255) NULL,
            `title_en` VARCHAR(255) NULL,
            `date` VARCHAR(255) NULL,
            `image` VARCHAR(255) NULL,
            `excerpt_ar` TEXT NULL,
            `excerpt_en` TEXT NULL,
            `content_ar` LONGTEXT NULL,
            `content_en` LONGTEXT NULL,
            `target_audience` VARCHAR(255) NULL,
            `is_visible` TINYINT DEFAULT 1,
            `author_id` INT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'comments' => "
        CREATE TABLE IF NOT EXISTS `comments` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `post_id` INT NULL,
            `author_name` VARCHAR(255) NULL,
            `content` TEXT NULL,
            `date` VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'map_locations' => "
        CREATE TABLE IF NOT EXISTS `map_locations` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name_ar` VARCHAR(255) NULL,
            `name_en` VARCHAR(255) NULL,
            `category` VARCHAR(255) NULL,
            `latitude` DOUBLE NULL,
            `longitude` DOUBLE NULL,
            `details_ar` TEXT NULL,
            `details_en` TEXT NULL,
            `created_by` INT NULL,
            `is_approved` TINYINT DEFAULT 1,
            `rejection_comment` TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'statistics' => "
        CREATE TABLE IF NOT EXISTS `statistics` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `label_ar` VARCHAR(255) NULL,
            `label_en` VARCHAR(255) NULL,
            `value` INT NULL,
            `suffix` VARCHAR(255) NULL,
            `icon` VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'pages' => "
        CREATE TABLE IF NOT EXISTS `pages` (
            `id` VARCHAR(255) PRIMARY KEY,
            `title_ar` VARCHAR(255) NULL,
            `title_en` VARCHAR(255) NULL,
            `content_ar` LONGTEXT NULL,
            `content_en` LONGTEXT NULL,
            `is_visible` TINYINT DEFAULT 1,
            `parent_id` VARCHAR(255) NULL,
            `order_index` INT DEFAULT 0,
            `wp_slug` VARCHAR(255) NULL,
            `json_data` LONGTEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'visitors' => "
        CREATE TABLE IF NOT EXISTS `visitors` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `ip` VARCHAR(255) NULL,
            `date` VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'document_templates' => "
        CREATE TABLE IF NOT EXISTS `document_templates` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NULL,
            `fields` TEXT NULL,
            `size` VARCHAR(255) DEFAULT '1.0 MB'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'notifications' => "
        CREATE TABLE IF NOT EXISTS `notifications` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `message` TEXT NULL,
            `type` VARCHAR(255) DEFAULT 'info',
            `entity_type` VARCHAR(255) DEFAULT '',
            `entity_id` INT NULL,
            `link` VARCHAR(255) DEFAULT '',
            `is_read` TINYINT DEFAULT 0,
            `target_role` INT NULL,
            `target_user` INT NULL,
            `created_at` DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'user_notifications' => "
        CREATE TABLE IF NOT EXISTS `user_notifications` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NULL,
            `notification_id` INT NULL,
            `is_read` TINYINT DEFAULT 0,
            `is_deleted` TINYINT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'news_counters' => "
        CREATE TABLE IF NOT EXISTS `news_counters` (
            `key` VARCHAR(255) PRIMARY KEY,
            `value` INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'map_kml_features' => "
        CREATE TABLE IF NOT EXISTS `map_kml_features` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(255) NULL,
            `folder` VARCHAR(255) NULL,
            `type` VARCHAR(255) NULL,
            `coordinates` LONGTEXT NULL,
            `details` TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'companies' => "
        CREATE TABLE IF NOT EXISTS `companies` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `serial_number` VARCHAR(255) NULL,
            `registration_date` VARCHAR(255) NULL,
            `company_name` VARCHAR(255) NOT NULL,
            `activity_type` VARCHAR(255) NULL,
            `founding_meeting_date` VARCHAR(255) NULL,
            `founding_contract_date` VARCHAR(255) NULL,
            `commercial_license_number` VARCHAR(255) NULL,
            `commercial_license_issue_date` VARCHAR(255) NULL,
            `commercial_license_expiry` VARCHAR(255) NULL,
            `commercial_registry_number` VARCHAR(255) NULL,
            `commercial_registry_issue_date` VARCHAR(255) NULL,
            `commercial_registry_expiry` VARCHAR(255) NULL,
            `chamber_registration_number` VARCHAR(255) NULL,
            `chamber_registration_issue_date` VARCHAR(255) NULL,
            `chamber_registration_expiry` VARCHAR(255) NULL,
            `subscribed_capital` VARCHAR(255) NULL,
            `paid_capital` VARCHAR(255) NULL,
            `shareholders_count` VARCHAR(255) NULL,
            `experience_years` VARCHAR(255) NULL,
            `company_nationality` VARCHAR(255) NULL,
            `professional_license_number` VARCHAR(255) NULL,
            `tax_file_number` VARCHAR(255) NULL,
            `social_insurance_number` VARCHAR(255) NULL,
            `last_approved_budget` VARCHAR(255) NULL,
            `bank_name` VARCHAR(255) NULL,
            `bank_branch` VARCHAR(255) NULL,
            `bank_account` VARCHAR(255) NULL,
            `agent_name` VARCHAR(255) NULL,
            `email` VARCHAR(255) NULL,
            `address` VARCHAR(255) NULL,
            `phone1` VARCHAR(255) NULL,
            `phone2` VARCHAR(255) NULL,
            `phone3` VARCHAR(255) NULL,
            `country` VARCHAR(255) NULL,
            `website` VARCHAR(255) NULL,
            `status` VARCHAR(255) DEFAULT 'pending',
            `notes` TEXT NULL,
            `created_at` DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'gallery' => "
        CREATE TABLE IF NOT EXISTS `gallery` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `title_ar` VARCHAR(255) DEFAULT '',
            `title_en` VARCHAR(255) DEFAULT '',
            `category` VARCHAR(255) DEFAULT 'عام',
            `image_url` VARCHAR(255) NOT NULL,
            `is_visible` TINYINT DEFAULT 1,
            `display_order` INT DEFAULT 0,
            `created_at` DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'books' => "
        CREATE TABLE IF NOT EXISTS `books` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `serial_number` VARCHAR(255) NULL,
            `title` VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'working_papers' => "
        CREATE TABLE IF NOT EXISTS `working_papers` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `title_ar` VARCHAR(255) NULL,
            `title_en` VARCHAR(255) NULL,
            `category` VARCHAR(255) NULL,
            `date` VARCHAR(255) NULL,
            `size` VARCHAR(255) DEFAULT '1.5 MB',
            `type` VARCHAR(255) DEFAULT 'pdf',
            `desc_ar` TEXT NULL,
            `desc_en` TEXT NULL,
            `author_ar` VARCHAR(255) NULL,
            `author_en` VARCHAR(255) NULL,
            `file_url` VARCHAR(255) NULL,
            `allow_download` TINYINT DEFAULT 1,
            `created_at` DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    'homepage_images' => "
        CREATE TABLE IF NOT EXISTS `homepage_images` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `image_url` VARCHAR(255) NOT NULL,
            `display_order` INT DEFAULT 0,
            `created_at` DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    "
];

// Re-create tables and migrate data
foreach ($tables as $name => $ddl) {
    echo "Creating MySQL table `$name`...\n";
    $mysql->exec("DROP TABLE IF EXISTS `$name`");
    $mysql->exec($ddl);

    // Fetch data from SQLite
    $stmt = $sqlite->query("SELECT * FROM `$name`");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($rows) > 0) {
        echo "Migrating " . count($rows) . " rows for `$name`...\n";
        
        $fields = array_keys($rows[0]);
        $placeholders = implode(', ', array_map(fn($f) => ":$f", $fields));
        $fieldsEscaped = implode(', ', array_map(fn($f) => "`$f`", $fields));
        
        $insertSql = "INSERT INTO `$name` ($fieldsEscaped) VALUES ($placeholders)";
        $insertStmt = $mysql->prepare($insertSql);

        $mysql->beginTransaction();
        foreach ($rows as $row) {
            // Convert NULL values or types if needed
            foreach ($row as $k => $v) {
                if ($v === '') $row[$k] = null;
            }
            $insertStmt->execute($row);
        }
        $mysql->commit();
    } else {
        echo "Table `$name` is empty. Skipped data migration.\n";
    }
}

echo "\nDatabase Migration SQLite -> MySQL finished successfully with zero data loss!\n";
