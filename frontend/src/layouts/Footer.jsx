import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaFacebook, FaTwitter, FaLinkedin, FaYoutube,
  FaMapMarkerAlt, FaEnvelope, FaPhone,
  FaSignInAlt, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import PrimaryButton from '../components/ui/PrimaryButton';


const Footer = () => {
  const { locale, t } = useLanguage();
  const year = new Date().getFullYear();

  const quickLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/interactive-map', label: t('nav.map') },
    { to: '/news', label: t('nav.news') },
    { to: '/working-papers', label: t('nav.papers') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const services = [
    t('services.service1.title'),
    t('services.service2.title'),
    t('services.service3.title'),
    t('services.service5.title'),
    t('services.service4.title'),
  ];

  const ArrowIcon = locale === 'ar' ? FaChevronLeft : FaChevronRight;

  return (
    <footer className="footer-custom">
      <Container>
        <Row className="gy-5">
          {/* Identity */}
          <Col lg={4} md={12}>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--card-bg)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px',
              }}>
                <img
                  src="/logo.png"
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ fontFamily: 'Cairo', fontWeight: 800, fontSize: locale === 'ar' ? '1.1rem' : '0.95rem', color: '#fff', lineHeight: 1.2 }}>
                  {locale === 'ar' ? 'الهيئة الوطنية' : 'National Authority'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  {locale === 'ar' ? 'للتخطيط العمراني' : 'for Urban Planning'}
                </div>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, fontSize: '0.95rem' }}>
              {t('footer.desc')}
            </p>
            <div className="d-flex gap-2 mt-4">
              {[
                { icon: <FaFacebook size={18} />, href: 'https://www.facebook.com/upa.gov.ly', label: 'Facebook' },
                { icon: <FaTwitter size={18} />, href: '#', label: 'Twitter' },
                { icon: <FaLinkedin size={18} />, href: '#', label: 'LinkedIn' },
                { icon: <FaYoutube size={18} />, href: '#', label: 'YouTube' },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-icon-link"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} md={6}>
            <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '1.2rem', fontSize: '1rem' }}>
              {t('footer.quickLinks')}
            </h6>
            <ul className="list-unstyled m-0 d-flex flex-column gap-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="footer-link">
                    <ArrowIcon size={10} style={{ flexShrink: 0, color: 'var(--accent)' }} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Services */}
          <Col lg={2} md={6}>
            <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '1.2rem', fontSize: '1rem' }}>
              {locale === 'ar' ? 'خدماتنا' : 'Our Services'}
            </h6>
            <ul className="list-unstyled m-0 d-flex flex-column gap-2">
              {services.map((s, i) => (
                <li key={i}>
                  <a href="#" className="footer-link">
                    <ArrowIcon size={10} style={{ flexShrink: 0, color: 'var(--accent)' }} />
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </Col>

          {/* Contact + Portal */}
          <Col lg={4} md={12}>
            <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '1.2rem', fontSize: '1rem' }}>
              {t('footer.contactUs')}
            </h6>
            <ul className="list-unstyled m-0 d-flex flex-column gap-3 mb-4">
              <li className="d-flex align-items-start gap-3">
                <FaMapMarkerAlt style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem' }}>
                  {t('footer.address')}
                </span>
              </li>
              <li className="d-flex align-items-center gap-3">
                <FaPhone style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem', direction: 'ltr' }}>
                  {t('footer.phone')}
                </span>
              </li>
              <li className="d-flex align-items-center gap-3">
                <FaEnvelope style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem' }}>
                  {t('footer.email')}
                </span>
              </li>
            </ul>

             {/* Employee Portal Section */}
             <div style={{
               background: 'rgba(255,255,255,0.05)',
               border: '1px solid rgba(255,255,255,0.12)',
               borderRadius: 16,
               padding: '20px 22px',
             }}>
               <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                 {locale === 'ar' ? 'بوابة الموظفين والعاملين' : 'Staff & Employees Portal'}
               </h6>
               <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                 {locale === 'ar' ? 'للوصول إلى النظام الداخلي وإدارة البيانات' : 'Access the internal dashboard to manage planning data.'}
               </p>
               <div className="d-flex flex-column gap-2">
                 <PrimaryButton 
                   to="/login" 
                   variant="primary" 
                   className="w-100" 
                   style={{ fontSize: '0.88rem', padding: '9px 20px' }} 
                   icon={<FaSignInAlt size={14} />}
                 >
                   {locale === 'ar' ? 'تسجيل الدخول للنظام' : 'Login to System'}
                 </PrimaryButton>
               </div>
             </div>
          </Col>
        </Row>

        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '40px 0 25px' }} />

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>
            &copy; {year} {t('footer.rights')}
          </p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>
            {locale === 'ar' ? 'الجمهورية الليبية' : 'State of Libya'}
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
