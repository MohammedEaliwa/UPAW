import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Badge, Form } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaFilter, FaCalendarAlt, FaNewspaper,
  FaChevronLeft, FaChevronRight, FaImages, FaMapMarkedAlt,
} from 'react-icons/fa';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useLanguage } from '../../../context/LanguageContext';
import { api } from '../../../services/api';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ModernModal from '../../../components/ModernModal';
import './news.css';

// KML to GeoJSON parser helper
const parseKmlToGeoJson = (kmlString) => {
  try {
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlString, 'text/xml');
    const geojson = { type: 'FeatureCollection', features: [] };
    
    // Parse Placemarks
    const placemarks = kml.getElementsByTagName('Placemark');
    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const feature = { type: 'Feature', properties: {}, geometry: null };
      
      // Get properties
      const name = pm.getElementsByTagName('name')[0]?.textContent;
      if (name) feature.properties.name = name;
      
      // Try Polygon
      const polygon = pm.getElementsByTagName('Polygon')[0];
      if (polygon) {
        const coordStr = polygon.getElementsByTagName('coordinates')[0]?.textContent || '';
        const coords = coordStr.trim().split(/\s+/).map(line => {
          const [lng, lat] = line.split(',').map(Number);
          return [lng, lat];
        }).filter(c => !isNaN(c[0]) && !isNaN(c[1]));
        
        feature.geometry = { type: 'Polygon', coordinates: [coords] };
      }
      
      // Try Point
      const point = pm.getElementsByTagName('Point')[0];
      if (point) {
        const coordStr = point.getElementsByTagName('coordinates')[0]?.textContent || '';
        const [lng, lat] = coordStr.trim().split(',').map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          feature.geometry = { type: 'Point', coordinates: [lng, lat] };
        }
      }

      if (feature.geometry) {
        geojson.features.push(feature);
      }
    }
    return geojson;
  } catch (err) {
    console.error('KML Parsing error:', err);
    return { type: 'FeatureCollection', features: [] };
  }
};

const News = () => {
  const { locale, t } = useLanguage();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('الكل');

  // Modals
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [activeGalleryNews, setActiveGalleryNews] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showMapModal, setShowMapModal] = useState(false);
  const [activeMapNews, setActiveMapNews] = useState(null);
  const [isMapBlurred, setIsMapBlurred] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    // Prevent print screen key
    const preventPrntScr = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        alert(locale === 'ar' ? 'تصوير الشاشة محظور لحماية الملكية.' : 'Screenshots are disabled.');
      }
    };
    window.addEventListener('keyup', preventPrntScr);
    
    // Blur when focus is lost
    const handleBlur = () => {
      if (showMapModal) setIsMapBlurred(true);
    };
    const handleFocus = () => {
      setIsMapBlurred(false);
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    api.getNews()
      .then(data => {
        setNewsList(Array.isArray(data) ? data : []);
      })
      .catch(() => setNewsList([]))
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener('keyup', preventPrntScr);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [showMapModal, locale]);

  const isRtl = locale === 'ar';
  const ChevronIcon = isRtl ? FaChevronLeft : FaChevronRight;

  const categories = [
    { value: 'الكل', label: isRtl ? 'الكل' : 'All' },
    { value: 'إداري', label: isRtl ? 'أخبار الإدارة' : 'Administration' },
    { value: 'فني', label: isRtl ? 'أخبار فنية' : 'Technical' },
    { value: 'أخبار الهيئة', label: isRtl ? 'أخبار الهيئة' : 'Authority News' },
    { value: 'إعلانات', label: isRtl ? 'إعلانات' : 'Announcements' },
  ];

  const categoryMap = {
    'إداري': isRtl ? 'أخبار الإدارة' : 'Administration',
    'فني': isRtl ? 'أخبار فنية' : 'Technical',
    'أخبار الهيئة': isRtl ? 'أخبار الهيئة' : 'Authority News',
    'إعلانات': isRtl ? 'إعلانات' : 'Announcements',
  };

  const catColors = {
    'إداري': '#003087',
    'فني': '#0066cc',
    'أخبار الهيئة': '#00a8e8',
    'إعلانات': '#c9a227',
  };

  const filtered = newsList.filter((news) => {
    if (!news.is_visible) return false;
    if (news.target_audience !== 'العامة') return false;
    
    const title = (isRtl ? (news.title_ar || news.title) : (news.title_en || news.title)) || '';
    const content = (isRtl ? (news.content_ar || news.content) : (news.content_en || news.content)) || '';
    
    const matchCat = selectedCat === 'الكل' || news.category === selectedCat;
    const matchSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5 } }),
  };

  const handleOpenGallery = (news, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveGalleryNews(news);
    setCurrentImageIndex(0);
    setShowGalleryModal(true);
  };

  const handleOpenMap = (news, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMapNews(news);
    setShowMapModal(true);
  };

  const handleOpenReport = (news, e) => {
    e.preventDefault();
    setActiveReport(news);
    setShowReportModal(true);
  };

  return (
    <div className="news-page" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="news-header">
        <div style={{ position: 'absolute', bottom: -50, right: -50, width: 250, height: 250, background: 'radial-gradient(circle, rgba(0,168,232,0.1) 0%, transparent 70%)' }} />
        <Container className="position-relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 16px', borderRadius: 99, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
              <FaNewspaper size={12} />
              {t('news.tag')}
            </div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {t('news.title')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', margin: 0 }}>
              {t('news.subtitle')}
            </p>
          </motion.div>
        </Container>
      </div>

      <Container style={{ marginTop: '50px' }}>
        {/* Search and Filter */}
        <div className="news-filter-card">
          <Row className="g-3 align-items-center">
            <Col md={5}>
              <div style={{ position: 'relative' }}>
                <Form.Control
                  placeholder={t('news.searchPlaceholder')}
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
              <div className="news-filter-buttons">
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

        {/* Content list */}
        {loading ? (
          <div className="text-center py-5">
            <div style={{ width: 44, height: 44, border: '3px solid rgba(0,48,135,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">{isRtl ? 'لا توجد نتائج تطابق بحثك.' : 'No results matching your search.'}</div>
        ) : (
          <Row className="g-4">
            {filtered.map((news, idx) => {
              const title = isRtl ? (news.title_ar || news.title) : (news.title_en || news.title);
              const excerpt = isRtl ? news.excerpt_ar : news.excerpt_en;
              const isFeatured = news.is_featured;

              return (
                <Col xs={12} lg={isFeatured ? 12 : 6} key={news.id}>
                  <motion.div
                    custom={idx}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={cardVariants}
                    className="h-100"
                  >
                    <div
                      className="news-card card border-0"
                      style={{
                        display: 'flex',
                        flexDirection: isFeatured ? 'row' : 'column',
                        background: 'var(--card-bg)',
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: '0 8px 30px rgba(0,48,135,0.06)',
                        border: '1px solid var(--border)',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onClick={() => handleOpenReport(news, { preventDefault: () => {} })}
                    >
                      <div style={{
                        overflow: 'hidden',
                        width: isFeatured ? '45%' : '100%',
                        height: isFeatured ? 'auto' : '220px',
                        minHeight: isFeatured ? 300 : 220,
                        flexShrink: 0,
                      }}>
                        <img src={news.image} alt={title} className="news-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div className="p-4 d-flex flex-column justify-content-between" style={{ flex: 1 }}>
                        <div>
                          {isFeatured && (
                            <Badge style={{ background: '#c9a227', alignSelf: 'flex-start', marginBottom: 12, fontSize: '0.75rem' }}>
                              {isRtl ? 'خبر مميز' : 'Featured News'}
                            </Badge>
                          )}
                          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                            <span
                              className="news-cat"
                              style={{ background: catColors[news.category] || 'var(--primary)', color: 'white' }}
                            >
                              {categoryMap[news.category] || news.category}
                            </span>
                            <div className="d-flex align-items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              <FaCalendarAlt size={12} />
                              {news.date}
                            </div>
                          </div>
                          <h5 style={{ fontWeight: 800, lineHeight: 1.55, color: 'var(--text)', fontSize: isFeatured ? '1.4rem' : '1.05rem', marginBottom: '0.75rem' }}>
                            {title}
                          </h5>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                            {excerpt}
                          </p>
                        </div>
                        <div className="d-flex align-items-center flex-wrap gap-3 mt-3 pt-3 border-top" style={{ borderColor: 'var(--border)' }}>
                          <a href="#" onClick={(e) => handleOpenReport(news, e)} style={{
                            color: 'var(--primary)', fontWeight: 700, textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: '0.9rem'
                          }}>
                            {locale === 'ar' ? 'اقرأ التقرير كاملاً' : 'Read Full Report'} <ChevronIcon size={12} />
                          </a>
                          
                          {news.images && news.images.length > 1 && (
                            <PrimaryButton 
                              variant="outline-primary" 
                              onClick={(e) => handleOpenGallery(news, e)}
                              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                              <FaImages /> {isRtl ? `معرض الصور (${news.images.length})` : `Gallery (${news.images.length})`}
                            </PrimaryButton>
                          )}

                          {news.kml_data && (
                            <PrimaryButton 
                              variant="outline-primary" 
                              onClick={(e) => handleOpenMap(news, e)}
                              style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: '#10b981', color: '#10b981' }}
                            >
                              <FaMapMarkedAlt /> {isRtl ? 'استعراض الخريطة التفاعلية' : 'View Interactive Map'}
                            </PrimaryButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>

      {/* Gallery Modal */}
      <ModernModal 
        show={showGalleryModal} 
        onClose={() => setShowGalleryModal(false)}
        title={activeGalleryNews ? (isRtl ? (activeGalleryNews.title_ar || activeGalleryNews.title) : (activeGalleryNews.title_en || activeGalleryNews.title)) : 'Gallery'}
        type="primary"
        size="lg"
      >
        {activeGalleryNews && activeGalleryNews.images && (
          <div>
            <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden' }}>
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentImageIndex}
                  src={activeGalleryNews.images[currentImageIndex]} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </AnimatePresence>
              
              {activeGalleryNews.images.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? activeGalleryNews.images.length - 1 : prev - 1)}
                    style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
                  >
                    <FaChevronLeft />
                  </button>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => prev === activeGalleryNews.images.length - 1 ? 0 : prev + 1)}
                    style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
            </div>
            <div className="d-flex gap-2 mt-3 overflow-auto pb-2">
              {activeGalleryNews.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  style={{ width: 80, height: 60, flexShrink: 0, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: currentImageIndex === idx ? '2px solid var(--primary)' : '2px solid transparent', opacity: currentImageIndex === idx ? 1 : 0.6 }}
                >
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </ModernModal>

      {/* Map Protection KML Modal */}
      <ModernModal 
        show={showMapModal} 
        onClose={() => setShowMapModal(false)}
        title={activeMapNews ? (isRtl ? (activeMapNews.title_ar || activeMapNews.title) : (activeMapNews.title_en || activeMapNews.title)) : 'Map'}
        type="primary"
        size="lg"
      >
        {activeMapNews && activeMapNews.kml_data && (
          <div 
            className="kml-map-container"
            onContextMenu={(e) => { e.preventDefault(); alert(isRtl ? 'عذراً، هذا المخطط محمي ولا يمكن حفظه.' : 'Map is protected against saving.'); }}
            style={{ 
              position: 'relative', height: '450px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)',
              filter: isMapBlurred ? 'blur(15px)' : 'blur(0px)',
              transition: 'filter 0.2s ease-in-out'
            }}
          >
            <MapContainer center={[32.8872, 13.1932]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <GeoJSON data={parseKmlToGeoJson(activeMapNews.kml_data)} style={() => ({ color: 'red', weight: 4, opacity: 0.8 })} />
            </MapContainer>
            
            {/* Watermark overlay */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', zIndex: 10,
              background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 10px)',
            }}>
              <div style={{
                transform: 'rotate(-30deg)',
                color: 'rgba(0,0,0,0.1)',
                fontSize: '4rem',
                fontWeight: 900,
                userSelect: 'none',
                fontFamily: 'Cairo, sans-serif'
              }}>
                سري للغاية - للعرض فقط
              </div>
            </div>
          </div>
        )}
        <div className="text-muted text-center mt-3 small" style={{ direction: 'rtl' }}>
          💡 <span className="text-danger fw-bold">تنويه أمني:</span> هذه البيانات محمية ولا يسمح بتحميل ملف المخطط KML أو مشاركته. تم تطبيق تقنيات لمنع النسخ أو التقاط الشاشة للحفاظ على سرية المشاريع والمخططات.
        </div>
      </ModernModal>

      {/* Full Report Modal */}
      <ModernModal
        show={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setActiveReport(null);
        }}
        title={activeReport ? (isRtl ? (activeReport.title_ar || activeReport.title) : (activeReport.title_en || activeReport.title)) : ''}
        size="lg"
      >
        {activeReport && (
          <div>
            {activeReport.image && (
              <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={activeReport.image} alt="Report" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
              </div>
            )}
            <div className="d-flex align-items-center gap-2 mb-4 text-muted" style={{ fontSize: '0.9rem' }}>
              <FaCalendarAlt />
              {activeReport.date}
            </div>
            <div 
              className="rich-text-content" 
              style={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text)' }}
              dangerouslySetInnerHTML={{ __html: isRtl ? (activeReport.content_ar || activeReport.content) : (activeReport.content_en || activeReport.content) }} 
            />
          </div>
        )}
      </ModernModal>

      {/* Security CSS */}
      <style>{`
        /* Blur map when page loses focus to deter screenshotting tools */
        .kml-map-container {
          filter: blur(0px);
          transition: filter 0.2s;
        }
        @media print {
          .kml-map-container {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default News;
