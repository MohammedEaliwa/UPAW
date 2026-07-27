import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FaSearch, FaFilePdf, FaPaperPlane, FaCheckCircle,
  FaSpinner, FaExclamationCircle, FaList, FaClipboardList,
  FaUpload, FaInfoCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

const EmptyForm = {
  name: '',
  specialty: '',
  experience_years: '',
  degree: '',
  license_number: '',
  email: '',
  phone: '',
  address: '',
};

const ExpertsRegistration = () => {
  const { isDarkMode } = useTheme();
  const { locale } = useLanguage();
  const isRtl = locale === 'ar';
  const pdfRef = useRef(null);

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'form' | 'list'
  const [formData, setFormData] = useState(EmptyForm);
  const [uploadedFiles, setUploadedFiles] = useState({
    cv: null,
    id_card: null,
    license: null,
    degree: null,
  });
  const [uploadingState, setUploadingState] = useState({
    cv: false,
    id_card: false,
    license: false,
    degree: false,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error'
  const [submitMsg, setSubmitMsg] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  // Experts list
  const [experts, setExperts] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    const fetchExpertsList = async () => {
      if (activeTab === 'list') {
        setLoadingList(true);
        try {
          const data = await api.getExperts();
          if (active) {
            setExperts(data || []);
            setLoadingList(false);
          }
        } catch (err) {
          console.error('Error fetching experts:', err);
          if (active) {
            setLoadingList(false);
          }
        }
      }
    };
    fetchExpertsList();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingState((prev) => ({ ...prev, [type]: true }));
    try {
      const res = await api.uploadFile(file);
      if (res && res.url) {
        setUploadedFiles((prev) => ({ ...prev, [type]: res.url }));
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert(isRtl ? 'حدث خطأ أثناء تحميل الملف' : 'Error uploading file');
    } finally {
      setUploadingState((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setFormLoading(true);
    setSubmitStatus(null);

    const attachments = JSON.stringify(uploadedFiles);

    try {
      const payload = {
        ...formData,
        experience_years: parseInt(formData.experience_years, 10) || 0,
        attachments,
      };

      const res = await api.createExpert(payload);
      setSubmitStatus('success');
      const serial = res?.serial_number || res?.data?.serial_number;
      setSubmitMsg(isRtl 
        ? `تم تقديم طلب تسجيل الخبير بنجاح! رقم الطلب الخاص بك هو: ${serial}` 
        : `Expert registration application submitted successfully! Reference number: ${serial}`
      );
      setSubmittedData({ ...payload, serial_number: serial });
    } catch (err) {
      setSubmitStatus('error');
      setSubmitMsg(err.message || (isRtl ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again'));
    } finally {
      setFormLoading(false);
    }
  };

  const exportPdf = async (data) => {
    const el = pdfRef.current;
    if (!el) return;
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    el.style.display = 'block';
    await new Promise((r) => setTimeout(r, 200));

    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const img = canvas.toDataURL('image/png');
      pdf.addImage(img, 'PNG', 0, 0, pw, ph);
      pdf.save(`Expert-Request-${data.serial_number || 'expert'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      el.style.display = 'none';
    }
  };

  const filteredExperts = experts.filter((exp) => {
    const query = searchTerm.toLowerCase();
    return (
      (exp.name || '').toLowerCase().includes(query) ||
      (exp.specialty || '').toLowerCase().includes(query) ||
      (exp.serial_number || '').toLowerCase().includes(query)
    );
  });

  const cardStyle = {
    background: isDarkMode ? 'rgba(25,35,65,0.85)' : 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,48,135,0.1)'}`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(12px)',
    padding: 30,
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'Cairo, Tajawal, sans-serif',
        paddingTop: 100,
        paddingBottom: 80,
        transition: 'background 0.3s ease',
      }}
    >
      {/* ── Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001d5a 0%, #003087 55%, #005cbf 100%)',
          padding: '50px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 36,
        }}
      >
        <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '20px 20px' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ color: '#fff', fontSize: '2.1rem', fontWeight: 900, marginBottom: 10 }}>
            {isRtl ? 'تسجيل الخبراء والمستشارين' : 'Experts & Consultants Registration'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', maxWidth: 650, margin: '0 auto' }}>
            {isRtl
              ? 'المنظومة الإلكترونية لتسجيل وتصنيف الخبراء والمستشارين للعمل بالتعاون مع الهيئة الوطنية للتخطيط العمراني'
              : 'Electronic system for expert and consultant registration to collaborate with the National Authority for Urban Planning'}
          </p>
        </motion.div>
      </div>

      {/* ── Tabs Container ── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { id: 'info', label: isRtl ? '📖 التوجيهات والمتطلبات' : 'Info & Requirements', icon: <FaClipboardList /> },
            { id: 'form', label: isRtl ? '📝 تقديم طلب جديد' : 'Submit Application', icon: <FaPaperPlane /> },
            { id: 'list', label: isRtl ? '👥 قائمة الخبراء المسجلين' : 'Registered Experts', icon: <FaList /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  background: active ? 'var(--primary)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff'),
                  color: active ? '#fff' : 'var(--text)',
                  boxShadow: active ? '0 4px 12px rgba(0,48,135,0.2)' : 'none',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={cardStyle}>
              <h4 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: 18 }}>
                {isRtl ? 'شروط ومتطلبات التسجيل في منظومة الخبراء' : 'Expert Registration Policy'}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 24 }}>
                {isRtl
                  ? 'ترحب الهيئة الوطنية للتخطيط العمراني بطلبات الانضمام من الخبراء والمستشارين في شتى التخصصات الهندسية والتخطيطية ذات العلاقة بالتنمية المستدامة والتنظيم الحضري. يجب توفر الشروط التالية للنظر في الطلبات:'
                  : 'The National Authority for Urban Planning welcomes registration requests from professional experts and engineering consultants. Please ensure the following conditions are met before applying:'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {[
                  { title: isRtl ? 'الخبرة العملية' : 'Work Experience', text: isRtl ? 'يجب ألا تقل الخبرة المهنية للخبراء والمستشارين عن 7 سنوات في التخصص المطلوبة.' : 'A minimum of 7 years of professional experience in the relevant domain.' },
                  { title: isRtl ? 'المؤهلات العلمية' : 'Degree Requirements', text: isRtl ? 'الحصول على درجة البكالوريوس كحد أدنى من جامعة معترف بها مع إرفاق الشهادات الرسمية.' : 'Minimum Bachelor\'s Degree from an accredited institution with official certificates.' },
                  { title: isRtl ? 'ترخيص مزاولة المهنة' : 'Professional License', text: isRtl ? 'امتلاك إذن مزاولة مهنة ساري المفعول صادر عن نقابة المهندسين أو جهة الاختصاص.' : 'Valid engineering license issued by the Engineers Association or certified entity.' },
                  { title: isRtl ? 'المستندات المطلوبة' : 'Documents Submission', text: isRtl ? 'تحميل السيرة الذاتية المفصلة، وإثبات الهوية الشخصية، والملف الفني الذي يوضح سابقة الأعمال.' : 'A detailed CV, national identity document, and a portfolio showcasing previous works.' },
                ].map((req, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,48,135,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{idx + 1}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.92rem', marginBottom: 2 }}>{req.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.5 }}>{req.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(0,48,135,0.04), rgba(0,92,191,0.02))', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaInfoCircle size={22} color="var(--primary)" />
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text)' }}>
                  {isRtl
                    ? 'بعد إتمام تقديم الطلب، سيصلك رقم مرجعي للطلب ويمكنك تحميل رسالة التقديم الرسمية بصيغة PDF والاحتفاظ بها.'
                    : 'Upon submitting the form, you will receive a reference code to download and print your official application letter as a PDF.'}
                </span>
              </div>
            </motion.div>
          )}

          {/* TAB 2: FORM */}
          {activeTab === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={cardStyle}>
              {submitStatus === 'success' ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <FaCheckCircle size={60} color="#10b981" style={{ marginBottom: 18 }} />
                  <h3 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{isRtl ? 'تم تقديم الطلب بنجاح!' : 'Application Submitted Successfully!'}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.6 }}>{submitMsg}</p>
                  
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => exportPdf(submittedData)}
                      style={{
                        padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff',
                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <FaFilePdf /> {isRtl ? 'تحميل الرسالة الرسمية PDF' : 'Download Official PDF Letter'}
                    </button>
                    <button
                      onClick={() => {
                        setSubmitStatus(null);
                        setFormData(EmptyForm);
                        setUploadedFiles({ cv: null, id_card: null, license: null, degree: null });
                      }}
                      style={{
                        padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                        color: 'var(--text)', fontWeight: 700,
                      }}
                    >
                      {isRtl ? 'تقديم طلب جديد' : 'Submit Another Application'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Header */}
                    <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                      <h4 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{isRtl ? 'بيانات الخبير / المستشار' : 'Expert Personal & Professional Data'}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                        {isRtl ? 'يرجى إدخال البيانات الشخصية والمهنية بكل دقة كما هي مسجلة بالوثائق الرسمية' : 'Enter details precisely as they appear in official identity papers'}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                      {/* Name */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'block' }}>{isRtl ? 'الاسم الكامل باللغة العربية *' : 'Full Arabic Name *'}</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)' }} />
                      </div>

                      {/* Specialty */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'block' }}>{isRtl ? 'التخصص الهندسي/التخطيطي المعتمد *' : 'Certified Specialty *'}</label>
                        <input type="text" name="specialty" required placeholder={isRtl ? 'مثال: تخطيط مدن، مساحة، نظم معلومات جغرافية' : 'e.g. Urban Planning, GIS, Surveying'} value={formData.specialty} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)' }} />
                      </div>

                      {/* Experience */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'block' }}>{isRtl ? 'عدد سنوات الخبرة المهنية *' : 'Years of Experience *'}</label>
                        <input type="number" name="experience_years" required min="7" value={formData.experience_years} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)' }} />
                      </div>

                      {/* Degree */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'block' }}>{isRtl ? 'المؤهل العلمي الأعلى *' : 'Highest Academic Degree *'}</label>
                        <select name="degree" required value={formData.degree} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)' }}>
                          <option value="">{isRtl ? 'اختر المؤهل...' : 'Select degree...'}</option>
                          <option value="دكتوراه">{isRtl ? 'دكتوراه (PhD)' : 'Doctorate / PhD'}</option>
                          <option value="ماجستير">{isRtl ? 'ماجستير (MSc)' : 'Master\'s Degree'}</option>
                          <option value="بكالوريوس">{isRtl ? 'بكالوريوس (BSc)' : 'Bachelor\'s Degree'}</option>
                          <option value="دبلوم عال">{isRtl ? 'دبلوم عال' : 'Higher Diploma'}</option>
                        </select>
                      </div>

                      {/* License */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'block' }}>{isRtl ? 'رقم ترخيص مزاولة المهنة *' : 'Professional License Number *'}</label>
                        <input type="text" name="license_number" required value={formData.license_number} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)' }} />
                      </div>

                      {/* Email */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'block' }}>{isRtl ? 'البريد الإلكتروني *' : 'Email Address *'}</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)', direction: 'ltr' }} />
                      </div>

                      {/* Phone */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'block' }}>{isRtl ? 'رقم الهاتف الأول (واتساب مفضل) *' : 'Primary Phone Number *'}</label>
                        <input type="text" name="phone" required value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)', direction: 'ltr' }} />
                      </div>

                      {/* Address */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, display: 'block' }}>{isRtl ? 'عنوان الإقامة / المكتب *' : 'Office or Residential Address *'}</label>
                        <input type="text" name="address" required value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text)' }} />
                      </div>
                    </div>

                    {/* File Upload Section */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <h5 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{isRtl ? 'تحميل الوثائق المرفقة (بصيغة PDF أو صورة)' : 'Upload Attachments (PDF / Image)'}</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        {[
                          { key: 'cv', label: isRtl ? 'السيرة الذاتية (CV) *' : 'Resume / CV *' },
                          { key: 'id_card', label: isRtl ? 'الهوية الشخصية (جواز سفر / بطاقة) *' : 'ID Card or Passport *' },
                          { key: 'license', label: isRtl ? 'ترخيص مزاولة المهنة *' : 'Professional License *' },
                          { key: 'degree', label: isRtl ? 'المؤهلات العلمية المعتمدة *' : 'Degree / Certificates *' },
                        ].map((fileSpec) => {
                          const fileUploaded = !!uploadedFiles[fileSpec.key];
                          const uploading = uploadingState[fileSpec.key];
                          return (
                            <div
                              key={fileSpec.key}
                              style={{
                                border: `1px dashed ${fileUploaded ? '#10b981' : 'var(--border)'}`,
                                background: fileUploaded ? 'rgba(16,185,129,0.03)' : 'var(--bg-light)',
                                padding: '16px',
                                borderRadius: 12,
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                              }}
                            >
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{fileSpec.label}</div>
                              {uploading ? (
                                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} color="var(--primary)" size={20} />
                              ) : fileUploaded ? (
                                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                                  <FaCheckCircle /> {isRtl ? 'تم الرفع' : 'Uploaded'}
                                </div>
                              ) : (
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                  <FaUpload size={10} /> {isRtl ? 'اختر ملف' : 'Browse File'}
                                  <input type="file" required accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, fileSpec.key)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {submitStatus === 'error' && (
                      <div style={{ padding: '12px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 8, alignItems: 'center', color: '#ef4444', fontSize: '0.86rem', fontWeight: 600 }}>
                        <FaExclamationCircle />
                        <span>{submitMsg}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <button
                        type="submit"
                        disabled={formLoading || Object.values(uploadedFiles).some((x) => !x)}
                        style={{
                          padding: '12px 36px', borderRadius: 12, border: 'none',
                          background: formLoading || Object.values(uploadedFiles).some((x) => !x) ? 'rgba(0,48,135,0.4)' : 'var(--primary)',
                          color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                          display: 'flex', alignItems: 'center', gap: 10, cursor: formLoading ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 14px rgba(0,48,135,0.25)',
                        }}
                      >
                        {formLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaPaperPlane />}
                        {formLoading ? (isRtl ? 'جارٍ الحفظ والرفع...' : 'Submitting...') : (isRtl ? 'تقديم الطلب للجنة الفنية' : 'Submit Application')}
                      </button>
                    </div>

                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* TAB 3: LIST */}
          {activeTab === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
                <h5 style={{ fontWeight: 800, color: 'var(--text)', margin: 0 }}>{isRtl ? 'قائمة الخبراء والمستشارين المسجلين' : 'Certified Experts Registry'}</h5>
                <div style={{ position: 'relative', width: 280 }}>
                  <FaSearch style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: isRtl ? 12 : 'auto', left: isRtl ? 'auto' : 12, color: 'var(--text-muted)' }} size={13} />
                  <input
                    type="text"
                    placeholder={isRtl ? 'بحث باسم الخبير أو التخصص...' : 'Search by name or specialty...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      paddingRight: isRtl ? 32 : 12,
                      paddingLeft: isRtl ? 12 : 32,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-light)',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                    }}
                  />
                </div>
              </div>

              {loadingList ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} size={24} color="var(--primary)" />
                </div>
              ) : filteredExperts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {isRtl ? 'لا يوجد خبراء أو مستشارين مسجلين يطابقون البحث.' : 'No registered experts found matching search.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: isRtl ? 'right' : 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700 }}>
                        <th style={{ padding: '12px 10px' }}>{isRtl ? 'رقم القيد' : 'Serial No.'}</th>
                        <th style={{ padding: '12px 10px' }}>{isRtl ? 'الاسم الكامل' : 'Expert Name'}</th>
                        <th style={{ padding: '12px 10px' }}>{isRtl ? 'التخصص المعتمد' : 'Specialty'}</th>
                        <th style={{ padding: '12px 10px' }}>{isRtl ? 'المؤهل' : 'Degree'}</th>
                        <th style={{ padding: '12px 10px' }}>{isRtl ? 'الخبرة (سنة)' : 'Exp. (Years)'}</th>
                        <th style={{ padding: '12px 10px' }}>{isRtl ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExperts.map((exp, idx) => (
                        <tr key={exp.id || idx} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 700 }}>{exp.serial_number}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{exp.name}</td>
                          <td style={{ padding: '12px 10px' }}>{exp.specialty}</td>
                          <td style={{ padding: '12px 10px' }}>{exp.degree}</td>
                          <td style={{ padding: '12px 10px' }}>{exp.experience_years} {isRtl ? 'سنوات' : 'years'}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: 50,
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background:
                                  exp.status === 'approved' ? 'rgba(16,185,129,0.12)' :
                                  exp.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                color:
                                  exp.status === 'approved' ? '#10b981' :
                                  exp.status === 'rejected' ? '#ef4444' : '#f59e0b',
                              }}
                            >
                              {exp.status === 'approved' ? (isRtl ? 'مقبول / معتمد' : 'Approved') :
                               exp.status === 'rejected' ? (isRtl ? 'مرفوض' : 'Rejected') : (isRtl ? 'تحت الدراسة' : 'Pending')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Hidden PDF Printable Official Letter Template ── */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1, display: 'none' }}>
        <div
          ref={pdfRef}
          style={{
            width: '210mm',
            height: '297mm',
            padding: '24mm 20mm 20mm',
            background: '#ffffff',
            color: '#000000',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '11pt',
            lineHeight: 1.6,
            boxSizing: 'border-box',
            position: 'relative',
          }}
          dir="rtl"
        >
          {/* Header Logos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #003087', paddingBottom: 15, marginBottom: 25 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11pt', fontWeight: 800 }}>دولة ليبيا</div>
              <div style={{ fontSize: '10pt', fontWeight: 700, color: '#4a5568' }}>مجلس الوزراء</div>
              <div style={{ fontSize: '10pt', fontWeight: 700, color: '#003087' }}>الهيئة الوطنية للتخطيط العمراني</div>
            </div>
            <div style={{ width: 65, height: 65 }}>
              <img src={`${window.location.origin}/logo.png`} alt="شعار الهيئة" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ textAlign: 'left', fontSize: '9pt', color: '#718096' }}>
              <div>رقم الإشارة: {submittedData?.serial_number || 'EXP-2026-XXX'}</div>
              <div>التاريخ: {new Date().toLocaleDateString('ar-LY')}</div>
              <div>الموضوع: طلب قيد خبير استشاري</div>
            </div>
          </div>

          {/* Letter Body */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, margin: 0, textDecoration: 'underline' }}>طلب قيد وتسجيل خبير / مستشار هندسي</h4>
          </div>

          <div style={{ marginBottom: 15 }}>
            <span style={{ fontWeight: 800 }}>السيد / رئيس الهيئة الوطنية للتخطيط العمراني</span>
            <br />
            <span>تحية طيبة وبعد،،</span>
          </div>

          <p style={{ textIndent: '15mm', textAlign: 'justify', marginBottom: 20 }}>
            بالإشارة إلى اللوائح والقرارات التنظيمية المعتمدة بالهيئة الوطنية للتخطيط العمراني بشأن تسجيل وتصنيف الكفاءات والخبراء والمستشارين الفنيين للعمل مع الهيئة وإداراتها وفروعها، أتقدم إليكم بطلب القيد والتسجيل في جدول الخبراء المعتمدين لدى الهيئة، وتجدون أدناه البيانات المهنية والعلمية التفصيلية والوثائق الثبوتية المرفقة بطلبي هذا:
          </p>

          {/* Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 25, fontSize: '10.5pt' }}>
            <tbody>
              <tr style={{ border: '1px solid #cbd5e0' }}>
                <td style={{ padding: '8px 12px', background: '#f7fafc', fontWeight: 800, width: '35%', borderRight: '1px solid #cbd5e0' }}>الاسم الكامل للخبـير:</td>
                <td style={{ padding: '8px 12px' }}>{submittedData?.name}</td>
              </tr>
              <tr style={{ border: '1px solid #cbd5e0' }}>
                <td style={{ padding: '8px 12px', background: '#f7fafc', fontWeight: 800, borderRight: '1px solid #cbd5e0' }}>التخصص التخطيطي/الهندسي:</td>
                <td style={{ padding: '8px 12px' }}>{submittedData?.specialty}</td>
              </tr>
              <tr style={{ border: '1px solid #cbd5e0' }}>
                <td style={{ padding: '8px 12px', background: '#f7fafc', fontWeight: 800, borderRight: '1px solid #cbd5e0' }}>المؤهل العلمي الأعلى:</td>
                <td style={{ padding: '8px 12px' }}>{submittedData?.degree}</td>
              </tr>
              <tr style={{ border: '1px solid #cbd5e0' }}>
                <td style={{ padding: '8px 12px', background: '#f7fafc', fontWeight: 800, borderRight: '1px solid #cbd5e0' }}>رقم ترخيص مزاولة المهنة:</td>
                <td style={{ padding: '8px 12px' }}>{submittedData?.license_number}</td>
              </tr>
              <tr style={{ border: '1px solid #cbd5e0' }}>
                <td style={{ padding: '8px 12px', background: '#f7fafc', fontWeight: 800, borderRight: '1px solid #cbd5e0' }}>عدد سنوات الخبرة العملية:</td>
                <td style={{ padding: '8px 12px' }}>{submittedData?.experience_years} سنة فعلية</td>
              </tr>
              <tr style={{ border: '1px solid #cbd5e0' }}>
                <td style={{ padding: '8px 12px', background: '#f7fafc', fontWeight: 800, borderRight: '1px solid #cbd5e0' }}>البريد الإلكتروني للتواصل:</td>
                <td style={{ padding: '8px 12px' }}>{submittedData?.email}</td>
              </tr>
              <tr style={{ border: '1px solid #cbd5e0' }}>
                <td style={{ padding: '8px 12px', background: '#f7fafc', fontWeight: 800, borderRight: '1px solid #cbd5e0' }}>رقم الهاتف / الواتساب:</td>
                <td style={{ padding: '8px 12px' }}>{submittedData?.phone}</td>
              </tr>
              <tr style={{ border: '1px solid #cbd5e0' }}>
                <td style={{ padding: '8px 12px', background: '#f7fafc', fontWeight: 800, borderRight: '1px solid #cbd5e0' }}>عنوان السكن أو المكتب:</td>
                <td style={{ padding: '8px 12px' }}>{submittedData?.address}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ textAlign: 'justify', marginBottom: 35 }}>
            أتعهد بصحة وسلامة جميع البيانات والمستندات المرفقة، وبأن ألتزم بأعلى معايير المهنية والقوانين المنظمة لأعمال التخطيط العمراني في دولة ليبيا. شاكراً لكم حسن تعاونكم واهتمامكم.
          </p>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ fontWeight: 800, textDecoration: 'underline' }}>مقدم الطلب (الخبير)</div>
              <div style={{ marginTop: 25 }}>الاسم: .......................................</div>
              <div style={{ marginTop: 10 }}>التوقيع: ...................................</div>
            </div>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ fontWeight: 800, textDecoration: 'underline' }}>اللجنة الفنية بالهيئة</div>
              <div style={{ marginTop: 25 }}>الحالة: .......................................</div>
              <div style={{ marginTop: 10 }}>التوقيع والختم: .......................</div>
            </div>
          </div>

          {/* Footer Address */}
          <div style={{ position: 'absolute', bottom: 12, left: 20, right: 20, borderTop: '1px solid #e2e8f0', paddingTop: 10, textAlign: 'center', fontSize: '8pt', color: '#718096' }}>
            <span>طرابلس، شارع عمر المختار، مبنى الهيئة الوطنية للتخطيط العمراني - البريد الإلكتروني: info@gupa.gov.ly - هاتف: +218 21 360 0090</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ExpertsRegistration;
