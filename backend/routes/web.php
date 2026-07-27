<?php

use Illuminate\Support\Facades\Route;

// Fallback to serve the React SPA index.html for any route not matched by the API routes
Route::fallback(function () {
    $path = public_path('index.html');
    if (file_exists($path)) {
        return file_get_contents($path);
    }
    return response('Frontend build not found. Run npm run build in frontend.', 404);
});
