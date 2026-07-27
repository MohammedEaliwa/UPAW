import React, { useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { motion } from 'motion/react';
import {
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock,
  FaPaperPlane, FaUser, FaBuilding, FaCheckCircle
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { api } from '../../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './contact.css';

const Contact = () => {
  const { locale, t } = useLanguage();
  const isRtl = locale === 'ar';
  
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState(null);

  React.useEffect(() => {
    api.getPageContact()
      .then(d => setPageData(d))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 6000);
  };

  const contacts = pageData ? [
    { icon: <FaMapMarkerAlt size={22} />, label: t('contact.field.address'), value: isRtl ? pageData.links.address_ar : pageData.links.address_en, color: '#003087' },
    { icon: <FaPhone size={22} />, label: t('contact.field.phone'), value: pageData.links.phone, color: '#0066cc' },
    { icon: <FaEnvelope size={22} />, label: t('contact.field.email'), value: pageData.links.email, color: '#00a8e8' },
    { icon: <FaClock size={22} />, label: t('contact.field.workHours'), value: t('footer.workHours'), color: '#006fa8' },
  ] : [];

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
    <div className="contact-page" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="contact-header">
        <div style={{ position: 'absolute', top: -80, right: isRtl ? -80 : 'auto', left: isRtl ? 'auto' : -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,168,232,0.1) 0%, transparent 70%)' }} />
        <Container className="position-relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 16px', borderRadius: 99, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
              <FaEnvelope size={12} /> {t('contact.tag')}
            </div>
            <h1 style={{ color: '#fff', fontWeight: 900, marginBottom: '0.5rem' }}>
              {t('contact.title')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', margin: 0 }}>
              {t('contact.subtitle')}
            </p>
          </motion.div>
        </Container>
      </div>

      <Container style={{ marginTop: '50px' }}>
        <Row className="g-5 align-items-start">
          {/* Contact Info */}
          <Col lg={5}>
            <motion.div initial={{ opacity: 0, x: isRtl ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="contact-info-card" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: '1rem' }}>{t('contact.info')}</h4>
                {pageData && (
                  <div 
                    style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{ __html: isRtl ? pageData.content_ar : pageData.content_en }}
                  />
                )}
                <div className="d-flex flex-column gap-4">
                  {contacts.map((c, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3">
                      <div style={{
                        width: 48, height: 48, flexShrink: 0, borderRadius: 12,
                        background: 'rgba(255,255,255,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                      }}>
                        {c.icon}
                      </div>
                      <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginBottom: 3 }}>{c.label}</div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{c.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Map */}
              {pageData?.map_location && (
                <div style={{
                  borderRadius: 20, overflow: 'hidden',
                  height: 250, border: '2px solid rgba(0,48,135,0.12)',
                  position: 'relative', zIndex: 1
                }}>
                  <MapContainer 
                    center={[pageData.map_location.lat, pageData.map_location.lng]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[pageData.map_location.lat, pageData.map_location.lng]}>
                      <Popup>{isRtl ? pageData.links.address_ar : pageData.links.address_en}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </motion.div>
          </Col>

          {/* Contact Form */}
          <Col lg={7}>
            <motion.div initial={{ opacity: 0, x: isRtl ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="contact-form-container" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <h4 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem' }}>
                  {t('contact.formTitle')}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  {t('contact.formSubtitle')}
                </p>

                {sent && (
                  <Alert style={{ borderRadius: 12, border: 'none', background: '#f0fdf4', color: '#166534', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FaCheckCircle /> {t('contact.success')}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>{t('contact.nameLabel')}</label>
                      <div style={{ position: 'relative' }}>
                        <FaUser style={iconStyle} size={14} />
                        <input
                          type="text" required
                          placeholder={t('contact.namePlaceholder')}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          style={dynamicInputStyle}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>{t('contact.emailLabel')}</label>
                      <div style={{ position: 'relative' }}>
                        <FaEnvelope style={iconStyle} size={14} />
                        <input
                          type="email" required
                          placeholder={t('contact.emailPlaceholder')}
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          style={dynamicInputStyle}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </Col>
                    <Col md={12}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>{t('contact.subjectLabel')}</label>
                      <div style={{ position: 'relative' }}>
                        <FaBuilding style={iconStyle} size={14} />
                        <input
                          type="text" required
                          placeholder={t('contact.subjectPlaceholder')}
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          style={dynamicInputStyle}
                          onFocus={(e) => e.target.style.borderColor = '#003087'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </Col>
                    <Col md={12}>
                      <label style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontSize: '0.88rem', display: 'block' }}>{t('contact.messageLabel')}</label>
                      <textarea
                        required rows={5}
                        placeholder={t('contact.messagePlaceholder')}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, paddingLeft: 18, paddingRight: 18 }}
                        onFocus={(e) => e.target.style.borderColor = '#003087'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
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
                      <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{t('contact.sending')}</>
                    ) : (
                      <><FaPaperPlane size={16} />{t('contact.sendBtn')}</>
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

export default Contact;
