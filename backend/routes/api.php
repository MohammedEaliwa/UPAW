<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\AuditLogController;

// ─── Auth & Uploads (never cached, Rate-Limited for Anti-Brute-Force) ──────────
Route::middleware('throttle:10,1')->post('/login', [ApiController::class, 'login']);
Route::middleware('throttle:5,1')->post('/register', [ApiController::class, 'register']);
Route::middleware('throttle:15,1')->post('/upload', [ApiController::class, 'uploadFile']);

// ─── Public READ routes (cached for 5 minutes) ────────────────────────────────
Route::middleware('cache.api:300')->group(function () {
    Route::get('/visitors/stats', [ApiController::class, 'getVisitorStats']);
    Route::get('/decisions', [ApiController::class, 'getDecisions']);
    Route::get('/documents', [ApiController::class, 'getDocuments']);
    Route::get('/users', [ApiController::class, 'getUsers']);
    Route::get('/roles', [ApiController::class, 'getRoles']);
    Route::get('/statistics', [ApiController::class, 'getStatistics']);
    Route::get('/books', [ApiController::class, 'getBooks']);
    Route::get('/working-papers', [ApiController::class, 'getWorkingPapers']);
    Route::get('/pages', [ApiController::class, 'getPages']);
    Route::get('/pages/{id}', [ApiController::class, 'getPage']);
    Route::get('/map_locations', [ApiController::class, 'getMapLocations']);
    Route::get('/kml/features', [ApiController::class, 'getKmlFeatures']);
    Route::get('/news/stats', [ApiController::class, 'getNewsStats']);
    Route::get('/news', [ApiController::class, 'getNews']);
    Route::get('/news/{id}', [ApiController::class, 'getNewsItem']);
    Route::get('/news/{id}/comments', [ApiController::class, 'getNewsComments']);
    Route::get('/companies/stats/summary', [ApiController::class, 'getCompaniesSummary']);
    Route::get('/companies', [ApiController::class, 'getCompanies']);
    Route::get('/gallery/all', [ApiController::class, 'getGalleryAll']);
    Route::get('/gallery/categories', [ApiController::class, 'getGalleryCategories']);
    Route::get('/gallery', [ApiController::class, 'getGallery']);
    Route::get('/homepage-images', [ApiController::class, 'getHomepageImages']);
    Route::get('/complaints', [ApiController::class, 'getComplaints']);
    Route::get('/experts', [ApiController::class, 'getExperts']);
    Route::get('/employee-requests', [ApiController::class, 'getEmployeeRequests']);
    Route::get('/directors', [ApiController::class, 'getDirectors']);
});

// ─── Visitor count (not cached — must track unique IPs) ───────────────────────
Route::get('/visitors/count', [ApiController::class, 'getVisitorCount']);

// ─── Notifications (user-specific, short cache 15s/30s) ──────────────────────
Route::middleware('cache.api:15')->get('/notifications/unread-count', [ApiController::class, 'getNotificationsUnreadCount']);
Route::middleware('cache.api:30')->group(function () {
    Route::get('/notifications', [ApiController::class, 'getNotifications']);
});

// ─── Cache flush helper (called by frontend after any write) ──────────────────
Route::post('/cache/clear', function () {
    Cache::flush();
    return response()->json(['message' => 'Cache cleared']);
});

Route::post('/app-subscriptions', [ApiController::class, 'subscribeToApp']);

Route::put('/documents/{id}', [ApiController::class, 'updateDocument']);
Route::post('/documents', [ApiController::class, 'createDocument']);
Route::delete('/documents/{id}', [ApiController::class, 'deleteDocument']);

Route::post('/users', [ApiController::class, 'createUser']);
Route::put('/users/{id}', [ApiController::class, 'updateUser']);
Route::delete('/users/{id}', [ApiController::class, 'deleteUser']);

Route::post('/statistics', [ApiController::class, 'createStatistic']);
Route::put('/statistics/{id}', [ApiController::class, 'updateStatistic']);
Route::delete('/statistics/{id}', [ApiController::class, 'deleteStatistic']);

Route::post('/books', [ApiController::class, 'createBook']);
Route::put('/books/{id}', [ApiController::class, 'updateBook']);
Route::delete('/books/{id}', [ApiController::class, 'deleteBook']);

Route::post('/working-papers', [ApiController::class, 'createWorkingPaper']);
Route::put('/working-papers/{id}', [ApiController::class, 'updateWorkingPaper']);
Route::patch('/working-papers/{id}/allow-download', [ApiController::class, 'toggleWorkingPaperDownload']);
Route::delete('/working-papers/{id}', [ApiController::class, 'deleteWorkingPaper']);

Route::post('/pages', [ApiController::class, 'createPage']);
Route::put('/pages/{id}', [ApiController::class, 'updatePage']);
Route::patch('/pages/{id}/visibility', [ApiController::class, 'togglePageVisibility']);
Route::delete('/pages/{id}', [ApiController::class, 'deletePage']);

Route::post('/map_locations', [ApiController::class, 'createMapLocation']);
Route::put('/map_locations/{id}', [ApiController::class, 'updateMapLocation']);
Route::delete('/map_locations/{id}', [ApiController::class, 'deleteMapLocation']);

Route::delete('/kml/features/clear', [ApiController::class, 'clearKmlFeatures']);
Route::post('/kml/upload', [ApiController::class, 'uploadKml']);
Route::put('/kml/features/{id}/color', [ApiController::class, 'updateKmlFeatureColor']);
Route::put('/kml/folders/color', [ApiController::class, 'updateKmlFolderColor']);
Route::put('/kml/folders/rename', [ApiController::class, 'renameKmlFolder']);
Route::delete('/kml/folders', [ApiController::class, 'deleteKmlFolder']);
Route::delete('/kml/features/{id}', [ApiController::class, 'deleteKmlFeature']);

Route::post('/news', [ApiController::class, 'createNews']);
Route::put('/news/{id}', [ApiController::class, 'updateNews']);
Route::delete('/news/{id}', [ApiController::class, 'deleteNews']);
Route::patch('/news/{id}/visibility', [ApiController::class, 'toggleNewsVisibility']);
Route::post('/news/{id}/comments', [ApiController::class, 'createNewsComment']);

Route::post('/notifications', [ApiController::class, 'createNotificationHttp']);
Route::patch('/notifications/{id}/read', [ApiController::class, 'markNotificationRead']);
Route::patch('/notifications/read-all', [ApiController::class, 'markAllNotificationsRead']);
Route::delete('/notifications/clear-all', [ApiController::class, 'clearAllNotifications']);
Route::delete('/notifications/{id}', [ApiController::class, 'deleteNotification']);

Route::post('/companies', [ApiController::class, 'createCompany']);
Route::put('/companies/{id}', [ApiController::class, 'updateCompany']);
Route::match(['PUT', 'PATCH'], '/companies/{id}/status', [ApiController::class, 'updateCompanyStatus']);
Route::delete('/companies/{id}', [ApiController::class, 'deleteCompany']);

Route::post('/gallery/bulk-delete', [ApiController::class, 'bulkDeleteGallery']);
Route::post('/gallery/bulk-update-category', [ApiController::class, 'bulkUpdateGalleryCategory']);
Route::post('/gallery/bulk-update-visibility', [ApiController::class, 'bulkUpdateGalleryVisibility']);
Route::post('/gallery', [ApiController::class, 'createGallery']);
Route::put('/gallery/{id}', [ApiController::class, 'updateGallery']);
Route::patch('/gallery/{id}/toggle', [ApiController::class, 'toggleGalleryVisibility']);
Route::delete('/gallery/{id}', [ApiController::class, 'deleteGallery']);

Route::post('/homepage-images', [ApiController::class, 'createHomepageImage']);
Route::delete('/homepage-images/{id}', [ApiController::class, 'deleteHomepageImage']);

Route::put('/complaints/{id}/status', [ApiController::class, 'updateComplaintStatus']);
Route::post('/complaints', [ApiController::class, 'createComplaint']);
Route::delete('/complaints/{id}', [ApiController::class, 'deleteComplaint']);

Route::put('/experts/{id}/status', [ApiController::class, 'updateExpertStatus']);
Route::post('/experts', [ApiController::class, 'createExpert']);
Route::delete('/experts/{id}', [ApiController::class, 'deleteExpert']);

Route::put('/employee-requests/{id}/status', [ApiController::class, 'updateEmployeeRequestStatus']);
Route::post('/employee-requests', [ApiController::class, 'createEmployeeRequest']);
Route::delete('/employee-requests/{id}', [ApiController::class, 'deleteEmployeeRequest']);

// ─── Directors ────────────────────────────────────────────────────────────────
Route::post('/directors', [ApiController::class, 'createDirector']);
Route::post('/directors/{id}', [ApiController::class, 'updateDirector']); // POST supports FormData (file upload)
Route::put('/directors/{id}', [ApiController::class, 'updateDirector']);
Route::delete('/directors/{id}', [ApiController::class, 'deleteDirector']);

// ─── Audit Logs & Security Controls (admin only, never cached) ────────────────
Route::get('/audit-logs/stats',            [AuditLogController::class, 'stats']);
Route::get('/audit-logs/filter-options',   [AuditLogController::class, 'filterOptions']);
Route::get('/audit-logs/export',           [AuditLogController::class, 'export']);
Route::get('/audit-logs/user-trail/{user}',[AuditLogController::class, 'getUserTrail']);
Route::get('/audit-logs',                  [AuditLogController::class, 'index']);
Route::get('/audit-logs/{id}',             [AuditLogController::class, 'show']);
Route::delete('/audit-logs/{id}',          [AuditLogController::class, 'destroy']);

Route::get('/blocked-ips',                 [AuditLogController::class, 'getBlockedIps']);
Route::post('/blocked-ips',                [AuditLogController::class, 'blockIp']);
Route::delete('/blocked-ips/{ip}',         [AuditLogController::class, 'unblockIp']);
