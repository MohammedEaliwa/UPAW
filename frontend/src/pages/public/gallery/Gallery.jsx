import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaImages, FaTimes, FaChevronLeft, FaChevronRight,
  FaSpinner, FaExpand, FaSearch
} from 'react-icons/fa';
import { MdPhotoLibrary } from 'react-icons/md';
import { api } from '../../../services/api';
import './gallery.css';

const LIMIT = 10;

const GALLERY_CAT_EN = {
  'الكل': 'All',
  'عام': 'General',
  'طرابلس القديمة': 'Old Tripoli',
  'طرابلس 22': 'Tripoli 22',
  'ليبيا القديمة': 'Old Libya',
};

const Gallery = () => {
  const { isDarkMode } = useTheme();
  const { locale } = useLanguage();
  const isRtl = locale === 'ar';

  // All loaded images across all pages
  const [images, setImages]               = useState([]);
  // Categories (fetched separately)
  const [categories, setCategories]       = useState(['الكل']);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [search, setSearch]               = useState('');
  const [page, setPage]                   = useState(1);
  const [hasMore, setHasMore]             = useState(true);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [lightbox, setLightbox]           = useState({ open: false, index: 0 });
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const [brokenIds, setBrokenIds]         = useState(new Set());

  // Intersection observer ref for infinite scroll trigger
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const touchStart = useRef(0);

  // ── Fetch one page of images ─────────────────────────────────────────────
  const fetchPage = useCallback(async (pg, cat, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await api.getGallery(pg, LIMIT, cat);

      // Handle both old array format and new paginated object format
      let rows = [];
      let more = false;
      if (Array.isArray(data)) {
        // Old API format (array) - load all at once
        rows = data;
        more = false;
      } else if (data && Array.isArray(data.rows)) {
        // New paginated format
        rows = data.rows;
        more = data.hasMore ?? false;
      }

      if (reset) {
        setImages(rows);
        setBrokenIds(new Set());
        // Extract categories from first batch if categories endpoint fails
        if (rows.length > 0) {
          setCategories(prev => {
            const allCats = new Set(rows.map(r => r.category).filter(Boolean));
            const existing = new Set(prev.slice(1)); // skip 'الكل'
            allCats.forEach(c => existing.add(c));
            return ['الكل', ...existing];
          });
        }
      } else {
        setImages(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          return [...prev, ...rows.filter(r => !existingIds.has(r.id))];
        });
      }
      setHasMore(more);
    } catch (e) {
      console.error('Gallery fetch error:', e);
      if (reset) setImages([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);



  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    // Fetch categories
    const fetchCats = async () => {
      try {
        const cats = await api.getGalleryCategories?.();
        if (active && Array.isArray(cats)) {
          setCategories(['الكل', ...cats.filter(Boolean)]);
        }
      } catch {
        // not critical
      }
    };

    // Fetch first page of images immediately
    fetchPage(1, 'الكل', true);
    fetchCats();

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reset & reload when category changes ────────────────────────────────
  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat);
    setPage(1);
    setImages([]);
    setHasMore(true);
    fetchPage(1, cat, true);
  }, [fetchPage]);

  // ── Intersection Observer for infinite scroll ────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPage(nextPage, activeCategory, false);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, loading, page, activeCategory, fetchPage]);

  // ── Filtered by search (client-side) and broken images removed ──────────
  const markBroken = (id) => setBrokenIds(prev => new Set([...prev, id]));

  const filtered = (search.trim()
    ? images.filter(img =>
        (img.title_ar || '').includes(search) ||
        (img.title_en || '').toLowerCase().includes(search.toLowerCase())
      )
    : images
  ).filter(img => !brokenIds.has(img.id));

  // ── Lightbox controls ────────────────────────────────────────────────────
  const openLightbox  = (index) => {
    setLightbox({ open: true, index });
    setLightboxLoading(true);
  };
  const closeLightbox = useCallback(() => setLightbox({ open: false, index: 0 }), []);
  const prevImg = useCallback(() => {
    setLightbox(l => ({ ...l, index: (l.index - 1 + filtered.length) % filtered.length }));
    setLightboxLoading(true);
  }, [filtered.length]);
  const nextImg = useCallback(() => {
    setLightbox(l => ({ ...l, index: (l.index + 1) % filtered.length }));
    setLightboxLoading(true);
  }, [filtered.length]);

  useEffect(() => {
    if (!lightbox.open) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  isRtl ? nextImg() : prevImg();
      if (e.key === 'ArrowRight') isRtl ? prevImg() : nextImg();
      if (e.key === 'Escape')     closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox.open, isRtl, nextImg, prevImg, closeLightbox]);

  const bg = isDarkMode
    ? 'linear-gradient(135deg,#070d1f 0%,#0a1230 50%,#080f20 100%)'
    : 'linear-gradient(135deg,#001d5a 0%,#003087 50%,#0066cc 100%)';

  return (
    <div className="gallery-page" style={{ minHeight: '100vh', background: bg, paddingTop: 90, paddingBottom: 60, direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16,
            background: 'rgba(255,255,255,0.18)',
            padding: '8px 22px', borderRadius: 50,
            border: '1px solid rgba(255,255,255,0.35)',
          }}>
            <MdPhotoLibrary style={{ color: '#fff', fontSize: '1.1rem' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
              {isRtl ? 'الهيئة الوطنية للتخطيط العمراني' : 'National Authority for Urban Planning'}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
            {isRtl ? 'معرض الصور' : 'Photo Gallery'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
            {isRtl
              ? 'استعرض أحدث الصور والمشاريع والفعاليات الخاصة بالهيئة الوطنية للتخطيط العمراني'
              : 'Explore the latest photos, projects, and events of the National Authority for Urban Planning'}
          </p>
        </motion.div>

        {/* Search + Filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="gallery-search-wrap">
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
            background: isDarkMode ? 'rgba(25,35,65,0.85)' : 'rgba(255,255,255,0.95)',
            borderRadius: 14, border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,48,135,0.12)'}`,
            backdropFilter: 'blur(10px)', minWidth: 240,
            flexDirection: isRtl ? 'row-reverse' : 'row',
          }}>
            <FaSearch style={{ color: '#0066cc', fontSize: '0.85rem', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isRtl ? 'ابحث في المعرض...' : 'Search gallery...'}
              style={{ border: 'none', background: 'transparent', color: isDarkMode ? '#fff' : '#1a2850', outline: 'none', fontFamily: 'Cairo, sans-serif', fontSize: '0.88rem', flex: 1, textAlign: isRtl ? 'right' : 'left' }} />
          </div>
          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => handleCategoryChange(cat)} style={{
                padding: '9px 20px', borderRadius: 50, cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                transition: 'all 0.22s',
                background: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.15)',
                color: activeCategory === cat ? '#003087' : '#fff',
                border: `1px solid ${activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.25)'}`,
                boxShadow: activeCategory === cat ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
              }}>
                {isRtl ? cat : (cat === 'الكل' ? 'All' : (GALLERY_CAT_EN[cat] || cat))}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {images.length} {isRtl ? 'صورة محمّلة' : 'images loaded'}{hasMore ? (isRtl ? ' · اسحب للأسفل لتحميل المزيد' : ' · Scroll down to load more') : ''}
          </span>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <FaSpinner style={{ fontSize: '2.5rem', color: '#0066cc', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
            <FaImages style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', fontFamily: 'Cairo, sans-serif' }}>
              لا توجد صور في هذا التصنيف
            </p>
          </motion.div>
        ) : (
          <>
            <div className="gallery-grid">
              <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              `}</style>
              {filtered.map((img, i) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min((i % LIMIT) * 0.04, 0.4) }}
                    onClick={() => openLightbox(i)}
                    className="gallery-item"
                    style={{
                      breakInside: 'avoid', marginBottom: 16,
                      borderRadius: 16, overflow: 'hidden',
                      cursor: 'pointer', position: 'relative',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,48,135,0.08)'}`,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      transition: 'transform 0.25s, box-shadow 0.25s',
                      display: 'block',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,48,135,0.25)';
                      e.currentTarget.querySelector('.overlay').style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
                      e.currentTarget.querySelector('.overlay').style.opacity = '0';
                    }}
                  >
                    <img
                      src={img.image_url}
                      alt={img.title_ar || img.title_en || ''}
                      style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                      loading="lazy"
                      onError={() => markBroken(img.id)}
                    />
                    {/* Overlay — always visible on touch, hover on desktop */}
                    <div className="overlay" style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,10,40,0.85) 0%, rgba(0,10,40,0.2) 60%, transparent 100%)',
                      opacity: 0, transition: 'opacity 0.25s',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      padding: '16px 14px',
                    }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Cairo, sans-serif', marginBottom: 4 }}>
                      {img.title_ar || img.title_en || ''}
                    </div>
                    {img.category && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(0,102,204,0.8)', color: '#fff',
                        padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                        width: 'fit-content',
                      }}>
                        {img.category}
                      </span>
                    )}
                    <FaExpand style={{ position: 'absolute', top: 12, left: 12, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {/* Loading More Spinner */}
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <FaSpinner style={{ fontSize: '2rem', color: '#0066cc', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontFamily: 'Cairo, sans-serif', fontSize: '0.85rem' }}>
                  جاري تحميل المزيد...
                </p>
              </div>
            )}

            {/* End of gallery message */}
            {!hasMore && images.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '32px 0' }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.1)',
                  padding: '10px 24px', borderRadius: 50,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <FaImages style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Cairo, sans-serif', fontSize: '0.85rem' }}>
                    تم عرض جميع الصور ({images.length} صورة)
                  </span>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox.open && filtered[lightbox.index] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const touchEnd = e.changedTouches[0].clientX;
              const delta = touchStart.current - touchEnd;
              if (Math.abs(delta) > 50) {
                if (delta > 0) nextImg();
                else prevImg();
              }
            }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}
          >
            {/* Close button */}
            <button onClick={closeLightbox} style={{
              position: 'absolute', top: 20, right: 20,
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', transition: 'background 0.2s', zIndex: 10,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <FaTimes />
            </button>

            {/* Prev button */}
            <button onClick={e => { e.stopPropagation(); prevImg(); }} style={{
              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              width: 50, height: 50, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', transition: 'background 0.2s', zIndex: 10,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <FaChevronLeft />
            </button>

            {/* Image */}
            <motion.div
              key={lightbox.index}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.22 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}
            >
              {lightboxLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaSpinner style={{ fontSize: '2rem', color: '#fff', animation: 'spin 1s linear infinite' }} />
                </div>
              )}
              <img
                src={filtered[lightbox.index].image_url}
                alt={filtered[lightbox.index].title_ar || ''}
                onLoad={() => setLightboxLoading(false)}
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', display: lightboxLoading ? 'none' : 'block' }}
                onError={() => { setLightboxLoading(false); markBroken(filtered[lightbox.index]?.id); if (filtered.length > 1) nextImg(); else closeLightbox(); }}
              />
              {/* Caption */}
              {!lightboxLoading && (filtered[lightbox.index].title_ar || filtered[lightbox.index].category) && (
                <div style={{
                  position: 'absolute', bottom: -44, left: 0, right: 0, textAlign: 'center',
                  color: 'rgba(255,255,255,0.8)', fontFamily: 'Cairo, sans-serif',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{filtered[lightbox.index].title_ar}</span>
                  {filtered[lightbox.index].category && (
                    <span style={{ marginRight: 8, fontSize: '0.8rem', color: '#0099ff' }}>— {filtered[lightbox.index].category}</span>
                  )}
                </div>
              )}
            </motion.div>

            {/* Next button */}
            <button onClick={e => { e.stopPropagation(); nextImg(); }} style={{
              position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
              width: 50, height: 50, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', transition: 'background 0.2s', zIndex: 10,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <FaChevronRight />
            </button>

            {/* Counter */}
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              padding: '6px 16px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
              fontFamily: 'Cairo, sans-serif',
            }}>
              {lightbox.index + 1} / {filtered.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
