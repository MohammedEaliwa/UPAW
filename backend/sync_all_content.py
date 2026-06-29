"""
Comprehensive UPA website scraper
Fetches ALL pages from upa.gov.ly WordPress REST API with full content and titles
Preserves existing records, only updates/inserts
"""

import requests
import sqlite3
import os
import html
import time

requests.packages.urllib3.disable_warnings()
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
BASE_URL = 'https://upa.gov.ly/wp-json/wp/v2'
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.sqlite')


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def upsert_page(conn, slug, title_ar, content_ar, parent_id='', order_index=0, wp_slug=''):
    c = conn.cursor()
    # Check if exists
    c.execute('SELECT id FROM pages WHERE id = ?', (slug,))
    existing = c.fetchone()
    if existing:
        # Update - preserve is_visible, update content and title
        c.execute('''
            UPDATE pages 
            SET title_ar = ?, title_en = ?, content_ar = ?, content_en = ?, 
                parent_id = ?, order_index = ?, wp_slug = ?
            WHERE id = ?
        ''', (title_ar, title_ar, content_ar, content_ar, parent_id, order_index, wp_slug, slug))
        print(f'  [UPDATE] {slug[:60]}')
    else:
        # Insert new
        c.execute('''
            INSERT INTO pages (id, title_ar, title_en, content_ar, content_en, json_data, is_visible, parent_id, order_index, wp_slug)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (slug, title_ar, title_ar, content_ar, content_ar, '{}', 1, parent_id, order_index, wp_slug))
        print(f'  [INSERT] {slug[:60]}')


def fetch_all_pages():
    """Fetch ALL pages from WP REST API, handling pagination"""
    all_pages = []
    page_num = 1
    while True:
        url = f'{BASE_URL}/pages?per_page=100&page={page_num}&_fields=id,slug,title,content,parent,menu_order,status'
        try:
            res = requests.get(url, headers=HEADERS, verify=False, timeout=30)
            if res.status_code == 400:
                break  # No more pages
            if res.status_code != 200:
                print(f'Error fetching page {page_num}: {res.status_code}')
                break
            data = res.json()
            if not data:
                break
            all_pages.extend(data)
            total_pages_header = int(res.headers.get('X-WP-TotalPages', 1))
            print(f'  Fetched page {page_num}/{total_pages_header} ({len(data)} items)')
            if page_num >= total_pages_header:
                break
            page_num += 1
            time.sleep(0.3)  # Be polite
        except Exception as e:
            print(f'Error fetching page {page_num}: {e}')
            break
    return all_pages


def fetch_all_posts():
    """Fetch ALL posts from WP REST API"""
    all_posts = []
    page_num = 1
    while True:
        url = f'{BASE_URL}/posts?per_page=100&page={page_num}&_fields=id,slug,title,content,excerpt,date,featured_media,categories,status'
        try:
            res = requests.get(url, headers=HEADERS, verify=False, timeout=30)
            if res.status_code == 400:
                break
            if res.status_code != 200:
                break
            data = res.json()
            if not data:
                break
            all_posts.extend(data)
            total_pages_header = int(res.headers.get('X-WP-TotalPages', 1))
            if page_num >= total_pages_header:
                break
            page_num += 1
            time.sleep(0.3)
        except Exception as e:
            print(f'Error fetching posts page {page_num}: {e}')
            break
    return all_posts


def fetch_media_url(media_id):
    if not media_id:
        return ''
    try:
        url = f'{BASE_URL}/media/{media_id}?_fields=source_url'
        res = requests.get(url, headers=HEADERS, verify=False, timeout=10)
        if res.status_code == 200:
            return res.json().get('source_url', '')
    except Exception:
        pass
    return ''


def sync_all_pages(conn):
    print('\n=== Syncing Pages ===')
    pages = fetch_all_pages()
    print(f'Total pages fetched: {len(pages)}')
    
    # Build parent map (id -> slug)
    id_to_slug = {}
    for p in pages:
        slug = p.get('slug', '')
        id_to_slug[p['id']] = slug

    synced = 0
    for idx, p in enumerate(pages):
        if p.get('status') not in ('publish', None, ''):
            continue
        
        slug = p.get('slug', '')
        if not slug:
            continue
        
        # URL encode the slug for use as ID (keep it consistent with what we already stored)
        from urllib.parse import quote
        # Use the slug as-is (it might already be encoded)
        page_id = slug
        
        title_ar = html.unescape(p.get('title', {}).get('rendered', '') or '')
        content_ar = p.get('content', {}).get('rendered', '') or ''
        parent_wp_id = p.get('parent', 0)
        parent_slug = id_to_slug.get(parent_wp_id, '') if parent_wp_id else ''
        order_index = p.get('menu_order', idx)
        
        upsert_page(conn, page_id, title_ar, content_ar, parent_slug, order_index, slug)
        synced += 1

    conn.commit()
    print(f'Pages sync complete: {synced} pages processed')


def sync_all_posts(conn):
    print('\n=== Syncing Posts (News) ===')
    
    # Get data entry user id
    c = conn.cursor()
    c.execute('SELECT id FROM users WHERE role_id = 2 LIMIT 1')
    row = c.fetchone()
    author_id = row['id'] if row else 1
    
    posts = fetch_all_posts()
    print(f'Total posts fetched: {len(posts)}')
    
    # Don't delete existing - just update or insert by matching title
    inserted = 0
    updated = 0
    
    for p in posts:
        if p.get('status') != 'publish':
            continue
        
        title_ar = html.unescape(p.get('title', {}).get('rendered', '') or '')
        content_ar = p.get('content', {}).get('rendered', '') or ''
        excerpt_html = p.get('excerpt', {}).get('rendered', '') or ''
        # Strip tags from excerpt
        import re
        excerpt_ar = re.sub('<[^>]+>', '', excerpt_html)[:250].strip()
        date_val = p.get('date', '')[:10] if p.get('date') else ''
        slug = p.get('slug', '')
        
        # Fetch featured image
        media_id = p.get('featured_media', 0)
        image_url = fetch_media_url(media_id) if media_id else ''
        if not image_url:
            image_url = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'
        
        # Check if news with same slug already exists
        c.execute('SELECT id FROM news WHERE title_ar = ? OR (date = ? AND title_ar = ?)', (title_ar, date_val, title_ar))
        existing = c.fetchone()
        
        if existing:
            c.execute('''
                UPDATE news SET title_ar=?, title_en=?, content_ar=?, content_en=?,
                    excerpt_ar=?, excerpt_en=?, image=?, date=?
                WHERE id=?
            ''', (title_ar, title_ar, content_ar, content_ar, excerpt_ar, excerpt_ar, image_url, date_val, existing['id']))
            updated += 1
            print(f'  [UPDATE news] {slug[:50]}')
        else:
            c.execute('''
                INSERT INTO news (category, title_ar, title_en, date, image, excerpt_ar, excerpt_en,
                    content_ar, content_en, target_audience, is_visible, author_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', ('\u0623\u062e\u0628\u0627\u0631 \u0627\u0644\u0647\u064a\u0626\u0629', title_ar, title_ar, date_val, image_url,
                  excerpt_ar, excerpt_ar, content_ar, content_ar, '\u0627\u0644\u0639\u0627\u0645\u0629', 1, author_id))
            inserted += 1
            print(f'  [INSERT news] {slug[:50]}')
        
        time.sleep(0.1)
    
    conn.commit()
    print(f'Posts sync complete: {inserted} inserted, {updated} updated')


if __name__ == '__main__':
    conn = get_conn()
    try:
        sync_all_pages(conn)
        sync_all_posts(conn)
    finally:
        conn.close()
    print('\n=== ALL DONE ===')
