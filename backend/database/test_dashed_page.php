<?php
$url = 'http://127.0.0.1:8000/api/pages/-%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%D8%B9-%D8%A5%D8%B3%D9%83%D8%A7%D9%86%D9%8A%D8%A9-%D8%A5%D9%82%D9%84%D9%8A%D9%85-%D8%B7%D8%B1%D8%A7%D8%A8%D9%84%D8%B3-';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$res = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

echo "HTTP Code: " . $info['http_code'] . "\n";
echo "Response:\n" . substr($res, $info['header_size'], 500) . "\n";
