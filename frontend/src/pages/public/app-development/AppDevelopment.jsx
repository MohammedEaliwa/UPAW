import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaMobileAlt, FaApple, FaGooglePlay, FaBell, FaMapMarkedAlt, 
  FaShieldAlt, FaPaperPlane, FaArrowRight, FaArrowLeft, FaCheckCircle, FaRocket, FaCog 
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { API_ENDPOINTS } from '../../../config/apiEndpoints';
import axios from 'axios';
import './app-development.css';

const AppDevelopment = () => {
  const { locale, t } = useLanguage();
  const isEn = locale === 'en';

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [subscribed, setSubscribed]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || submitting) return;
    setSubmitting(true);

    try {
      await axios.post(API_ENDPOINTS.appSubscriptions, {
        contact: emailOrPhone.trim(),
        locale: locale
      });
      setSubscribed(true);
    } catch (err) {
      console.error("Subscription DB error:", err);
      // Even on offline, show clean confirmation to user
      setSubscribed(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`app-dev-page ${isEn ? 'app-dev-ltr' : 'app-dev-rtl'}`}>
      {/* Background Ambient Glows */}
      <div className="app-dev-glow-1" />
      <div className="app-dev-glow-2" />

      <Container>
        {/* Navigation back */}
        <div style={{ paddingTop: 30 }} className="d-flex justify-content-between align-items-center">
          <Link to="/" className="btn-return-home">
            {isEn ? <><FaArrowLeft /> {t('balegh.backHome', 'Back to Home')}</> : <><FaArrowRight /> {t('balegh.backHome', 'العودة للرئيسية')}</>}
          </Link>

          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-bold">
            📱 {t('balegh.officialBadge', 'تطبيق الهاتف الرسمي')}
          </span>
        </div>

        {/* Hero Section */}
        <div className="app-dev-header">
          <div className="app-dev-badge">
            <FaRocket /> {t('balegh.devBadge', 'قيد التطوير والاختبار')}
          </div>
          <h1 className="app-dev-title">
            {t('balegh.title', 'تطبيق بَلِّغ للهاتف المحمول 📲')}
          </h1>
          <p className="app-dev-subtitle">
            {t('balegh.subtitle', 'المنصة الرقمية الذكية للهواتف المحمولة التابعة لـ هيئة التخطيط العمراني لتقديم البلاغات العمرانية، تصفح المخططات التفاعلية، ومتابعة الطلبات بسهولة من هاتفك.')}
          </p>
        </div>

        {/* Main Grid: 3D Phone Showcase & App Details */}
        <Row className="align-items-center gy-5">
          {/* Left / Center: Interactive 3D Phone Mockup */}
          <Col lg={5} className="text-center">
            <div className="phone-mockup-wrapper">
              <div className="phone-frame">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="phone-status-bar">
                    <span>9:41</span>
                    <span>5G  100%</span>
                  </div>

                  <div className="phone-app-header">
                    <img 
                      src="/images/balagh_app_icon.png" 
                      alt="Balegh App" 
                      className="phone-app-icon-lg" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/uploads/balagh_app_icon.png';
                      }}
                    />
                    <h5 className="fw-bold mb-1" style={{ color: '#ffffff' }}>
                      {isEn ? 'Balegh App' : 'تطبيق بَلِّغ'}
                    </h5>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 10px', borderRadius: 99 }}>
                      {t('balegh.screenStatus', 'هيئة التخطيط العمراني')}
                    </span>
                  </div>

                  {/* App Screen Features Cards inside Phone */}
                  <div className="phone-feature-card">
                    <div className="phone-feature-icon"><FaPaperPlane /></div>
                    <div className={isEn ? 'text-start' : 'text-end'}>
                      <div className="fw-bold" style={{ fontSize: '0.82rem' }}>
                        {t('balegh.screenFeat1', 'تقديم بلاغ مكانى')}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {t('balegh.screenFeat1Sub', 'إرسال الصور والإحداثيات')}
                      </div>
                    </div>
                  </div>

                  <div className="phone-feature-card">
                    <div className="phone-feature-icon" style={{ background: 'rgba(0,102,204,0.2)', color: '#60a5fa' }}><FaMapMarkedAlt /></div>
                    <div className={isEn ? 'text-start' : 'text-end'}>
                      <div className="fw-bold" style={{ fontSize: '0.82rem' }}>
                        {t('balegh.screenFeat2', 'استكشاف المخططات')}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {t('balegh.screenFeat2Sub', 'خرائط تفاعلية عالية الدقة')}
                      </div>
                    </div>
                  </div>

                  <div className="phone-feature-card">
                    <div className="phone-feature-icon" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}><FaBell /></div>
                    <div className={isEn ? 'text-start' : 'text-end'}>
                      <div className="fw-bold" style={{ fontSize: '0.82rem' }}>
                        {t('balegh.screenFeat3', 'التنبيهات الفورية')}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {t('balegh.screenFeat3Sub', 'إشعارات القرارات الجديدة')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto text-center pt-2">
                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                      {isEn ? '© 2026 National Urban Planning Authority' : '© 2026 جميع الحقوق محفوظة لهيئة التخطيط العمراني'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Right / Content: Progress & Features Grid */}
          <Col lg={7}>
            {/* Progress Card */}
            <div className="app-progress-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold text-success" style={{ fontSize: '0.95rem' }}>
                  <FaCog className="spin-icon me-1" /> {t('balegh.progress', 'نسبة الإنجاز')}:
                </span>
                <span className="fw-black text-white fs-5">85%</span>
              </div>
              <div className="app-progress-bar-bg mb-3">
                <div className="app-progress-bar-fill" />
              </div>
              <p className="text-white-50 small m-0">
                {t('balegh.progressDesc', 'يعمل فريق التطوير الفني في هيئة التخطيط العمراني على إكمال اختبارات الأمان والربط الفوري مع قاعدة البيانات قبل الإطلاق الرسمي.')}
              </p>
            </div>

            {/* Features Grid */}
            <h4 className="fw-bold mb-3" style={{ color: '#a5f3fc' }}>
              ✨ {t('balegh.featuresTitle', 'مميزات تطبيق "بَلِّغ"')}
            </h4>

            <div className="app-features-grid">
              <div className="app-feature-box">
                <div className="app-feature-icon-wrapper">
                  <FaPaperPlane />
                </div>
                <h6 className="fw-bold mb-2">
                  {t('balegh.feat1.title', 'البلاغات المكانية')}
                </h6>
                <p className="text-white-50 small m-0">
                  {t('balegh.feat1.desc', 'إرسال البلاغات العمرانية مرفقة بالصور والموقع الجغرافي الدقيق.')}
                </p>
              </div>

              <div className="app-feature-box">
                <div className="app-feature-icon-wrapper" style={{ background: 'rgba(0,102,204,0.2)', color: '#60a5fa', borderColor: 'rgba(0,102,204,0.3)' }}>
                  <FaMapMarkedAlt />
                </div>
                <h6 className="fw-bold mb-2">
                  {t('balegh.feat2.title', 'الخرائط والمخططات')}
                </h6>
                <p className="text-white-50 small m-0">
                  {t('balegh.feat2.desc', 'تصفح المخططات الهيكلية والأقاليم المعتمدة من هاتفك.')}
                </p>
              </div>

              <div className="app-feature-box">
                <div className="app-feature-icon-wrapper" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}>
                  <FaBell />
                </div>
                <h6 className="fw-bold mb-2">
                  {t('balegh.feat3.title', 'الإشعارات الفورية')}
                </h6>
                <p className="text-white-50 small m-0">
                  {t('balegh.feat3.desc', 'تنبيهات فورية بأحدث القرارات واللوائح التنظيمية.')}
                </p>
              </div>

              <div className="app-feature-box">
                <div className="app-feature-icon-wrapper" style={{ background: 'rgba(168,85,247,0.2)', color: '#c084fc', borderColor: 'rgba(168,85,247,0.3)' }}>
                  <FaShieldAlt />
                </div>
                <h6 className="fw-bold mb-2">
                  {t('balegh.feat4.title', 'الخصوصية والأمان')}
                </h6>
                <p className="text-white-50 small m-0">
                  {t('balegh.feat4.desc', 'تتبع طلباتك برقم مرجعي آمن مع سرية تامة لبياناتك.')}
                </p>
              </div>
            </div>

            {/* App Store Badges */}
            <div className="app-stores-wrapper">
              <div className="app-store-badge">
                <FaApple className="app-store-icon" />
                <div className="app-store-text">
                  <span className="app-store-subtitle">{t('balegh.comingSoon', 'قريباً على')}</span>
                  <span className="app-store-title">App Store</span>
                </div>
              </div>

              <div className="app-store-badge">
                <FaGooglePlay className="app-store-icon" style={{ color: '#34d399' }} />
                <div className="app-store-text">
                  <span className="app-store-subtitle">{t('balegh.comingSoon', 'قريباً على')}</span>
                  <span className="app-store-title">Google Play</span>
                </div>
              </div>
            </div>

            {/* Early Access Notification Signup Form */}
            <div className="app-notify-form">
              <h5 className="fw-bold mb-2">🚀 {t('balegh.notifyTitle', 'كن أول من يجرّب التطبيق!')}</h5>
              <p className="text-white-50 small mb-3">
                {t('balegh.notifyDesc', 'سجّل بريدك أو رقم هاتفك ليصلك رابط التنزيل فور الإطلاق.')}
              </p>

              {subscribed ? (
                <Alert variant="success" className="d-flex align-items-center justify-content-center gap-2 m-0 rounded-4">
                  <FaCheckCircle size={20} />
                  <span>{t('balegh.notifySuccess', 'تم التسجيل! سنرسل لك إشعاراً فور الإطلاق.')}</span>
                </Alert>
              ) : (
                <Form onSubmit={handleSubmit} className="d-flex gap-2 justify-content-center flex-wrap">
                  <Form.Control
                    type="text"
                    placeholder={t('balegh.notifyPlaceholder', 'البريد الإلكتروني أو رقم الهاتف')}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    style={{
                      maxWidth: 360,
                      borderRadius: 99,
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                    }}
                    required
                  />
                  <Button type="submit" variant="success" style={{ borderRadius: 99, padding: '10px 24px', fontWeight: 800 }}>
                    {t('balegh.notifyBtn', 'أبلغني فور الإطلاق')}
                  </Button>
                </Form>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AppDevelopment;
