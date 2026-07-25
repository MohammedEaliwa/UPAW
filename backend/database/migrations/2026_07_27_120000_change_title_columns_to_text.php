<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify title_ar and title_en in news table to TEXT
        DB::statement("ALTER TABLE news MODIFY title_ar TEXT NULL");
        DB::statement("ALTER TABLE news MODIFY title_en TEXT NULL");

        // Modify title_ar and title_en in pages table to TEXT
        DB::statement("ALTER TABLE pages MODIFY title_ar TEXT NULL");
        DB::statement("ALTER TABLE pages MODIFY title_en TEXT NULL");

        // Modify name_ar and name_en in map_locations table to TEXT
        DB::statement("ALTER TABLE map_locations MODIFY name_ar TEXT NULL");
        DB::statement("ALTER TABLE map_locations MODIFY name_en TEXT NULL");

        // Modify title_ar and title_en in working_papers table to TEXT
        DB::statement("ALTER TABLE working_papers MODIFY title_ar TEXT NULL");
        DB::statement("ALTER TABLE working_papers MODIFY title_en TEXT NULL");

        // Modify title_ar and title_en in gallery table to TEXT
        DB::statement("ALTER TABLE gallery MODIFY title_ar TEXT NULL");
        DB::statement("ALTER TABLE gallery MODIFY title_en TEXT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
