import React, { useState, useEffect } from 'react';
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

const Gallery = () => {
  const { isDarkMode } = useTheme();

  const [images, setImages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState(['الكل']);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await api.getGallery();
      const images = Array.isArray(data) ? data : [];
      setImages(images);
      setFiltered(images);
      const cats = ['الكل', ...new Set(images.map(img => img.category).filter(Boolean))];
      setCategories(cats);
    } catch (e) { console.error(e); setImages([]); setFiltered([]); setCategories(['الكل']); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let data = images;
    if (activeCategory !== 'الكل') data = data.filter(img => img.category === activeCategory);
    if (search.trim()) data = data.filter(img => (img.title_ar || '').includes(search) || (img.title_en || '').toLowerCase().includes(search.toLowerCase()));
    setFiltered(data);
  }, [activeCategory, search, images]);

  const openLightbox = (index) => setLightbox({ open: true, index });
  const closeLightbox = () => setLightbox({ open: false, index: 0 });
  const prevImg = () => setLightbox(l => ({ ...l, index: (l.index - 1 + filtered.length) % filtered.length }));
  const nextImg = () => setLightbox(l => ({ ...l, index: (l.index + 1) % filtered.length }));

  useEffect(() => {
    if (!lightbox.open) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prevImg();
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox.open, filtered]);

  const bg = isDarkMode
    ? 'linear-gradient(135deg,#070d1f 0%,#0a1230 50%,#080f20 100%)'
    : 'linear-gradient(135deg,#001d5a 0%,#003087 50%,#0066cc 100%)';

  return (
    <div className="gallery-page" style={{ minHeight: '100vh', background: bg, paddingTop: 90, paddingBottom: 60, direction: 'rtl', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
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
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>الهيئة الوطنية للتخطيط العمراني</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
            معرض الصور
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
            استعرض أحدث الصور والمشاريع والفعاليات الخاصة بالهيئة الوطنية للتخطيط العمراني
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
            flexDirection: 'row-reverse',
          }}>
            <FaSearch style={{ color: '#0066cc', fontSize: '0.85rem', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في المعرض..."
              style={{ border: 'none', background: 'transparent', color: isDarkMode ? '#fff' : '#1a2850', outline: 'none', fontFamily: 'Cairo, sans-serif', fontSize: '0.88rem', flex: 1, textAlign: 'right' }} />
          </div>
          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '9px 20px', borderRadius: 50, border: 'none', cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                transition: 'all 0.22s',
                background: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.15)',
                color: activeCategory === cat ? '#003087' : '#fff',
                border: `1px solid ${activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.25)'}`,
                boxShadow: activeCategory === cat ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
              }}>
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {filtered.length} صورة{activeCategory !== 'الكل' ? ` في تصنيف "${activeCategory}"` : ''}
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
          <div className="gallery-grid">
            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
            {filtered.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                onClick={() => openLightbox(i)}
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
                />
                {/* Overlay */}
                <div className="overlay" style={{
                  position: 'absolute', inset: 0,
                  background: 'gradient(to top, rgba(0,10,40,0.85) 0%, rgba(0,10,40,0.2) 60%, transparent 100%)',
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
              <img
                src={filtered[lightbox.index].image_url}
                alt={filtered[lightbox.index].title_ar || ''}
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', display: 'block' }}
              />
              {/* Caption */}
              {(filtered[lightbox.index].title_ar || filtered[lightbox.index].category) && (
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
