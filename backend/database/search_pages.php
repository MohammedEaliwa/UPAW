<?php
try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=upaw_db', 'root', 'Joker@3153015');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $db->query("SELECT id, title_ar FROM pages WHERE title_ar LIKE '%مشاريع%' OR id LIKE '%%d8%%'");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: [{$row['id']}] | Title: [{$row['title_ar']}]\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
