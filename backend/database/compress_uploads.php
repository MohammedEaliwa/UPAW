<?php
// Script to compress and optimize all uploaded images in-place to improve site performance.
// Keeps original filenames to ensure database compatibility.

ini_set('memory_limit', '-1');
gc_enable();

$uploadsDir = __DIR__ . '/../public/uploads';

if (!is_dir($uploadsDir)) {
    die("Uploads directory not found: $uploadsDir\n");
}

$files = scandir($uploadsDir);
$imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];

$totalBefore = 0;
$totalAfter = 0;
$processedCount = 0;
$skippedCount = 0;
$errorCount = 0;

echo "Scanning uploads directory for images...\n";

// First, find all valid images
$imagesToProcess = [];
foreach ($files as $file) {
    if ($file === '.' || $file === '..') continue;
    $filePath = "$uploadsDir/$file";
    if (!is_file($filePath)) continue;

    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (in_array($ext, $imageExtensions)) {
        $imagesToProcess[] = [
            'name' => $file,
            'path' => $filePath,
            'ext' => $ext,
            'size' => filesize($filePath)
        ];
        $totalBefore += filesize($filePath);
    }
}

$totalImages = count($imagesToProcess);
echo "Found $totalImages images to optimize.\n";
echo "Total size before optimization: " . round($totalBefore / 1024 / 1024, 2) . " MB\n\n";

foreach ($imagesToProcess as $index => $img) {
    $processedCount++;
    $pct = round(($processedCount / $totalImages) * 100, 1);
    
    // Load image
    $srcImg = null;
    switch ($img['ext']) {
        case 'jpg':
        case 'jpeg':
            $srcImg = @imagecreatefromjpeg($img['path']);
            break;
        case 'png':
            $srcImg = @imagecreatefrompng($img['path']);
            break;
        case 'webp':
            $srcImg = @imagecreatefromwebp($img['path']);
            break;
    }

    if (!$srcImg) {
        echo "[$pct%] Failed to load {$img['name']}. Skipping.\n";
        $errorCount++;
        $totalAfter += $img['size'];
        continue;
    }

    $w = imagesx($srcImg);
    $h = imagesy($srcImg);
    
    // Max dimension for web optimize
    $maxDim = 1000;
    $resized = false;
    
    if ($w > $maxDim || $h > $maxDim) {
        if ($w >= $h) {
            $newW = $maxDim;
            $newH = (int)round($h * ($maxDim / $w));
        } else {
            $newH = $maxDim;
            $newW = (int)round($w * ($maxDim / $h));
        }
        
        $dstImg = imagecreatetruecolor($newW, $newH);
        
        // Handle transparency for PNG/WEBP
        if ($img['ext'] === 'png' || $img['ext'] === 'webp') {
            imagealphablending($dstImg, false);
            imagesavealpha($dstImg, true);
            $transparent = imagecolorallocatealpha($dstImg, 255, 255, 255, 127);
            imagefilledrectangle($dstImg, 0, 0, $newW, $newH, $transparent);
        }
        
        imagecopyresampled($dstImg, $srcImg, 0, 0, 0, 0, $newW, $newH, $w, $h);
        imagedestroy($srcImg);
        $srcImg = $dstImg;
        $resized = true;
    }

    // Save back with compression
    $tempPath = $img['path'] . '.tmp';
    $saveSuccess = false;

    switch ($img['ext']) {
        case 'jpg':
        case 'jpeg':
            $saveSuccess = imagejpeg($srcImg, $tempPath, 75); // 75% quality is excellent compromise
            break;
        case 'png':
            // Convert to 8-bit PNG if transparency is not critical, or just compress.
            // Level 7 is high compression without excessive CPU time
            $saveSuccess = imagepng($srcImg, $tempPath, 7); 
            break;
        case 'webp':
            $saveSuccess = imagewebp($srcImg, $tempPath, 75);
            break;
    }

    imagedestroy($srcImg);

    if ($saveSuccess) {
        $newSize = filesize($tempPath);
        // Only replace if the compressed version is actually smaller
        if ($newSize < $img['size']) {
            unlink($img['path']);
            rename($tempPath, $img['path']);
            $finalSize = $newSize;
            $saved = round(($img['size'] - $finalSize) / 1024, 1);
            echo "[$pct%] Optimized: {$img['name']} (Saved {$saved} KB) " . ($resized ? "[Resized]" : "") . "\n";
        } else {
            unlink($tempPath);
            $finalSize = $img['size'];
            // echo "[$pct%] No size benefit for {$img['name']}. Kept original.\n";
            $skippedCount++;
        }
    } else {
        if (file_exists($tempPath)) unlink($tempPath);
        $finalSize = $img['size'];
        echo "[$pct%] Failed to save compressed {$img['name']}.\n";
        $errorCount++;
    }

    $totalAfter += $finalSize;
    gc_collect_cycles();
}

$savings = $totalBefore - $totalAfter;
echo "\n--- Optimization Summary ---\n";
echo "Processed: $processedCount / $totalImages images.\n";
echo "Skipped (already optimized): $skippedCount\n";
echo "Errors: $errorCount\n";
echo "Total size before: " . round($totalBefore / 1024 / 1024, 2) . " MB\n";
echo "Total size after:  " . round($totalAfter / 1024 / 1024, 2) . " MB\n";
echo "Total savings:      " . round($savings / 1024 / 1024, 2) . " MB (" . round(($savings / $totalBefore) * 100, 1) . "% size reduction)\n";
