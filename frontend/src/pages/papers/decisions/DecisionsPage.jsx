import React, { useState, useEffect } from 'react';
import { Container, Modal, Button } from 'react-bootstrap';
import { motion } from 'motion/react';
import {
  FaGavel, FaDownload,
  FaBalanceScale, FaFileContract, FaBook, FaClipboardList,
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { api } from '../../../services/api';
import DataTable from '../../../components/DataTable';
import './decisions.css';

// Data will be loaded from API

const CAT_COLORS = {
  'لوائح':    { bg: '#003087', light: '#003087' },
  'قوانين':   { bg: '#0066cc', light: '#0066cc' },
  'قرارات':   { bg: '#b45309', light: '#b45309' },
  'تشريعات':  { bg: '#006fa8', light: '#006fa8' },
};

const CATEGORIES = ['الكل', 'لوائح', 'قوانين', 'قرارات', 'تشريعات'];

// ── Component ────────────────────────────────────────────────────
const DecisionsPage = () => {
  const { locale } = useLanguage();
  const { isDarkMode } = useTheme();
  const isRtl = locale === 'ar';

  const [allDecisions, setAllDecisions]    = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const [search, setSearch]       = useState('');
  const [selectedCat, setSelectedCat] = useState('الكل');
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        if (mounted) setError(err.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...allDecisions];
    if (selectedCat !== 'الكل') {
      result = result.filter(d => d.category === selectedCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.title_ar.toLowerCase().includes(q) ||
        (d.title_en || '').toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    setDisplayed(result);
    setPage(1);
  }, [search, selectedCat, allDecisions]);

  const totalPages = Math.ceil(displayed.length / limit) || 1;
  const pageData   = displayed.slice((page - 1) * limit, page * limit);

  // Export CSV
  const handleExport = () => {
    const csvContent = [
      ['#', isRtl ? 'العنوان' : 'Title', isRtl ? 'التصنيف' : 'Category'].join(','),
      ...displayed.map((d, i) => [
        i + 1,
        `"${(isRtl ? d.title_ar : (d.title_en || d.title_ar)).replace(/"/g, '""')}"`,
        d.category,
      ].join(',')),
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
      label: isRtl ? 'عنوان الوثيقة' : 'Document Title',
      sortable: true,
      render: (_, row) => (
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => setSelectedItem(row)}
        >
          <div style={{ fontWeight: 700, fontSize: '0.93rem', color: 'var(--text)', marginBottom: 3, lineHeight: 1.4 }}>
            {isRtl ? row.title_ar : (row.title_en || row.title_ar)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {isRtl ? row.desc_ar : (row.desc_en || row.desc_ar)}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: isRtl ? 'التصنيف' : 'Category',
      sortable: true,
      style: { width: 130, textAlign: 'center' },
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
            {val}
          </span>
        );
      },
    },
    {
      key: 'file_url',
      label: isRtl ? 'تحميل' : 'Download',
      sortable: false,
      style: { width: 110, textAlign: 'center' },
      render: (val) =>
        val && val !== '#' ? (
          <a href={val} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(135deg,#003087,#0066cc)',
              border: 'none', color: '#fff',
              padding: '7px 16px', borderRadius: 10,
              fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem',
              fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <FaDownload size={11} />
              {isRtl ? 'تحميل' : 'Download'}
            </button>
          </a>
        ) : (
          <button disabled style={{
            background: 'var(--border)', border: 'none', color: 'var(--text-muted)',
            padding: '7px 16px', borderRadius: 10,
            fontWeight: 700, cursor: 'not-allowed', fontSize: '0.78rem',
            fontFamily: 'inherit', opacity: 0.5,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <FaDownload size={11} />
            {isRtl ? 'غير متاح' : 'N/A'}
          </button>
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
    }}>

      {/* Hero Header */}
      <section style={{
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
            page={page}
            limit={limit}
            totalPages={totalPages}
            loading={loading}
            onPageChange={p => setPage(p)}
            onLimitChange={l => { setLimit(l); setPage(1); }}
            onSearch={q => setSearch(q)}
            searchPlaceholder={isRtl ? 'ابحث في القرارات واللوائح...' : 'Search decisions and regulations...'}
            filters={categoryFilter}
            onExport={handleExport}
            emptyIcon={<FaGavel />}
            emptyText={isRtl ? 'لا توجد وثائق مطابقة' : 'No matching documents'}
          />
        </motion.div>
      </Container>

      {/* Details Modal */}
      <Modal
        show={selectedItem !== null}
        onHide={() => setSelectedItem(null)}
        size="lg"
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
            fontWeight: 800, fontSize: '1rem',
          }}>
            {isRtl ? 'تفاصيل الوثيقة' : 'Document Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{
          padding: '28px 32px',
          direction: isRtl ? 'rtl' : 'ltr',
          textAlign: isRtl ? 'right' : 'left',
          background: isDarkMode ? 'var(--card-bg)' : '#fff',
          color: 'var(--text)',
        }}>
          {selectedItem && (
            <div>
              <span style={{
                background: CAT_COLORS[selectedItem.category]?.bg || '#003087',
                color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                padding: '4px 16px', borderRadius: 99, display: 'inline-block', marginBottom: 16,
              }}>
                {selectedItem.category}
              </span>

              <h4 style={{ fontWeight: 800, lineHeight: 1.6, marginBottom: 16, color: 'var(--text)' }}>
                {isRtl ? selectedItem.title_ar : (selectedItem.title_en || selectedItem.title_ar)}
              </h4>

              <hr style={{ opacity: 0.15, marginBottom: 16 }} />

              <h6 style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                {isRtl ? 'نبذة عن الوثيقة:' : 'About this document:'}
              </h6>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.85 }}>
                {isRtl ? (selectedItem.desc_ar || 'لا يوجد وصف متاح.') : (selectedItem.desc_en || selectedItem.desc_ar || 'No description available.')}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                <Button variant="light" onClick={() => setSelectedItem(null)} style={{ fontFamily: 'inherit', fontWeight: 700 }}>
                  {isRtl ? 'إغلاق' : 'Close'}
                </Button>
                {selectedItem.file_url && selectedItem.file_url !== '#' && (
                  <a
                    href={selectedItem.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <button style={{
                      background: `linear-gradient(135deg, ${CAT_COLORS[selectedItem.category]?.bg || '#003087'} 0%, #0066cc 100%)`,
                      border: 'none', color: '#fff',
                      padding: '10px 24px', borderRadius: 12,
                      fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}>
                      <FaDownload size={14} />
                      {isRtl ? 'تحميل الملف' : 'Download File'}
                    </button>
                  </a>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DecisionsPage;
