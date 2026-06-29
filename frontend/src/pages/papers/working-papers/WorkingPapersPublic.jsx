import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Spinner, Modal, Button } from 'react-bootstrap';
import { motion } from 'motion/react';
import { FaSearch, FaFilter, FaFileAlt, FaCalendarAlt, FaDownload, FaFilePdf, FaFileWord } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { api } from '../../../services/api';
import './working-papers.css';

const WorkingPapersPublic = () => {
  const { locale, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('الكل');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState(null);

  const isRtl = locale === 'ar';

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const data = await api.getWorkingPapers();
        setPapers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPapers();
  }, []);

  const categories = [
    { value: 'الكل', label: isRtl ? 'الكل' : 'All' },
    { value: 'دراسات تخطيطية', label: isRtl ? 'دراسات تخطيطية' : 'Planning Studies' },
    { value: 'تقارير', label: isRtl ? 'تقارير' : 'Reports' },
    { value: 'أوراق بحثية', label: isRtl ? 'أوراق بحثية' : 'Research Papers' },
    { value: 'لوائح وتشريعات', label: isRtl ? 'لوائح وتشريعات' : 'Regulations' },
    { value: 'مخططات', label: isRtl ? 'مخططات' : 'Plans' },
  ];

  const categoryMap = {
    'دراسات تخطيطية': isRtl ? 'دراسات تخطيطية' : 'Planning Studies',
    'تقارير': isRtl ? 'تقارير' : 'Reports',
    'أوراق بحثية': isRtl ? 'أوراق بحثية' : 'Research Papers',
    'لوائح وتشريعات': isRtl ? 'لوائح وتشريعات' : 'Regulations',
    'مخططات': isRtl ? 'مخططات' : 'Plans',
  };

  const filtered = papers.filter((p) => {
    const title = isRtl ? (p.title_ar || '') : (p.title_en || p.title_ar || '');
    const desc = isRtl ? (p.desc_ar || '') : (p.desc_en || p.desc_ar || '');
    
    const matchCat = selectedCat === 'الكل' || p.category === selectedCat;
    const matchSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const catColors = {
    'دراسات تخطيطية': '#003087',
    'تقارير': '#0066cc',
    'أوراق بحثية': '#00a8e8',
    'لوائح وتشريعات': '#c9a227',
    'مخططات': '#006fa8',
  };

  return (
    <div className="working-papers-page" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="papers-header" style={{
        background: 'linear-gradient(135deg, #001225 0%, #001d5a 50%, #003087 100%)',
        padding: '70px 0 50px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: -50, right: -50, width: 250, height: 250, background: 'radial-gradient(circle, rgba(0,168,232,0.1) 0%, transparent 70%)' }} />
        <Container className="position-relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 16px', borderRadius: 99, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
              <FaFileAlt size={12} />
              {t('papers.tag')}
            </div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {t('papers.title')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', margin: 0 }}>
              {t('papers.subtitle')}
            </p>
          </motion.div>
        </Container>
      </div>

      <Container style={{ marginTop: '50px' }}>
        {/* Search and Filter */}
        <div className="papers-filter-card">
          <Row className="g-3 align-items-center">
            <Col md={5}>
              <div style={{ position: 'relative' }}>
                <Form.Control
                  placeholder={t('papers.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: '2px solid var(--border)',
                    borderRadius: 10,
                    paddingRight: isRtl ? '42px' : '16px',
                    paddingLeft: isRtl ? '16px' : '42px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    background: 'var(--bg)', color: 'var(--text)',
                    fontFamily: 'inherit',
                    boxShadow: 'none',
                    width: '100%',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  right: isRtl ? '14px' : 'auto',
                  left: isRtl ? 'auto' : '14px',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  display: 'flex',
                }}>
                  <FaSearch size={15} />
                </span>
              </div>
            </Col>
            <Col md={7}>
              <div className="papers-filter-buttons">
                <FaFilter style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCat(cat.value)}
                    style={{
                      padding: '6px 16px', borderRadius: 99,
                      border: selectedCat === cat.value ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: selectedCat === cat.value ? 'var(--primary)' : 'transparent',
                      color: selectedCat === cat.value ? '#fff' : 'var(--text-muted)',
                      fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
                      fontSize: '0.85rem', fontFamily: 'inherit',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </Col>
          </Row>
        </div>

        {/* Papers List */}
        <div className="d-flex flex-column gap-4">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">{isRtl ? 'جاري تحميل أوراق العمل...' : 'Loading working papers...'}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaFileAlt size={48} className="opacity-25 mb-3" />
              <h5>{t('papers.empty')}</h5>
            </div>
          ) : (
            filtered.map((paper, idx) => {
              const title = isRtl ? paper.title_ar : paper.title_en;
              const desc = isRtl ? paper.desc_ar : paper.desc_en;
              const author = isRtl ? paper.author_ar : paper.author_en;

              return (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07 }}
                >
                  <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '24px 28px',
                    boxShadow: '0 2px 15px rgba(0,48,135,0.06)',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    textAlign: isRtl ? 'right' : 'left',
                    flexDirection: isRtl ? 'row' : 'row-reverse'
                  }}
                  className="papers-row-card"
                  onClick={() => setSelectedPaper(paper)}
                  >
                    {/* Download button */}
                    <div 
                      style={{ flexShrink: 0, textAlign: 'center', minWidth: '110px' }} 
                      className="order-3 order-md-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {paper.file_url && paper.file_url !== '#' && paper.allow_download === 1 ? (
                        /* ✅ Download ALLOWED */
                        <a 
                          href={paper.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <button style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                            border: 'none', color: '#fff',
                            padding: '10px 20px', borderRadius: 12,
                            fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                            fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'all 0.3s',
                            width: '100%',
                            justifyContent: 'center'
                          }}>
                            <FaDownload size={14} />
                            {t('papers.download')}
                          </button>
                        </a>
                      ) : paper.file_url && paper.file_url !== '#' ? (
                        /* 🔒 Download BLOCKED — show view-only button */
                        <button
                          style={{
                            background: 'linear-gradient(135deg,#6c757d,#495057)',
                            border: 'none', color: '#fff',
                            padding: '10px 20px', borderRadius: 12,
                            fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem',
                            fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'all 0.3s',
                            width: '100%',
                            justifyContent: 'center',
                          }}
                          onClick={() => setSelectedPaper(paper)}
                        >
                          <span style={{ fontSize: '1rem' }}>👁</span>
                          {isRtl ? 'عرض فقط' : 'View Only'}
                        </button>
                      ) : (
                        /* No file */
                        <button style={{
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                          border: 'none', color: '#fff',
                          padding: '10px 20px', borderRadius: 12,
                          fontWeight: 700, cursor: 'not-allowed', fontSize: '0.85rem',
                          fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 8,
                          transition: 'all 0.3s',
                          width: '100%',
                          justifyContent: 'center',
                          opacity: 0.5
                        }} disabled>
                          <FaDownload size={14} />
                          {t('papers.download')}
                        </button>
                      )}
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>
                        {paper.size}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: '250px' }} className="order-2">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2" style={{ justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                        <span style={{
                          background: catColors[paper.category] || 'var(--primary)',
                          color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                          padding: '3px 12px', borderRadius: 99,
                        }}>
                          {categoryMap[paper.category] || paper.category}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FaCalendarAlt size={11} /> {paper.date}
                        </span>
                        {author && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            • {author}
                          </span>
                        )}
                      </div>
                      <h5 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem', fontSize: '1.05rem', lineHeight: 1.5 }}>
                        {title}
                      </h5>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                        {desc}
                      </p>
                    </div>

                    {/* File Icon */}
                    <div style={{
                      width: 58, height: 58, flexShrink: 0,
                      borderRadius: 14,
                      background: paper.type === 'pdf' ? 'rgba(220,38,38,0.08)' : 'rgba(37,99,235,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} className="order-1 order-md-3 mx-auto mx-md-0">
                      {paper.type === 'pdf'
                        ? <FaFilePdf size={26} color="#dc2626" />
                        : <FaFileWord size={26} color="#2563eb" />
                      }
                    </div>

                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </Container>

      {/* Details Modal */}
      <Modal 
        show={selectedPaper !== null} 
        onHide={() => setSelectedPaper(null)} 
        size="lg" 
        centered
        style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}
      >
        <Modal.Header closeButton className="border-0 bg-light" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <Modal.Title className="fw-bold text-primary">
            {isRtl ? 'تفاصيل ورقة العمل / التقرير' : 'Document / Report Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
          {selectedPaper && (
            <div>
              <div className="d-flex flex-wrap gap-2 mb-3" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
                <span className="badge bg-primary" style={{ fontSize: '0.85rem' }}>
                  {categoryMap[selectedPaper.category] || selectedPaper.category}
                </span>
                <span className="text-muted small d-flex align-items-center gap-1" style={{ marginRight: isRtl ? '10px' : '0', marginLeft: isRtl ? '0' : '10px' }}>
                  <FaCalendarAlt size={11} /> {selectedPaper.date}
                </span>
                {selectedPaper.size && (
                  <span className="text-muted small">
                    • {selectedPaper.size} ({selectedPaper.type === 'word' ? 'DOCX' : 'PDF'})
                  </span>
                )}
              </div>
              
              <h4 className="fw-bold mb-3" style={{ color: 'var(--text)', lineHeight: 1.5 }}>
                {isRtl ? selectedPaper.title_ar : (selectedPaper.title_en || selectedPaper.title_ar)}
              </h4>
              
              {((isRtl ? selectedPaper.author_ar : selectedPaper.author_en) || selectedPaper.author_ar) && (
                <div className="mb-4 text-muted" style={{ fontSize: '0.95rem' }}>
                  <strong>{isRtl ? 'الجهة المعدّة:' : 'Prepared by:'}</strong> {isRtl ? selectedPaper.author_ar : (selectedPaper.author_en || selectedPaper.author_ar)}
                </div>
              )}
              
              <hr className="my-3" style={{ opacity: 0.15 }} />
              
              <h6 className="fw-bold text-secondary mb-2">{isRtl ? 'نبذة عن الملف / التقرير:' : 'About this report:'}</h6>
              <p className="text-muted" style={{ fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {isRtl ? (selectedPaper.desc_ar || 'لا يوجد وصف متاح باللغة العربية.') : (selectedPaper.desc_en || selectedPaper.desc_ar || 'No description available.')}
              </p>
              
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="light" onClick={() => setSelectedPaper(null)}>
                  {isRtl ? 'إغلاق' : 'Close'}
                </Button>
                {selectedPaper.file_url && selectedPaper.file_url !== '#' && selectedPaper.allow_download === 1 ? (
                  /* ✅ Download allowed in modal */
                  <a 
                    href={selectedPaper.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary px-4 fw-bold d-inline-flex align-items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                      border: 'none',
                      textDecoration: 'none',
                      color: '#fff'
                    }}
                  >
                    <FaDownload size={14} />
                    {isRtl ? 'تحميل الملف' : 'Download File'}
                  </a>
                ) : selectedPaper.file_url && selectedPaper.file_url !== '#' ? (
                  /* 🔒 Download blocked in modal — show disabled message */
                  <span
                    className="btn d-inline-flex align-items-center gap-2 px-4 fw-bold"
                    style={{
                      background: '#dee2e6',
                      border: 'none',
                      color: '#6c757d',
                      cursor: 'not-allowed',
                    }}
                  >
                    <span>🔒</span>
                    {isRtl ? 'التحميل غير متاح' : 'Download Disabled'}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default WorkingPapersPublic;
