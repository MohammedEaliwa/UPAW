import sqlite3
conn = sqlite3.connect('database.sqlite')
c = conn.cursor()
c.execute("SELECT id, title_ar, length(content_ar) as clen FROM pages ORDER BY order_index ASC LIMIT 30")
rows = c.fetchall()
for r in rows:
    slug = r[0][:50]
    title = (r[1] or '').encode('utf-8', errors='replace')[:50]
    print(slug, '|', title, '|', r[2])
conn.close()
