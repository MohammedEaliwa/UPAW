import React from 'react';
import { motion } from 'motion/react';
import { Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const MotionLink = motion(Link);

const PrimaryButton = ({
  children,
  onClick,
  to,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger, outline-brand
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
          background: 'linear-gradient(135deg, #1B6B3A 0%, #178B55 40%, #26C6DA 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 6px 24px rgba(27, 107, 58, 0.45), 0 1px 4px rgba(0, 0, 0, 0.2)'
        };
      case 'secondary':
        return {
          background: 'var(--card-bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        };
      case 'outline-brand':
      case 'outline':
        return {
          background: 'rgba(255, 255, 255, 0.07)',
          color: '#ffffff',
          border: '2px solid rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
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
    textDecoration: 'none',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  };

  const getClassName = () => {
    const baseClass = variant === 'primary' 
      ? 'btn-primary-custom' 
      : (variant === 'outline' || variant === 'outline-brand')
      ? 'btn-outline-brand' 
      : 'primary-btn-custom';
    return `${baseClass} ${className}`;
  };

  const content = loading ? (
    <Spinner animation="border" size="sm" />
  ) : (
    <>
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span style={{ color: '#ffffff', display: 'inline-flex', alignItems: 'center' }}>{children}</span>
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <MotionLink
        to={to}
        style={baseStyles}
        className={getClassName()}
        whileHover={{ scale: 1.03, translateY: -2 }}
        whileTap={{ scale: 0.97 }}
        {...props}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={baseStyles}
      className={getClassName()}
      whileHover={disabled || loading ? {} : { scale: 1.03, translateY: -2 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      {...props}
    >
      {content}
    </motion.button>
  );
};

export default PrimaryButton;

