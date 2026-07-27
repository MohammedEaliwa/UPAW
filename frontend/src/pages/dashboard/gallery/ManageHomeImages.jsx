import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUpload, FaTrash, FaImage, FaSpinner,
  FaHome, FaCheckCircle, FaExclamationTriangle,
} from 'react-icons/fa';
import { api } from '../../../services/api';

const ManageHomeImages = () => {
  const { isDarkMode } = useTheme();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await api.getHomeImages();
      setImages(Array.isArray(data) ? data : []);
    } catch { showToast('خطأ في جلب الصور', 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('display_order', images.length);
        await api.createHomeImage(fd);
        successCount++;
      } catch { showToast('فشل رفع ' + file.name, 'error'); }
    }
    if (successCount > 0) showToast('تم رفع ' + successCount + ' صورة بنجاح');
    setUploading(false);
    fetchImages();
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteHomeImage(id);
      showToast('تم حذف الصورة بنجاح');
      fetchImages();
    } catch { showToast('فشل حذف الصورة', 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(Array.from(e.dataTransfer.files));
  };

  const bg = isDarkMode ? 'linear-gradient(135deg,#070d1f 0%,#0a1230 100%)' : '#f0f4ff';
  const card = isDarkMode ? 'rgba(15,25,55,0.85)' : '#fff';
  const border = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,48,135,0.1)';
  const text = isDarkMode ? '#fff' : '#1a2850';
  const muted = isDarkMode ? 'rgba(255,255,255,0.5)' : '#6b7280';

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '24px', direction: 'rtl', fontFamily: 'Cairo, Tajawal, sans-serif' }}>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id}
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              style={{ padding: '12px 20px', borderRadius: 10, color: '#fff', background: toast.type === 'error' ? '#ef4444' : '#10b981', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
              {toast.type === 'error' ? <FaExclamationTriangle /> : <FaCheckCircle />}
              {toast.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8888, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ background: card, borderRadius: 16, padding: '32px', maxWidth: 380, width: '90%', textAlign: 'center', border: `1px solid ${border}` }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🗑️</div>
              <h3 style={{ color: text, fontWeight: 800, marginBottom: 8 }}>تأكيد الحذف</h3>
              <p style={{ color: muted, marginBottom: 24, fontSize: '0.95rem' }}>هل أنت متأكد من حذف هذه الصورة؟</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: text, cursor: 'pointer', fontWeight: 600, fontFamily: 'Cairo' }}>
                  إلغاء
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'Cairo' }}>
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#003087,#0066cc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaHome style={{ color: '#fff', fontSize: '1.1rem' }} />
          </div>
          <div>
            <h1 style={{ color: text, fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>صور الصفحة الرئيسية</h1>
            <p style={{ color: muted, margin: 0, fontSize: '0.85rem' }}>إدارة صور العرض الديناميكي في الواجهة الرئيسية للموقع</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,102,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaImage style={{ color: '#0066cc' }} />
          </div>
          <div>
            <div style={{ color: text, fontWeight: 800, fontSize: '1.2rem' }}>{images.length}</div>
            <div style={{ color: muted, fontSize: '0.78rem' }}>إجمالي الصور</div>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{ background: dragOver ? 'rgba(0,102,204,0.08)' : card, border: `2px dashed ${dragOver ? '#0066cc' : border}`, borderRadius: 16, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 28, transition: 'all 0.25s' }}>
        <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUpload(Array.from(e.target.files))} />
        {uploading ? (
          <div style={{ color: '#0066cc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <FaSpinner style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 700 }}>جارٍ رفع الصور...</span>
          </div>
        ) : (
          <>
            <FaUpload style={{ fontSize: '2.5rem', color: dragOver ? '#0066cc' : muted, marginBottom: 12 }} />
            <p style={{ color: text, fontWeight: 700, fontSize: '1rem', margin: '0 0 4px' }}>اسحب وأفلت الصور هنا أو اضغط للاختيار</p>
            <p style={{ color: muted, fontSize: '0.82rem', margin: 0 }}>يمكنك رفع عدة صور في آنٍ واحد • JPG, PNG, WEBP</p>
          </>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: muted }}>
          <FaSpinner style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p style={{ margin: 0 }}>جارٍ تحميل الصور...</p>
        </div>
      ) : images.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: muted }}>
          <FaImage style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>لا توجد صور. ارفع الصور من المربع أعلاه.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {images.map((img, idx) => (
            <motion.div key={img.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${border}`, background: card, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <img src={img.image_url} alt={`slide-${idx}`} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: muted, fontSize: '0.8rem' }}>صورة {idx + 1}</span>
                <button onClick={() => setDeleteConfirm(img.id)}
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Cairo', transition: 'all 0.2s' }}>
                  <FaTrash size={11} /> حذف
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ManageHomeImages;
