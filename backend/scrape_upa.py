import requests
from bs4 import BeautifulSoup
import sqlite3
import datetime
import os

# Connect to database
db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get data entry user ID
cursor.execute("SELECT id FROM users WHERE role_id = 2 LIMIT 1")
user = cursor.fetchone()
author_id = user[0] if user else 1

def fetch_upa_news():
    url = "https://upa.gov.ly/"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers, timeout=15, verify=False) # verify=False for some gov sites with invalid SSL
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # WordPress usually uses 'article' or specific classes.
        articles = soup.find_all('article')
        
        if not articles:
            # Fallback if 'article' tag is not used
            articles = soup.find_all('div', class_=lambda c: c and 'post' in c)

        print(f"Found {len(articles)} articles.")
        
        if len(articles) == 0:
            print("Trying to find h2/h3 tags as titles...")
            titles = soup.find_all(['h2', 'h3'])
            articles = [{'title_tag': t} for t in titles if t.find('a')]
            print(f"Found {len(articles)} potential titles.")

        inserted_count = 0
        for i, article in enumerate(articles[:15]): 
            if isinstance(article, dict):
                title_tag = article['title_tag']
                article_element = title_tag.parent.parent
            else:
                title_tag = article.find(['h1', 'h2', 'h3'])
                article_element = article
                
            if not title_tag:
                continue
                
            title = title_tag.get_text(strip=True)
            if len(title) < 10: # Too short to be news
                continue
                
            link = title_tag.find('a')['href'] if title_tag.find('a') else url
            
            # Extract image
            img_tag = article_element.find('img') if article_element else None
            image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'
            
            if image_url.startswith('/'):
                image_url = f"https://upa.gov.ly{image_url}"
                
            # Extract excerpt
            excerpt_tag = article_element.find('div', class_='entry-content') if article_element else None
            if not excerpt_tag and article_element:
                excerpt_tag = article_element.find('p')
                
            excerpt = excerpt_tag.get_text(strip=True)[:200] + '...' if excerpt_tag else "تفاصيل الخبر متوفرة على الموقع الرسمي."
            
            category = 'أخبار الهيئة'
            date_str = datetime.datetime.now().strftime("%Y-%m-%d")
            
            # Check if exists
            cursor.execute("SELECT id FROM news WHERE title_ar = ?", (title,))
            if cursor.fetchone():
                print("Article already exists. Skipping.")
                continue
                
            # Insert into database
            cursor.execute('''
                INSERT INTO news (category, title_ar, title_en, date, image, excerpt_ar, excerpt_en, content_ar, content_en, target_audience, is_visible, author_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                category,
                title,
                title, # No EN available
                date_str,
                image_url,
                excerpt,
                excerpt,
                f"<p>{excerpt}</p><p><a href='{link}' target='_blank'>اقرأ المزيد على الموقع الرسمي</a></p>",
                f"<p>{excerpt}</p>",
                "العامة", # Target audience: Public
                1, # is_visible: True
                author_id
            ))
            inserted_count += 1
            # removed print title due to encoding
            
        conn.commit()
        print(f"Successfully inserted {inserted_count} new articles into the database.")
        
    except Exception as e:
        print(f"Error scraping data: {e}")

if __name__ == "__main__":
    print("Starting UPA website scraper...")
    fetch_upa_news()
    conn.close()
