<?php
$base = 'http://127.0.0.1:8000/api';
$endpoints = [
    '/homepage-images',
    '/news',
    '/gallery',
    '/pages',
    '/statistics',
    '/companies/stats/summary',
    '/books',
    '/working-papers',
];

foreach ($endpoints as $ep) {
    $url = $base . $ep;
    $ctx = stream_context_create(['http' => ['timeout' => 5]]);
    $res = @file_get_contents($url, false, $ctx);
    if ($res === false) {
        echo "FAIL: $ep\n";
    } else {
        $data = json_decode($res, true);
        if (is_array($data)) {
            $count = isset($data['rows']) ? count($data['rows']) : count($data);
            echo "OK:   $ep → $count items\n";
        } else {
            echo "OK:   $ep → " . substr($res, 0, 80) . "\n";
        }
    }
}
