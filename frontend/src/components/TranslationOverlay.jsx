import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaTimes, FaLanguage, FaCheckCircle, FaSpinner, FaRobot, FaGlobe } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const TranslationOverlay = ({ visible, onDone, onCancel }) => {
  const [status, setStatus] = useState('idle'); // idle | translating | done | error
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [dots, setDots] = useState('');

  // Animate dots
  useEffect(() => {
    if (status !== 'translating') return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  const startTranslation = useCallback(async () => {
    setStatus('translating');
    setProgress(0);
    setTotal(0);
    setCurrentItem('');

    try {
      const eventSource = new EventSource(API_ENDPOINTS.translateAll);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'start') {
            setTotal(data.total);
          } else if (data.type === 'progress') {
            setProgress(data.completed);
            setTotal(data.total);
            // Show a user-friendly current item
            let display = data.item || '';
            try { display = decodeURIComponent(display).replace(/-/g, ' '); } catch {}
            setCurrentItem(display.substring(0, 40));
          } else if (data.type === 'done') {
            setStatus('done');
            eventSource.close();
            setTimeout(() => onDone(), 2000);
          } else if (data.type === 'error') {
            setStatus('error');
            eventSource.close();
          }
        } catch {}
      };

      eventSource.onerror = () => {
        setStatus('error');
        eventSource.close();
      };
    } catch (err) {
      setStatus('error');
    }
  }, [onDone]);

  useEffect(() => {
    if (visible && status === 'idle') {
      startTranslation();
    }
  }, [visible, status, startTranslation]);

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  const stages = [
    { label: 'تحليل محتوى الموقع', done: status !== 'idle' },
    { label: 'الترجمة بالذكاء الاصطناعي', done: status === 'done' },
    { label: 'تحديث قاعدة البيانات', done: status === 'done' },
    { label: 'عرض النسخة الإنجليزية', done: false },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 13, 40, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              background: 'linear-gradient(145deg, #0a0f2e 0%, #001450 60%, #00205e 100%)',
              borderRadius: 28,
              padding: '48px 52px',
              maxWidth: 540,
              width: '92%',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background glow */}
            <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,102,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Cancel button */}
            {status === 'translating' && (
              <button
                onClick={onCancel}
                style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
              >
                <FaTimes />
              </button>
            )}

            {/* Icon */}
            <motion.div
              animate={status === 'translating' ? { rotate: [0, 360] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ marginBottom: 28 }}
            >
              {status === 'done' ? (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #00c851, #007e33)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <FaCheckCircle size={36} color="white" />
                </div>
              ) : status === 'error' ? (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #ff4444, #cc0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <FaTimes size={36} color="white" />
                </div>
              ) : (
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #003087, #0066cc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaRobot size={36} color="white" />
                  </div>
                  {/* Orbit ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px dashed rgba(0, 153, 255, 0.4)' }}
                  />
                </div>
              )}
            </motion.div>

            {/* Title */}
            <h4 style={{ color: 'white', fontWeight: 800, marginBottom: 8, fontSize: '1.35rem', fontFamily: 'Cairo, sans-serif' }}>
              {status === 'done'
                ? '✅ اكتملت الترجمة!'
                : status === 'error'
                ? '❌ حدث خطأ في الترجمة'
                : `🤖 الذكاء الاصطناعي يترجم الموقع${dots}`}
            </h4>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: 32, lineHeight: 1.7 }}>
              {status === 'done'
                ? 'تمت ترجمة جميع محتويات الموقع إلى الإنجليزية بنجاح. سيتم تحميل النسخة الإنجليزية الآن.'
                : status === 'error'
                ? 'تعذّر الاتصال بخدمة الترجمة. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.'
                : 'يقوم الذكاء الاصطناعي بقراءة وترجمة كل صفحات الموقع تلقائياً. يُرجى الانتظار...'}
            </p>

            {/* Progress Bar */}
            {status === 'translating' && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                  <span>جاري ترجمة: <span style={{ color: '#7eb8ff', fontWeight: 600 }}>{currentItem || '...'}</span></span>
                  <span style={{ color: '#7eb8ff', fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #003087, #0099ff, #00d4ff)',
                      borderRadius: 99,
                      boxShadow: '0 0 12px rgba(0, 153, 255, 0.6)',
                    }}
                  />
                </div>
                <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
                  {progress} / {total} عنصر مترجم
                </div>
              </div>
            )}

            {/* Stages */}
            {status === 'translating' && (
              <div style={{ textAlign: 'right', direction: 'rtl' }}>
                {stages.map((stage, i) => {
                  const isActive = (i === 0 && progress === 0) ||
                                   (i === 1 && progress > 0 && status === 'translating') ||
                                   (i === 2 && pct > 80) ||
                                   (i === 3 && status === 'done');
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: stage.done ? '#00c851' : isActive ? '#0066cc' : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: 'white',
                      }}>
                        {stage.done ? '✓' : isActive ? <FaSpinner size={10} style={{ animation: 'spin 1s linear infinite' }} /> : i + 1}
                      </div>
                      <span style={{ fontSize: '0.84rem', color: stage.done ? '#00c851' : isActive ? '#7eb8ff' : 'rgba(255,255,255,0.3)', fontWeight: isActive ? 600 : 400 }}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error retry button */}
            {status === 'error' && (
              <div className="d-flex gap-3 justify-content-center">
                <button
                  onClick={() => { setStatus('idle'); }}
                  style={{ background: '#003087', color: 'white', border: 'none', borderRadius: 12, padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  إعادة المحاولة
                </button>
                <button
                  onClick={onCancel}
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 12, padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  إلغاء
                </button>
              </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TranslationOverlay;
