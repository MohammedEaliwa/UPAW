const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  console.error('Database file not found:', dbPath);
  process.exit(2);
}

const stats = fs.statSync(dbPath);
console.log('DB Path:', dbPath);
console.log('Size:', stats.size, 'bytes');
console.log('Modified:', stats.mtime.toISOString());

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(3);
  }
});

function runQuery(q) {
  return new Promise((resolve, reject) => {
    db.all(q, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

(async () => {
  try {
    const tables = await runQuery("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('\nTables:');
    for (const t of tables) {
      console.log(' -', t.name);
    }

    const targets = ['map_kml_features','news','pages','working_papers','gallery','companies','visitors','notifications','users'];
    console.log('\nCounts:');
    for (const name of targets) {
      try {
        const r = await runQuery(`SELECT COUNT(*) as c FROM ${name}`);
        console.log(`${name}:`, r[0].c);
      } catch (e) {
        // table may not exist
      }
    }

    // show last 5 news items
    try {
      const recent = await runQuery('SELECT id, title_ar, date FROM news ORDER BY id DESC LIMIT 5');
      console.log('\nRecent news (last 5):');
      recent.forEach(r => console.log(` #${r.id} - ${r.title_ar || r.title_en || '<no title>'} (${r.date || '-'})`));
    } catch (e) {}

    db.close();
  } catch (err) {
    console.error('Error querying DB:', err.message);
    db.close();
    process.exit(4);
  }
})();
