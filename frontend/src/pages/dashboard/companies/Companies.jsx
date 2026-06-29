import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { api } from '../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBuilding, FaSearch, FaFilter, FaFilePdf, FaCheck, FaTimes,
  FaTrash, FaEye, FaSpinner, FaGlobe, FaMapMarkerAlt, FaChevronDown,
  FaExclamationTriangle
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DataTable from '../../../components/DataTable';

// uses centralized `api` service

// ─── Toast Notification ───────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div style={{
    position: 'fixed', top: '1.5rem', right: '1.5rem',
    zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem'
  }}>
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.85rem 1.25rem', borderRadius: '12px',
            background: t.type === 'success' ? 'linear-gradient(135deg,#0d6b3b,#1a9f5a)'
              : t.type === 'error' ? 'linear-gradient(135deg,#8b1a1a,#c0392b)'
              : 'linear-gradient(135deg,#0a3080,#1a5fcc)',
            color: '#fff', fontSize: '0.9rem', fontFamily: "'Cairo', sans-serif",
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '260px',
            border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
            direction: 'rtl'
          }}
          onClick={() => removeToast(t.id)}
        >
          {t.type === 'success' ? <FaCheck /> : t.type === 'error' ? <FaTimes /> : <FaExclamationTriangle />}
          <span>{t.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    approved:  { label: 'مقبول',        bg: 'rgba(16,185,129,0.18)', color: '#10b981', border: 'rgba(16,185,129,0.4)' },
    pending:   { label: 'قيد المراجعة', bg: 'rgba(245,158,11,0.18)', color: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
    rejected:  { label: 'مرفوض',        bg: 'rgba(239,68,68,0.18)',  color: '#ef4444', border: 'rgba(239,68,68,0.4)'  },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.3rem 0.9rem', borderRadius: '999px',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Cairo', sans-serif",
      whiteSpace: 'nowrap'
    }}>
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: s.color, display: 'inline-block',
        boxShadow: `0 0 6px ${s.color}`
      }} />
      {s.label}
    </span>
  );
};

// ─── Field Display ────────────────────────────────────────────────────────────
const Field = ({ label, value, icon, fullWidth }) => (
  <div style={{
    gridColumn: fullWidth ? '1 / -1' : 'span 1',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', padding: '0.75rem 1rem',
    display: 'flex', flexDirection: 'column', gap: '0.25rem'
  }}>
    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Cairo', sans-serif" }}>
      {icon && <span style={{ marginLeft: '0.3rem' }}>{icon}</span>}{label}
    </span>
    <span style={{
      fontSize: '0.88rem', color: '#fff', fontWeight: 600,
      fontFamily: "'Cairo', sans-serif", wordBreak: 'break-word'
    }}>
      {value || <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>—</span>}
    </span>
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

// ─── PDF Template (hidden) ────────────────────────────────────────────────────
const PdfTemplate = React.forwardRef(({ company }, ref) => {
  const data = company || {};
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fff', position: 'absolute', left: '-9999px', top: 0 }}>
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

        {/* Row 1: تاريخ التسجيل | الرقم التسلسلي */}
        <PdfRow mb={8} fields={[
          { label: 'تاريخ التسجيل *', value: data.registration_date },
          { label: 'الرقم التسلسلي *', value: data.serial_number },
        ]} />

        {/* Row 2: اسم الشركة | نوع النشاط */}
        <PdfRow mb={8} fields={[
          { label: 'اسم الشركة', value: data.company_name },
          { label: 'نوع النشاط *', value: data.activity_type },
        ]} />

        {/* Row 3: تاريخ محضر التأسيس | تاريخ عقد التأسيس */}
        <PdfRow mb={8} fields={[
          { label: 'تاريخ محضر الاجتماع التأسيسي', value: data.founding_meeting_date },
          { label: 'تاريخ عقد التأسيس', value: data.founding_contract_date },
        ]} />

        {/* Row 4: رقم الرخصة التجارية (3 cols) */}
        <PdfRow mb={8} fields={[
          { label: 'رقم الرخصة التجارية', value: data.commercial_license_number, flex: 2 },
          { label: 'تاريخ صدورها', value: data.commercial_license_issue_date, flex: 1 },
          { label: 'صالحة حتى تاريخ', value: data.commercial_license_expiry, flex: 1 },
        ]} />

        {/* Row 5: رقم السجل التجاري (3 cols) */}
        <PdfRow mb={8} fields={[
          { label: 'رقم السجل التجاري', value: data.commercial_registry_number, flex: 2 },
          { label: 'تاريخ صدوره', value: data.commercial_registry_issue_date, flex: 1 },
          { label: 'صالح حتى تاريخ', value: data.commercial_registry_expiry, flex: 1 },
        ]} />

        {/* Row 6: رقم القيد بالغرفة التجارية (3 cols) */}
        <PdfRow mb={8} fields={[
          { label: 'رقم القيد بالغرفة التجارية', value: data.chamber_registration_number, flex: 2 },
          { label: 'تاريخ صدوره', value: data.chamber_registration_issue_date, flex: 1 },
          { label: 'صالح حتى تاريخ', value: data.chamber_registration_expiry, flex: 1 },
        ]} />

        {/* Row 7: رأس المال المكتتب | رأس المال المدفوع | عدد المساهمين */}
        <PdfRow mb={8} fields={[
          { label: 'رأس المال المكتتب به', value: data.subscribed_capital },
          { label: 'رأس المال المدفوع', value: data.paid_capital },
          { label: 'عدد المساهمين', value: data.shareholders_count },
        ]} />

        {/* Row 8: سنوات الخبرة | جنسية الشركة | رقم اذن مزاولة المهنة */}
        <PdfRow mb={8} fields={[
          { label: 'سنوات الخبرة', value: data.experience_years },
          { label: 'جنسية الشركة', value: data.company_nationality },
          { label: 'رقم اذن مزاولة المهنة', value: data.professional_license_number },
        ]} />

        {/* Row 9: رقم الملف الضريبي | سنة آخر ميزانية | رقم ملف الضمان */}
        <PdfRow mb={8} fields={[
          { label: 'رقم الملف الضريبي', value: data.tax_file_number },
          { label: 'سنة آخر ميزانية معتمدة', value: data.last_approved_budget },
          { label: 'رقم ملف الضمان الاجتماعي', value: data.social_insurance_number },
        ]} />

        {/* Row 10: اسم المصرف | الفرع | رقم الحساب */}
        <PdfRow mb={10} fields={[
          { label: 'اسم المصرف', value: data.bank_name },
          { label: 'الفرع', value: data.bank_branch },
          { label: 'رقم الحساب', value: data.bank_account },
        ]} />

        {/* Footer note page 1 */}
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
        {/* Row 11: اسم المفوض | البريد الالكتروني | عنوان الشركة */}
        <PdfRow mb={8} fields={[
          { label: 'اسم المفوض', value: data.agent_name },
          { label: 'البريد الالكتروني', value: data.email },
          { label: 'عنوان الشركة', value: data.address },
        ]} />

        {/* Row 12: رقم الهاتف × 3 */}
        <PdfRow mb={18} fields={[
          { label: 'رقم الهاتف', value: data.phone1 },
          { label: 'رقم الهاتف', value: data.phone2 },
          { label: 'رقم الهاتف', value: data.phone3 },
        ]} />

        {/* Attachments */}
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

        {/* Signature */}
        <div style={{ position: 'absolute', bottom: 40, right: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>اعتماد النموذج</div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#555' }}>................................</div>
        </div>
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Companies() {
  const { isDarkMode } = useTheme();

  // Data state
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // UI state
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(null);

  const pdfRef = useRef(null);
  const toastId = useRef(0);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Fetch stats ──────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await api.getCompaniesSummary();
      setStats(data);
    } catch {
      // fallback computed from list
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch companies ──────────────────────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCompanies();
      let list = Array.isArray(data) ? data : (data.companies || data.data || []);
      if (filter !== 'all') list = list.filter(c => c.status === filter);
      setCompanies(list);
    } catch (err) {
      addToast('فشل تحميل بيانات الشركات', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  // ── Filtered + searched ──────────────────────────────────────────────────────
  const displayed = companies.filter(c =>
    !search || (c.company_name || '').toLowerCase().includes(search.toLowerCase())
  );
  const pageData = displayed.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(displayed.length / limit) || 1;

  // ── Status change ─────────────────────────────────────────────────────────────
  const changeStatus = async (id, status) => {
    setActionLoading(prev => ({ ...prev, [id]: status }));
    try {
      await api.updateCompanyStatus(id, { status, notes: statusNote });
      addToast(status === 'approved' ? 'تم قبول الشركة بنجاح' : 'تم رفض الشركة', status === 'approved' ? 'success' : 'error');
      setShowNoteInput(null);
      setStatusNote('');
      if (selectedCompany?.id === id || selectedCompany?._id === id) {
        setSelectedCompany(prev => ({ ...prev, status, notes: statusNote }));
      }
      await fetchCompanies();
      await fetchStats();
    } catch {
      addToast('فشل تغيير الحالة', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteCompany = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      await api.deleteCompany(id);
      addToast('تم حذف الشركة بنجاح', 'success');
      setDeleteTarget(null);
      if (modalOpen && (selectedCompany?.id === id || selectedCompany?._id === id)) {
        setModalOpen(false);
        setSelectedCompany(null);
      }
      await fetchCompanies();
      await fetchStats();
    } catch {
      addToast('فشل حذف الشركة', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  // ── PDF Export ────────────────────────────────────────────────────────────────
  const exportPdf = async (company) => {
    setPdfLoading(true);
    try {
      const el = pdfRef.current;
      if (!el) return;
      
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

      pdf.save(`company_${company.company_name || company.id}.pdf`);
      addToast('تم تصدير الملف بنجاح', 'success');
    } catch (err) {
      console.error(err);
      addToast('فشل تصدير PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────────
  const isDark = isDarkMode;
  const glass = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,48,135,0.12)',
    borderRadius: '16px',
    backdropFilter: 'blur(12px)',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,48,135,0.08)',
  };
  const text = isDark ? '#f0f4ff' : '#0a1a3b';
  const subText = isDark ? 'rgba(240,244,255,0.55)' : 'rgba(10,26,59,0.5)';

  const btn = (bg, hoverBg, color = '#fff') => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
    background: bg, color, fontFamily: "'Cairo', sans-serif",
    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s', whiteSpace: 'nowrap'
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-LY') : '—';
  const getId = (c) => c?.id || c?._id;

  const filterTabs = [
    { key: 'all',      label: 'الكل' },
    { key: 'pending',  label: 'قيد المراجعة' },
    { key: 'approved', label: 'مقبول' },
    { key: 'rejected', label: 'مرفوض' },
  ];

  const statCards = [
    { label: 'إجمالي الشركات', value: stats.total.toLocaleString('ar'),    color: '#003087', icon: <FaBuilding /> },
    { label: 'قيد المراجعة',  value: stats.pending.toLocaleString('ar'),  color: '#f59e0b', icon: <FaFilter /> },
    { label: 'مقبول',          value: stats.approved.toLocaleString('ar'), color: '#10b981', icon: <FaCheck />  },
    { label: 'مرفوض',          value: stats.rejected.toLocaleString('ar'), color: '#ef4444', icon: <FaTimes />  },
  ];

  const columns = [
    {
      key: 'id',
      label: '#',
      style: { width: 60, color: '#aaa', fontWeight: 700 },
      render: (_, row, i) => (page - 1) * limit + i + 1,
    },
    {
      key: 'company_name',
      label: 'اسم الشركة',
      sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg,#003087,#1a5fcc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', color: '#fff', flexShrink: 0
          }}>
            <FaBuilding />
          </div>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: text, fontFamily: "'Cairo', sans-serif" }}>
            {val}
          </span>
        </div>
      ),
    },
    {
      key: 'country',
      label: 'الدولة',
      sortable: true,
      render: (val) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <FaMapMarkerAlt style={{ fontSize: '0.75rem', color: '#ef4444' }} />
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'activity_type',
      label: 'نوع النشاط',
      sortable: true,
    },
    {
      key: 'registration_date',
      label: 'تاريخ التسجيل',
      sortable: true,
      render: (val, row) => formatDate(val || row.created_at),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: '_actions',
      label: 'الإجراءات',
      style: { width: 220, textAlign: 'center' },
      render: (_, row) => {
        const id = getId(row);
        const isLoading = actionLoading[id];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="mn-icon-btn"
              style={{ color: '#3b82f6', borderColor: '#3b82f655', background: 'transparent' }}
              onClick={() => { setSelectedCompany(row); setModalOpen(true); setShowNoteInput(null); setStatusNote(''); }}
              title="عرض التفاصيل"
            >
              <FaEye size={12} />
            </button>
            {row.status !== 'approved' && (
              <button
                className="mn-icon-btn"
                style={{ color: '#10b981', borderColor: '#10b98155', background: 'transparent' }}
                onClick={() => { setShowNoteInput(`approve-${id}`); setStatusNote(''); }}
                disabled={!!isLoading}
                title="قبول"
              >
                {isLoading === 'approved' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaCheck size={12} />}
              </button>
            )}
            {row.status !== 'rejected' && (
              <button
                className="mn-icon-btn"
                style={{ color: '#ef4444', borderColor: '#ef444455', background: 'transparent' }}
                onClick={() => { setShowNoteInput(`reject-${id}`); setStatusNote(''); }}
                disabled={!!isLoading}
                title="رفض"
              >
                {isLoading === 'rejected' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaTimes size={12} />}
              </button>
            )}
            <button
              className="mn-icon-btn"
              style={{ color: '#a855f7', borderColor: '#a855f755', background: 'transparent' }}
              onClick={() => { setSelectedCompany(row); setTimeout(() => exportPdf(row), 100); }}
              disabled={pdfLoading}
              title="تصدير PDF"
            >
              {pdfLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaFilePdf size={12} />}
            </button>
            <button
              className="mn-icon-btn"
              style={{ color: '#ef4444', borderColor: '#ef444455', background: 'transparent' }}
              onClick={() => setDeleteTarget(row)}
              disabled={!!isLoading}
              title="حذف"
            >
              {isLoading === 'delete' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaTrash size={12} />}
            </button>
          </div>
        );
      },
    },
  ];

  const filtersJSX = (
    <div className="d-flex align-items-center gap-2">
      <select
        className="mn-filter-select"
        value={filter}
        onChange={e => { setFilter(e.target.value); setPage(1); }}
        title="فلترة حسب الحالة"
      >
        {filterTabs.map(tab => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
      </select>
    </div>
  );

  // ── Detail modal fields config ────────────────────────────────────────────────
  const detailGroups = (c) => [
    {
      title: 'المعلومات الأساسية',
      fields: [
        { label: 'اسم الشركة',          value: c.company_name,         fullWidth: true },
        { label: 'الرقم التسلسلي',      value: c.serial_number },
        { label: 'تاريخ التسجيل',       value: formatDate(c.registration_date || c.created_at) },
        { label: 'نوع النشاط',          value: c.activity_type },
        { label: 'جنسية الشركة',        value: c.company_nationality },
        { label: 'الدولة',              value: c.country, icon: <FaMapMarkerAlt /> },
        { label: 'الموقع الإلكتروني',   value: c.website, icon: <FaGlobe /> },
        { label: 'البريد الإلكتروني',   value: c.email },
        { label: 'العنوان',             value: c.address, fullWidth: true },
        { label: 'هاتف 1',              value: c.phone1 },
        { label: 'هاتف 2',              value: c.phone2 },
        { label: 'هاتف 3',              value: c.phone3 },
      ]
    },
    {
      title: 'التأسيس والرأس المال',
      fields: [
        { label: 'تاريخ الاجتماع التأسيسي',  value: formatDate(c.founding_meeting_date) },
        { label: 'تاريخ عقد التأسيس',         value: formatDate(c.founding_contract_date) },
        { label: 'عدد المساهمين',              value: c.shareholders_count },
        { label: 'سنوات الخبرة',               value: c.experience_years },
        { label: 'رأس المال المكتتب به',       value: c.subscribed_capital },
        { label: 'رأس المال المدفوع',          value: c.paid_capital },
        { label: 'آخر ميزانية معتمدة',         value: c.last_approved_budget },
      ]
    },
    {
      title: 'التراخيص والسجلات',
      fields: [
        { label: 'رقم الرخصة التجارية',        value: c.commercial_license_number },
        { label: 'تاريخ إصدار الرخصة',          value: formatDate(c.commercial_license_issue_date) },
        { label: 'تاريخ انتهاء الرخصة',         value: formatDate(c.commercial_license_expiry_date) },
        { label: 'رقم السجل التجاري',            value: c.commercial_registry_number },
        { label: 'تاريخ إصدار السجل',            value: formatDate(c.commercial_registry_issue_date) },
        { label: 'تاريخ انتهاء السجل',           value: formatDate(c.commercial_registry_expiry_date) },
        { label: 'رقم التسجيل بالغرفة',         value: c.chamber_registration_number },
        { label: 'تاريخ إصدار تسجيل الغرفة',    value: formatDate(c.chamber_registration_issue_date) },
        { label: 'تاريخ انتهاء تسجيل الغرفة',   value: formatDate(c.chamber_registration_expiry_date) },
        { label: 'رقم الرخصة المهنية',           value: c.professional_license_number },
        { label: 'رقم الملف الضريبي',            value: c.tax_file_number },
        { label: 'رقم التأمين الاجتماعي',        value: c.social_insurance_number },
      ]
    },
    {
      title: 'المعلومات المصرفية والوكيل',
      fields: [
        { label: 'اسم البنك',       value: c.bank_name },
        { label: 'فرع البنك',       value: c.bank_branch },
        { label: 'رقم الحساب',      value: c.bank_account },
        { label: 'اسم الوكيل',      value: c.agent_name },
      ]
    },
    {
      title: 'الحالة والملاحظات',
      fields: [
        { label: 'الحالة الحالية', value: c.status === 'approved' ? 'مقبول' : c.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة' },
        { label: 'تاريخ الإنشاء',  value: formatDate(c.created_at) },
        { label: 'الملاحظات',       value: c.notes, fullWidth: true },
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh', direction: 'rtl',
      fontFamily: "'Cairo', 'Tajawal', sans-serif",
      padding: '2rem',
      color: text,
    }}>
      {/* Toast */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Hidden PDF template */}
      {selectedCompany && <PdfTemplate ref={pdfRef} company={selectedCompany} />}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 className="fw-bold m-0" style={{ color: 'var(--primary)' }}>
          <span><FaBuilding className="ms-2" /> إدارة الشركات والمكاتب الاستشارية</span>
        </h3>
      </div>

      {/* DataTable View */}
      <DataTable
        columns={columns}
        data={pageData}
        total={displayed.length}
        page={page}
        limit={limit}
        totalPages={totalPages}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearch={(s) => { setSearch(s); setPage(1); }}
        searchPlaceholder="بحث باسم الشركة..."
        statsCards={statCards}
        filters={filtersJSX}
        onExport={() => {
          const csv = [
            ['#', 'اسم الشركة', 'الدولة', 'نوع النشاط', 'تاريخ التسجيل', 'الحالة'].join(','),
            ...displayed.map((c, i) => [
              i + 1,
              `"${(c.company_name || '').replace(/"/g, '""')}"`,
              c.country || '',
              c.activity_type || '',
              formatDate(c.registration_date || c.created_at),
              c.status === 'approved' ? 'مقبول' : c.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
            ].join(',')),
          ].join('\n');
          const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'companies.csv'; a.click();
          URL.revokeObjectURL(url);
        }}
        emptyIcon={<FaBuilding />}
        emptyText="لا توجد شركات مضافة حالياً"
      />

      {/* ─── Detail Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && selectedCompany && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
              padding: '1rem'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              style={{
                background: isDark ? 'linear-gradient(145deg,#0d1b40,#071028)' : 'linear-gradient(145deg,#e8eef8,#fff)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,48,135,0.15)',
                borderRadius: '20px', width: '100%', maxWidth: '860px',
                maxHeight: '90vh', overflowY: 'auto', direction: 'rtl',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
              }}
            >
              {/* Modal header */}
              <div style={{
                padding: '1.5rem 1.75rem',
                background: isDark ? 'rgba(0,48,135,0.3)' : 'rgba(0,48,135,0.06)',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,48,135,0.1)',
                display: 'flex', alignItems: 'center', gap: '1rem',
                position: 'sticky', top: 0, zIndex: 10,
                backdropFilter: 'blur(12px)',
                borderRadius: '20px 20px 0 0'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'linear-gradient(135deg,#003087,#1a5fcc)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', color: '#fff', flexShrink: 0
                }}>
                  <FaBuilding />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: text, fontFamily: "'Cairo', sans-serif" }}>
                    {selectedCompany.company_name}
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: subText, fontFamily: "'Cairo', sans-serif" }}>
                    <StatusBadge status={selectedCompany.status} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Export PDF */}
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={btn('linear-gradient(135deg,#7c3aed,#a855f7)')}
                    onClick={() => exportPdf(selectedCompany)}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaFilePdf />}
                    تصدير PDF
                  </motion.button>
                  {/* Approve */}
                  {selectedCompany.status !== 'approved' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      style={btn('linear-gradient(135deg,#047857,#10b981)')}
                      onClick={() => changeStatus(getId(selectedCompany), 'approved')}
                      disabled={!!actionLoading[getId(selectedCompany)]}
                    >
                      <FaCheck /> قبول
                    </motion.button>
                  )}
                  {/* Reject */}
                  {selectedCompany.status !== 'rejected' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      style={btn('linear-gradient(135deg,#991b1b,#ef4444)')}
                      onClick={() => changeStatus(getId(selectedCompany), 'rejected')}
                      disabled={!!actionLoading[getId(selectedCompany)]}
                    >
                      <FaTimes /> رفض
                    </motion.button>
                  )}
                  {/* Close */}
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={btn(isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', '', subText)}
                    onClick={() => setModalOpen(false)}
                  >
                    <FaTimes />
                  </motion.button>
                </div>
              </div>

              {/* Modal body */}
              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {detailGroups(selectedCompany).map((group, gi) => (
                  <div key={gi}>
                    <div style={{
                      fontSize: '0.78rem', fontWeight: 800, color: '#1a5fcc',
                      fontFamily: "'Cairo', sans-serif", marginBottom: '0.75rem',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      <span style={{ width: '3px', height: '14px', background: 'linear-gradient(#003087,#1a5fcc)', borderRadius: '2px', display: 'inline-block' }} />
                      {group.title}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.6rem' }}>
                      {group.fields.map((f, fi) => (
                        <Field key={fi} label={f.label} value={f.value} icon={f.icon} fullWidth={f.fullWidth} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              padding: '1rem'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                background: isDark ? 'linear-gradient(145deg,#1a0a0a,#2d0f0f)' : '#fff',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: '18px',
                padding: '2rem', maxWidth: '400px', width: '100%', direction: 'rtl',
                boxShadow: '0 24px 80px rgba(239,68,68,0.3)',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', color: '#ef4444', margin: '0 auto 1.25rem'
              }}>
                <FaExclamationTriangle />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontFamily: "'Cairo', sans-serif", color: text, fontWeight: 800 }}>
                تأكيد الحذف
              </h3>
              <p style={{ margin: '0 0 1.5rem', color: subText, fontFamily: "'Cairo', sans-serif", fontSize: '0.88rem', lineHeight: 1.6 }}>
                هل أنت متأكد من حذف شركة <strong style={{ color: '#ef4444' }}>{deleteTarget.company_name}</strong>؟
                <br />لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ ...btn('linear-gradient(135deg,#991b1b,#ef4444)'), flex: 1, justifyContent: 'center', padding: '0.7rem' }}
                  onClick={() => deleteCompany(getId(deleteTarget))}
                  disabled={!!actionLoading[getId(deleteTarget)]}
                >
                  {actionLoading[getId(deleteTarget)] === 'delete'
                    ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                    : <FaTrash />}
                  نعم، احذف
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ ...btn(isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', '', subText), flex: 1, justifyContent: 'center', padding: '0.7rem' }}
                  onClick={() => setDeleteTarget(null)}
                >
                  إلغاء
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap');
        .mn-icon-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px; border: 1.5px solid;
          background: transparent; cursor: pointer;
          transition: background 0.15s, transform 0.15s;
        }
        .mn-icon-btn:hover { background: rgba(0,0,0,0.05); transform: scale(1.1); }
        .mn-filter-select {
          border: 1.5px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 0.82rem;
          color: var(--text, #333);
          background: var(--bg, #f5f7fa);
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }
        .mn-filter-select:focus { border-color: var(--primary); }
      `}</style>
    </div>
  );
}
