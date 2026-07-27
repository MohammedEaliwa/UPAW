<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Add composite and single-column indexes to high-traffic tables
 * to speed up common query patterns.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Helper to add index only if it doesn't already exist
        $addIndex = function (string $table, array $cols, string $name) {
            $existing = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$name]);
            if (empty($existing)) {
                Schema::table($table, function (Blueprint $t) use ($cols, $name) {
                    $t->index($cols, $name);
                });
            }
        };

        // ── news ────────────────────────────────────────────────────────────
        // Most common filter: visible public posts ordered by id desc
        $addIndex('news', ['is_visible', 'target_audience', 'id'], 'news_visible_audience_id_idx');
        // Date ordering
        $addIndex('news', ['date'], 'news_date_idx');

        // ── visitors ────────────────────────────────────────────────────────
        // Daily unique-visitor lookup
        $addIndex('visitors', ['ip', 'date'], 'visitors_ip_date_idx');
        $addIndex('visitors', ['date'], 'visitors_date_idx');

        // ── notifications ────────────────────────────────────────────────────
        // Filtering by target_role / target_user
        $addIndex('notifications', ['target_role'], 'notif_target_role_idx');
        $addIndex('notifications', ['target_user'], 'notif_target_user_idx');
        $addIndex('notifications', ['is_read'], 'notif_is_read_idx');

        // ── user_notifications ───────────────────────────────────────────────
        $addIndex('user_notifications', ['user_id', 'is_read'], 'un_user_read_idx');
        $addIndex('user_notifications', ['user_id', 'is_deleted'], 'un_user_deleted_idx');

        // ── map_locations ────────────────────────────────────────────────────
        $addIndex('map_locations', ['is_approved'], 'map_approved_idx');
        $addIndex('map_locations', ['category'], 'map_category_idx');

        // ── gallery ──────────────────────────────────────────────────────────
        $addIndex('gallery', ['is_visible', 'category'], 'gallery_visible_cat_idx');
        $addIndex('gallery', ['display_order'], 'gallery_display_order_idx');

        // ── companies ────────────────────────────────────────────────────────
        $addIndex('companies', ['status'], 'companies_status_idx');

        // ── complaints ───────────────────────────────────────────────────────
        $addIndex('complaints', ['status'], 'complaints_status_idx');
        $addIndex('complaints', ['created_at'], 'complaints_created_at_idx');

        // ── experts ──────────────────────────────────────────────────────────
        $addIndex('experts', ['status'], 'experts_status_idx');

        // ── employee_requests ────────────────────────────────────────────────
        $addIndex('employee_requests', ['status'], 'emp_requests_status_idx');

        // ── working_papers ────────────────────────────────────────────────────
        $addIndex('working_papers', ['category'], 'wp_category_idx');
    }

    public function down(): void
    {
        $dropIndex = function (string $table, string $name) {
            $existing = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$name]);
            if (!empty($existing)) {
                Schema::table($table, fn (Blueprint $t) => $t->dropIndex($name));
            }
        };

        $dropIndex('news',               'news_visible_audience_id_idx');
        $dropIndex('news',               'news_date_idx');
        $dropIndex('visitors',           'visitors_ip_date_idx');
        $dropIndex('visitors',           'visitors_date_idx');
        $dropIndex('notifications',      'notif_target_role_idx');
        $dropIndex('notifications',      'notif_target_user_idx');
        $dropIndex('notifications',      'notif_is_read_idx');
        $dropIndex('user_notifications', 'un_user_read_idx');
        $dropIndex('user_notifications', 'un_user_deleted_idx');
        $dropIndex('map_locations',      'map_approved_idx');
        $dropIndex('map_locations',      'map_category_idx');
        $dropIndex('gallery',            'gallery_visible_cat_idx');
        $dropIndex('gallery',            'gallery_display_order_idx');
        $dropIndex('companies',          'companies_status_idx');
        $dropIndex('complaints',         'complaints_status_idx');
        $dropIndex('complaints',         'complaints_created_at_idx');
        $dropIndex('experts',            'experts_status_idx');
        $dropIndex('employee_requests',  'emp_requests_status_idx');
        $dropIndex('working_papers',     'wp_category_idx');
    }
};
