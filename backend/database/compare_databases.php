<?php

$sqlitePath = __DIR__ . '/database.sqlite';
$envFile = __DIR__ . '/../.env';

if (!file_exists($sqlitePath)) {
    die("SQLite database not found at $sqlitePath\n");
}

// Parse .env
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
    $sqlite = new PDO("sqlite:$sqlitePath");
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $mysql = new PDO("mysql:host=$mysqlHost;port=$mysqlPort;dbname=$mysqlDb", $mysqlUser, $mysqlPass);
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    die("Database Connection Error: " . $e->getMessage() . "\n");
}

// Get all tables from SQLite
$stmt = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

echo "Comparison Report (SQLite vs MySQL):\n";
echo str_repeat("-", 50) . "\n";
echo sprintf("%-25s | %-10s | %-10s\n", "Table Name", "SQLite Rows", "MySQL Rows");
echo str_repeat("-", 50) . "\n";

foreach ($tables as $table) {
    // SQLite count
    $sqCount = $sqlite->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
    
    // MySQL count
    try {
        $myCount = $mysql->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        $status = ($sqCount == $myCount) ? "MATCH ✅" : "MISMATCH ❌";
    } catch (Exception $e) {
        $myCount = "ERROR";
        $status = "MISSING ❌";
    }
    
    echo sprintf("%-25s | %-10s | %-10s (%s)\n", $table, $sqCount, $myCount, $status);
}
echo str_repeat("-", 50) . "\n";
