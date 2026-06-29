import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FaBuilding, FaSearch, FaGlobe, FaMapMarkerAlt,
  FaFilePdf, FaPaperPlane, FaCheckCircle,
  FaSpinner, FaExclamationCircle, FaList, FaClipboardList,
} from 'react-icons/fa';
import { MdBusiness } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import './company-registration.css';

// use centralized api service

const ATTACHMENTS = [
  'محضر الاجتماع التأسيسي للشركة',
  'عقد التأسيس',
  'النظام الأساسي للشركة',
  'الرخصة التجارية سارية المفعول – احضار الأصل وقت التسجيل',
  'شهادة القيد بالغرفة التجارية حديثة',
  'شهادة السجل التجاري – احضار الأصل وقت التسجيل',
  'ترخيص مزاولة المهنة من نقابة المهندسين',
  'إفادة من المصرف برقم الحساب الشركة',
  'عقد ملكية مقر الشركة أو المكتب أو عقد أيجار، مقرراً به رسم كروكي',
  'الهيكل الوظيفي للشركة أو المكتب الاستشاري متضمناً قائمة الإدارات والأقسام الفنية وعدد المتخصصين العاملين',
  'إفادة بسداد الضريبي باسم الهيئة الوطنية للتخطيط العمراني',
  'ميزانية حديثة معتمدة من مصلحة الضرائب',
  'إفادة بسداد اشتراكات الضمان الاجتماعي',
  'الملف الفني للشركة موضح فيه الأعمال التي قامت بها الشركة سابقاً',
  'إفادة بخبرة الشركات الأجنبية والمكاتب الاستشارية داخل ليبيا',
  'صورة من اتفاقيات المساندة بين الشركات والمكاتب الاستشارية المتخصصة ونسخة منها، بالإضافة إلى ملف يتضمن الخبرة المهنية والسيرة المساندة واعمال المساحة والتعمير ونظم المعلومات الجغرافية، وقائمة بالطاقم الفني والأعمال المنجزة من قبل المساند',
  'رسالة جميع المستندات موجهة إلى السيد / رئيس الهيئة الوطنية للتخطيط العمراني',
];

const StatusBadge = ({ status }) => {
  const map = {
    approved: { label: 'مقبول', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    pending:  { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    rejected: { label: 'مرفوض', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}>
      {s.label}
    </span>
  );
};

const FormField = ({ label, name, value, onChange, type = 'text', isDark, half = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: half ? '0 0 calc(50% - 8px)' : '1 1 100%', minWidth: 0 }}>
    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.7)' : '#003087', fontFamily: 'Cairo, sans-serif' }}>{label}</label>
    <input
      type={type} name={name} value={value || ''} onChange={onChange}
      style={{
        padding: '9px 12px', borderRadius: 8,
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,48,135,0.2)'}`,
        background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
        color: isDark ? '#fff' : '#1a2850',
        fontSize: '0.88rem', fontFamily: 'Cairo, sans-serif', outline: 'none',
        transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = '#0066cc'}
      onBlur={e => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,48,135,0.2)'}
    />
  </div>
);

const SectionHeader = ({ title, isDark }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${isDark ? 'rgba(0,120,255,0.3)' : 'rgba(0,48,135,0.15)'}` }}>
    <div style={{ width: 4, height: 22, borderRadius: 4, background: 'linear-gradient(135deg,#003087,#0066cc)' }} />
    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: isDark ? '#fff' : '#003087', fontFamily: 'Cairo, sans-serif' }}>{title}</h3>
  </div>
);

const PdfField = ({ label, value, flex = 1 }) => (
  <div style={{ flex, display: 'flex', flexDirection: 'column', gap: 3 }}>
    <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'right', fontFamily: 'Cairo, Arial, sans-serif' }}>{label}</div>
    <div style={{
      border: '1px solid #000', minHeight: 26, padding: '3px 6px',
      fontSize: 10, fontFamily: 'Cairo, Arial, sans-serif', textAlign: 'right',
      background: '#fff', boxSizing: 'border-box',
    }}>{value || ''}</div>
  </div>
);

const PdfRow = ({ fields, gap = 8, mb = 6 }) => (
  <div style={{ display: 'flex', gap, marginBottom: mb, direction: 'rtl' }}>
    {fields.map((f, i) => (
      <PdfField key={i} label={f.label} value={f.value} flex={f.flex || 1} />
    ))}
  </div>
);

const PdfTemplate = React.forwardRef(({ data }, ref) => (
  <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fff' }}>
    {/* Page 1 */}
    <div id="pdf-page-1" style={{
      width: 794,
      height: 1123,
      background: '#fff',
      fontFamily: 'Cairo, Arial, sans-serif',
      direction: 'rtl',
      color: '#000',
      padding: '40px 48px',
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 18, lineHeight: 1.7 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>دولة ليبيا</div>
        <div style={{ fontSize: 13, fontWeight: 800 }}>الهيئة الوطنية للتخطيط العمراني</div>
        <div style={{ fontSize: 12 }}>نموذج تسجيل الشركات والمكاتب الاستشارية</div>
        <div style={{ fontSize: 12 }}>في مشاريع التخطيط العمراني</div>
      </div>

      <PdfRow mb={8} fields={[
        { label: 'تاريخ التسجيل *', value: data.registration_date },
        { label: 'الرقم التسلسلي *', value: data.serial_number },
      ]} />

      <PdfRow mb={8} fields={[
        { label: 'اسم الشركة', value: data.company_name },
        { label: 'نوع النشاط *', value: data.activity_type },
      ]} />

      <PdfRow mb={8} fields={[
        { label: 'تاريخ محضر الاجتماع التأسيسي', value: data.founding_meeting_date },
        { label: 'تاريخ عقد التأسيس', value: data.founding_contract_date },
      ]} />

      <PdfRow mb={8} fields={[
        { label: 'رقم الرخصة التجارية', value: data.commercial_license_number, flex: 2 },
        { label: 'تاريخ صدورها', value: data.commercial_license_issue_date, flex: 1 },
        { label: 'صالحة حتى تاريخ', value: data.commercial_license_expiry, flex: 1 },
      ]} />

      <PdfRow mb={8} fields={[
        { label: 'رقم السجل التجاري', value: data.commercial_registry_number, flex: 2 },
        { label: 'تاريخ صدوره', value: data.commercial_registry_issue_date, flex: 1 },
        { label: 'صالح حتى تاريخ', value: data.commercial_registry_expiry, flex: 1 },
      ]} />

      <PdfRow mb={8} fields={[
        { label: 'رقم القيد بالغرفة التجارية', value: data.chamber_registration_number, flex: 2 },
        { label: 'تاريخ صدوره', value: data.chamber_registration_issue_date, flex: 1 },
        { label: 'صالح حتى تاريخ', value: data.chamber_registration_expiry, flex: 1 },
      ]} />

      <PdfRow mb={8} fields={[
        { label: 'رأس المال المكتتب به', value: data.subscribed_capital },
        { label: 'رأس المال المدفوع', value: data.paid_capital },
        { label: 'عدد المساهمين', value: data.shareholders_count },
      ]} />

      <PdfRow mb={8} fields={[
        { label: 'سنوات الخبرة', value: data.experience_years },
        { label: 'جنسية الشركة', value: data.company_nationality },
        { label: 'رقم اذن مزاولة المهنة', value: data.professional_license_number },
      ]} />

      <PdfRow mb={8} fields={[
        { label: 'رقم الملف الضريبي', value: data.tax_file_number },
        { label: 'سنة آخر ميزانية معتمدة', value: data.last_approved_budget },
        { label: 'رقم ملف الضمان الاجتماعي', value: data.social_insurance_number },
      ]} />

      <PdfRow mb={10} fields={[
        { label: 'اسم المصرف', value: data.bank_name },
        { label: 'الفرع', value: data.bank_branch },
        { label: 'رقم الحساب', value: data.bank_account },
      ]} />

      <div style={{ position: 'absolute', bottom: 30, left: 48, right: 48 }}>
        <div style={{ fontSize: 9, color: '#555', textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: 6 }}>
          بند التعبئة من قبل الهيئة الوطنية للتخطيط العمراني
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, textAlign: 'center', marginTop: 4, color: '#000' }}>
          ** لا تقبل طلبات تسجيل الشركات والمكاتب الاستشارية التي لا تُقدم خبرتها عن 5 سنوات
        </div>
      </div>
    </div>

    {/* Page 2 */}
    <div id="pdf-page-2" style={{
      width: 794,
      height: 1123,
      background: '#fff',
      fontFamily: 'Cairo, Arial, sans-serif',
      direction: 'rtl',
      color: '#000',
      padding: '40px 48px',
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      <PdfRow mb={8} fields={[
        { label: 'اسم المفوض', value: data.agent_name },
        { label: 'البريد الالكتروني', value: data.email },
        { label: 'عنوان الشركة', value: data.address },
      ]} />

      <PdfRow mb={18} fields={[
        { label: 'رقم الهاتف', value: data.phone1 },
        { label: 'رقم الهاتف', value: data.phone2 },
        { label: 'رقم الهاتف', value: data.phone3 },
      ]} />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, textAlign: 'right' }}>المرفقات :</div>
        {[
          'محضر الاجتماع التأسيسي للشركة .',
          'عقد التأسيس .',
          'النظام الأساسي للشركة .',
          'الرخصة التجارية سارية المفعول –احضار الاصل وقت التسجيل .',
          'شهادة القيد بالغرفة التجارية حديثة.',
          'شهادة السجل التجاري – احضار الاصل وقت التسجيل .',
          'ترخيص مزاولة المهنة .',
          'إذن مزاولة المهنة من نقابة المهندسين',
          'إفادة من المصرف برقم الحساب الشركة',
          'عقد ملكية مقر الشركة أو المكتب أو عقد أيجار ، مرفق به رسم كروكي',
          'الهيكل الوظيفي للشركة أو المكتب الاستشاري متضمناً قائمة الإدارات او الأقسام الفنية وعدد المتخصصين العاملين.',
          'إفادة بسداد الضريبي باسم الهيئة الوطنية للتخطيط العمراني .',
          'ميزانية حديثة معتمدة من مصلحة الضرائب.',
          'إفادة بسداد اشتراكات الضمان الاجتماعي.',
          'الملف الفني للشركة موضح فيه الأعمال التي قامت بها الشركة سابقاً ،',
          'إفادة بخبر الشركات الأجنبية والمكاتب الاستشارية داخل ليبيا',
          'صورة من اتفاقيات المساندة مع الشركات والمكاتب الاستشارية المتخصصة ونسخة منها ، بالإضافة الى ملف يتضمن الخبرة المهنية المساند في مجال التخطيط العمراني والأعمال المساحية ونظم المعلومات الجغرافية ، وقائمة بالطاقم الفني والاعمال المنجزة من قبل المساند .',
          'رسالة جميع المستندات موجهه الى السيد / رئيس الهيئة الوطنية للتخطيط العمراني .',
        ].map((att, i) => (
          <div key={i} style={{
            fontSize: 10, marginBottom: 4,
            display: 'flex', gap: 4, direction: 'rtl', textAlign: 'right',
            fontFamily: 'Cairo, Arial, sans-serif', lineHeight: 1.4,
          }}>
            <span style={{ minWidth: 22, fontWeight: 700, flexShrink: 0 }}>{i + 1}-</span>
            <span>{att}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 40, right: 48 }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>اعتماد النموذج</div>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#555' }}>................................</div>
      </div>
    </div>
  </div>
));

const CompanyRegistration = () => {
  const { isDarkMode } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [formLoading, setFormLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const pdfRef = useRef(null);

  const emptyForm = {
    company_name: '', activity_type: '', country: '', website: '',
    founding_meeting_date: '', founding_contract_date: '',
    commercial_license_number: '', commercial_license_issue_date: '', commercial_license_expiry: '',
    commercial_registry_number: '', commercial_registry_issue_date: '', commercial_registry_expiry: '',
    chamber_registration_number: '', chamber_registration_issue_date: '', chamber_registration_expiry: '',
    subscribed_capital: '', paid_capital: '', shareholders_count: '', experience_years: '',
    company_nationality: '', professional_license_number: '', tax_file_number: '',
    social_insurance_number: '', last_approved_budget: '',
    bank_name: '', bank_branch: '', bank_account: '',
    agent_name: '', email: '', address: '', phone1: '', phone2: '', phone3: '',
    registration_date: new Date().toISOString().split('T')[0],
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await api.getCompanies();
      const list = Array.isArray(data) ? data : (data.data || []);
      setCompanies(list.filter(c => c.status === 'approved'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = companies.filter(c =>
    (c.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.country || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.website || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setFormLoading(true);
    setSubmitStatus(null);
    try {
      const res = await api.createCompany(formData);
      setSubmitStatus('success');
      const serial = res?.serial_number || res?.data?.serial_number;
      setSubmitMsg(`تم تقديم طلب التسجيل بنجاح! رقم الطلب: ${serial}`);
      setSubmittedData({ ...formData, serial_number: serial });
    } catch (err) {
      setSubmitStatus('error');
      setSubmitMsg(err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally { setFormLoading(false); }
  };

  const exportPdf = async data => {
    const el = pdfRef.current;
    if (!el) return;
    el.style.position = 'fixed';
    el.style.top = '-9999px';
    el.style.display = 'block';
    await new Promise(r => setTimeout(r, 200));
    try {
      const page1 = el.querySelector('#pdf-page-1');
      const page2 = el.querySelector('#pdf-page-2');
      const canvas1 = await html2canvas(page1, { scale: 2, useCORS: true });
      const canvas2 = await html2canvas(page2, { scale: 2, useCORS: true });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      const img1 = canvas1.toDataURL('image/png');
      pdf.addImage(img1, 'PNG', 0, 0, pw, ph);

      pdf.addPage();
      const img2 = canvas2.toDataURL('image/png');
      pdf.addImage(img2, 'PNG', 0, 0, pw, ph);

      pdf.save(`${(data.company_name || 'registration').replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      el.style.display = 'none';
    }
  };

  const card = {
    background: isDarkMode ? 'rgba(25,35,65,0.85)' : 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,48,135,0.1)'}`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(12px)',
  };

  const tabStyle = tab => ({
    padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
    fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.9rem',
    transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 8,
    background: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.15)',
    color: activeTab === tab ? '#003087' : '#fff',
    border: `1px solid ${activeTab === tab ? '#fff' : 'rgba(255,255,255,0.25)'}`,
    boxShadow: activeTab === tab ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
  });

  return (
    <div className="company-registration-page" style={{
      minHeight: '100vh',
      background: isDarkMode ? 'linear-gradient(135deg,#0a0f1e,#0d1635,#0a1525)' : 'linear-gradient(135deg,#001d5a 0%,#003087 50%,#0066cc 100%)',
      paddingTop: 90, paddingBottom: 60, direction: 'rtl', fontFamily: 'Cairo, Tajawal, sans-serif',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16,
            background: 'rgba(255,255,255,0.18)',
            padding: '8px 20px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.35)',
          }}>
            <MdBusiness style={{ color: '#fff', fontSize: '1.1rem' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>الهيئة الوطنية للتخطيط العمراني</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
            تسجيل الشركات والمكاتب الاستشارية
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', maxWidth: 600, margin: '0 auto' }}>
            في مشاريع التخطيط العمراني — سجّل شركتك وابدأ رحلة الشراكة مع الهيئة الوطنية
          </p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={tabStyle('list')} onClick={() => setActiveTab('list')}><FaList /> قائمة الشركات المسجلة</button>
          <button style={tabStyle('form')} onClick={() => setActiveTab('form')}><FaClipboardList /> نموذج تسجيل جديد</button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Search bar */}
              <div style={{ ...card, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <FaSearch style={{ color: '#0066cc', flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث باسم الشركة أو الدولة..."
                  style={{ flex: 1, border: 'none', background: 'transparent', color: isDarkMode ? '#fff' : '#1a2850', fontSize: '0.9rem', fontFamily: 'Cairo, sans-serif', outline: 'none' }} />
                <span style={{ fontSize: '0.8rem', color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,48,135,0.4)', whiteSpace: 'nowrap' }}>{filtered.length} شركة</span>
              </div>

              {/* Table */}
              <div style={card}>
                <div className="registration-grid-table" style={{
                  fontWeight: 800, fontSize: '0.82rem',
                  background: isDarkMode ? 'rgba(0,48,135,0.25)' : 'rgba(0,48,135,0.07)',
                  borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,48,135,0.1)'}`,
                  color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#003087', fontFamily: 'Cairo, sans-serif',
                }}>
                  <span>رقم</span><span>اسم الشركة</span><span>الدولة</span><span>الموقع الإلكتروني</span><span>الحالة</span>
                </div>
                {loading ? (
                  <div style={{ padding: 60, textAlign: 'center' }}>
                    <FaSpinner style={{ fontSize: '2rem', color: '#0066cc', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center', color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,48,135,0.4)' }}>لا توجد نتائج</div>
                ) : filtered.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                    className="registration-grid-table"
                    style={{
                      borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,48,135,0.06)'}`,
                      cursor: 'default', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,48,135,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontWeight: 700, color: '#0066cc' }}>{i + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,rgba(0,48,135,0.12),rgba(0,102,204,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0066cc', flexShrink: 0 }}>
                        <FaBuilding style={{ fontSize: '0.9rem' }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.87rem', color: isDarkMode ? '#fff' : '#1a2850', fontFamily: 'Cairo, sans-serif' }}>{c.company_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaMapMarkerAlt style={{ color: '#0066cc', fontSize: '0.7rem' }} />
                      <span style={{ fontSize: '0.84rem', color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#4a5568' }}>{c.country || '—'}</span>
                    </div>
                    <div>
                      {c.website ? (
                        <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0066cc', textDecoration: 'none', fontSize: '0.81rem' }}>
                          <FaGlobe style={{ fontSize: '0.7rem' }} />
                          {c.website.replace(/https?:\/\//, '').replace('www.', '').slice(0, 28)}
                        </a>
                      ) : <span style={{ color: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', fontSize: '0.81rem' }}>—</span>}
                    </div>
                    <StatusBadge status={c.status} />
                  </motion.div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '12px 18px', ...card, fontSize: '0.79rem', color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,48,135,0.5)' }}>
                المصدر: اللجنة المشكلة بقرار رئيس الهيئة (96-2024)
              </div>
            </motion.div>
          )}

          {activeTab === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {submitStatus === 'success' && submittedData ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ ...card, padding: 40, textAlign: 'center' }}>
                  <FaCheckCircle style={{ fontSize: '3.5rem', color: '#10b981', marginBottom: 14 }} />
                  <h2 style={{ color: isDarkMode ? '#fff' : '#003087', fontFamily: 'Cairo, sans-serif', margin: '0 0 10px' }}>تم تقديم الطلب بنجاح!</h2>
                  <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,48,135,0.6)', marginBottom: 24 }}>{submitMsg}</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => exportPdf(submittedData)} style={{
                      padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff',
                      fontFamily: 'Cairo, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
                    }}><FaFilePdf /> تحميل PDF</button>
                    <button onClick={() => { setSubmitStatus(null); setSubmittedData(null); setFormData(emptyForm); }} style={{
                      padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,48,135,0.1)',
                      color: isDarkMode ? '#fff' : '#003087', fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                    }}>تقديم طلب جديد</button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Form heading */}
                    <div style={{ ...card, padding: '20px 28px', background: 'linear-gradient(135deg,#003087,#0066cc)', border: 'none', textAlign: 'center', color: '#fff' }}>
                      <div style={{ fontSize: '0.82rem', opacity: 0.8 }}>دولة ليبيا</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4 }}>الهيئة الوطنية للتخطيط العمراني</div>
                      <div style={{ fontSize: '0.88rem', opacity: 0.9, marginTop: 2 }}>نموذج تسجيل الشركات والمكاتب الاستشارية في مشاريع التخطيط العمراني</div>
                    </div>

                    {/* Basic */}
                    <div className="registration-card" style={card}>
                      <SectionHeader title="البيانات الأساسية" isDark={isDarkMode} />
                      <div className="form-fields-flex">
                        <FormField label="تاريخ التسجيل" name="registration_date" type="date" value={formData.registration_date} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="اسم الشركة *" name="company_name" value={formData.company_name} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="نوع النشاط *" name="activity_type" value={formData.activity_type} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="جنسية الشركة / الدولة" name="country" value={formData.country} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="الموقع الإلكتروني" name="website" value={formData.website} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="تخصص الشركة" name="company_nationality" value={formData.company_nationality} onChange={handleChange} isDark={isDarkMode} half />
                      </div>
                    </div>

                    {/* Founding */}
                    <div className="registration-card" style={card}>
                      <SectionHeader title="وثائق التأسيس" isDark={isDarkMode} />
                      <div className="form-fields-flex">
                        <FormField label="تاريخ محضر الاجتماع التأسيسي" name="founding_meeting_date" type="date" value={formData.founding_meeting_date} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="تاريخ عقد التأسيس" name="founding_contract_date" type="date" value={formData.founding_contract_date} onChange={handleChange} isDark={isDarkMode} half />
                      </div>
                    </div>

                    {/* License & Registry */}
                    <div className="registration-card" style={card}>
                      <SectionHeader title="الرخصة التجارية والسجلات" isDark={isDarkMode} />
                      {[
                        { label: 'الرخصة التجارية', num: 'commercial_license_number', issue: 'commercial_license_issue_date', exp: 'commercial_license_expiry' },
                        { label: 'السجل التجاري', num: 'commercial_registry_number', issue: 'commercial_registry_issue_date', exp: 'commercial_registry_expiry' },
                        { label: 'القيد بالغرفة التجارية', num: 'chamber_registration_number', issue: 'chamber_registration_issue_date', exp: 'chamber_registration_expiry' },
                      ].map((item, i) => (
                        <div key={i} style={{ marginBottom: i < 2 ? 20 : 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,48,135,0.45)', marginBottom: 10, fontFamily: 'Cairo, sans-serif' }}>{item.label}</div>
                          <div className="form-fields-flex">
                            <FormField label="الرقم" name={item.num} value={formData[item.num]} onChange={handleChange} isDark={isDarkMode} half />
                            <FormField label="تاريخ الإصدار" name={item.issue} type="date" value={formData[item.issue]} onChange={handleChange} isDark={isDarkMode} half />
                            <FormField label="صالح حتى" name={item.exp} type="date" value={formData[item.exp]} onChange={handleChange} isDark={isDarkMode} half />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Capital */}
                    <div className="registration-card" style={card}>
                      <SectionHeader title="رأس المال والخبرة" isDark={isDarkMode} />
                      <div className="form-fields-flex">
                        <FormField label="رأس المال المكتتب به" name="subscribed_capital" value={formData.subscribed_capital} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="رأس المال المدفوع" name="paid_capital" value={formData.paid_capital} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="عدد المساهمين" name="shareholders_count" value={formData.shareholders_count} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="سنوات الخبرة" name="experience_years" value={formData.experience_years} onChange={handleChange} isDark={isDarkMode} half />
                      </div>
                    </div>

                    {/* Professional & Tax */}
                    <div className="registration-card" style={card}>
                      <SectionHeader title="بيانات المهنة والضرائب" isDark={isDarkMode} />
                      <div className="form-fields-flex">
                        <FormField label="رقم إذن مزاولة المهنة" name="professional_license_number" value={formData.professional_license_number} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="رقم الملف الضريبي" name="tax_file_number" value={formData.tax_file_number} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="رقم ملف الضمان الاجتماعي" name="social_insurance_number" value={formData.social_insurance_number} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="سنة آخر ميزانية معتمدة" name="last_approved_budget" value={formData.last_approved_budget} onChange={handleChange} isDark={isDarkMode} half />
                      </div>
                    </div>

                    {/* Bank */}
                    <div className="registration-card" style={card}>
                      <SectionHeader title="البيانات البنكية" isDark={isDarkMode} />
                      <div className="form-fields-flex">
                        <FormField label="اسم المصرف" name="bank_name" value={formData.bank_name} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="الفرع" name="bank_branch" value={formData.bank_branch} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="رقم الحساب" name="bank_account" value={formData.bank_account} onChange={handleChange} isDark={isDarkMode} half />
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="registration-card" style={card}>
                      <SectionHeader title="بيانات التواصل" isDark={isDarkMode} />
                      <div className="form-fields-flex">
                        <FormField label="اسم المفوض" name="agent_name" value={formData.agent_name} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="البريد الإلكتروني" name="email" type="email" value={formData.email} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="عنوان الشركة" name="address" value={formData.address} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="رقم الهاتف الأول" name="phone1" value={formData.phone1} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="رقم الهاتف الثاني" name="phone2" value={formData.phone2} onChange={handleChange} isDark={isDarkMode} half />
                        <FormField label="رقم الهاتف الثالث" name="phone3" value={formData.phone3} onChange={handleChange} isDark={isDarkMode} half />
                      </div>
                    </div>

                    {/* Attachments */}
                    <div className="registration-card" style={card}>
                      <SectionHeader title="المرفقات المطلوبة" isDark={isDarkMode} />
                      <p style={{ fontSize: '0.82rem', color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,48,135,0.5)', marginBottom: 16, fontFamily: 'Cairo, sans-serif' }}>
                        يجب إحضار جميع الوثائق التالية عند التقديم:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ATTACHMENTS.map((att, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 10,
                            background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,48,135,0.03)',
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,48,135,0.06)'}`,
                          }}>
                            <span style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#003087,#0066cc)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.73rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ fontSize: '0.84rem', color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#1a2850', fontFamily: 'Cairo, sans-serif', lineHeight: 1.5 }}>{att}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ marginTop: 14, fontSize: '0.79rem', fontWeight: 700, color: '#ef4444', fontFamily: 'Cairo, sans-serif', padding: '10px 14px', background: 'rgba(239,68,68,0.07)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.18)' }}>
                        ** لا تُقبل طلبات تسجيل الشركات والمكاتب الاستشارية التي لا تُقدم خبرتها عن 5 سنوات
                      </p>
                    </div>

                    {submitStatus === 'error' && (
                      <div style={{ padding: '13px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <FaExclamationCircle style={{ color: '#ef4444' }} />
                        <span style={{ color: '#ef4444', fontFamily: 'Cairo, sans-serif', fontSize: '0.88rem' }}>{submitMsg}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', paddingBottom: 10 }}>
                      <button type="submit" disabled={formLoading} style={{
                        padding: '14px 36px', borderRadius: 14, border: 'none', cursor: formLoading ? 'not-allowed' : 'pointer',
                        background: formLoading ? 'rgba(0,48,135,0.4)' : 'linear-gradient(135deg,#003087,#0066cc)',
                        color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: '1rem',
                        display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: formLoading ? 'none' : '0 6px 20px rgba(0,48,135,0.35)',
                      }}>
                        {formLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaPaperPlane />}
                        {formLoading ? 'جارٍ الإرسال...' : 'تقديم طلب التسجيل'}
                      </button>
                      <button type="button" onClick={() => {
                        const link = document.createElement('a');
                        link.href = 'http://localhost:5000/uploads/company_registration_template.pdf';
                        link.download = 'نموذج_تسجيل_الشركات_والمكاتب_الاستشارية.pdf';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }} style={{
                        padding: '14px 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff',
                        fontFamily: 'Cairo, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <FaFilePdf /> تحميل نموذج PDF
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden PDF template */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1, display: 'none' }}>
        <PdfTemplate ref={pdfRef} data={submittedData || formData} />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CompanyRegistration;
