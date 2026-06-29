import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTrashAlt } from 'react-icons/fa';

const ModernModal = ({
  show,
  onClose,
  onHide,
  title,
  type = 'primary', // primary, success, danger, warning
  children,
  size = 'md', // sm, md, lg, xl
  showCloseButton = true
}) => {
  // Support both onClose and onHide props
  const handleClose = onHide || onClose || (() => {});

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 350 }
    },
    exit: { opacity: 0, scale: 0.92, y: 15, transition: { duration: 0.2 } }
  };

  const typeStyles = {
    primary: {
      headerBg: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
      titleColor: '#ffffff',
      icon: <FaInfoCircle className="text-white" size={20} />,
      btnBg: 'var(--primary)'
    },
    success: {
      headerBg: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      titleColor: '#ffffff',
      icon: <FaCheckCircle className="text-white" size={20} />,
      btnBg: '#10b981'
    },
    danger: {
      headerBg: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
      titleColor: '#ffffff',
      icon: <FaTrashAlt className="text-white" size={20} />,
      btnBg: '#ef4444'
    },
    warning: {
      headerBg: 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
      titleColor: '#ffffff',
      icon: <FaExclamationTriangle className="text-white" size={20} />,
      btnBg: '#f59e0b'
    }
  };

  const currentStyle = typeStyles[type] || typeStyles.primary;

  const sizeWidths = {
    sm: '400px',
    md: '550px',
    lg: '800px',
    xl: '1000px'
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          direction: 'rtl'
        }}
      >
        {/* Backdrop - clicking outside closes modal */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />

        {/* Modal Window */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: sizeWidths[size] || sizeWidths.md,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(0, 48, 135, 0.05)',
            border: '1px solid var(--border, rgba(0,48,135,0.08))',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div 
            style={{
              background: currentStyle.headerBg,
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {currentStyle.icon}
              </div>
              <h5 
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  fontFamily: 'Cairo, Tajawal, sans-serif',
                  color: currentStyle.titleColor
                }}
              >
                {title}
              </h5>
            </div>

            {showCloseButton && (
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.1, rotate: 90, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <FaTimes size={16} />
              </motion.button>
            )}
          </div>

          {/* Body */}
          <div 
            style={{
              padding: '28px 24px',
              maxHeight: '78vh',
              overflowY: 'auto',
              fontFamily: 'Tajawal, sans-serif'
            }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModernModal;
