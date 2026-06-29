import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const ToastNotification = ({ show, message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'rgba(255, 255, 255, 0.12)',
      color: '#ffffff',
      icon: <FaCheckCircle size={18} style={{ color: '#10b981' }} />,
      title: 'نجحت العملية'
    },
    danger: {
      bg: 'rgba(255, 255, 255, 0.12)',
      color: '#ffffff',
      icon: <FaExclamationCircle size={18} style={{ color: '#f87171' }} />,
      title: 'حدث خطأ'
    },
    warning: {
      bg: 'rgba(255, 255, 255, 0.12)',
      color: '#ffffff',
      icon: <FaExclamationTriangle size={18} style={{ color: '#fbbf24' }} />,
      title: 'تنبيه'
    },
    info: {
      bg: 'rgba(255, 255, 255, 0.12)',
      color: '#ffffff',
      icon: <FaInfoCircle size={18} style={{ color: '#38bdf8' }} />,
      title: 'معلومة'
    }
  };

  const cfg = typeConfig[type] || typeConfig.success;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, x: -50, scale: 0.9, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 9999,
            width: '320px',
            background: 'linear-gradient(135deg, #001d5a 0%, #003087 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            direction: 'rtl',
            fontFamily: 'Cairo, sans-serif'
          }}
        >
          {/* Main content row */}
          <div style={{ display: 'flex', padding: '16px 18px', alignItems: 'center', gap: '14px' }}>
            {/* Type indicator colored icon container */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: cfg.bg,
              color: '#fff',
              flexShrink: 0
            }}>
              {cfg.icon}
            </div>

            {/* Message and title */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>
                {cfg.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                {message}
              </div>
            </div>

            {/* Close button */}
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <FaTimes size={12} />
            </button>
          </div>

          {/* Progress bar animation */}
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            style={{
              height: '3px',
              background: 'rgba(255, 255, 255, 0.25)',
              opacity: 0.8
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
