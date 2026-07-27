import { useState, useEffect, useMemo } from 'react';
import { Container, Modal, Button, Badge } from 'react-bootstrap';
import { motion } from 'motion/react';
import {
  FaGavel, FaBalanceScale, FaEye, FaUser, FaFilePdf, FaLock, FaShieldAlt
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import DataTable from '../../../components/DataTable';
import './decisions.css';

const CAT_COLORS = {
  'لوائح':    { bg: '#003087', light: '#003087' },
  'قوانين':   { bg: '#0066cc', light: '#0066cc' },
  'قرارات':   { bg: '#b45309', light: '#b45309' },
  'تشريعات':  { bg: '#006fa8', light: '#006fa8' },
};

const CATEGORIES = ['تشريعات', 'قرارات', 'قوانين', 'لوائح', 'الكل'];

// ── Component ────────────────────────────────────────────────────
const DecisionsPage = () => {
  const { locale } = useLanguage();
  const { isDarkMode } = useTheme();
  const { user } = useAuth() || {};
  const isRtl = locale === 'ar';

  // Admin role check: Only admin sees author information
  const isAdmin = Boolean(
    user && (
      user.role_slug === 'admin' ||
      user.role_name === 'أدمن' ||
      user.role_name === 'مسؤول النظام' ||
      user.username === 'admin'
    )
  );

  const [allDecisions, setAllDecisions]    = useState([]);
  const [search, setSearch]       = useState('');
  const [selectedCat, setSelectedCat] = useState('الكل');
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Anti-screenshot & window blur protection state
  const [isProtectedBlank, setIsProtectedBlank] = useState(false);

  // Instant Anti-Screenshot & OS Capture protection listeners
  useEffect(() => {
    if (!selectedItem) return;

    const handleBlur = () => {
      // Immediately hide iframe when focus is lost (e.g. Snipping tool, Win+Shift+S, Alt+Tab, PrtScn)
      setIsProtectedBlank(true);
    };

    const handleFocus = () => {
      setIsProtectedBlank(false);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setIsProtectedBlank(true);
      } else {
        setIsProtectedBlank(false);
      }
    };

    const handleKeyDown = (e) => {
      // Intercept PrtScn, Win key, Alt+PrtScn, Ctrl+P, Ctrl+S, F12, Snipping tool shortcuts
      if (
        e.key === 'PrintScreen' ||
        e.keyCode === 44 ||
        e.key === 'Meta' ||
        (e.altKey && (e.key === 'PrintScreen' || e.keyCode === 44)) ||
        (e.ctrlKey && ['p', 'P', 's', 'S', 'u', 'U'].includes(e.key)) ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'C', 'c', 'S', 's'].includes(e.key)) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsProtectedBlank(true);
        setTimeout(() => setIsProtectedBlank(false), 3000);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        setIsProtectedBlank(true);
        setTimeout(() => setIsProtectedBlank(false), 3000);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [selectedItem]);

  // Fetch decisions from API on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getDecisions();
        const data = Array.isArray(res) ? res : (res.data || res.items || []);
        if (mounted) setAllDecisions(data);
      } catch (err) {
        console.error('Failed to load decisions', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Derived filter logic with useMemo
  const displayed = useMemo(() => {
    let result = [...allDecisions];
    if (selectedCat !== 'الكل') {
      result = result.filter(d => d.category === selectedCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        (d.title_ar || '').toLowerCase().includes(q) ||
        (d.title_en || '').toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q) ||
        (isAdmin && (d.author || '').toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, selectedCat, allDecisions, isAdmin]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / limit));
  const safePage   = Math.min(page, totalPages);
  const pageData   = displayed.slice((safePage - 1) * limit, safePage * limit);

  // Export CSV
  const handleExport = () => {
    const header = ['#', isRtl ? 'العنوان' : 'Title', isRtl ? 'التصنيف' : 'Category'];
    if (isAdmin) header.push(isRtl ? 'المُدخل' : 'Author');

    const csvContent = [
      header.join(','),
      ...displayed.map((d, i) => {
        const row = [
          i + 1,
          `"${(isRtl ? d.title_ar : (d.title_en || d.title_ar)).replace(/"/g, '""')}"`,
          d.category,
        ];
        if (isAdmin) row.push(d.author || 'Aya');
        return row.join(',');
      }),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isRtl ? 'القرارات_واللوائح.csv' : 'decisions_regulations.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Columns ────────────────────────────────────────────────────
  const columns = [
    {
      key: 'id',
      label: isRtl ? 'رقم' : 'No.',
      sortable: false,
      style: { width: 60, textAlign: 'center' },
      render: (_, __, idx) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg,#003087,#0066cc)',
          color: '#fff', fontWeight: 800, fontSize: '0.82rem',
        }}>
          {(page - 1) * limit + idx + 1}
        </span>
      ),
    },
    {
      key: 'title_ar',
      label: isRtl ? 'عنوان القرار / الوثيقة' : 'Decision / Document Title',
      sortable: true,
      render: (_, row) => (
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => { setSelectedItem(row); setIsProtectedBlank(false); }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--primary)', marginBottom: 3, lineHeight: 1.4 }} className="hover-underline">
            <FaFilePdf className="ms-1 me-1 text-danger" />
            {isRtl ? row.title_ar : (row.title_en || row.title_ar)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            رقم القرار: {row.number || row.id} {row.year ? `(${row.year})` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: isRtl ? 'التصنيف' : 'Category',
      sortable: true,
      style: { width: 120, textAlign: 'center' },
      render: (val) => {
        const color = CAT_COLORS[val]?.bg || '#003087';
        return (
          <span style={{
            background: color + '18',
            color,
            border: `1px solid ${color}40`,
            padding: '4px 14px',
            borderRadius: 99,
            fontWeight: 700,
            fontSize: '0.78rem',
            whiteSpace: 'nowrap',
          }}>
            {val || 'قرارات'}
          </span>
        );
      },
    },
    // Show Author Column ONLY for ADMIN
    ...(isAdmin ? [{
      key: 'author',
      label: isRtl ? 'المُدخل بواسطة' : 'Added By',
      sortable: true,
      style: { width: 140, textAlign: 'center' },
      render: (val, row) => (
        <div className="d-flex flex-column align-items-center">
          <Badge bg="info" className="px-2 py-1 text-dark fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
            <FaUser size={10} /> {val || row.author || 'Aya'}
          </Badge>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {row.author_role || 'مدخل بيانات'}
          </span>
        </div>
      ),
    }] : []),
    {
      key: 'file_url',
      label: isRtl ? 'الإجراءات' : 'Actions',
      sortable: false,
      style: { width: 110, textAlign: 'center' },
      render: (_, row) => (
        <div className="d-flex justify-content-center">
          <button
            onClick={() => { setSelectedItem(row); setIsProtectedBlank(false); }}
            style={{
              background: 'linear-gradient(135deg, #003087 0%, #0066cc 100%)',
              border: 'none', color: '#fff',
              padding: '7px 18px', borderRadius: 8,
              fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 8px rgba(0,48,135,0.2)'
            }}
            title="عرض القرار"
          >
            <FaEye size={13} />
            {isRtl ? 'عرض القرار' : 'View Decision'}
          </button>
        </div>
      ),
    },
  ];

  // ── Category filter as extra JSX for DataTable filters prop ───
  const categoryFilter = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => setSelectedCat(cat)}
          style={{
            padding: '6px 16px', borderRadius: 99,
            border: selectedCat === cat ? '2px solid var(--primary)' : '2px solid var(--border)',
            background: selectedCat === cat ? 'var(--primary)' : 'transparent',
            color: selectedCat === cat ? '#fff' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
        >
          {isRtl ? cat : cat}
        </button>
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{
      background: 'var(--bg)', minHeight: '100vh',
      direction: isRtl ? 'rtl' : 'ltr',
      fontFamily: 'Cairo, Tajawal, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>

      <style>{`
        @media print {
          body { display: none !important; }
        }
        .protected-modal-dialog {
          max-width: 94vw !important;
          width: 94vw !important;
        }
      `}</style>

      {/* Hero Header */}
      <section className="dark-hero-section" style={{
        background: 'linear-gradient(135deg, #001225 0%, #001d5a 50%, #003087 100%)',
        padding: '70px 0 50px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,168,232,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: -50, width: 250, height: 250, background: 'radial-gradient(circle, rgba(201,162,39,0.07) 0%, transparent 70%)' }} />
        <Container className="position-relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              padding: '5px 16px', borderRadius: 99, color: 'rgba(255,255,255,0.85)',
              fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem',
            }}>
              <FaBalanceScale size={12} />
              {isRtl ? 'الإطار التشريعي والقانوني' : 'Legal & Legislative Framework'}
            </div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,2.8rem)', marginBottom: '0.5rem' }}>
              {isRtl ? 'القرارات و اللوائح' : 'Decisions & Regulations'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', maxWidth: 600, margin: 0 }}>
              {isRtl
                ? 'مجموعة القوانين والتشريعات والقرارات الصادرة عن الهيئة الوطنية للتخطيط العمراني'
                : 'Collection of laws, legislation, and decisions issued by the National Urban Planning Authority'}
            </p>
          </motion.div>
        </Container>
      </section>

      {/* DataTable Section */}
      <Container style={{ paddingTop: 40, paddingBottom: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <DataTable
            columns={columns}
            data={pageData}
            total={displayed.length}
            page={safePage}
            limit={limit}
            totalPages={totalPages}
            loading={loading}
            onPageChange={p => setPage(p)}
            onLimitChange={l => { setLimit(l); setPage(1); }}
            onSearch={q => { setSearch(q); setPage(1); }}
            searchPlaceholder={isRtl ? 'ابحث في القرارات واللوائح...' : 'Search decisions and regulations...'}
            filters={categoryFilter}
            onExport={handleExport}
            emptyIcon={<FaGavel />}
            emptyText={isRtl ? 'لا توجد وثائق مطابقة' : 'No matching documents'}
          />
        </motion.div>
      </Container>

      {/* Details & PDF Viewing Modal */}
      <Modal
        show={selectedItem !== null}
        onHide={() => { setSelectedItem(null); setIsProtectedBlank(false); }}
        size="xl"
        dialogClassName="protected-modal-dialog"
        centered
        style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}
      >
        <Modal.Header closeButton style={{
          direction: isRtl ? 'rtl' : 'ltr',
          background: isDarkMode ? 'var(--card-bg)' : '#f8faff',
          borderBottom: '1px solid var(--border)',
        }}>
          <Modal.Title style={{
            color: CAT_COLORS[selectedItem?.category]?.bg || '#003087',
            fontWeight: 800, fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <FaFilePdf className="text-danger" />
            {isRtl ? 'عرض القرار الرسمي' : 'View Official Decision'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          style={{
            padding: '24px 28px',
            direction: isRtl ? 'rtl' : 'ltr',
            textAlign: isRtl ? 'right' : 'left',
            background: isDarkMode ? 'var(--card-bg)' : '#fff',
            color: 'var(--text)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {selectedItem && (
            <div>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span style={{
                    background: CAT_COLORS[selectedItem.category]?.bg || '#003087',
                    color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                    padding: '4px 16px', borderRadius: 99, display: 'inline-block',
                  }}>
                    {selectedItem.category || 'قرارات'}
                  </span>
                  <Badge bg="dark" className="px-3 py-2 text-warning fs-6 rounded-pill d-flex align-items-center gap-2">
                    <FaShieldAlt /> وثيقة محمية ضد التصوير والنسخ
                  </Badge>
                </div>

                {/* Show Author Badge ONLY for ADMIN */}
                {isAdmin && (
                  <Badge bg="info" className="px-3 py-2 text-dark fs-6 rounded-pill d-flex align-items-center gap-2">
                    <FaUser /> المُدخل بواسطة: <strong>{selectedItem.author || 'Aya'}</strong> ({selectedItem.author_role || 'مدخل بيانات'})
                  </Badge>
                )}
              </div>

              <h4 style={{ fontWeight: 900, lineHeight: 1.5, marginBottom: 12, color: 'var(--text)' }}>
                {isRtl ? selectedItem.title_ar : (selectedItem.title_en || selectedItem.title_ar)}
              </h4>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                <strong>رقم الوثيقة/القرار:</strong> {selectedItem.number || selectedItem.id} {selectedItem.year ? `| السنة: ${selectedItem.year}` : ''}
              </div>

              {/* PDF Container with anti-screenshot overlay */}
              {selectedItem.file_url && selectedItem.file_url !== '#' ? (
                <div className="mb-3 position-relative" style={{ overflow: 'hidden', borderRadius: 14 }}>

                  {isProtectedBlank ? (
                    <div style={{
                      width: '100%',
                      height: '650px',
                      background: '#020617',
                      color: '#ef4444',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      gap: 14,
                      border: '2px solid #ef4444'
                    }}>
                      <FaLock size={56} />
                      <h3 style={{ fontWeight: 900, margin: 0, color: '#ffffff' }}>محتوى محمي - حجب أمني تلقائي</h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>تم حجب محتوى القرار فوراً لحماية السرية أثناء محاولة تصوير الشاشة</p>
                    </div>
                  ) : (
                    /* Standard Web PDF Viewer Engine */
                    <iframe
                      src={`${selectedItem.file_url}#page=1&view=FitH`}
                      style={{
                        width: '100%',
                        height: '650px',
                        borderRadius: 14,
                        border: '1.5px solid var(--border)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        background: '#f8fafc'
                      }}
                      title="معاينة القرار PDF"
                    />
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.85 }}>
                  {isRtl ? (selectedItem.desc_ar || 'لا يوجد ملف مرفق متاح.') : (selectedItem.desc_en || selectedItem.desc_ar || 'No file available.')}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <Button variant="secondary" onClick={() => { setSelectedItem(null); setIsProtectedBlank(false); }} style={{ fontFamily: 'inherit', fontWeight: 700, borderRadius: 10, padding: '8px 24px' }}>
                  {isRtl ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DecisionsPage;
