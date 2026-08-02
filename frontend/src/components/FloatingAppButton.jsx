import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './floating-app-button.css';

const FloatingAppButton = ({ onClickOverride }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, t } = useLanguage();

  const [scrollState, setScrollState] = useState('idle'); // 'idle' | 'down' | 'up'

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let timeoutId = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY) > 3) {
        if (currentScrollY > lastScrollY) {
          setScrollState('down');
        } else {
          setScrollState('up');
        }
        lastScrollY = currentScrollY;
      }

      clearTimeout(timeoutId);
      // Soft transition window when stopping scroll
      timeoutId = setTimeout(() => {
        setScrollState('idle');
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Hide the button completely when on the app-development page
  if (location.pathname === '/app-development') return null;

  const handleClick = (e) => {
    e.preventDefault();
    if (onClickOverride) {
      onClickOverride();
    } else {
      navigate('/app-development');
    }
  };

  const isEn = locale === 'en';

  return (
    <div className={`floating-app-button-wrapper ${isEn ? 'floating-ltr' : 'floating-rtl'}`}>
      <button
        className={`floating-app-btn scroll-${scrollState}`}
        onClick={handleClick}
        title={t('balegh.floatTitle', 'تطبيق بَلِّغ') + ' - ' + t('balegh.floatSub', 'قيد التطوير')}
        aria-label={t('balegh.title', 'تطبيق بَلِّغ للهاتف المحمول')}
      >
        <div className="floating-app-pulse-ring" />
        <span className="floating-app-badge">
          {t('balegh.badge', 'قريباً')}
        </span>
        <img
          src="/images/balagh_app_icon.png"
          alt="Balegh App Icon"
          className="floating-app-icon-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/uploads/balagh_app_icon.png';
          }}
        />
      </button>
    </div>
  );
};

export default FloatingAppButton;
