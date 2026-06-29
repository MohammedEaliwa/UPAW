const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function run(q) {
  return new Promise((res, rej) => db.all(q, (e, r) => e ? rej(e) : res(r)));
}

(async () => {
  try {
    console.log('Pages containing "تقارير" in title:');
    const p = await run(`SELECT id, title_ar, title_en FROM pages WHERE title_ar LIKE '%تقارير%' OR title_en LIKE '%report%' LIMIT 50`);
    console.log(p);

    console.log('\nWorking papers sample columns:');
    const wp = await run(`PRAGMA table_info(working_papers)`);
    console.log(wp);

    console.log('\nDocuments table info:');
    const dt = await run(`PRAGMA table_info(document_templates)`);
    console.log(dt);

    console.log('\nRecent working_papers rows:');
    const rows = await run(`SELECT id, title_ar, title_en, date, category, file_url FROM working_papers ORDER BY id DESC LIMIT 20`);
    console.log(rows);

    db.close();
  } catch (e) {
    console.error(e);
    db.close();
  }
})();
