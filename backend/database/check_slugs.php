<?php
try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=upaw_db', 'root', 'Joker@3153015');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $db->query('SELECT id, slug, title_ar FROM pages LIMIT 20');
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['id']} | Slug: [{$row['slug']}] | Title: {$row['title_ar']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
