const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDB = () => {
  db.serialize(() => {
    // 1. Roles Table
    db.run(`CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      slug TEXT,
      description TEXT
    )`);

    // 2. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      email TEXT,
      phone TEXT,
      job_number TEXT,
      password TEXT,
      role_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      branch TEXT,
      FOREIGN KEY(role_id) REFERENCES roles(id)
    )`);

    db.run(`ALTER TABLE users ADD COLUMN branch TEXT`, (err) => {
      // Ignore if column already exists
    });

    // 3. News Table
    db.run(`CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      title_ar TEXT,
      title_en TEXT,
      date TEXT,
      image TEXT,
      excerpt_ar TEXT,
      excerpt_en TEXT,
      content_ar TEXT,
      content_en TEXT,
      target_audience TEXT,
      is_visible BOOLEAN DEFAULT 1,
      author_id INTEGER,
      FOREIGN KEY(author_id) REFERENCES users(id)
    )`);

    // 4. Comments Table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      author_name TEXT,
      content TEXT,
      date TEXT,
      FOREIGN KEY(post_id) REFERENCES news(id)
    )`);

    // 5. Map Locations Table
    db.run(`CREATE TABLE IF NOT EXISTS map_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ar TEXT,
      name_en TEXT,
      category TEXT,
      latitude REAL,
      longitude REAL,
      details_ar TEXT,
      details_en TEXT,
      created_by INTEGER,
      is_approved BOOLEAN DEFAULT 1,
      FOREIGN KEY(created_by) REFERENCES users(id)
    )`);

    db.run(`ALTER TABLE map_locations ADD COLUMN is_approved BOOLEAN DEFAULT 1`, (err) => {
      // Ignore if column already exists
    });

    db.run(`ALTER TABLE map_locations ADD COLUMN rejection_comment TEXT`, (err) => {
      // Ignore if column already exists
    });

    // 6. Statistics Table
    db.run(`CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label_ar TEXT,
      label_en TEXT,
      value INTEGER,
      suffix TEXT,
      icon TEXT
    )`);

    // 7. Pages Table (About, Contact)
    db.run(`CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title_ar TEXT,
      title_en TEXT,
      content_ar TEXT,
      content_en TEXT,
      is_visible INTEGER DEFAULT 1,
      parent_id TEXT,
      order_index INTEGER DEFAULT 0,
      wp_slug TEXT,
      json_data TEXT
    )`);

    // 8. Visitors Table
    db.run(`CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT,
      date TEXT
    )`);

    // 9. Document Templates Table
    db.run(`CREATE TABLE IF NOT EXISTS document_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      fields TEXT,
      size TEXT DEFAULT '1.0 MB'
    )`);

    // 10. Notifications Table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT DEFAULT '',
      type TEXT DEFAULT 'info',
      entity_type TEXT DEFAULT '',
      entity_id INTEGER,
      link TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      target_role INTEGER DEFAULT NULL,
      target_user INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT (datetime('now','localtime'))
    )`);

    db.run(`ALTER TABLE notifications ADD COLUMN target_role INTEGER DEFAULT NULL`, (err) => {});
    db.run(`ALTER TABLE notifications ADD COLUMN target_user INTEGER DEFAULT NULL`, (err) => {});

    // 10b. User Notifications State Table
    db.run(`CREATE TABLE IF NOT EXISTS user_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      notification_id INTEGER,
      is_read INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      UNIQUE(user_id, notification_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(notification_id) REFERENCES notifications(id) ON DELETE CASCADE
    )`);


    // 11. News Counters Table
    db.run(`CREATE TABLE IF NOT EXISTS news_counters (
      key TEXT PRIMARY KEY,
      value INTEGER DEFAULT 0
    )`);

    // 12. KML Features Table
    db.run(`CREATE TABLE IF NOT EXISTS map_kml_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      folder TEXT,
      type TEXT,
      coordinates TEXT,
      details TEXT
    )`);

    // 13. Companies Registration Table
    db.run(`CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_number TEXT,
      registration_date TEXT,
      company_name TEXT NOT NULL,
      activity_type TEXT,
      founding_meeting_date TEXT,
      founding_contract_date TEXT,
      commercial_license_number TEXT,
      commercial_license_issue_date TEXT,
      commercial_license_expiry TEXT,
      commercial_registry_number TEXT,
      commercial_registry_issue_date TEXT,
      commercial_registry_expiry TEXT,
      chamber_registration_number TEXT,
      chamber_registration_issue_date TEXT,
      chamber_registration_expiry TEXT,
      subscribed_capital TEXT,
      paid_capital TEXT,
      shareholders_count TEXT,
      experience_years TEXT,
      company_nationality TEXT,
      professional_license_number TEXT,
      tax_file_number TEXT,
      social_insurance_number TEXT,
      last_approved_budget TEXT,
      bank_name TEXT,
      bank_branch TEXT,
      bank_account TEXT,
      agent_name TEXT,
      email TEXT,
      address TEXT,
      phone1 TEXT,
      phone2 TEXT,
      phone3 TEXT,
      country TEXT,
      website TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT (datetime('now','localtime'))
    )`);

    // 14. Gallery Table
    db.run(`CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_ar TEXT DEFAULT '',
      title_en TEXT DEFAULT '',
      category TEXT DEFAULT 'عام',
      image_url TEXT NOT NULL,
      is_visible INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now','localtime'))
    )`);

    // 15. Working Papers Table
    db.run(`CREATE TABLE IF NOT EXISTS working_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_ar TEXT,
      title_en TEXT,
      category TEXT,
      date TEXT,
      size TEXT DEFAULT '1.5 MB',
      type TEXT DEFAULT 'pdf',
      desc_ar TEXT,
      desc_en TEXT,
      author_ar TEXT,
      author_en TEXT,
      file_url TEXT,
      allow_download INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now','localtime'))
    )`);

    // Sync news counters on init
    db.run(`INSERT OR REPLACE INTO news_counters (key, value) VALUES ('total', (SELECT COUNT(*) FROM news))`);
    db.run(`INSERT OR REPLACE INTO news_counters (key, value) VALUES ('visible', (SELECT COUNT(*) FROM news WHERE is_visible = 1))`);
    db.run(`INSERT OR REPLACE INTO news_counters (key, value) VALUES ('hidden', (SELECT COUNT(*) FROM news WHERE is_visible = 0))`);

    // Insert Default Data if Empty
    db.get("SELECT count(*) as count FROM roles", (err, row) => {
      if (row.count === 0) {
        console.log('Seeding initial data...');
        db.run(`INSERT INTO roles (id, name, slug, description) VALUES 
          (1, 'مسؤول', 'admin', 'مدير النظام بكافة الصلاحيات'),
          (2, 'مدخل بيانات', 'data_entry', 'مسؤول عن إدخال البيانات والخرائط والأخبار'),
          (3, 'موظف', 'employee', 'موظف عادي لمتابعة البيانات فقط')
        `);

        db.run(`INSERT INTO users (id, username, email, phone, job_number, password, role_id, is_active) VALUES 
          (1, 'Admin', 'admin@upa.gov.ly', '0910000001', 'Admin', 'User@12', 1, 1),
          (2, 'مدخل البيانات', 'data@upa.gov.ly', '0920000002', 'UP-1002', 'User@12', 2, 1),
          (3, 'خالد محمد', 'khaled@upa.gov.ly', '0930000003', 'UP-1003', 'password123', 3, 1)
        `);

        // Seed initial statistics
        db.run(`INSERT INTO statistics (label_ar, label_en, value, suffix, icon) VALUES 
          ('مخططاً حضرياً معتمداً', 'Approved Urban Plans', 60, '+', 'FaMapMarkedAlt'),
          ('فرعاً على مستوى ليبيا', 'Branches across Libya', 22, '', 'FaRegBuilding'),
          ('عاماً من العطاء', 'Years of Dedication', 40, '+', 'FaGlobe'),
          ('كادراً متخصصاً', 'Specialized Cadres', 500, '+', 'FaUsers')
        `);

        // Initial Pages
        const aboutData = {
          tasks: [
            { icon: 'FaMapMarkedAlt', title_ar: 'المخططات العمرانية', desc_ar: 'إعداد وتحديث المخططات الحضرية والإقليمية بكافة مستوياتها.', title_en: 'Urban Plans', desc_en: 'Preparing and updating urban and regional plans.' },
            { icon: 'FaLayerGroup', title_ar: 'التخطيط الإقليمي', desc_ar: 'وضع الأطر الاستراتيجية للتوزيع الأمثل للسكان والأنشطة.', title_en: 'Regional Planning', desc_en: 'Setting strategic frameworks.' }
          ],
          leadership: [
            { 
              name_ar: 'د. أحمد التومي', 
              title_ar: 'مدير الهيئة', 
              name_en: 'Dr. Ahmed Al-Toumi', 
              title_en: 'Director of the Authority', 
              img: 'http://localhost:5000/uploads/director_image.jpg' 
            }
          ]
        };
        db.run(`INSERT INTO pages (id, title_ar, title_en, content_ar, content_en, is_visible, json_data) VALUES 
          ('about', 'عن الهيئة', 'About Us', 'محتوى عن الهيئة', 'About us content', 1, ?)
        `, [JSON.stringify(aboutData)]);

        const contactData = {
          links: { phone: '00218-21-0000000', email: 'info@upa.gov.ly', address_ar: 'طرابلس', address_en: 'Tripoli', facebook: '', twitter: '' },
          map_location: { lat: 32.8872, lng: 13.1932 }
        };
        db.run(`INSERT INTO pages (id, title_ar, title_en, content_ar, content_en, is_visible, json_data) VALUES 
          ('contact', 'اتصل بنا', 'Contact Us', 'تواصل معنا', 'Contact Us', 1, ?)
        `, [JSON.stringify(contactData)]);

        // Seed initial companies from official document
        db.run(`INSERT INTO companies (company_name, country, website, status, activity_type, registration_date) VALUES
          ('DFN Plan & Project', 'تركيا', 'www.dfnproje.com', 'approved', 'استشارات هندسية', '2024-11-19'),
          ('Henan ZhongGong Design & Research Group Co., Ltd. HNDI', 'الصين', 'www.hndi.com.cn', 'approved', 'استشارات هندسية', '2024-11-19'),
          ('صبح كونسلت', 'مصر', 'www.diaconsult.com', 'approved', 'استشارات هندسية', '2024-11-19'),
          ('جماعة المهندسين الاستشاريين', 'مصر', 'www.ecgia.com', 'approved', 'استشارات هندسية', '2024-11-19'),
          ('Sebat Project Engineering Consultancy Trade Inc', 'تركيا', 'www.sebatproje.com.tr', 'approved', 'استشارات هندسية', '2024-11-19'),
          ('BNR', 'تركيا', 'www.birkentseldonusum.com', 'approved', 'استشارات هندسية', '2025-02-16'),
          ('DOHWA Engineering Co., Ltd', 'كوريا الجنوبية', 'www.dohwa.co.kr', 'approved', 'استشارات هندسية', '2025-02-16'),
          ('اتحاد المستشارين الهندسية', 'الأردن', 'https://group-rc.com/', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('بر للاستشارات', 'مصر', 'https://pco-eg.net/', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('الشركة المركزية لتمييز البناء', 'تونس', 'www.scet-tunisie.com', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('الشركة السعودية للخدمات الاستشارية', 'السعودية', 'www.saudiconsult.com', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('برينتاس الفو', 'مصر', '', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('المجموعة الاستشارية شاكر', 'مصر', 'www.shakergroup.com', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('SP ARCHITECTS', 'تركيا', 'https://spdo.com.tr/', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('شركة دورش (Dorsch)', 'ألمانيا', 'www.dorsch.com', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('محمد دمص', 'مصر', 'https://ace-mb.com/', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('شركة دار بلس (Darplus)', 'بريطانيا', 'www.sidaracollaborative.com', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('AZM', 'تركيا', 'www.azmsurveying.com', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('USUK', 'تركيا', 'www.usukmap.com', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('مركز الدراسات التخطيطية والمعمارية', 'مصر', 'https://cpas-egypt.com/', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('AWA partners', 'تونس', 'www.awa.com.tn', 'approved', 'استشارات هندسية', '2025-01-01'),
          ('BURO HAPPOLD', 'بريطانيا', 'www.burohappold.com', 'approved', 'استشارات هندسية', '2025-01-01')
        `);
      }
    });

    db.get("SELECT count(*) as count FROM working_papers", (err, row) => {
      if (!err && row && row.count === 0) {
        console.log('Seeding initial working papers...');
        db.run(`INSERT INTO working_papers (title_ar, title_en, category, date, size, type, desc_ar, desc_en, author_ar, author_en, file_url) VALUES 
          ('التقرير التقييمي للمخطط الوطني الثالث (2020-2025)', 'Evaluation Report of the Third National Plan (2020-2025)', 'تقارير', '2025-01-15', '4.2 MB', 'pdf', 'تقرير شامل يُقيّم نسب إنجاز مستهدفات المخطط التخطيطي الثالث وأبرز التحديات التي واجهت التنفيذ.', 'A comprehensive report evaluating completion rates of the Third Planning Plan targets and key implementation challenges.', 'مكتب المتابعة الفنية', 'Technical Follow-up Office', '#'),
          ('اللائحة التنفيذية للتطوير العقاري وتنظيم المجمعات السكنية', 'Executive Regulations for Real Estate Development and Housing Complex Regulation', 'لوائح وتشريعات', '2024-10-10', '2.8 MB', 'pdf', 'الضوابط واللوائح القانونية المعتمدة لتنظيم مشاريع التطوير العقاري الاستثماري في ليبيا.', 'Legal controls and regulations approved to regulate investment real estate development projects in Libya.', 'الإدارة القانونية', 'Legal Department', '#'),
          ('دراسة استراتيجية حول التنمية الريفية المستدامة في المناطق الصحراوية', 'Strategic Study for Rural Housing in Libya', 'دراسات تخطيطية', '2024-12-05', '3.3 MB', 'word', 'دراسة استراتيجية تُعالج أوضاع الإسكان في المناطق الريفية وتقدم توصيات لتطوير التجمعات الريفية.', 'A strategic study addressing housing conditions in rural areas and providing recommendations for rural community development.', 'قسم التخطيط الريفي', 'Rural Planning Department', '#')
        `);
      }
    });
  });
};

module.exports = { db, initDB };
