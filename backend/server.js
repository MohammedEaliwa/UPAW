const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, initDB } = require('./database');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve frontend static build if exists
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  // Serve index.html for SPA routes
  // Serve index.html for non-API routes (SPA fallback) using middleware to avoid
  // path-to-regexp issues with certain router versions.
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Initialize DB
initDB();

// ── Notification Helper ────────────────────────────────────────────────────
function createNotification({ title, message = '', type = 'info', entityType = '', entityId = null, link = '', targetRole = null, targetUser = null }) {
  db.run(
    `INSERT INTO notifications (title, message, type, entity_type, entity_id, link, target_role, target_user) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, message, type, entityType, entityId, link, targetRole, targetUser],
    (err) => { if (err) console.error('[Notification Error]', err.message); }
  );
}

// Helper: Sync news stats counters to DB table
function updateNewsCounters() {
  db.serialize(() => {
    db.run(`INSERT OR REPLACE INTO news_counters (key, value) VALUES ('total', (SELECT COUNT(*) FROM news))`);
    db.run(`INSERT OR REPLACE INTO news_counters (key, value) VALUES ('visible', (SELECT COUNT(*) FROM news WHERE is_visible = 1))`);
    db.run(`INSERT OR REPLACE INTO news_counters (key, value) VALUES ('hidden', (SELECT COUNT(*) FROM news WHERE is_visible = 0))`);
  });
}


// --- VISITOR TRACKING MIDDLEWARE ---
app.use((req, res, next) => {
  // Simple visitor tracking by IP and current Date
  // We only track unique IPs per day
  const ip = req.ip || req.connection.remoteAddress;
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT * FROM visitors WHERE ip = ? AND date = ?', [ip, today], (err, row) => {
    if (!err && !row) {
      db.run('INSERT INTO visitors (ip, date) VALUES (?, ?)', [ip, today]);
    }
  });
  next();
});

// --- ROUTES ---

// Visitors Count API
app.get('/api/visitors/count', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM visitors', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ total: row.total });
  });
});

app.get('/api/visitors/stats', (req, res) => {
  db.all('SELECT date, COUNT(*) as count FROM visitors GROUP BY date ORDER BY date ASC LIMIT 14', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Document Templates API
app.get('/api/documents', (req, res) => {
  db.all('SELECT * FROM document_templates', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/documents', (req, res) => {
  const { title, fields, size } = req.body;
  db.run(`INSERT INTO document_templates (title, fields, size) VALUES (?, ?, ?)`, 
    [title, fields, size || '1.0 MB'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, fields, size: size || '1.0 MB' });
  });
});

app.put('/api/documents/:id', (req, res) => {
  const { title, fields } = req.body;
  db.run(`UPDATE document_templates SET title=?, fields=? WHERE id=?`, 
    [title, fields, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
  });
});

app.delete('/api/documents/:id', (req, res) => {
  db.run(`DELETE FROM document_templates WHERE id=?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Auth / Users
// Auth / Users
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT users.*, roles.name as role_name, roles.slug as role_slug 
          FROM users 
          JOIN roles ON users.role_id = roles.id 
          WHERE (users.username = ? OR users.job_number = ? OR users.email = ?) AND users.password = ?`, 
          [username, username, username, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    
    // Return user with branch
    res.json({ user: { ...user, role: { name: user.role_name, slug: user.role_slug } } });
  });
});

app.post('/api/register', (req, res) => {
  const { fullName, nationalId, email, department, username, password, branch } = req.body;
  // Store full name / username, national id in job_number, active = 0 (needs admin approval)
  db.run(`INSERT INTO users (username, email, phone, job_number, password, role_id, is_active, branch) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
          [fullName || username, email, '', nationalId || '', password, 3, 0, branch || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    createNotification({ 
      title: `طلب تسجيل موظف جديد`, 
      message: `الموظف: ${fullName || username} - ${branch || 'بدون فرع'}`, 
      type: 'add', 
      entityType: 'user', 
      entityId: this.lastID, 
      link: '/dashboard/user-management' 
    });
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/users', (req, res) => {
  db.all(`SELECT users.*, roles.name as role_name, roles.slug as role_slug 
          FROM users JOIN roles ON users.role_id = roles.id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const users = rows.map(u => ({ ...u, role: { name: u.role_name, slug: u.role_slug } }));
    res.json(users);
  });
});

app.post('/api/users', (req, res) => {
  const { username, email, phone, job_number, password, role_id, is_active, branch } = req.body;
  db.run(`INSERT INTO users (username, email, phone, job_number, password, role_id, is_active, branch) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
          [username, email, phone, job_number, password, role_id, is_active ? 1 : 0, branch || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    createNotification({ title: `تمت إضافة مستخدم جديد`, message: `المستخدم: ${username}`, type: 'add', entityType: 'user', entityId: this.lastID, link: '/dashboard/user-management' });
    res.json({ id: this.lastID });
  });
});

app.put('/api/users/:id', (req, res) => {
  const { username, email, phone, job_number, password, role_id, is_active, branch } = req.body;
  db.run(`UPDATE users SET username=?, email=?, phone=?, job_number=?, password=?, role_id=?, is_active=?, branch=? WHERE id=?`, 
          [username, email, phone, job_number, password, role_id, is_active ? 1 : 0, branch || '', req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    createNotification({ title: `تم تعديل بيانات مستخدم`, message: `المستخدم: ${username}`, type: 'edit', entityType: 'user', entityId: req.params.id, link: '/dashboard/user-management' });
    res.json({ success: true });
  });
});

app.delete('/api/users/:id', (req, res) => {
  db.run(`DELETE FROM users WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    createNotification({ title: `تم حذف مستخدم`, message: `معرف المستخدم: ${req.params.id}`, type: 'delete', entityType: 'user', link: '/dashboard/user-management' });
    res.json({ success: true });
  });
});

app.get('/api/roles', (req, res) => {
  db.all('SELECT * FROM roles', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Statistics
app.get('/api/statistics', (req, res) => {
  db.all('SELECT * FROM statistics', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/statistics', (req, res) => {
  const { label_ar, label_en, value, suffix, icon } = req.body;
  db.run(`INSERT INTO statistics (label_ar, label_en, value, suffix, icon) VALUES (?, ?, ?, ?, ?)`,
    [label_ar, label_en, value, suffix, icon], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
  });
});

app.put('/api/statistics/:id', (req, res) => {
  const { label_ar, label_en, value, suffix, icon } = req.body;
  db.run(`UPDATE statistics SET label_ar=?, label_en=?, value=?, suffix=?, icon=? WHERE id=?`,
    [label_ar, label_en, value, suffix, icon, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
  });
});

app.delete('/api/statistics/:id', (req, res) => {
  db.run('DELETE FROM statistics WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Pages
app.get('/api/books', (req, res) => {
  db.all('SELECT id, serial_number, title FROM books ORDER BY CAST(serial_number AS INTEGER) ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/books', (req, res) => {
  const { serial_number, title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  db.run('INSERT INTO books (serial_number, title) VALUES (?, ?)', [serial_number || '', title], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, serial_number, title });
  });
});

app.put('/api/books/:id', (req, res) => {
  const { serial_number, title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  db.run('UPDATE books SET serial_number=?, title=? WHERE id=?', [serial_number || '', title, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/books/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Working Papers
// Ensure allow_download column exists (migration)
try {
  db.run('ALTER TABLE working_papers ADD COLUMN allow_download INTEGER DEFAULT 1', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Failed to add allow_download column:', err.message);
    }
  });
} catch (e) {
  console.error('Migration error:', e.message);
}

app.get('/api/working-papers', (req, res) => {
  db.all(`SELECT *, COALESCE(allow_download,1) as allow_download FROM working_papers ORDER BY id DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/working-papers', async (req, res) => {
  const { title_ar, title_en, category, date, size, type, desc_ar, desc_en, author_ar, author_en, file_url, allow_download } = req.body;
  if (!title_ar) return res.status(400).json({ error: 'Arabic title is required' });
  
  // Safe translation – never throws, falls back to original text
  let finalTitleEn = title_en && title_en !== title_ar ? title_en : '';
  let finalAuthorEn = author_en && author_en !== author_ar ? author_en : '';
  let finalDescEn = desc_en && desc_en !== desc_ar ? desc_en : '';
  try {
    if (!finalTitleEn && title_ar)   finalTitleEn  = await translateChunk(title_ar, 'ar', 'en');
    if (!finalAuthorEn && author_ar) finalAuthorEn = await translateChunk(author_ar, 'ar', 'en');
    if (!finalDescEn && desc_ar)     finalDescEn   = await translateChunk(desc_ar, 'ar', 'en');
  } catch (e) { console.error('[Translation error – POST working-papers]', e.message); }

  const finalAllowDownload = (allow_download === 0 || allow_download === '0') ? 0 : 1;

  db.run(
    `INSERT INTO working_papers (title_ar, title_en, category, date, size, type, desc_ar, desc_en, author_ar, author_en, file_url, allow_download) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title_ar, finalTitleEn, category || 'عام', date || new Date().toISOString().split('T')[0], size || '1.5 MB', type || 'pdf', desc_ar || '', finalDescEn, author_ar || '', finalAuthorEn, file_url || '#', finalAllowDownload],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title_ar, title_en: finalTitleEn, category, date, size, type, desc_ar, desc_en: finalDescEn, author_ar, author_en: finalAuthorEn, file_url, allow_download: finalAllowDownload });
    }
  );
});

app.put('/api/working-papers/:id', async (req, res) => {
  const { title_ar, title_en, category, date, size, type, desc_ar, desc_en, author_ar, author_en, file_url, allow_download } = req.body;
  if (!title_ar) return res.status(400).json({ error: 'Arabic title is required' });
  
  // Safe translation – never throws, falls back to original text
  let finalTitleEn = title_en && title_en !== title_ar ? title_en : '';
  let finalAuthorEn = author_en && author_en !== author_ar ? author_en : '';
  let finalDescEn = desc_en && desc_en !== desc_ar ? desc_en : '';
  try {
    if (!finalTitleEn && title_ar)   finalTitleEn  = await translateChunk(title_ar, 'ar', 'en');
    if (!finalAuthorEn && author_ar) finalAuthorEn = await translateChunk(author_ar, 'ar', 'en');
    if (!finalDescEn && desc_ar)     finalDescEn   = await translateChunk(desc_ar, 'ar', 'en');
  } catch (e) { console.error('[Translation error – PUT working-papers]', e.message); }

  const finalAllowDownload = (allow_download === 0 || allow_download === '0') ? 0 : 1;

  db.run(
    `UPDATE working_papers SET title_ar=?, title_en=?, category=?, date=?, size=?, type=?, desc_ar=?, desc_en=?, author_ar=?, author_en=?, file_url=?, allow_download=? 
     WHERE id=?`,
    [title_ar, finalTitleEn, category || 'عام', date || new Date().toISOString().split('T')[0], size || '1.5 MB', type || 'pdf', desc_ar || '', finalDescEn, author_ar || '', finalAuthorEn, file_url || '#', finalAllowDownload, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, allow_download: finalAllowDownload });
    }
  );
});

// Fast PATCH – update allow_download only (no translation needed)
app.patch('/api/working-papers/:id/allow-download', (req, res) => {
  const { allow_download } = req.body;
  const finalVal = (allow_download === 0 || allow_download === '0' || allow_download === false) ? 0 : 1;
  db.run(
    `UPDATE working_papers SET allow_download=? WHERE id=?`,
    [finalVal, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, allow_download: finalVal });
    }
  );
});

app.delete('/api/working-papers/:id', (req, res) => {
  db.run('DELETE FROM working_papers WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


app.get('/api/pages', (req, res) => {
  db.all('SELECT id, title_ar, title_en, is_visible, parent_id, order_index FROM pages ORDER BY order_index ASC, id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// Helper: try finding a page by id in both decoded and encoded forms
function findPageId(db, rawId, callback) {
  // rawId from Express params is URL-decoded (e.g. Arabic text)
  // DB may store it as percent-encoded slug (e.g. %d8%a7%d9%84...)
  const encodedLower = encodeURIComponent(rawId).toLowerCase();
  db.get('SELECT * FROM pages WHERE id=? OR LOWER(id)=? OR id=?', [rawId, encodedLower, rawId.toLowerCase()], callback);
}

app.get('/api/pages/:id', (req, res) => {
  findPageId(db, req.params.id, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    let pageData = {
      id: row.id,
      title_ar: row.title_ar || '',
      title_en: row.title_en || '',
      content_ar: row.content_ar || '',
      content_en: row.content_en || '',
      is_visible: row.is_visible !== 0,
      parent_id: row.parent_id || '',
    };
    if (row.json_data) {
      try { pageData = { ...pageData, ...JSON.parse(row.json_data) }; } catch(e){}
    }
    res.json(pageData);
  });
});

app.put('/api/pages/:id', async (req, res) => {
  const { content_ar, content_en, title_ar, title_en, is_visible, parent_id, ...rest } = req.body;
  
  const finalTitleEn = title_en && title_en !== title_ar ? title_en : (title_ar ? await translateChunk(title_ar, 'ar', 'en') : '');
  const plainText = extractTextFromHtml(content_ar);
  const finalContentEn = content_en && content_en !== content_ar ? content_en : (plainText ? await translateLongText(plainText, 'ar', 'en') : '');

  const json_data = JSON.stringify(rest);
  // Find the actual stored id first
  findPageId(db, req.params.id, (findErr, existing) => {
    const actualId = existing ? existing.id : req.params.id;
    db.run(
      `UPDATE pages SET content_ar=?, content_en=?, title_ar=?, title_en=?, is_visible=?, parent_id=?, json_data=? WHERE id=?`,
      [content_ar, finalContentEn, title_ar || '', finalTitleEn, is_visible !== false ? 1 : 0, parent_id || '', json_data, actualId],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) {
          db.run(`INSERT INTO pages (id, content_ar, content_en, title_ar, title_en, is_visible, parent_id, json_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [actualId, content_ar, finalContentEn, title_ar || '', finalTitleEn, is_visible !== false ? 1 : 0, parent_id || '', json_data]);
        }
        res.json({ success: true });
    });
  });
});

app.patch('/api/pages/:id/visibility', (req, res) => {
  const { is_visible } = req.body;
  findPageId(db, req.params.id, (findErr, existing) => {
    const actualId = existing ? existing.id : req.params.id;
    db.run('UPDATE pages SET is_visible=? WHERE id=?', [is_visible ? 1 : 0, actualId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.delete('/api/pages/:id', (req, res) => {
  findPageId(db, req.params.id, (findErr, existing) => {
    const actualId = existing ? existing.id : req.params.id;
    db.run('DELETE FROM pages WHERE id=?', [actualId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Map Locations
app.get('/api/map_locations', (req, res) => {
  const showAll = req.query.all === 'true';
  const query = showAll 
    ? `SELECT map_locations.*, users.username as creator_name 
       FROM map_locations 
       LEFT JOIN users ON map_locations.created_by = users.id 
       ORDER BY map_locations.id DESC`
    : `SELECT map_locations.*, users.username as creator_name 
       FROM map_locations 
       LEFT JOIN users ON map_locations.created_by = users.id 
       WHERE map_locations.is_approved = 1 
       ORDER BY map_locations.id DESC`;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/map_locations', (req, res) => {
  const { name_ar, name_en, category, latitude, longitude, details_ar, details_en, created_by, is_approved } = req.body;
  const approvedVal = is_approved === undefined ? 1 : (is_approved ? 1 : 0);
  
  db.run(`INSERT INTO map_locations (name_ar, name_en, category, latitude, longitude, details_ar, details_en, created_by, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name_ar, name_en || name_ar, category, latitude, longitude, details_ar, details_en || details_ar, created_by, approvedVal], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const lastID = this.lastID;
      
      if (approvedVal === 0) {
        createNotification({
          title: `طلب إضافة معلم جديد على الخريطة`,
          message: `المعلم: ${name_ar} - بانتظار مراجعة واعتماد المسؤول`,
          type: 'add',
          entityType: 'map',
          entityId: lastID,
          link: `/dashboard/manage-map?review=${lastID}`,
          targetRole: 1
        });
      }
      res.json({ id: lastID });
  });
});

app.put('/api/map_locations/:id', (req, res) => {
  const { name_ar, name_en, category, latitude, longitude, details_ar, details_en, is_approved, rejection_comment } = req.body;
  const approvedVal = is_approved === undefined ? 1 : Number(is_approved);
  
  // Get existing record to check approval transition
  db.get('SELECT is_approved, created_by, name_ar FROM map_locations WHERE id=?', [req.params.id], (err, row) => {
    db.run(`UPDATE map_locations SET name_ar=?, name_en=?, category=?, latitude=?, longitude=?, details_ar=?, details_en=?, is_approved=?, rejection_comment=? WHERE id=?`,
      [name_ar, name_en || name_ar, category, latitude, longitude, details_ar, details_en || details_ar, approvedVal, rejection_comment || null, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // If it transitioned to approved, notify the creator
        if (row && row.is_approved !== 1 && approvedVal === 1) {
          createNotification({
            title: `تمت الموافقة على الخريطة`,
            message: `تم اعتماد المشروع: ${name_ar}`,
            type: 'success',
            entityType: 'map',
            entityId: req.params.id,
            link: '/dashboard',
            targetUser: row.created_by
          });
        }
        
        // If it transitioned to rejected/re-study (is_approved === 2), notify the creator
        if (row && approvedVal === 2) {
          createNotification({
            title: `طلب إعادة دراسة المعلم`,
            message: `المعلم: ${name_ar} يحتاج إلى تعديل. السبب: ${rejection_comment || 'مراجعة الخريطة والبيانات'}`,
            type: 'warning',
            entityType: 'map',
            entityId: req.params.id,
            link: `/dashboard/manage-map?re_study=${req.params.id}`,
            targetUser: row.created_by
          });
        }

        // If it transitioned from re-study (2) to pending (0) (resubmitted by employee), notify admins
        if (row && row.is_approved === 2 && approvedVal === 0) {
          createNotification({
            title: `تم تعديل وإعادة إرسال المعلم`,
            message: `المعلم: ${name_ar} - تم تعديله وبانتظار المراجعة`,
            type: 'add',
            entityType: 'map',
            entityId: req.params.id,
            link: `/dashboard/manage-map?review=${req.params.id}`,
            targetRole: 1 // Admin role
          });
        }
        res.json({ success: true });
    });
  });
});

app.delete('/api/map_locations/:id', (req, res) => {
  db.run('DELETE FROM map_locations WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// KML Features API
app.get('/api/kml/features', (req, res) => {
  db.all('SELECT * FROM map_kml_features', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/kml/features/clear', (req, res) => {
  db.run('DELETE FROM map_kml_features', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

function parseKmlAndInsert(kmlContent, callback) {
  db.serialize(() => {
    const folderRegex = /<Folder[^>]*>([\s\S]*?)<\/Folder>/g;
    let folderMatch;
    let count = 0;
    const stmt = db.prepare(`INSERT INTO map_kml_features (name, folder, type, coordinates, details) VALUES (?, ?, ?, ?, ?)`);

    while ((folderMatch = folderRegex.exec(kmlContent)) !== null) {
      const folderBlock = folderMatch[1];
      const nameMatch = /<name>([\s\S]*?)<\/name>/.exec(folderBlock);
      const folderName = nameMatch ? nameMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'عام';

      const placemarkRegex = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/g;
      let placemarkMatch;

      while ((placemarkMatch = placemarkRegex.exec(folderBlock)) !== null) {
        const placemarkBlock = placemarkMatch[1];

        const pNameMatch = /<name>([\s\S]*?)<\/name>/.exec(placemarkBlock);
        let placemarkName = pNameMatch ? pNameMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';

        const descMatch = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/.exec(placemarkBlock);
        const details = descMatch ? descMatch[1].trim() : '';

        if (placemarkBlock.includes('<Point>')) {
          const coordMatch = /<Point>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/.exec(placemarkBlock);
          if (coordMatch) {
            const coordStr = coordMatch[1].trim();
            const parts = coordStr.split(',');
            if (parts.length >= 2) {
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                const coordinates = JSON.stringify([lat, lng]);
                stmt.run(placemarkName, folderName, 'Point', coordinates, details);
                count++;
              }
            }
          }
        } else if (placemarkBlock.includes('<Polygon>')) {
          const coordMatch = /<Polygon>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/.exec(placemarkBlock);
          if (coordMatch) {
            const coordStr = coordMatch[1].trim();
            const tokens = coordStr.split(/\s+/);
            const coordsArr = [];
            tokens.forEach(tok => {
              const parts = tok.split(',');
              if (parts.length >= 2) {
                const lng = parseFloat(parts[0]);
                const lat = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                  coordsArr.push([lat, lng]);
                }
              }
            });
            if (coordsArr.length > 0) {
              const coordinates = JSON.stringify(coordsArr);
              stmt.run(placemarkName, folderName, 'Polygon', coordinates, details);
              count++;
            }
          }
        }
      }
    }
    stmt.finalize();
    callback(null, count);
  });
}

app.post('/api/kml/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const editorName = req.query.editor_username || 'مدخل البيانات';
  const filePath = req.file.path;
  const isKmz = req.file.originalname.toLowerCase().endsWith('.kmz');

  try {
    let kmlContent = '';
    if (isKmz) {
      const { execSync } = require('child_process');
      const extractDir = path.join(__dirname, 'kml_temp_' + Date.now());
      if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir);
      
      execSync(`tar -xf "${filePath}" -C "${extractDir}"`);
      const kmlPath = path.join(extractDir, 'doc.kml');
      if (fs.existsSync(kmlPath)) {
        kmlContent = fs.readFileSync(kmlPath, 'utf8');
      } else {
        throw new Error('KMZ does not contain doc.kml');
      }
      fs.rmSync(extractDir, { recursive: true, force: true });
    } else {
      kmlContent = fs.readFileSync(filePath, 'utf8');
    }

    // If replace=true is provided, clear existing features first
    const replace = req.query.replace === 'true' || req.body.replace === true;
    const afterParse = (err, count) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to parse KML' });
      }
      createNotification({
        title: `تم رفع ملف خرائط جديد بواسطة ${editorName}`,
        message: `تم تحليل واستيراد ${count} معلم جغرافي بنجاح.`,
        type: 'add',
        entityType: 'map',
        link: '/dashboard/manage-map',
      });
      // Remove uploaded file
      fs.unlinkSync(filePath);
      res.json({ success: true, count });
    };

    if (replace) {
      db.run('DELETE FROM map_kml_features', (delErr) => {
        if (delErr) return res.status(500).json({ error: delErr.message });
        parseKmlAndInsert(kmlContent, afterParse);
      });
    } else {
      parseKmlAndInsert(kmlContent, afterParse);
    }

  } catch (e) {
    console.error(e);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Error processing file: ' + e.message });
  }
});

// News Stats – dynamic counts from DB
app.get('/api/news/stats', (req, res) => {
  db.all(`SELECT key, value FROM news_counters`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const stats = { total: 0, visible: 0, hidden: 0 };
    if (rows) {
      rows.forEach(r => {
        if (r.key === 'total') stats.total = r.value;
        if (r.key === 'visible') stats.visible = r.value;
        if (r.key === 'hidden') stats.hidden = r.value;
      });
    }
    res.json(stats);
  });
});

// News – supports optional server-side pagination
app.get('/api/news', (req, res) => {
  const hasPagination = req.query.page || req.query.limit;
  const page     = parseInt(req.query.page)  || 1;
  const limit    = parseInt(req.query.limit) || 15;
  const search   = (req.query.search   || '').trim();
  const category = (req.query.category || '').trim();
  const audience = (req.query.audience || '').trim();
  const offset   = (page - 1) * limit;

  const conditions = [];
  const params     = [];

  if (search) {
    conditions.push('(title_ar LIKE ? OR title_en LIKE ? OR excerpt_ar LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) { conditions.push('category = ?'); params.push(category); }
  if (audience) { conditions.push('target_audience = ?'); params.push(audience); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  if (!hasPagination && !search && !category && !audience) {
    // Backward-compatible: return plain array for callers without pagination params
    return db.all(`SELECT * FROM news ORDER BY id DESC`, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }

  db.get(`SELECT COUNT(*) as total FROM news ${where}`, params, (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const total      = countRow.total;
    const totalPages = Math.ceil(total / limit) || 1;

    db.all(
      `SELECT * FROM news ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows, total, page, limit, totalPages });
      }
    );
  });
});

app.post('/api/news', async (req, res) => {
  const { category, title_ar, title_en, date, image, excerpt_ar, excerpt_en, content_ar, content_en, target_audience, is_visible, author_id } = req.body;
  
  const finalTitleEn = title_en && title_en !== title_ar ? title_en : (title_ar ? await translateChunk(title_ar, 'ar', 'en') : '');
  const finalExcerptEn = excerpt_en && excerpt_en !== excerpt_ar ? excerpt_en : (excerpt_ar ? await translateChunk(excerpt_ar, 'ar', 'en') : '');
  const plainText = extractTextFromHtml(content_ar);
  const finalContentEn = content_en && content_en !== content_ar ? content_en : (plainText ? await translateLongText(plainText, 'ar', 'en') : '');

  db.run(`INSERT INTO news (category, title_ar, title_en, date, image, excerpt_ar, excerpt_en, content_ar, content_en, target_audience, is_visible, author_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category, title_ar, finalTitleEn, date, image, excerpt_ar, finalExcerptEn, content_ar, finalContentEn, target_audience, is_visible === false ? 0 : 1, author_id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const lastID = this.lastID;
      
      // Fetch author username for realistic notification
      db.get('SELECT username FROM users WHERE id = ?', [author_id], (errUser, userRow) => {
        const authorName = userRow ? userRow.username : 'مدخل البيانات';
        createNotification({
          title: `تمت إضافة خبر جديد بواسطة ${authorName}`,
          message: title_ar || title_en || '',
          type: 'add',
          entityType: 'news',
          entityId: lastID,
          link: '/dashboard/manage-news',
          targetRole: target_audience === 'الموظفين' ? 3 : null
        });
      });

      updateNewsCounters();
      res.json({ id: lastID });
  });
});

app.put('/api/news/:id', async (req, res) => {
  const { category, title_ar, title_en, image, excerpt_ar, excerpt_en, content_ar, content_en, target_audience, is_visible, editor_username } = req.body;
  
  const finalTitleEn = title_en && title_en !== title_ar ? title_en : (title_ar ? await translateChunk(title_ar, 'ar', 'en') : '');
  const finalExcerptEn = excerpt_en && excerpt_en !== excerpt_ar ? excerpt_en : (excerpt_ar ? await translateChunk(excerpt_ar, 'ar', 'en') : '');
  const plainText = extractTextFromHtml(content_ar);
  const finalContentEn = content_en && content_en !== content_ar ? content_en : (plainText ? await translateLongText(plainText, 'ar', 'en') : '');

  db.run(`UPDATE news SET category=?, title_ar=?, title_en=?, image=?, excerpt_ar=?, excerpt_en=?, content_ar=?, content_en=?, target_audience=?, is_visible=? WHERE id=?`,
    [category, title_ar, finalTitleEn, image, excerpt_ar, finalExcerptEn, content_ar, finalContentEn, target_audience, is_visible === false ? 0 : 1, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const editorName = editor_username || 'مدخل البيانات';
      createNotification({
        title: `تم تعديل خبر بواسطة ${editorName}`,
        message: title_ar || title_en || '',
        type: 'edit',
        entityType: 'news',
        entityId: req.params.id,
        link: '/dashboard/manage-news',
        targetRole: 1
      });
      updateNewsCounters();
      res.json({ success: true });
  });
});

app.delete('/api/news/:id', (req, res) => {
  const editorName = req.query.editor_username || 'مدخل البيانات';
  // Get title before deleting
  db.get('SELECT title_ar FROM news WHERE id=?', [req.params.id], (err2, row) => {
    db.run('DELETE FROM news WHERE id=?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      createNotification({
        title: `تم حذف خبر بواسطة ${editorName}`,
        message: row ? row.title_ar : '',
        type: 'delete',
        entityType: 'news',
        link: '/dashboard/manage-news',
        targetRole: 1
      });
      updateNewsCounters();
      res.json({ success: true });
    });
  });
});

// News Comments API
app.get('/api/news/:id/comments', (req, res) => {
  db.all('SELECT * FROM comments WHERE post_id=? ORDER BY id ASC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/news/:id/comments', (req, res) => {
  const { author_name, content } = req.body;
  const dateStr = new Date().toISOString().split('T')[0];
  db.run(`INSERT INTO comments (post_id, author_name, content, date) VALUES (?, ?, ?, ?)`,
    [req.params.id, author_name, content, dateStr], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const newCommentId = this.lastID;
      
      // Notify Admin about new comment
      createNotification({
        title: `تعليق جديد من ${author_name}`,
        message: content,
        type: 'info',
        entityType: 'comment',
        entityId: newCommentId,
        link: '/dashboard/internal-news',
        targetRole: 1
      });

      res.json({ id: newCommentId, post_id: req.params.id, author_name, content, date: dateStr });
  });
});

// ── Notifications API ─────────────────────────────────────────────────────
app.get('/api/notifications', (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const roleId = req.query.role_id;
  const userId = req.query.user_id;
  const userIdVal = userId || 0;

  let query = `
    SELECT n.*, COALESCE(un.is_read, 0) as is_read
    FROM notifications n
    LEFT JOIN user_notifications un ON un.notification_id = n.id AND un.user_id = ?
    WHERE (un.is_deleted IS NULL OR un.is_deleted = 0)
  `;
  const params = [userIdVal];

  if (roleId || userId) {
    query += ` AND (`;
    const conditions = [];
    if (roleId) {
      conditions.push(`n.target_role = ?`);
      params.push(roleId);
    }
    if (userId) {
      conditions.push(`n.target_user = ?`);
      params.push(userId);
    }
    conditions.push(`(n.target_role IS NULL AND n.target_user IS NULL)`); // Global notifications
    query += conditions.join(' OR ') + `)`;
  }

  query += ` ORDER BY n.id DESC LIMIT ?`;
  params.push(limit);

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/notifications/unread-count', (req, res) => {
  const roleId = req.query.role_id;
  const userId = req.query.user_id;
  const userIdVal = userId || 0;

  let query = `
    SELECT COUNT(*) as count 
    FROM notifications n
    LEFT JOIN user_notifications un ON un.notification_id = n.id AND un.user_id = ?
    WHERE COALESCE(un.is_read, 0) = 0 AND (un.is_deleted IS NULL OR un.is_deleted = 0)
  `;
  const params = [userIdVal];

  if (roleId || userId) {
    query += ` AND (`;
    const conditions = [];
    if (roleId) {
      conditions.push(`n.target_role = ?`);
      params.push(roleId);
    }
    if (userId) {
      conditions.push(`n.target_user = ?`);
      params.push(userId);
    }
    conditions.push(`(n.target_role IS NULL AND n.target_user IS NULL)`);
    query += conditions.join(' OR ') + `)`;
  }

  db.get(query, params, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row ? row.count : 0 });
  });
});

app.patch('/api/notifications/read-all', (req, res) => {
  const roleId = req.query.role_id;
  const userId = req.query.user_id;

  if (userId) {
    db.all(
      `SELECT id FROM notifications 
       WHERE (target_user = ? OR target_role = ? OR (target_role IS NULL AND target_user IS NULL))`,
      [userId, roleId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) return res.json({ success: true });

        const stmt = db.prepare(`
          INSERT INTO user_notifications (user_id, notification_id, is_read) 
          VALUES (?, ?, 1) 
          ON CONFLICT(user_id, notification_id) 
          DO UPDATE SET is_read = 1
        `);
        rows.forEach(row => {
          stmt.run(userId, row.id);
        });
        stmt.finalize(() => {
          res.json({ success: true });
        });
      }
    );
  } else {
    db.run(`UPDATE notifications SET is_read = 1 WHERE is_read = 0`, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  }
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const userId = req.query.user_id;

  if (userId) {
    db.run(
      `INSERT INTO user_notifications (user_id, notification_id, is_read) 
       VALUES (?, ?, 1) 
       ON CONFLICT(user_id, notification_id) 
       DO UPDATE SET is_read = 1`,
      [userId, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  } else {
    db.run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  }
});

app.delete('/api/notifications/clear-all', (req, res) => {
  const roleId = req.query.role_id;
  const userId = req.query.user_id;

  if (userId) {
    db.all(
      `SELECT id FROM notifications 
       WHERE (target_user = ? OR target_role = ? OR (target_role IS NULL AND target_user IS NULL))`,
      [userId, roleId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) return res.json({ success: true });

        const stmt = db.prepare(`
          INSERT INTO user_notifications (user_id, notification_id, is_deleted) 
          VALUES (?, ?, 1) 
          ON CONFLICT(user_id, notification_id) 
          DO UPDATE SET is_deleted = 1
        `);
        rows.forEach(row => {
          stmt.run(userId, row.id);
        });
        stmt.finalize(() => {
          res.json({ success: true });
        });
      }
    );
  } else {
    db.run(`DELETE FROM notifications`, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  }
});

// =============================================
// AI TRANSLATION ENGINE
// =============================================

// Translate a single text chunk (max 500 chars) via MyMemory free API
function translateChunk(text, fromLang, toLang) {
  return new Promise((resolve) => {
    if (!text || !text.trim()) return resolve('');
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 499))}&langpair=${fromLang}|${toLang}`;
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const translated = json.responseData?.translatedText || text;
          resolve(translated);
        } catch {
          resolve(text);
        }
      });
    });
    req.on('error', () => resolve(text));
    req.setTimeout(8000, () => { req.destroy(); resolve(text); });
  });
}

// Split long HTML text into translatable chunks, preserving HTML tags
function extractTextFromHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Translate text in ~450 char chunks
async function translateLongText(text, fromLang, toLang) {
  if (!text || text.trim().length < 5) return text;
  
  const MAX = 450;
  const words = text.split(' ');
  const chunks = [];
  let current = '';
  
  for (const word of words) {
    if ((current + ' ' + word).length > MAX) {
      if (current) chunks.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) chunks.push(current.trim());
  
  const results = [];
  for (const chunk of chunks) {
    const translated = await translateChunk(chunk, fromLang, toLang);
    results.push(translated);
    await new Promise(r => setTimeout(r, 150)); // rate-limit pause
  }
  return results.join(' ');
}

// SSE endpoint: translate all pages + news + titles
app.get('/api/translate-all', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Get all pages
    const pages = await new Promise((resolve, reject) => {
      db.all('SELECT id, title_ar, content_ar FROM pages WHERE is_visible != 0 OR is_visible IS NULL', (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
      });
    });

    // Get all news
    const news = await new Promise((resolve, reject) => {
      db.all('SELECT id, title_ar, excerpt_ar, content_ar FROM news WHERE is_visible != 0 OR is_visible IS NULL', (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
      });
    });

    const total = pages.length + news.length;
    let completed = 0;

    send({ type: 'start', total });

    // Translate pages
    for (const page of pages) {
      try {
        const titleEn = page.title_ar ? await translateChunk(page.title_ar, 'ar', 'en') : '';
        const plainText = extractTextFromHtml(page.content_ar || '');
        const contentEn = plainText ? await translateLongText(plainText, 'ar', 'en') : '';

        await new Promise((resolve, reject) => {
          db.run('UPDATE pages SET title_en=?, content_en=? WHERE id=?',
            [titleEn, contentEn, page.id], (err) => {
              if (err) reject(err); else resolve();
            });
        });
      } catch (e) {
        // skip this page on error
      }

      completed++;
      send({ type: 'progress', completed, total, item: page.id, kind: 'page' });
    }

    // Translate news
    for (const article of news) {
      try {
        const titleEn = article.title_ar ? await translateChunk(article.title_ar, 'ar', 'en') : '';
        const excerptEn = article.excerpt_ar ? await translateChunk(article.excerpt_ar, 'ar', 'en') : '';
        const plainText = extractTextFromHtml(article.content_ar || '');
        const contentEn = plainText ? await translateLongText(plainText, 'ar', 'en') : '';

        await new Promise((resolve, reject) => {
          db.run('UPDATE news SET title_en=?, excerpt_en=?, content_en=? WHERE id=?',
            [titleEn, excerptEn, contentEn, article.id], (err) => {
              if (err) reject(err); else resolve();
            });
        });
      } catch (e) {
        // skip on error
      }

      completed++;
      send({ type: 'progress', completed, total, item: article.id, kind: 'news' });
    }

    send({ type: 'done', total });
  } catch (err) {
    send({ type: 'error', message: err.message });
  }

  res.end();
});

// Check translation status
app.get('/api/translate-status', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM pages WHERE is_visible != 0', (err, totalRow) => {
    db.get('SELECT COUNT(*) as translated FROM pages WHERE is_visible != 0 AND content_en IS NOT NULL AND content_en != "" AND content_en != content_ar', (err2, transRow) => {
      res.json({
        total: totalRow?.total || 0,
        translated: transRow?.translated || 0,
        is_translated: (transRow?.translated || 0) > 0,
      });
    });
  });
});

// Fast single-page on-demand translation
app.post('/api/pages/:id/translate', async (req, res) => {
  try {
    const row = await new Promise((resolve, reject) => {
      findPageId(db, req.params.id, (err, r) => { if (err) reject(err); else resolve(r); });
    });
    if (!row) return res.status(404).json({ error: 'Not found' });

    // If already translated (content_en differs from content_ar), return cached
    if (row.content_en && row.content_en.trim() && row.content_en !== row.content_ar) {
      return res.json({ title_en: row.title_en || '', content_en: row.content_en, cached: true });
    }

    // Translate title
    const titleEn = row.title_ar ? await translateChunk(row.title_ar, 'ar', 'en') : '';

    // Extract plain text from HTML and translate
    const plainText = extractTextFromHtml(row.content_ar || '');
    const contentEn = plainText ? await translateLongText(plainText, 'ar', 'en') : '';

    // Save to DB
    db.run('UPDATE pages SET title_en=?, content_en=? WHERE id=?',
      [titleEn, contentEn, row.id]);

    res.json({ title_en: titleEn, content_en: contentEn, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fast single-news on-demand translation
app.post('/api/news/:id/translate', async (req, res) => {
  try {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM news WHERE id=?', [req.params.id], (err, r) => {
        if (err) reject(err); else resolve(r);
      });
    });
    if (!row) return res.status(404).json({ error: 'Not found' });

    if (row.content_en && row.content_en.trim() && row.content_en !== row.content_ar) {
      return res.json({ title_en: row.title_en || '', content_en: row.content_en, excerpt_en: row.excerpt_en || '', cached: true });
    }

    const titleEn = row.title_ar ? await translateChunk(row.title_ar, 'ar', 'en') : '';
    const excerptEn = row.excerpt_ar ? await translateChunk(row.excerpt_ar, 'ar', 'en') : '';
    const plainText = extractTextFromHtml(row.content_ar || '');
    const contentEn = plainText ? await translateLongText(plainText, 'ar', 'en') : '';

    db.run('UPDATE news SET title_en=?, excerpt_en=?, content_en=? WHERE id=?',
      [titleEn, excerptEn, contentEn, row.id]);

    res.json({ title_en: titleEn, content_en: contentEn, excerpt_en: excerptEn, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;

// ═══════════════════════════════════════════════════════════════════
// COMPANIES API
// ═══════════════════════════════════════════════════════════════════

// GET all companies (public: approved only | admin: all)
app.get('/api/companies', (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM companies';
  const params = [];
  const conditions = [];

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(company_name LIKE ? OR country LIKE ? OR activity_type LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY id DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET single company
app.get('/api/companies/:id', (req, res) => {
  db.get('SELECT * FROM companies WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Company not found' });
    res.json(row);
  });
});

// POST new company registration (public)
app.post('/api/companies', (req, res) => {
  const {
    company_name, activity_type, founding_meeting_date, founding_contract_date,
    commercial_license_number, commercial_license_issue_date, commercial_license_expiry,
    commercial_registry_number, commercial_registry_issue_date, commercial_registry_expiry,
    chamber_registration_number, chamber_registration_issue_date, chamber_registration_expiry,
    subscribed_capital, paid_capital, shareholders_count, experience_years,
    company_nationality, professional_license_number, tax_file_number,
    social_insurance_number, last_approved_budget, bank_name, bank_branch, bank_account,
    agent_name, email, address, phone1, phone2, phone3, country, website, registration_date
  } = req.body;

  if (!company_name) return res.status(400).json({ error: 'اسم الشركة مطلوب' });

  // Generate serial number: REG-YYYY-XXX
  const year = new Date().getFullYear();
  db.get('SELECT COUNT(*) as cnt FROM companies WHERE strftime("%Y", created_at) = ?', [String(year)], (err, row) => {
    const seq = String((row?.cnt || 0) + 1).padStart(3, '0');
    const serial_number = `REG-${year}-${seq}`;

    db.run(
      `INSERT INTO companies (
        serial_number, registration_date, company_name, activity_type,
        founding_meeting_date, founding_contract_date,
        commercial_license_number, commercial_license_issue_date, commercial_license_expiry,
        commercial_registry_number, commercial_registry_issue_date, commercial_registry_expiry,
        chamber_registration_number, chamber_registration_issue_date, chamber_registration_expiry,
        subscribed_capital, paid_capital, shareholders_count, experience_years,
        company_nationality, professional_license_number, tax_file_number,
        social_insurance_number, last_approved_budget, bank_name, bank_branch, bank_account,
        agent_name, email, address, phone1, phone2, phone3, country, website, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [
        serial_number, registration_date || new Date().toISOString().split('T')[0], company_name, activity_type,
        founding_meeting_date, founding_contract_date,
        commercial_license_number, commercial_license_issue_date, commercial_license_expiry,
        commercial_registry_number, commercial_registry_issue_date, commercial_registry_expiry,
        chamber_registration_number, chamber_registration_issue_date, chamber_registration_expiry,
        subscribed_capital, paid_capital, shareholders_count, experience_years,
        company_nationality, professional_license_number, tax_file_number,
        social_insurance_number, last_approved_budget, bank_name, bank_branch, bank_account,
        agent_name, email, address, phone1, phone2, phone3, country, website
      ],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const newId = this.lastID;
        // Send notification to admin
        createNotification({
          title: `طلب تسجيل شركة جديدة: ${company_name}`,
          message: `تقدمت شركة "${company_name}" بطلب تسجيل جديد برقم ${serial_number}`,
          type: 'info',
          entityType: 'company',
          entityId: newId,
          link: '/dashboard/companies',
          targetRole: 1
        });
        res.json({ success: true, id: newId, serial_number });
      }
    );
  });
});

// PUT update company status (admin)
app.put('/api/companies/:id/status', (req, res) => {
  const { status, notes } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.run('UPDATE companies SET status = ?, notes = ? WHERE id = ?',
    [status, notes || '', req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    }
  );
});

// PUT update company full data (admin)
app.put('/api/companies/:id', (req, res) => {
  const fields = Object.keys(req.body);
  if (!fields.length) return res.status(400).json({ error: 'No data provided' });
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => req.body[f]);
  values.push(req.params.id);
  db.run(`UPDATE companies SET ${setClause} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// DELETE company (admin)
app.delete('/api/companies/:id', (req, res) => {
  db.run('DELETE FROM companies WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  });
});

// GET company stats
app.get('/api/companies/stats/summary', (req, res) => {
  db.all(`SELECT status, COUNT(*) as count FROM companies GROUP BY status`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    rows.forEach(r => { stats[r.status] = r.count; stats.total += r.count; });
    res.json(stats);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GALLERY API
// ═══════════════════════════════════════════════════════════════════

// GET all visible gallery images (public)
app.get('/api/gallery', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM gallery WHERE is_visible = 1';
  const params = [];
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY display_order ASC, created_at DESC';
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET all gallery images including hidden (admin)
app.get('/api/gallery/all', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM gallery';
  const params = [];
  if (category && category !== 'all') {
    query += ' WHERE category = ?';
    params.push(category);
  }
  query += ' ORDER BY display_order ASC, created_at DESC';
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET gallery categories
app.get('/api/gallery/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM gallery ORDER BY category', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.category));
  });
});

// POST add gallery image (admin)
app.post('/api/gallery', upload.single('image'), (req, res) => {
  const { title_ar, title_en, category, display_order } = req.body;
  let image_url = req.body.image_url || '';
  if (req.file) {
    image_url = `http://localhost:5000/uploads/${req.file.filename}`;
  }
  if (!image_url) return res.status(400).json({ error: 'Image is required' });

  db.run(
    'INSERT INTO gallery (title_ar, title_en, category, image_url, display_order) VALUES (?, ?, ?, ?, ?)',
    [title_ar || '', title_en || '', category || 'عام', image_url, display_order || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID, image_url });
    }
  );
});

// PUT update gallery image (admin)
app.put('/api/gallery/:id', upload.single('image'), (req, res) => {
  const { title_ar, title_en, category, is_visible, display_order } = req.body;
  let updates = [];
  let params = [];

  if (title_ar !== undefined) { updates.push('title_ar = ?'); params.push(title_ar); }
  if (title_en !== undefined) { updates.push('title_en = ?'); params.push(title_en); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (is_visible !== undefined) { updates.push('is_visible = ?'); params.push(is_visible); }
  if (display_order !== undefined) { updates.push('display_order = ?'); params.push(display_order); }
  if (req.file) {
    const image_url = `http://localhost:5000/uploads/${req.file.filename}`;
    updates.push('image_url = ?');
    params.push(image_url);
  }

  if (!updates.length) return res.status(400).json({ error: 'No data to update' });
  params.push(req.params.id);

  db.run(`UPDATE gallery SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  });
});

// PATCH toggle gallery image visibility (admin)
app.patch('/api/gallery/:id/toggle', (req, res) => {
  db.run('UPDATE gallery SET is_visible = CASE WHEN is_visible = 1 THEN 0 ELSE 1 END WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT is_visible FROM gallery WHERE id = ?', [req.params.id], (err2, row) => {
        res.json({ success: true, is_visible: row?.is_visible });
      });
    }
  );
});

// DELETE gallery image (admin)
app.delete('/api/gallery/:id', (req, res) => {
  db.get('SELECT image_url FROM gallery WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });

    // Delete file from disk if it's a local upload
    if (row.image_url && row.image_url.includes('/uploads/')) {
      const filename = row.image_url.split('/uploads/')[1];
      const filePath = path.join(__dirname, 'uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.run('DELETE FROM gallery WHERE id = ?', [req.params.id], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
