import requests
import sqlite3
import os
import re

db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get data entry user ID
cursor.execute("SELECT id FROM users WHERE role_id = 2 LIMIT 1")
user = cursor.fetchone()
author_id = user[0] if user else 1

headers = {'User-Agent': 'Mozilla/5.0'}
requests.packages.urllib3.disable_warnings()

def strip_tags(html):
    return re.sub('<[^<]+?>', '', html) if html else ''

def fetch_media_url(media_id):
    if not media_id:
        return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'
    try:
        url = f"https://upa.gov.ly/wp-json/wp/v2/media/{media_id}"
        res = requests.get(url, headers=headers, verify=False, timeout=10)
        if res.status_code == 200:
            return res.json().get('source_url', '')
    except Exception as e:
        print(f"Error fetching media {media_id}: {e}")
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'

def sync_posts():
    print("Fetching all posts...")
    url = "https://upa.gov.ly/wp-json/wp/v2/posts?per_page=100"
    res = requests.get(url, headers=headers, verify=False, timeout=30)
    if res.status_code != 200:
        print("Failed to fetch posts:", res.status_code)
        return
    
    posts = res.json()
    print(f"Found {len(posts)} posts. Syncing...")
    
    # First clear existing news to avoid duplicates if user wants exact mirror
    cursor.execute("DELETE FROM news")
    
    inserted = 0
    for p in posts:
        title = p.get('title', {}).get('rendered', '')
        content = p.get('content', {}).get('rendered', '')
        excerpt_html = p.get('excerpt', {}).get('rendered', '')
        excerpt = strip_tags(excerpt_html)[:200]
        date = p.get('date', '').split('T')[0]
        
        # Decode HTML entities for title
        import html
        title = html.unescape(title)
        
        media_id = p.get('featured_media')
        image_url = fetch_media_url(media_id) if media_id else 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'
        
        cursor.execute('''
            INSERT INTO news (category, title_ar, title_en, date, image, excerpt_ar, excerpt_en, content_ar, content_en, target_audience, is_visible, author_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'أخبار الهيئة', title, title, date, image_url, excerpt, excerpt, content, content, 'العامة', 1, author_id
        ))
        inserted += 1
        
    conn.commit()
    print(f"Successfully synced {inserted} posts.")

def sync_pages():
    print("Fetching all pages...")
    url = "https://upa.gov.ly/wp-json/wp/v2/pages?per_page=100"
    res = requests.get(url, headers=headers, verify=False, timeout=30)
    if res.status_code != 200:
        print("Failed to fetch pages:", res.status_code)
        return
    
    pages = res.json()
    print(f"Found {len(pages)} pages. Syncing...")
    
    for p in pages:
        slug = p.get('slug', '')
        title = p.get('title', {}).get('rendered', '')
        content = p.get('content', {}).get('rendered', '')
        
        import html
        title = html.unescape(title)
        
        # We only map pages if their slugs match our IDs or we just insert them and user can link them later
        # Let's insert them into 'pages' table
        # We will use slug as ID if possible, otherwise use numeric id
        page_id = slug if slug else str(p.get('id', ''))
        
        cursor.execute("SELECT id FROM pages WHERE id = ?", (page_id,))
        if cursor.fetchone():
            cursor.execute("UPDATE pages SET content_ar = ?, content_en = ? WHERE id = ?", (content, content, page_id))
        else:
            cursor.execute("INSERT INTO pages (id, content_ar, content_en, json_data) VALUES (?, ?, ?, ?)", (page_id, content, content, '{}'))
            
    conn.commit()
    print("Successfully synced pages.")

if __name__ == '__main__':
    sync_posts()
    sync_pages()
    conn.close()
    print("All done!")
