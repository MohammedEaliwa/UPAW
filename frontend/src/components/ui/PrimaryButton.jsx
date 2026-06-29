import React from 'react';
import { motion } from 'motion/react';
import { Spinner } from 'react-bootstrap';

const PrimaryButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger
  size = 'md', // sm, md, lg
  icon,
  loading = false,
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,48,135,0.2)'
        };
      case 'secondary':
        return {
          background: 'var(--card-bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--primary)',
          border: '2px solid var(--primary)',
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 15px rgba(239,68,68,0.2)'
        };
      default:
        return {
          background: 'var(--primary)',
          color: '#ffffff',
          border: 'none'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '8px 16px', fontSize: '0.85rem', borderRadius: '99px' };
      case 'lg':
        return { padding: '14px 32px', fontSize: '1.1rem', borderRadius: '99px' };
      case 'md':
      default:
        return { padding: '10px 24px', fontSize: '0.95rem', borderRadius: '99px' };
    }
  };

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '700',
    fontFamily: 'inherit',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.7 : 1,
    transition: 'all 0.3s ease',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={baseStyles}
      className={`primary-btn-custom ${className}`}
      whileHover={disabled || loading ? {} : { scale: 1.03, translateY: -2 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      {...props}
    >
      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <>
          {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
};

export default PrimaryButton;
