import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaUpload, FaTimes, FaImage, FaSpinner, FaCheckCircle,
  FaImages, FaFilter, FaTimesCircle,
} from 'react-icons/fa';
import { api } from '../../../services/api';

const ManageGallery = () => {
  const { isDarkMode } = useTheme();

  const [images, setImages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState(['الكل']);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, visible: 0, hidden: 0 });
  const [modal, setModal] = useState(null); // null | 'add' | { type: 'edit', data: {...} }
  const [toasts, setToasts] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  const [form, setForm] = useState({ title_ar: '', title_en: '', category: 'عام', display_order: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await api.getGalleryAll();
      const data = Array.isArray(res) ? res : (res.data || []);
      setImages(data);
      setFiltered(data);
      const cats = ['الكل', ...new Set(data.map(img => img.category).filter(Boolean))];
      setCategories(cats);
      setStats({ total: data.length, visible: data.filter(i => i.is_visible).length, hidden: data.filter(i => !i.is_visible).length });
    } catch (e) { showToast('خطأ في جلب البيانات', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeCategory === 'الكل') setFiltered(images);
    else setFiltered(images.filter(img => img.category === activeCategory));
  }, [activeCategory, images]);

  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const openAdd = () => {
    setForm({ title_ar: '', title_en: '', category: 'عام', display_order: 0 });
    setImageFile(null);
    setImagePreview('');
    setModal('add');
  };

  const openEdit = (img) => {
    setForm({ title_ar: img.title_ar || '', title_en: img.title_en || '', category: img.category || 'عام', display_order: img.display_order || 0 });
    setImageFile(null);
    setImagePreview(img.image_url || '');
    setModal({ type: 'edit', data: img });
  };

  const closeModal = () => { setModal(null); setImageFile(null); setImagePreview(''); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const fd = new FormData();
      fd.append('title_ar', form.title_ar);
      fd.append('title_en', form.title_en);
      fd.append('category', form.category || 'عام');
      fd.append('display_order', form.display_order);
      if (imageFile) fd.append('image', imageFile);

      if (modal === 'add') {
        if (!imageFile) { showToast('يرجى اختيار صورة', 'error'); setFormLoading(false); return; }
        await api.createGallery(fd);
        showToast('تم إضافة الصورة بنجاح');
      } else {
        await api.updateGallery(modal.data.id, fd);
        showToast('تم تحديث الصورة بنجاح');
      }
      closeModal();
      fetchImages();
    } catch (err) {
      showToast(err.response?.data?.error || 'حدث خطأ', 'error');
    } finally { setFormLoading(false); }
  };

  const handleToggle = async (id) => {
    setActionLoading(a => ({ ...a, [id]: 'toggle' }));
    try {
      const res = await api.toggleGallery(id);
      const isVisible = res?.is_visible ?? (res?.data?.is_visible);
      setImages(imgs => imgs.map(img => img.id === id ? { ...img, is_visible: isVisible } : img));
      showToast(isVisible ? 'تم إظهار الصورة' : 'تم إخفاء الصورة');
    } catch { showToast('حدث خطأ', 'error'); }
    finally { setActionLoading(a => ({ ...a, [id]: null })); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    setActionLoading(a => ({ ...a, [id]: 'delete' }));
    try {
      await api.deleteGallery(id);
      setImages(imgs => imgs.filter(img => img.id !== id));
      showToast('تم حذف الصورة بنجاح');
    } catch { showToast('حدث خطأ في الحذف', 'error'); }
    finally { setActionLoading(a => ({ ...a, [id]: null })); }
  };

  const card = {
    background: isDarkMode ? 'rgba(25,35,65,0.8)' : 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,48,135,0.1)'}`,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  };

  const btnStyle = (color = '#003087') => ({
    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: `linear-gradient(135deg,${color},${color}cc)`,
    color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.82rem',
    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
  });

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Cairo, Tajawal, sans-serif', minHeight: '100vh' }}>

      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              style={{
                padding: '12px 18px', borderRadius: 12, color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.88rem',
                background: toast.type === 'error' ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#059669,#10b981)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              {toast.type === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
              {toast.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: isDarkMode ? '#fff' : '#003087', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaImages style={{ color: '#0066cc' }} /> إدارة معرض الصور
            </h1>
            <p style={{ margin: '4px 0 0', color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,48,135,0.5)', fontSize: '0.88rem' }}>
              إضافة وتعديل وإدارة صور معرض الهيئة الوطنية
            </p>
          </div>
          <button onClick={openAdd} style={{ ...btnStyle('#003087'), padding: '11px 22px', fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(0,48,135,0.3)' }}>
            <FaPlus /> إضافة صورة جديدة
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'إجمالي الصور', value: stats.total, color: '#003087' },
          { label: 'مرئية', value: stats.visible, color: '#059669' },
          { label: 'مخفية', value: stats.hidden, color: '#d97706' },
        ].map((s, i) => (
          <div key={i} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.value}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,48,135,0.5)', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '7px 18px', borderRadius: 50, border: 'none', cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.82rem',
            background: activeCategory === cat ? 'linear-gradient(135deg,#003087,#0066cc)' : (isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,48,135,0.07)'),
            color: activeCategory === cat ? '#fff' : (isDarkMode ? 'rgba(255,255,255,0.7)' : '#003087'),
            boxShadow: activeCategory === cat ? '0 3px 12px rgba(0,48,135,0.3)' : 'none',
            transition: 'all 0.2s',
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Images Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <FaSpinner style={{ fontSize: '2.5rem', color: '#0066cc', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center' }}>
          <FaImages style={{ fontSize: '3rem', color: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,48,135,0.2)', marginBottom: 12 }} />
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,48,135,0.4)', fontFamily: 'Cairo, sans-serif' }}>لا توجد صور</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map((img, i) => (
            <motion.div key={img.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{
                ...card, overflow: 'hidden',
                opacity: img.is_visible ? 1 : 0.6,
                transition: 'opacity 0.3s, transform 0.2s',
              }}>
              {/* Thumbnail */}
              <div style={{ position: 'relative', paddingTop: '65%', background: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,48,135,0.05)' }}>
                <img src={img.image_url} alt={img.title_ar || ''} style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                }} loading="lazy" onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23eee"/></svg>'; }} />
                {/* Visibility overlay */}
                {!img.is_visible && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaEyeSlash style={{ color: '#fff', fontSize: '1.5rem' }} />
                  </div>
                )}
                {/* Category badge */}
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,48,135,0.85)', color: '#fff',
                  padding: '3px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {img.category || 'عام'}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isDarkMode ? '#fff' : '#1a2850', marginBottom: 4, fontFamily: 'Cairo, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {img.title_ar || img.title_en || 'بدون عنوان'}
                </div>
                <div style={{ fontSize: '0.73rem', color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,48,135,0.5)', marginBottom: 12 }}>
                  الترتيب: {img.display_order ?? 0}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => openEdit(img)} style={{ ...btnStyle('#0066cc'), padding: '6px 12px', flex: 1 }}>
                    <FaEdit style={{ fontSize: '0.75rem' }} /> تعديل
                  </button>
                  <button onClick={() => handleToggle(img.id)} disabled={actionLoading[img.id] === 'toggle'}
                    style={{ ...btnStyle(img.is_visible ? '#d97706' : '#059669'), padding: '6px 12px', flex: 1 }}>
                    {actionLoading[img.id] === 'toggle' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : (img.is_visible ? <FaEyeSlash style={{ fontSize: '0.75rem' }} /> : <FaEye style={{ fontSize: '0.75rem' }} />)}
                    {img.is_visible ? 'إخفاء' : 'إظهار'}
                  </button>
                  <button onClick={() => handleDelete(img.id)} disabled={actionLoading[img.id] === 'delete'}
                    style={{ ...btnStyle('#dc2626'), padding: '6px 10px' }}>
                    {actionLoading[img.id] === 'delete' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaTrash style={{ fontSize: '0.75rem' }} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeModal}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
              onClick={e => e.stopPropagation()}
              style={{
                ...card, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
                padding: 28,
              }}>
              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: isDarkMode ? '#fff' : '#003087', fontFamily: 'Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {modal === 'add' ? <><FaPlus style={{ color: '#0066cc' }} /> إضافة صورة جديدة</> : <><FaEdit style={{ color: '#0066cc' }} /> تعديل الصورة</>}
                </h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#888', fontSize: '1.1rem' }}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Image upload */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#003087', display: 'block', marginBottom: 8, fontFamily: 'Cairo, sans-serif' }}>
                    {modal === 'add' ? 'الصورة *' : 'الصورة (اتركها فارغة للإبقاء على الحالية)'}
                  </label>
                  {/* Preview */}
                  {imagePreview && (
                    <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', height: 160, background: '#000' }}>
                      <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <label htmlFor="gallery-file-upload" style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderRadius: 10, border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,48,135,0.2)'}`,
                    cursor: 'pointer', color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#0066cc',
                    fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0066cc'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,48,135,0.2)'}>
                    <FaUpload />
                    {imageFile ? imageFile.name : 'اختر صورة أو اسحب وأفلت'}
                  </label>
                  <input id="gallery-file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                {/* Fields */}
                {[
                  { label: 'العنوان بالعربية', key: 'title_ar', placeholder: 'عنوان الصورة بالعربية' },
                  { label: 'العنوان بالإنجليزية', key: 'title_en', placeholder: 'Image title in English' },
                  { label: 'التصنيف', key: 'category', placeholder: 'مثال: مشاريع، فعاليات، عام' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#003087', display: 'block', marginBottom: 6, fontFamily: 'Cairo, sans-serif' }}>{field.label}</label>
                    <input
                      type="text" value={form[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '10px 14px', borderRadius: 10,
                        border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,48,135,0.2)'}`,
                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                        color: isDarkMode ? '#fff' : '#1a2850',
                        fontFamily: 'Cairo, sans-serif', fontSize: '0.88rem', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = '#0066cc'}
                      onBlur={e => e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,48,135,0.2)'}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#003087', display: 'block', marginBottom: 6, fontFamily: 'Cairo, sans-serif' }}>الترتيب</label>
                  <input type="number" value={form.display_order}
                    onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10,
                      border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,48,135,0.2)'}`,
                      background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                      color: isDarkMode ? '#fff' : '#1a2850', fontFamily: 'Cairo, sans-serif', fontSize: '0.88rem', outline: 'none',
                    }} />
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" onClick={closeModal} style={{
                    padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,48,135,0.08)',
                    color: isDarkMode ? '#fff' : '#003087', fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                  }}>إلغاء</button>
                  <button type="submit" disabled={formLoading} style={{
                    padding: '11px 24px', borderRadius: 10, border: 'none', cursor: formLoading ? 'not-allowed' : 'pointer',
                    background: formLoading ? 'rgba(0,48,135,0.4)' : 'linear-gradient(135deg,#003087,#0066cc)',
                    color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: formLoading ? 'none' : '0 4px 14px rgba(0,48,135,0.3)',
                  }}>
                    {formLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : (modal === 'add' ? <FaPlus /> : <FaEdit />)}
                    {formLoading ? 'جارٍ الحفظ...' : (modal === 'add' ? 'إضافة الصورة' : 'حفظ التعديلات')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ManageGallery;
