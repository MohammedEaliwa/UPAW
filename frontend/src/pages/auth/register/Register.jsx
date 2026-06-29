import React, { useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaUserPlus, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaIdCard, FaArrowLeft, FaCheckCircle, FaShieldAlt
} from 'react-icons/fa';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import './register.css';

const Register = () => {
  const [form, setForm] = useState({
    fullName: '', nationalId: '', email: '',
    department: '', username: '', password: '', confirmPassword: '',
    branch: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const departments = [
    'قسم التخطيط الحضري',
    'قسم التخطيط الإقليمي',
    'قسم اللوائح والتشريعات',
    'المرصد الحضري',
    'وحدة البحث والتطوير',
    'الإدارة العامة',
    'قسم الموارد البشرية',
    'الإدارة المالية',
    'قسم تقنية المعلومات',
    'قسم العلاقات العامة',
  ];

  const branches = [
    'فرع طرابلس', 'فرع بنغازي', 'فرع سبها', 'فرع مصراتة', 'فرع الزاوية',
    'فرع الخمس', 'فرع البيضاء', 'فرع طبرق', 'فرع غريان', 'فرع الجفرة',
    'فرع سرت', 'فرع درنة', 'فرع زوارة', 'فرع الكفرة', 'فرع غات',
    'فرع مرزق', 'فرع نالوت', 'فرع يفرن', 'فرع بني وليد', 'فرع ترهونة',
    'فرع أوباري', 'فرع أجدابيا'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.branch) {
      setError('يرجى اختيار الفرع التابع له.'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.'); return;
    }
    if (form.password.length < 8) {
      setError('يجب أن تكون كلمة المرور 8 أحرف على الأقل.'); return;
    }
    setLoading(true);
    try {
      await api.register(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 44px 12px 16px',
    border: '2px solid var(--border)', borderRadius: 12,
    fontSize: '0.95rem', fontFamily: 'Tajawal, inherit',
    color: 'var(--text)', background: 'var(--bg)',
    outline: 'none', transition: 'border-color 0.3s',
  };

  const iconStyle = {
    position: 'absolute', right: 15, top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1,
  };

  if (success) {
    return (
      <div className="auth-page">
        <Container>
          <Row className="justify-content-center align-items-center min-vh-100">
            <Col lg={5} md={7}>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <div className="auth-card text-center">
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%', margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, #003087, #0066cc)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FaCheckCircle color="#fff" size={45} />
                  </div>
                  <h3 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>
                    تم إرسال طلبك بنجاح!
                  </h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '2rem' }}>
                    تم استلام طلب التسجيل الخاص بك. سيتم مراجعة طلبك من قِبَل مدخل البيانات 
                    وإشعارك بالقبول أو الرفض عبر البريد الإلكتروني.
                  </p>
                  <div style={{
                    background: 'rgba(0,48,135,0.05)', border: '1px solid rgba(0,48,135,0.12)',
                    borderRadius: 12, padding: '14px 20px', marginBottom: '2rem',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <FaShieldAlt style={{ color: '#003087', flexShrink: 0 }} />
                    <p style={{ margin: 0, color: '#003087', fontSize: '0.88rem', fontWeight: 600 }}>
                      طلبك في قائمة المراجعة وسيتم البت فيه خلال 1-3 أيام عمل
                    </p>
                  </div>
                  <Link to="/" className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2" style={{ padding: '12px', borderRadius: 12 }}>
                    <FaArrowLeft size={14} />
                    العودة للصفحة الرئيسية
                  </Link>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100 py-5">
          <Col lg={6} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="auth-card">
                {/* Header */}
                <div className="text-center mb-4">
                  <div style={{
                    width: 65, height: 65, borderRadius: 16, margin: '0 auto 14px',
                    background: 'var(--card-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0,48,135,0.12)',
                    padding: '6px',
                    border: '1px solid var(--border)',
                  }}>
                    <img
                      src="/logo.png"
                      alt="شعار الهيئة"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <h4 style={{ fontFamily: 'Cairo', fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>
                    إنشاء حساب جديد
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                    يتطلب موافقة مدخل البيانات قبل تفعيل الحساب
                  </p>
                </div>

                {error && (
                  <Alert style={{ borderRadius: 12, border: 'none', background: '#fef2f2', color: '#991b1b', fontSize: '0.9rem' }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'right', direction: 'rtl' }}>
                  <Row className="g-3">
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        الاسم الكامل *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaUser style={iconStyle} size={14} />
                        <input
                          type="text" required
                          placeholder="الاسم الرباعي"
                          value={form.fullName}
                          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                          style={inputStyle}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        الرقم الوطني *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaIdCard style={iconStyle} size={14} />
                        <input
                          type="text" required
                          placeholder="12 رقماً"
                          value={form.nationalId}
                          onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                          style={inputStyle}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        البريد الإلكتروني *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaEnvelope style={iconStyle} size={14} />
                        <input
                          type="email" required
                          placeholder="example@upa.gov.ly"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          style={inputStyle}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        القسم / الإدارة *
                      </label>
                      <select
                        required
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        style={{ ...inputStyle, paddingRight: 16 }}
                        onFocus={(e) => e.target.style.borderColor = '#003087'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      >
                        <option value="">اختر القسم</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Col>
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        الفرع التابع له *
                      </label>
                      <select
                        required
                        value={form.branch}
                        onChange={(e) => setForm({ ...form, branch: e.target.value })}
                        style={{ ...inputStyle, paddingRight: 16 }}
                        onFocus={(e) => e.target.style.borderColor = '#003087'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      >
                        <option value="">اختر الفرع</option>
                        {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </Col>
                    <Col md={12}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        اسم المستخدم *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaUser style={iconStyle} size={14} />
                        <input
                          type="text" required
                          placeholder="سيُستخدم لتسجيل الدخول"
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          style={inputStyle}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        كلمة المرور *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaLock style={iconStyle} size={14} />
                        <input
                          type={showPw ? 'text' : 'password'} required
                          placeholder="8 أحرف على الأقل"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          style={{ ...inputStyle, paddingLeft: 44 }}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#556080', cursor: 'pointer' }}>
                          {showPw ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </Col>
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        تأكيد كلمة المرور *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaLock style={iconStyle} size={14} />
                        <input
                          type={showPw ? 'text' : 'password'} required
                          placeholder="أعد كتابة كلمة المرور"
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          style={inputStyle}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                    </Col>
                  </Row>

                  <PrimaryButton
                    type="submit"
                    loading={loading}
                    icon={<FaUserPlus size={16} />}
                    style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}
                  >
                    إرسال طلب التسجيل
                  </PrimaryButton>
                </form>

                <div className="text-center mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                    لديك حساب بالفعل؟{' '}
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                      تسجيل الدخول
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="text-center mt-4" style={{ direction: 'rtl' }}>
              <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <FaArrowLeft size={12} /> العودة للصفحة الرئيسية
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
