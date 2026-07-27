import { useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { motion } from 'motion/react';
import {
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock,
  FaPaperPlane, FaUser, FaBuilding, FaCheckCircle,
  FaExclamationCircle, FaFileAlt, FaIdCard
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { api } from '../../../services/api';
import './complaints.css';

const ComplaintsPage = () => {
  const { locale } = useLanguage();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    id_number: '',
    complaint_type: '',
    subject: '',
    message: '',
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await api.createComplaint(form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', id_number: '', complaint_type: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 7000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || (isRtl ? 'حدث خطأ أثناء إرسال الشكوى، يرجى المحاولة لاحقاً' : 'Error sending complaint, please try again later'));
    } finally {
      setLoading(false);
    }
  };

  const infoItems = [
    {
      icon: <FaMapMarkerAlt size={22} />,
      label: isRtl ? 'العنوان' : 'Address',
      value: isRtl ? 'طرابلس، شارع عمر المختار، الهيئة الوطنية للتخطيط العمراني' : 'Tripoli, Omar Al-Mukhtar St., National Urban Planning Authority'
    },
    {
      icon: <FaPhone size={22} />,
      label: isRtl ? 'الهاتف' : 'Phone',
      value: '+218 21-3336001'
    },
    {
      icon: <FaEnvelope size={22} />,
      label: isRtl ? 'البريد الإلكتروني' : 'Email',
      value: 'info@upa.gov.ly'
    },
    {
      icon: <FaClock size={22} />,
      label: isRtl ? 'ساعات العمل' : 'Working Hours',
      value: isRtl ? 'الأحد - الخميس: 8:00 ص - 2:00 م' : 'Sun - Thu: 8:00 AM - 2:00 PM'
    },
  ];

  const complaintTypes = isRtl ? [
    'شكوى تخطيطية',
    'شكوى إدارية',
    'شكوى تتعلق بمشروع',
    'مخالفة بناء',
    'أخرى',
  ] : [
    'Planning Complaint',
    'Administrative Complaint',
    'Project Complaint',
    'Building Violation',
    'Other',
  ];

  const inputStyle = {
    width: '100%',
    paddingTop: '13px',
    paddingBottom: '13px',
    border: '2px solid var(--border)',
    borderRadius: 12,
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    color: 'var(--text)',
    background: 'var(--bg)',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  };

  const iconStyle = isRtl
    ? { position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }
    : { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' };

  const dynamicInputStyle = isRtl
    ? { ...inputStyle, paddingRight: 44, paddingLeft: 18 }
    : { ...inputStyle, paddingLeft: 44, paddingRight: 18 };

  return (
    <div className="complaints-page" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="complaints-header">
        <div style={{ position: 'absolute', top: -80, right: isRtl ? -80 : 'auto', left: isRtl ? 'auto' : -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,168,232,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: isRtl ? -60 : 'auto', right: isRtl ? 'auto' : -60, width: 250, height: 250, background: 'radial-gradient(circle, rgba(0,48,135,0.15) 0%, transparent 70%)' }} />
        <Container className="position-relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 16px', borderRadius: 99, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
              <FaExclamationCircle size={12} />
              {isRtl ? 'خدماتنا الإلكترونية' : 'Our e-Services'}
            </div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '2.5rem', marginBottom: '0.5rem', fontFamily: 'Cairo, sans-serif' }}>
              {isRtl ? 'تقديم شكوى' : 'Submit a Complaint'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', margin: 0 }}>
              {isRtl
                ? 'تهدف مصلحة التخطيط العمراني من خلال هذه الخدمة إلى تمكين المواطنين والموظفين من التواصل مع إدارة المصلحة لطرح شكاواهم ومعالجتها'
                : 'This service allows citizens and employees to communicate with the authority management to submit and resolve their complaints'}
            </p>
          </motion.div>
        </Container>
      </div>

      <Container style={{ marginTop: '50px' }}>
        <Row className="g-5 align-items-start">
          {/* Info Sidebar */}
          <Col lg={5}>
            <motion.div initial={{ opacity: 0, x: isRtl ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="complaints-info-card" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: '1rem', fontFamily: 'Cairo, sans-serif' }}>
                  {isRtl ? 'معلومات التواصل' : 'Contact Information'}
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.8, marginBottom: '2rem' }}>
                  {isRtl
                    ? 'يمكنك التواصل معنا عبر القنوات التالية أو من خلال تقديم شكواك عبر النموذج الإلكتروني المتاح.'
                    : 'You can contact us through the following channels or by submitting your complaint via the electronic form available.'}
                </p>
                <div className="d-flex flex-column gap-4">
                  {infoItems.map((item, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3">
                      <div style={{
                        width: 48, height: 48, flexShrink: 0, borderRadius: 12,
                        background: 'rgba(255,255,255,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.93rem' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guidelines card */}
              <div className="complaints-guidelines-card" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <h6 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
                  <FaFileAlt size={15} />
                  {isRtl ? 'إرشادات تقديم الشكوى' : 'Complaint Submission Guidelines'}
                </h6>
                <ul style={{ paddingRight: isRtl ? '1.5rem' : 0, paddingLeft: isRtl ? 0 : '1.5rem', margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.9 }}>
                  <li>{isRtl ? 'تأكد من إدخال بياناتك الشخصية بشكل صحيح' : 'Ensure your personal details are entered correctly'}</li>
                  <li>{isRtl ? 'كن دقيقاً في وصف المشكلة أو الشكوى' : 'Be specific in describing your issue or complaint'}</li>
                  <li>{isRtl ? 'سيتم الرد عليك خلال 3-5 أيام عمل' : 'You will receive a response within 3-5 business days'}</li>
                  <li>{isRtl ? 'يمكن تقديم شكوى واحدة لكل حالة فقط' : 'Only one complaint per case can be submitted'}</li>
                </ul>
              </div>
            </motion.div>
          </Col>

          {/* Complaint Form */}
          <Col lg={7}>
            <motion.div initial={{ opacity: 0, x: isRtl ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="complaints-form-card" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <h4 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem', fontFamily: 'Cairo, sans-serif' }}>
                  {isRtl ? 'نموذج تقديم الشكوى' : 'Complaint Form'}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  {isRtl
                    ? 'يُرجى ملء جميع الحقول المطلوبة بدقة لضمان معالجة شكواك بشكل صحيح وفي الوقت المناسب.'
                    : 'Please fill in all required fields accurately to ensure your complaint is processed correctly and in a timely manner.'}
                </p>

                {sent && (
                  <Alert style={{ borderRadius: 12, border: 'none', background: '#f0fdf4', color: '#166534', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FaCheckCircle />
                    {isRtl
                      ? 'تم إرسال شكواك بنجاح! سنتواصل معك في أقرب وقت ممكن.'
                      : 'Your complaint has been submitted successfully! We will contact you as soon as possible.'}
                  </Alert>
                )}

                {errorMsg && (
                  <Alert style={{ borderRadius: 12, border: 'none', background: '#fef2f2', color: '#991b1b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FaExclamationCircle />
                    {errorMsg}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} dir={isRtl ? 'rtl' : 'ltr'}>
                  <Row className="g-3">
                    {/* Name */}
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        {isRtl ? 'الاسم الكامل *' : 'Full Name *'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaUser style={iconStyle} size={14} />
                        <input
                          type="text" required
                          placeholder={isRtl ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          style={dynamicInputStyle}
                          onFocus={e => e.target.style.borderColor = '#003087'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </Col>

                    {/* ID Number */}
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        {isRtl ? 'رقم الهوية الوطنية *' : 'National ID Number *'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaIdCard style={iconStyle} size={14} />
                        <input
                          type="text" required
                          placeholder={isRtl ? 'أدخل رقم هويتك' : 'Enter your ID number'}
                          value={form.id_number}
                          onChange={e => setForm({ ...form, id_number: e.target.value })}
                          style={{ ...dynamicInputStyle, direction: 'ltr' }}
                          onFocus={e => e.target.style.borderColor = '#003087'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </Col>

                    {/* Email */}
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        {isRtl ? 'البريد الإلكتروني *' : 'Email Address *'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaEnvelope style={iconStyle} size={14} />
                        <input
                          type="email" required
                          placeholder={isRtl ? 'example@email.com' : 'example@email.com'}
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          style={{ ...dynamicInputStyle, direction: 'ltr' }}
                          onFocus={e => e.target.style.borderColor = '#003087'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </Col>

                    {/* Phone */}
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        {isRtl ? 'رقم الهاتف' : 'Phone Number'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaPhone style={iconStyle} size={14} />
                        <input
                          type="tel"
                          placeholder={isRtl ? '0912345678' : '0912345678'}
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          style={{ ...dynamicInputStyle, direction: 'ltr' }}
                          onFocus={e => e.target.style.borderColor = '#003087'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </Col>

                    {/* Complaint Type */}
                    <Col md={12}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        {isRtl ? 'نوع الشكوى *' : 'Complaint Type *'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaFileAlt style={iconStyle} size={14} />
                        <select
                          required
                          value={form.complaint_type}
                          onChange={e => setForm({ ...form, complaint_type: e.target.value })}
                          style={{ ...dynamicInputStyle, appearance: 'none', cursor: 'pointer' }}
                          onFocus={e => e.target.style.borderColor = '#003087'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        >
                          <option value="">{isRtl ? '-- اختر نوع الشكوى --' : '-- Select Complaint Type --'}</option>
                          {complaintTypes.map((type, i) => (
                            <option key={i} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </Col>

                    {/* Subject */}
                    <Col md={12}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        {isRtl ? 'موضوع الشكوى *' : 'Complaint Subject *'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FaBuilding style={iconStyle} size={14} />
                        <input
                          type="text" required
                          placeholder={isRtl ? 'اكتب موضوع الشكوى' : 'Enter the complaint subject'}
                          value={form.subject}
                          onChange={e => setForm({ ...form, subject: e.target.value })}
                          style={dynamicInputStyle}
                          onFocus={e => e.target.style.borderColor = '#003087'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </Col>

                    {/* Message */}
                    <Col md={12}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>
                        {isRtl ? 'تفاصيل الشكوى *' : 'Complaint Details *'}
                      </label>
                      <textarea
                        required rows={6}
                        placeholder={isRtl ? 'اشرح شكواك بالتفصيل...' : 'Describe your complaint in detail...'}
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, paddingLeft: 18, paddingRight: 18 }}
                        onFocus={e => e.target.style.borderColor = '#003087'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </Col>
                  </Row>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      marginTop: '1.5rem',
                      width: '100%', padding: '14px',
                      background: loading ? '#94a3b8' : 'linear-gradient(135deg, #001d5a 0%, #0066cc 100%)',
                      border: 'none', borderRadius: 12,
                      color: '#fff', fontWeight: 700, fontSize: '1rem',
                      fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: '0 4px 20px rgba(0,48,135,0.25)',
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        {isRtl ? 'جاري الإرسال...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <FaPaperPlane size={16} />
                        {isRtl ? 'إرسال الشكوى' : 'Submit Complaint'}
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </Col>
        </Row>
      </Container>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ComplaintsPage;
