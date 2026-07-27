<?php
// Check schema of pages table in SQLite vs MySQL
try {
    $sqlite = new PDO("sqlite:backend/database/database.sqlite");
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $my = new PDO("mysql:host=127.0.0.1;dbname=upaw_db", "root", "Joker@3153015");
    $my->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "--- SQLite pages table columns ---\n";
    $q = $sqlite->query("PRAGMA table_info(pages)");
    while ($row = $q->fetch(PDO::FETCH_ASSOC)) {
        echo "  {$row['name']} ({$row['type']})\n";
    }

    echo "\n--- MySQL pages table columns ---\n";
    $q = $my->query("DESCRIBE pages");
    while ($row = $q->fetch(PDO::FETCH_ASSOC)) {
        echo "  {$row['Field']} ({$row['Type']})\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
