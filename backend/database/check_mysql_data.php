<?php
try {
    $m = new PDO('mysql:host=127.0.0.1;dbname=upaw_db', 'root', 'Joker@3153015');
    $m->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Total Gallery Images: " . $m->query('SELECT COUNT(*) FROM gallery')->fetchColumn() . "\n";
    echo "Visibility distribution:\n";
    print_r($m->query('SELECT is_visible, COUNT(*) as cnt FROM gallery GROUP BY is_visible')->fetchAll(PDO::FETCH_ASSOC));

    echo "\nTotal Pages: " . $m->query('SELECT COUNT(*) FROM pages')->fetchColumn() . "\n";
    print_r($m->query('SELECT id, title_ar, is_visible FROM pages LIMIT 5')->fetchAll(PDO::FETCH_ASSOC));

    echo "\nTotal Homepage Images: " . $m->query('SELECT COUNT(*) FROM homepage_images')->fetchColumn() . "\n";
    print_r($m->query('SELECT * FROM homepage_images')->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
