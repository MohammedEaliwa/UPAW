<?php

namespace App\Providers;

use App\Events\UserLoggedIn;
use App\Events\UserLoggedOut;
use App\Events\UserLoginFailed;
use App\Listeners\LogUserLoginFailedListener;
use App\Listeners\LogUserLoginListener;
use App\Listeners\LogUserLogoutListener;
use App\Models\AuditLog;
use App\Observers\AuditObserver;
use App\Services\AuditLogService;
use Illuminate\Database\Schema\Builder;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Finder\Finder;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind AuditLogService as a singleton so the same instance
        // (with its injected Request context) is shared across the request lifecycle.
        $this->app->singleton(AuditLogService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fix for MySQL < 5.7.7 / older MariaDB on shared hosting (Libyan Spider)
        Schema::defaultStringLength(191);

        // Register Events ↔ Listeners
        $this->registerEventListeners();

        // Auto-register AuditObserver for every Eloquent model
        $this->registerModelObservers();
    }

    // ─── Event / Listener Registration ────────────────────────────────────────

    private function registerEventListeners(): void
    {
        Event::listen(UserLoggedIn::class,    LogUserLoginListener::class);
        Event::listen(UserLoggedOut::class,   LogUserLogoutListener::class);
        Event::listen(UserLoginFailed::class, LogUserLoginFailedListener::class);
    }

    // ─── Auto-discover & observe all Eloquent Models ──────────────────────────

    private function registerModelObservers(): void
    {
        $modelsPath = app_path('Models');
        if (!is_dir($modelsPath)) return;

        $finder = Finder::create()->files()->name('*.php')->in($modelsPath);

        foreach ($finder as $file) {
            $className = 'App\\Models\\' . $file->getBasename('.php');

            // Skip the AuditLog model itself to prevent infinite loops
            if ($className === AuditLog::class) continue;

            if (!class_exists($className)) continue;

            $reflection = new \ReflectionClass($className);

            // Only observe concrete Eloquent models
            if ($reflection->isAbstract()) continue;
            if (!$reflection->isSubclassOf(\Illuminate\Database\Eloquent\Model::class)) continue;

            $className::observe(AuditObserver::class);
        }
    }
}
