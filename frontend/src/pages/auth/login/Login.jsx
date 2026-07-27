import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaSignInAlt, FaLock, FaUser, FaEye, FaEyeSlash,
  FaShieldAlt, FaArrowLeft, FaArrowRight
} from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import './login.css';

const Login = () => {
  const { locale, t } = useLanguage();
  const { isDark } = useTheme();
  const isRtl = locale === 'ar';
  const { user, login } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username.trim(), form.password.trim());
      navigate('/dashboard');
    } catch (err) {
      const serverMsg = err?.data?.error || err?.message;
      setError(serverMsg || (isRtl ? 'اسم المستخدم أو كلمة المرور غير صحيحة.' : 'Incorrect username or password.'));
    } finally {
      setLoading(false);
    }
  };

  const iconStyle = isRtl
    ? { position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#556080', zIndex: 1 }
    : { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#556080', zIndex: 1 };

  const inputStyle = {
    width: '100%',
    paddingTop: '13px',
    paddingBottom: '13px',
    paddingRight: isRtl ? '44px' : '16px',
    paddingLeft: isRtl ? '16px' : '44px',
    border: isDark ? '1.5px solid rgba(255,255,255,0.15)' : '2px solid #e2e8f0',
    borderRadius: 12,
    fontSize: '1rem',
    fontFamily: 'inherit',
    color: 'var(--text)',
    background: 'var(--card-bg)',
    outline: 'none',
    transition: 'border-color 0.3s',
  };

  const ArrowIcon = isRtl ? FaArrowLeft : FaArrowRight;

  return (
    <div className="auth-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100 py-5">
          <Col lg={5} md={7}>
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="auth-card" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                {/* Logo */}
                <div className="text-center mb-5">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      width: 70, height: 70, borderRadius: 18, margin: '0 auto 16px',
                      background: 'var(--card-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,48,135,0.12)',
                      padding: '6px',
                      border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,48,135,0.08)',
                    }}
                  >
                    <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </motion.div>
                  <h4 style={{ fontFamily: 'Cairo', fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>
                    {t('nav.portal')}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    {t('nav.authority')}
                  </p>
                  <div className="mt-3 d-inline-flex align-items-center gap-2" style={{
                    background: isDark ? 'rgba(34, 197, 94, 0.18)' : 'rgba(22, 163, 74, 0.08)',
                    border: isDark ? '1.5px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(22, 163, 74, 0.25)',
                    padding: '6px 16px',
                    borderRadius: 99,
                    boxShadow: isDark ? '0 0 15px rgba(34, 197, 94, 0.15)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    <FaShieldAlt style={{ color: isDark ? '#4ade80' : '#15803d', fontSize: '0.95rem' }} />
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: isDark ? '#4ade80' : '#15803d',
                      letterSpacing: '0.01em'
                    }}>
                      {isRtl ? 'اتصال مشفر وآمن (256-bit)' : 'Secure 256-bit Encrypted Connection'}
                    </span>
                  </div>
                </div>

                {error && (
                  <Alert variant="danger" style={{ borderRadius: 12, fontSize: '0.9rem', border: 'none', background: '#fef2f2', color: '#991b1b' }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8, fontSize: '0.9rem', display: 'block' }}>
                      {isRtl ? 'اسم المستخدم' : 'Username'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FaUser style={iconStyle} />
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                        placeholder={isRtl ? 'أدخل اسم المستخدم أو البريد' : 'Enter username or email'}
                        style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                        onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8, fontSize: '0.9rem', display: 'block' }}>
                      {isRtl ? 'كلمة المرور' : 'Password'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FaLock style={iconStyle} />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        placeholder={isRtl ? 'أدخل كلمة المرور' : 'Enter password'}
                        style={{ ...inputStyle, paddingLeft: isRtl ? '44px' : '44px', paddingRight: isRtl ? '44px' : '44px' }}
                        onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                        onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        style={{
                          position: 'absolute',
                          left: isRtl ? 14 : 'auto',
                          right: isRtl ? 'auto' : 14,
                          top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: '#556080',
                          cursor: 'pointer', padding: 4
                        }}
                      >
                        {showPw ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%', padding: '14px',
                      background: loading ? '#94a3b8' : 'linear-gradient(135deg, #001d5a 0%, #0066cc 100%)',
                      border: 'none', borderRadius: 12,
                      color: '#fff', fontWeight: 700, fontSize: '1.05rem',
                      fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: '0 4px 20px rgba(0,48,135,0.35)',
                      transition: 'background 0.3s',
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        {isRtl ? 'جارٍ تسجيل الدخول...' : 'Logging in...'}
                      </>
                    ) : (
                      <>
                        <FaSignInAlt />
                        {isRtl ? 'تسجيل الدخول' : 'Login'}
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.92rem' }}>
                    {isRtl ? 'ليس لديك حساب؟ سجل كموظف جديد هنا' : "Don't have an account? Register as new employee here"}
                  </Link>
                </div>

                <div className="d-flex align-items-center justify-content-center gap-2 mt-4" style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  <FaShieldAlt />
                  {isRtl
                    ? 'بوابة آمنة ومشفرة — للموظفين المعتمدين فقط'
                    : 'Secure encrypted portal — authorized personnel only'
                  }
                </div>
              </div>
            </motion.div>

            <div className="text-center mt-4">
              <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ArrowIcon size={12} />
                {t('common.backToHome')}
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
