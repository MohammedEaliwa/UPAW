import sqlite3

conn = sqlite3.connect('database.sqlite')
c = conn.cursor()

columns_to_add = [
    ('title_ar', 'TEXT'),
    ('title_en', 'TEXT'),
    ('is_visible', 'INTEGER DEFAULT 1'),
    ('parent_id', 'TEXT'),
    ('wp_slug', 'TEXT'),
    ('order_index', 'INTEGER DEFAULT 0'),
]

for col_name, col_type in columns_to_add:
    try:
        c.execute(f'ALTER TABLE pages ADD COLUMN {col_name} {col_type}')
        print(f'Added column: {col_name}')
    except Exception as e:
        print(f'Column {col_name} already exists or error: {e}')

conn.commit()
conn.close()
print('Migration complete')
