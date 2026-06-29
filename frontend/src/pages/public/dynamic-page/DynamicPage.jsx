import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import * as FaIcons from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { api } from '../../../services/api';
import { API_ENDPOINTS } from '../../../config/apiEndpoints';
import './dynamic-page.css';
import DataTable from '../../../components/DataTable';

// Map from upa.gov.ly URL segments to local page IDs
const UPA_URL_TO_LOCAL = {
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b7%d8%b1%d8%a7%d8%a8%d9%84%d8%b3-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b7%d8%b1%d8%a7%d8%a8%d9%84%d8%b3-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%85%d8%b3-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%85%d8%b3-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b2%d9%88%d8%a7%d8%b1%d8%a9-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b2%d9%88%d8%a7%d8%b1%d8%a9-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%ba%d8%b1%d9%8a%d8%a7%d9%86-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%ba%d8%b1%d9%8a%d8%a7%d9%86-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%85%d8%b5%d8%b1%d8%a7%d8%aa%d9%87-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%85%d8%b5%d8%b1%d8%a7%d8%aa%d9%87-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a',
  'kufra-sub-region': 'kufra-sub-region',
  'sirt-subregion': 'sirt-subregion',
  'tripoli_parks': 'tripoli_parks',
  'tripoli_moal': 'tripoli_moal',
  'tripoli_masharie_tarfihia': 'tripoli_masharie_tarfihia',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b7%d8%b1%d8%a7%d8%a8%d9%84%d8%b3-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b7%d8%b1%d8%a7%d8%a8%d9%84%d8%b3-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%85%d8%b3-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%85%d8%b3-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b2%d9%88%d8%a7%d8%b1%d8%a9-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b2%d9%88%d8%a7%d8%b1%d8%a9-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%ba%d8%b1%d9%8a%d8%a7%d9%86-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%ba%d8%b1%d9%8a%d8%a7%d9%86-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%85%d8%b5%d8%b1%d8%a7%d8%aa%d9%87-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%85%d8%b5%d8%b1%d8%a7%d8%aa%d9%87-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%84%d9%8a%d8%ac-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%84%d9%8a%d8%ac-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a8%d9%86%d8%ba%d8%a7%d8%b2%d9%8a-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a8%d9%ba%d8%a7%d8%b2%d9%8a-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
  '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%81%d8%b2%d8%a7%d9%86-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a': '%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%81%d8%b2%d8%a7%d9%86-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
};

// Convert a upa.gov.ly URL to a local /page/:id route, or null if not mapped
function upaUrlToLocal(url) {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('upa.gov.ly')) return null;
    const segments = urlObj.pathname.split('/').filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i].toLowerCase();
      if (UPA_URL_TO_LOCAL[seg]) return `/page/${UPA_URL_TO_LOCAL[seg]}`;
    }
    const fullPath = urlObj.pathname.replace(/\//g, '').toLowerCase();
    for (const [key, val] of Object.entries(UPA_URL_TO_LOCAL)) {
      if (fullPath.includes(key.toLowerCase())) return `/page/${val}`;
    }
  } catch {}
  return null;
}

// Cache translated content in memory
const translationCache = {};

async function fetchPageData(decodedId) {
  const encodedLower = encodeURIComponent(decodedId).toLowerCase();
  for (const attempt of [decodedId, encodedLower]) {
    try {
      const data = await api.getPageById(attempt);
      if (data && (data.content_ar || data.title_ar)) return data;
    } catch {}
  }
  return null;
}

async function translatePageOnDemand(pageId) {
  if (translationCache[pageId]) return translationCache[pageId];
  try {
    const data = await api.translatePage(pageId);
    translationCache[pageId] = data;
    return data;
  } catch {}
  return null;
}

const DynamicPage = () => {
  const { id } = useParams();
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const isRtl = !isEn;
  const navigate = useNavigate();
  const contentRef = useRef(null);

  let decodedId;
  try { decodedId = decodeURIComponent(id); } catch { decodedId = id; }

  // Detect reports page (تقارير)
  const isReportsPage = decodedId === '%d8%aa%d9%82%d8%a7%d8%b1%d9%8a%d8%b1' || decodedId.toLowerCase().includes('تقارير');

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [displayContent, setDisplayContent] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  // Reports table state
  const [reportsRows, setReportsRows] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsLimit, setReportsLimit] = useState(10);

  // If this is the reports page, ensure the header shows the Reports title
  useEffect(() => {
    if (isReportsPage) {
      setDisplayTitle(isRtl ? 'التقارير' : 'Reports');
    }
  }, [isReportsPage, isRtl]);

  const effectivePageTitle = isReportsPage
    ? (isRtl ? 'التقارير' : 'Reports')
    : (displayTitle || (loading ? '...' : (isEn ? 'Page' : 'الصفحة')));

  // Dynamic icon helper
  const getDynamicIcon = (iconName) => {
    const Icon = FaIcons[iconName];
    return Icon ? <Icon /> : <FaIcons.FaCheckCircle />;
  };

  // Render dynamic sections — mirrors About.jsx renderSection logic
  const renderSection = (section, idx) => {
    if (!section) return null;

    switch (section.type) {
      case 'text_image':
        return (
          <motion.div
            key={section.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <Row className={`g-5 align-items-center mb-5 flex-md-row${section.alignment === 'left' ? '-reverse' : ''}`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
              <Col md={6}>
                {(isRtl ? section.title_ar : section.title_en) && (
                  <h3 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: '1.25rem', textAlign: isRtl ? 'right' : 'left' }}>
                    {isRtl ? section.title_ar : section.title_en}
                  </h3>
                )}
                <div
                  style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.8, textAlign: isRtl ? 'right' : 'left' }}
                  dangerouslySetInnerHTML={{ __html: isRtl ? section.content_ar : section.content_en }}
                />
              </Col>
              <Col md={6}>
                <div style={{
                  position: 'relative', borderRadius: 24, overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,48,135,0.12)', border: '1px solid var(--border)', height: 320,
                }}>
                  {section.image_url ? (
                    <img src={section.image_url} alt={isRtl ? section.title_ar : section.title_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(0,0,0,0.04)', color: 'var(--text-muted)' }}>
                      <FaIcons.FaImage size={48} />
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </motion.div>
        );

      case 'profile_card':
        return (
          <motion.div
            key={section.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="d-flex justify-content-center my-5"
          >
            <div style={{
              background: 'var(--card-bg)', borderRadius: 20, overflow: 'hidden',
              border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,48,135,0.1)',
              maxWidth: 450, width: '100%', textAlign: 'center',
            }}>
              <div style={{ height: 260, overflow: 'hidden', position: 'relative', background: '#eee' }}>
                {section.image_url ? (
                  <img src={section.image_url} alt={isRtl ? section.profile_name_ar : section.profile_name_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'linear-gradient(135deg, #001225 0%, #003087 100%)' }}>
                    <FaIcons.FaUser size={60} color="rgba(255,255,255,0.3)" />
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,29,90,0.85) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: 15, left: 0, right: 0 }}>
                  <h4 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>
                    {isRtl ? section.profile_name_ar : section.profile_name_en}
                  </h4>
                </div>
              </div>
              <div className="p-4" style={{ background: 'var(--card-bg)' }}>
                <div className="mb-3">
                  <span style={{
                    background: 'rgba(0,48,135,0.08)', color: 'var(--primary)',
                    fontSize: '0.82rem', fontWeight: 700, padding: '5px 15px',
                    borderRadius: 99, border: '1px solid rgba(0,48,135,0.15)',
                  }}>
                    {isRtl ? section.profile_title_ar : section.profile_title_en}
                  </span>
                </div>
                {(isRtl ? section.bio_ar : section.bio_en) && (
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {isRtl ? section.bio_ar : section.bio_en}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 'cards_grid':
        return (
          <motion.div
            key={section.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="my-5"
          >
            {section.title_ar && (
              <div className="text-center mb-4">
                <h3 style={{ fontWeight: 800, color: 'var(--text)' }}>
                  {isRtl ? section.title_ar : section.title_en}
                </h3>
                <div style={{ width: 60, height: 3, background: 'var(--primary)', borderRadius: 99, margin: '12px auto 0' }} />
              </div>
            )}
            <Row className="g-4">
              {(section.items || []).map((item, i) => (
                <Col md={6} lg={4} key={i}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    style={{
                      display: 'flex', gap: 16, padding: '20px 22px',
                      background: 'var(--card-bg)', borderRadius: 16,
                      border: '1px solid var(--border)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      height: '100%', flexDirection: 'row',
                      textAlign: isRtl ? 'right' : 'left',
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, flexShrink: 0, borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(0,48,135,0.08), rgba(0,168,232,0.08))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--primary)', fontSize: '1.1rem',
                    }}>
                      {getDynamicIcon(item.icon)}
                    </div>
                    <div>
                      <h6 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
                        {isRtl ? item.title_ar : item.title_en}
                      </h6>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
                        {isRtl ? item.desc_ar : item.desc_en}
                      </p>
                    </div>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        );

      case 'info_banner':
        return (
          <motion.div
            key={section.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="my-5"
            style={{
              background: section.banner_bg === 'dark'
                ? 'linear-gradient(135deg, #0b1528 0%, #112240 100%)'
                : section.banner_bg === 'gradient'
                ? 'linear-gradient(135deg, #003087 0%, #00a8e8 100%)'
                : 'linear-gradient(135deg, #001d5a 0%, #003087 60%, #0066cc 100%)',
              borderRadius: 24, padding: '50px 40px', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,48,135,0.16)',
            }}
          >
            <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
            <div className="position-relative">
              <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '0.75rem' }}>
                {isRtl ? section.title_ar : section.title_en}
              </h3>
              {(isRtl ? section.banner_desc_ar : section.banner_desc_en) && (
                <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '2rem', fontSize: '1rem', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }}>
                  {isRtl ? section.banner_desc_ar : section.banner_desc_en}
                </p>
              )}
              {(isRtl ? section.banner_btn_text_ar : section.banner_btn_text_en) && (
                <Link to={section.banner_btn_link || '#'} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)', color: '#fff', padding: '10px 24px', borderRadius: 99, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                  <FaIcons.FaArrowLeft size={14} style={{ transform: isRtl ? 'none' : 'rotate(180deg)' }} />
                  {isRtl ? section.banner_btn_text_ar : section.banner_btn_text_en}
                </Link>
              )}
            </div>
          </motion.div>
        );

      case 'stats_grid':
        return (
          <motion.div
            key={section.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="my-5"
          >
            {section.title_ar && (
              <div className="text-center mb-4">
                <h3 style={{ fontWeight: 800, color: 'var(--text)' }}>
                  {isRtl ? section.title_ar : section.title_en}
                </h3>
              </div>
            )}
            <Row className="g-4 justify-content-center">
              {(section.items || []).map((item, i) => (
                <Col xs={6} md={3} key={i}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    style={{
                      background: 'var(--card-bg)', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '24px 16px', textAlign: 'center',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 99,
                      background: 'rgba(0,48,135,0.06)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.15rem', marginBottom: 12,
                    }}>
                      {getDynamicIcon(item.icon)}
                    </div>
                    <h3 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--primary)', margin: '0 0 4px' }}>
                      {item.value}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {isRtl ? item.label_ar : item.label_en}
                    </span>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        );

      default:
        return null;
    }

    // Reports page handling moved to main render to display full-width DataTable
  };

  // 1. Fetch page from DB
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPageData(null);
    setDisplayContent('');
    if (!isReportsPage) setDisplayTitle('');

    fetchPageData(decodedId).then(data => {
      if (cancelled) return;
      setPageData(data);
      setLoading(false);
    });

    // If reports page, load working papers
    if (isReportsPage) {
      setReportsLoading(true);
      api.getWorkingPapers().then(rows => {
        if (cancelled) return;
        const normalized = (rows || []).map(r => ({
          id: r.id,
          title: isRtl ? r.title_ar || r.title_en : r.title_en || r.title_ar,
          category: r.category || r.section || '',
          date: r.date || r.published_at || '',
          file: r.file_url || r.file || '',
        }));
        setReportsRows(normalized);
        setReportsLoading(false);
      }).catch(() => { if (!cancelled) setReportsLoading(false); });
    }

    return () => { cancelled = true; };
  }, [decodedId]);

  // Import functionality removed — user requested not to transfer data

  // 2. When page data arrives or locale changes — set content or trigger translation
  useEffect(() => {
    if (isReportsPage) {
      setDisplayTitle(isRtl ? 'التقارير' : 'Reports');
      setDisplayContent('');
      setTranslating(false);
      return;
    }
    if (!pageData) return;
    let cancelled = false;

    if (!isEn) {
      setDisplayTitle(pageData.title_ar || decodedId.replace(/-/g, ' '));
      setDisplayContent(pageData.content_ar || '');
      setTranslating(false);
      return;
    }

    const alreadyTranslated =
      pageData.content_en &&
      pageData.content_en.trim() &&
      pageData.content_en !== pageData.content_ar;

    if (alreadyTranslated) {
      setDisplayTitle(pageData.title_en || pageData.title_ar || '');
      setDisplayContent(pageData.content_en);
      setTranslating(false);
      return;
    }

    const cached = translationCache[pageData.id];
    if (cached) {
      setDisplayTitle(cached.title_en || pageData.title_ar || '');
      setDisplayContent(cached.content_en || pageData.content_ar || '');
      setTranslating(false);
      return;
    }

    setDisplayTitle(pageData.title_ar || decodedId.replace(/-/g, ' '));
    setDisplayContent(pageData.content_ar || '');
    setTranslating(true);

    translatePageOnDemand(pageData.id).then(result => {
      if (cancelled) return;
      setTranslating(false);
      if (result && result.content_en) {
        setDisplayTitle(result.title_en || pageData.title_ar || '');
        setDisplayContent(result.content_en);
      }
    });

    return () => { cancelled = true; };
  }, [pageData, isEn, decodedId]);

  // 3. Intercept link clicks in rendered HTML content
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';

      if (href.startsWith('/page/')) {
        e.preventDefault();
        navigate(href);
      } else {
        const localPath = upaUrlToLocal(href);
        if (localPath) {
          e.preventDefault();
          navigate(localPath);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [displayContent, navigate]);

  const hasSections = pageData?.sections && pageData.sections.length > 0;
  const hasHtmlContent = displayContent && displayContent.trim().length > 0;

  return (
    <div className="dynamic-page-wrapper" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <section className="dynamic-page-header">
        <div style={{ position: 'absolute', top: -80, right: isRtl ? -80 : 'auto', left: isRtl ? 'auto' : -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,168,232,0.12) 0%, transparent 70%)' }} />
        <Container className="position-relative text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Breadcrumbs */}
            <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaIcons.FaHome size={12} /> {isEn ? 'Home' : 'الرئيسية'}
              </Link>
              <span>/</span>
              <span style={{ color: 'white', fontWeight: 600 }}>{displayTitle || '...'}</span>
            </div>
            <h1 style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,4vw,2.4rem)', margin: 0 }}>
              {effectivePageTitle}
            </h1>
            {translating && (
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 14px', borderRadius: 99, fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7eb8ff', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                {isEn ? 'Translating…' : 'جار الترجمة…'}
              </div>
            )}
          </motion.div>
        </Container>
      </section>

      <Container style={{ paddingTop: 40 }}>
        {isReportsPage ? (
          reportsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" style={{ width: 40, height: 40 }} />
            </div>
          ) : (
            <Row className="justify-content-center">
              <Col lg={8} md={10}>
                <div className="rounded-4 p-4 p-md-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: '0 6px 30px rgba(3,37,76,0.06)' }}>
                  <h2 style={{ fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>{isRtl ? 'التقارير' : 'Reports'}</h2>
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 18 }}>{isRtl ? 'قائمة التقارير متاحة للعرض والتحميل' : 'List of reports available for viewing and download'}</p>
                  {/* import button removed as requested */}
                  <DataTable
                    data={reportsRows.slice((reportsPage - 1) * reportsLimit, reportsPage * reportsLimit)}
                    total={reportsRows.length}
                    page={reportsPage}
                    limit={reportsLimit}
                    loading={reportsLoading}
                    rtl={isRtl}
                    onPageChange={(p) => setReportsPage(p)}
                    onLimitChange={(l) => { setReportsLimit(l); setReportsPage(1); }}
                    columns={[
                      { key: 'title', label: isRtl ? 'عنوان التقرير' : 'Title' },
                      { key: 'category', label: isRtl ? 'الإقليم' : 'Category' },
                      { key: 'date', label: isRtl ? 'التاريخ' : 'Date' },
                      { key: 'file', label: isRtl ? 'ملف' : 'File', render: (val) => val ? (<a href={val} target="_blank" rel="noreferrer">{isRtl ? 'تحميل' : 'Download'}</a>) : (isRtl ? 'غير متوفر' : 'N/A') },
                    ]}
                    pageSize={reportsLimit}
                    emptyMessage={isRtl ? 'لا توجد تقارير' : 'No reports available'}
                  />
                </div>
              </Col>
            </Row>
          )
        ) : loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ width: 40, height: 40 }} />
          </div>
        ) : !pageData ? (
          <Row className="justify-content-center">
            <Col lg={7}>
              <div className="text-center p-5 rounded-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏗️</div>
                <h4 className="fw-bold" style={{ color: 'var(--primary)' }}>
                  {isEn ? 'Page Not Found' : 'الصفحة غير موجودة'}
                </h4>
                <p className="text-muted mb-4">{isEn ? 'This page does not exist or has not been created yet.' : 'هذه الصفحة غير موجودة أو لم يتم إنشاؤها بعد.'}</p>
                <Link to="/" className="btn btn-primary rounded-pill px-4">{isEn ? 'Home' : 'الرئيسية'}</Link>
              </div>
            </Col>
          </Row>
        ) : !hasSections && !hasHtmlContent ? (
          <Row className="justify-content-center">
            <Col lg={7}>
              <div className="text-center p-5 rounded-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏗️</div>
                <h4 className="fw-bold" style={{ color: 'var(--primary)' }}>
                  {isEn ? 'Page Under Preparation' : 'الصفحة قيد الإعداد'}
                </h4>
                <p className="text-muted mb-4">
                  {isEn
                    ? 'Content for this page is being prepared. Please check back later.'
                    : 'يتم حالياً إعداد محتوى هذه الصفحة. يمكنك الرجوع إليها لاحقاً.'}
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/" className="btn btn-primary rounded-pill px-4">{isEn ? 'Home' : 'الرئيسية'}</Link>
                  <Link to="/contact" className="btn btn-outline-primary rounded-pill px-4">{isEn ? 'Contact Us' : 'تواصل معنا'}</Link>
                </div>
              </div>
            </Col>
          </Row>
        ) : (
          <motion.div
            key={locale}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Dynamic Sections — rendered first if available */}
            {hasSections && (
                <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                  {pageData.sections.map((sec, idx) => renderSection(sec, idx))}
                </div>
              )}

              {/* If this is the reports page, render full-width DataTable and skip card-style content */}
              {isReportsPage && (
                <div className="my-5" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                  <Container fluid className="py-3">
                    <h2 className="mb-4" style={{ fontWeight: 800 }}>{isRtl ? 'التقارير' : 'Reports'}</h2>
                    <div style={{ background: 'transparent' }}>
                      {/* import button removed by user request */}
                      <DataTable
                        data={reportsRows.slice((reportsPage - 1) * reportsLimit, reportsPage * reportsLimit)}
                        total={reportsRows.length}
                        page={reportsPage}
                        limit={reportsLimit}
                        loading={reportsLoading}
                        rtl={isRtl}
                        onPageChange={(p) => setReportsPage(p)}
                        onLimitChange={(l) => { setReportsLimit(l); setReportsPage(1); }}
                        plain={true}
                        columns={[
                          { key: 'title', label: isRtl ? 'العنوان' : 'Title' },
                          { key: 'category', label: isRtl ? 'الفئة' : 'Category' },
                          { key: 'date', label: isRtl ? 'التاريخ' : 'Date' },
                          { key: 'file', label: isRtl ? 'ملف' : 'File', render: (val) => val ? (<a href={val} target="_blank" rel="noreferrer">{isRtl ? 'تحميل' : 'Download'}</a>) : (isRtl ? 'غير متوفر' : 'N/A') },
                        ]}
                        pageSize={reportsLimit}
                        emptyMessage={isRtl ? 'لا توجد تقارير' : 'No reports available'}
                      />
                    </div>
                  </Container>
                </div>
              )}

            {/* HTML Content — rendered below sections if present */}
            {hasHtmlContent && (
              <Row className="justify-content-center mt-4">
                <Col lg={10} xl={9}>
                  <div
                    className="rounded-4 p-4 p-md-5 wp-page-content"
                    style={{
                      background: 'var(--card-bg)',
                      boxShadow: '0 4px 24px rgba(0,48,135,0.07)',
                      color: 'var(--text)',
                      lineHeight: 1.9,
                      fontSize: '1.05rem',
                      direction: isEn ? 'ltr' : 'rtl',
                      textAlign: isEn ? 'left' : 'right',
                      transition: 'opacity 0.2s',
                      opacity: translating ? 0.6 : 1,
                    }}
                    ref={contentRef}
                    dangerouslySetInnerHTML={{ __html: displayContent }}
                  />
                </Col>
              </Row>
            )}
          </motion.div>
        )}
      </Container>
    </div>
  );
};

export default DynamicPage;
