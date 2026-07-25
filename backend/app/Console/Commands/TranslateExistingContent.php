<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\AiTranslationService;

class TranslateExistingContent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:translate-existing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Translate all existing content in database (news, pages, map_locations, working_papers, gallery) using AI';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting AI auto-translation for existing database content...');

        // 1. News
        $newsItems = DB::table('news')->get();
        $this->info("Found {$newsItems->count()} news items.");
        foreach ($newsItems as $news) {
            $data = [
                'title_ar'   => $news->title_ar ?? '',
                'title_en'   => $news->title_en ?? '',
                'excerpt_ar' => $news->excerpt_ar ?? '',
                'excerpt_en' => $news->excerpt_en ?? '',
                'content_ar' => $news->content_ar ?? '',
                'content_en' => $news->content_en ?? '',
            ];
            AiTranslationService::autoTranslateData($data, [
                'title_ar'   => 'title_en',
                'excerpt_ar' => 'excerpt_en',
                'content_ar' => 'content_en',
            ]);
            DB::table('news')->where('id', $news->id)->update([
                'title_en'   => $data['title_en'],
                'excerpt_en' => $data['excerpt_en'],
                'content_en' => $data['content_en'],
                'title_ar'   => $data['title_ar'],
                'excerpt_ar' => $data['excerpt_ar'],
                'content_ar' => $data['content_ar'],
            ]);
        }
        $this->info('News translated.');

        // 2. Pages
        $pages = DB::table('pages')->get();
        $this->info("Found {$pages->count()} pages.");
        foreach ($pages as $page) {
            $data = [
                'title_ar'   => $page->title_ar ?? '',
                'title_en'   => $page->title_en ?? '',
                'content_ar' => $page->content_ar ?? '',
                'content_en' => $page->content_en ?? '',
            ];
            AiTranslationService::autoTranslateData($data, [
                'title_ar'   => 'title_en',
                'content_ar' => 'content_en',
            ]);
            DB::table('pages')->where('id', $page->id)->update([
                'title_en'   => $data['title_en'],
                'content_en' => $data['content_en'],
                'title_ar'   => $data['title_ar'],
                'content_ar' => $data['content_ar'],
            ]);
        }
        $this->info('Pages translated.');

        // 3. Map Locations
        $locations = DB::table('map_locations')->get();
        $this->info("Found {$locations->count()} map locations.");
        foreach ($locations as $loc) {
            $data = [
                'name_ar'    => $loc->name_ar ?? '',
                'name_en'    => $loc->name_en ?? '',
                'details_ar' => $loc->details_ar ?? '',
                'details_en' => $loc->details_en ?? '',
            ];
            AiTranslationService::autoTranslateData($data, [
                'name_ar'    => 'name_en',
                'details_ar' => 'details_en',
            ]);
            DB::table('map_locations')->where('id', $loc->id)->update([
                'name_en'    => $data['name_en'],
                'details_en' => $data['details_en'],
                'name_ar'    => $data['name_ar'],
                'details_ar' => $data['details_ar'],
            ]);
        }
        $this->info('Map locations translated.');

        // 4. Working Papers
        $papers = DB::table('working_papers')->get();
        $this->info("Found {$papers->count()} working papers.");
        foreach ($papers as $wp) {
            $data = [
                'title_ar'  => $wp->title_ar ?? '',
                'title_en'  => $wp->title_en ?? '',
                'desc_ar'   => $wp->desc_ar ?? '',
                'desc_en'   => $wp->desc_en ?? '',
                'author_ar' => $wp->author_ar ?? '',
                'author_en' => $wp->author_en ?? '',
            ];
            AiTranslationService::autoTranslateData($data, [
                'title_ar'  => 'title_en',
                'desc_ar'   => 'desc_en',
                'author_ar' => 'author_en',
            ]);
            DB::table('working_papers')->where('id', $wp->id)->update([
                'title_en'  => $data['title_en'],
                'desc_en'   => $data['desc_en'],
                'author_en' => $data['author_en'],
                'title_ar'  => $data['title_ar'],
                'desc_ar'   => $data['desc_ar'],
                'author_ar' => $data['author_ar'],
            ]);
        }
        $this->info('Working papers translated.');

        // 5. Gallery
        $gallery = DB::table('gallery')->get();
        $this->info("Found {$gallery->count()} gallery items.");
        foreach ($gallery as $g) {
            $data = [
                'title_ar' => $g->title_ar ?? '',
                'title_en' => $g->title_en ?? '',
            ];
            AiTranslationService::autoTranslateData($data, [
                'title_ar' => 'title_en',
            ]);
            DB::table('gallery')->where('id', $g->id)->update([
                'title_en' => $data['title_en'],
                'title_ar' => $data['title_ar'],
            ]);
        }
        $this->info('Gallery items translated.');

        $this->info('All database content auto-translated successfully via AI!');
        return Command::SUCCESS;
    }
}
