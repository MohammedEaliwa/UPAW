import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { 
  FaClipboardList, FaSearch, FaFilter, FaCheck, FaTimes, FaTrash, 
  FaFilePdf, FaEye, FaRegBuilding, FaUserTie, FaExclamationTriangle,
  FaFileAlt, FaInfoCircle, FaCalendarAlt, FaEnvelope, FaPhoneAlt,
  FaMapMarkerAlt, FaBriefcase, FaGraduationCap, FaCertificate, FaPrint,
  FaSpinner, FaGlobe
} from 'react-icons/fa';
import { api } from '../../../services/api';
import DataTable from '../../../components/DataTable';

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
    pending:   { label: 'قيد الدراسة', bg: 'rgba(245,158,11,0.18)', color: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
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

const RequestsDashboard = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('complaints'); // complaints, companies, experts, employee_requests
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  
  // Selected items & Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [statusNote, setStatusNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(null);
  const toastId = useRef(0);
  const printRef = useRef(null);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setSelectedItem(null);
    try {
      let res = [];
      if (activeTab === 'complaints') {
        res = await api.getComplaints();
      } else if (activeTab === 'companies') {
        res = await api.getCompanies();
      } else if (activeTab === 'experts') {
        res = await api.getExperts();
      } else if (activeTab === 'employee_requests') {
        res = await api.getEmployeeRequests();
      }
      
      let list = Array.isArray(res) ? res : (res.data || []);
      if (filter !== 'all') {
        list = list.filter(item => item.status === filter);
      }
      setData(list);
    } catch (err) {
      console.error('Error fetching requests data:', err);
      addToast('فشل تحميل المعاملات والطلبات', 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filter, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered & Searched Data
  const displayed = data.filter(item => {
    const searchString = search.toLowerCase();
    const applicantName = (item.name || item.employee_name || item.company_name || '').toLowerCase();
    const subject = (item.subject || item.complaint_type || item.activity_type || '').toLowerCase();
    const email = (item.email || item.employee_email || '').toLowerCase();
    const phone = item.phone || '';
    
    return !search || 
      applicantName.includes(searchString) || 
      subject.includes(searchString) || 
      email.includes(searchString) || 
      phone.includes(searchString);
  });

  const pageData = displayed.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(displayed.length / limit) || 1;

  // Change request status
  const changeStatus = async (id, status) => {
    setActionLoading(prev => ({ ...prev, [id]: status }));
    try {
      const payload = { status, notes: statusNote };
      if (activeTab === 'complaints') {
        await api.updateComplaintStatus(id, payload);
      } else if (activeTab === 'companies') {
        await api.updateCompanyStatus(id, payload);
      } else if (activeTab === 'experts') {
        await api.updateExpertStatus(id, payload);
      } else if (activeTab === 'employee_requests') {
        await api.updateEmployeeRequestStatus(id, payload);
      }

      addToast(status === 'approved' ? 'تم قبول المعاملة واعتمادها بنجاح' : 'تم رفض الطلب رسمياً', status === 'approved' ? 'success' : 'error');
      setShowNoteInput(null);
      setStatusNote('');
      
      if (selectedItem?.id === id || selectedItem?._id === id) {
        setSelectedItem(prev => ({ ...prev, status, notes: statusNote }));
      }
      
      await fetchData();
    } catch (err) {
      console.error(err);
      addToast('فشل تحديث حالة الطلب', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  // Delete Request
  const deleteRequest = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setActionLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      if (activeTab === 'complaints') {
        await api.deleteComplaint(id);
      } else if (activeTab === 'companies') {
        await api.deleteCompany(id);
      } else if (activeTab === 'experts') {
        await api.deleteExpert(id);
      } else if (activeTab === 'employee_requests') {
        await api.deleteEmployeeRequest(id);
      }
      
      addToast('تم حذف الطلب بنجاح من النظام', 'success');
      if (detailModalOpen && (selectedItem?.id === id || selectedItem?._id === id)) {
        setDetailModalOpen(false);
        setSelectedItem(null);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      addToast('فشل حذف المعاملة', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  // Open Modals
  const openDetails = (item) => {
    setSelectedItem(item);
    setStatusNote(item.notes || '');
    setDetailModalOpen(true);
  };

  const openLetter = (item) => {
    setSelectedItem(item);
    setLetterModalOpen(true);
  };

  // Format Helper
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-LY') : '—';
  const getId = (c) => c?.id || c?._id;

  const getRequestTypeName = (type) => {
    const map = {
      leave: 'طلب إجازة',
      tech_support: 'دعم فني وتقني',
      maintenance: 'طلب صيانة مرافق',
      mission: 'مهمة عمل / تكليف خارجي'
    };
    return map[type] || type;
  };

  // Printable Letter Trigger
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>رسالة رسمية - الهيئة الوطنية</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              direction: rtl;
              text-align: right;
              padding: 40px;
              background-color: #fff;
            }
            .letterhead {
              border-bottom: 3px double #0d6efd;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .stamp-box {
              border: 2px dashed #ccc;
              width: 130px;
              height: 130px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #aaa;
              font-size: 12px;
              border-radius: 50%;
              margin: 0 auto;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Styles matching Companies.jsx
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

  // Tabs structure
  const tabItems = [
    { key: 'complaints',       label: 'الشكاوى والبلاغات', icon: <FaExclamationTriangle /> },
    { key: 'companies',        label: 'تسجيل الشركات',     icon: <FaRegBuilding /> },
    { key: 'experts',          label: 'تسجيل الخبراء',     icon: <FaUserTie /> },
    { key: 'employee_requests', label: 'طلبات الموظفين',   icon: <FaFileAlt /> },
  ];

  // Dynamic status cards
  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === 'pending').length,
    approved: data.filter(d => d.status === 'approved').length,
    rejected: data.filter(d => d.status === 'rejected').length,
  };

  const statCards = [
    { label: 'إجمالي الوارد', value: stats.total.toLocaleString('ar'),    color: '#003087', icon: <FaClipboardList /> },
    { label: 'قيد الدراسة',  value: stats.pending.toLocaleString('ar'),  color: '#f59e0b', icon: <FaFilter /> },
    { label: 'مقبول',        value: stats.approved.toLocaleString('ar'), color: '#10b981', icon: <FaCheck />  },
    { label: 'مرفوض',        value: stats.rejected.toLocaleString('ar'), color: '#ef4444', icon: <FaTimes />  },
  ];

  // Filters Options inside DataTable
  const filterTabs = [
    { key: 'all',      label: 'الكل' },
    { key: 'pending',  label: 'قيد المراجعة' },
    { key: 'approved', label: 'مقبول' },
    { key: 'rejected', label: 'مرفوض' },
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

  // Dynamic columns definition based on Active Tab
  const getColumns = () => {
    const baseCols = [
      {
        key: 'id',
        label: '#',
        style: { width: 60, color: '#aaa', fontWeight: 700 },
        render: (_, row, i) => (page - 1) * limit + i + 1,
      },
    ];

    if (activeTab === 'complaints') {
      baseCols.push(
        {
          key: 'name',
          label: 'مقدم الشكوى',
          render: (val, row) => (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: text }}>{val}</span>
              <span style={{ fontSize: '0.72rem', color: subText }}>{row.email || row.phone}</span>
            </div>
          )
        },
        { key: 'complaint_type', label: 'نوع البلاغ' },
        { key: 'subject',        label: 'موضوع الشكوى' }
      );
    } else if (activeTab === 'companies') {
      baseCols.push(
        {
          key: 'company_name',
          label: 'اسم الشركة',
          render: (val, row) => (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: text }}>{val}</span>
              <span style={{ fontSize: '0.72rem', color: subText }}>{row.email || row.phone}</span>
            </div>
          )
        },
        { key: 'activity_type', label: 'النشاط الرئيسي' },
        { key: 'country',       label: 'الدولة / المقر' }
      );
    } else if (activeTab === 'experts') {
      baseCols.push(
        {
          key: 'name',
          label: 'اسم الخبير',
          render: (val, row) => (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: text }}>{val}</span>
              <span style={{ fontSize: '0.72rem', color: subText }}>{row.email || row.phone}</span>
            </div>
          )
        },
        { key: 'specialty',        label: 'التخصص المهني' },
        { key: 'experience_years', label: 'سنوات الخبرة', render: (val) => `${val || 0} سنة` }
      );
    } else { // employee_requests
      baseCols.push(
        {
          key: 'employee_name',
          label: 'اسم الموظف',
          render: (val, row) => (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: text }}>{val}</span>
              <span style={{ fontSize: '0.72rem', color: subText }}>{row.employee_email}</span>
            </div>
          )
        },
        { key: 'request_type', label: 'نوع المعاملة', render: (val) => getRequestTypeName(val) },
        { key: 'subject',      label: 'موضوع الطلب' }
      );
    }

    // Append Date, Status & Action Column
    baseCols.push(
      {
        key: 'created_at',
        label: 'تاريخ التقديم',
        render: (val) => formatDate(val)
      },
      {
        key: 'status',
        label: 'الحالة',
        render: (val) => <StatusBadge status={val} />
      },
      {
        key: 'actions',
        label: 'الإجراءات الإدارية',
        style: { width: 220, textAlign: 'center' },
        render: (_, row) => {
          const id = getId(row);
          const isLoading = actionLoading[id];
          return (
            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
              <button
                className="mn-icon-btn"
                style={{ color: 'var(--primary)', borderColor: 'rgba(0,48,135,0.2)', background: 'transparent' }}
                onClick={() => openDetails(row)}
                title="عرض التفاصيل والقرار"
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
                onClick={() => openLetter(row)}
                title="تصدير كرسالة موثقة"
              >
                <FaFilePdf size={12} />
              </button>
              <button
                className="mn-icon-btn"
                style={{ color: '#ef4444', borderColor: '#ef444455', background: 'transparent' }}
                onClick={() => deleteRequest(id)}
                disabled={!!isLoading}
                title="حذف"
              >
                {isLoading === 'delete' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaTrash size={12} />}
              </button>
            </div>
          );
        }
      }
    );

    return baseCols;
  };

  // Detail Modal Fields Configuration
  const detailGroups = (item) => {
    if (activeTab === 'complaints') {
      return [
        {
          title: 'بيانات مقدم البلاغ / الشكوى',
          fields: [
            { label: 'الاسم الكامل', value: item.name, fullWidth: true },
            { label: 'البريد الإلكتروني', value: item.email, icon: <FaEnvelope /> },
            { label: 'رقم الهاتف المعتمد', value: item.phone, icon: <FaPhoneAlt /> },
            { label: 'رقم الهوية الوطنية', value: item.id_number },
            { label: 'نوع المعاملة', value: item.complaint_type },
            { label: 'تاريخ الاستلام', value: formatDate(item.created_at) },
          ]
        },
        {
          title: 'المحتوى ونص الموضوع للشكوى',
          fields: [
            { label: 'العنوان / الموضوع', value: item.subject, fullWidth: true },
            { label: 'البيانات والتفاصيل الملحقة', value: item.message, fullWidth: true },
          ]
        },
        {
          title: 'الاعتماد الإداري وملاحظات اللجنة',
          fields: [
            { label: 'الحالة الإدارية للطلب', value: item.status === 'approved' ? 'مقبول ومعتمد' : item.status === 'rejected' ? 'مرفوض رسمياً' : 'تحت الدراسة' },
            { label: 'مبررات القرار والملاحظات المرفقة', value: item.notes, fullWidth: true },
          ]
        }
      ];
    } else if (activeTab === 'companies') {
      return [
        {
          title: 'المعلومات القانونية والتأسيسية للشركة',
          fields: [
            { label: 'اسم الكيان التجاري', value: item.company_name, fullWidth: true },
            { label: 'رقم ترخيص مزاولة النشاط', value: item.license_number },
            { label: 'نوع النشاط التجاري', value: item.activity_type },
            { label: 'الدولة وموقع المقر الرئيسي', value: item.country, icon: <FaMapMarkerAlt /> },
            { label: 'البريد الإلكتروني التجاري', value: item.email, icon: <FaEnvelope /> },
            { label: 'هاتف الاتصال الرئيسي', value: item.phone, icon: <FaPhoneAlt /> },
            { label: 'عنوان المقر التفصيلي', value: item.address, fullWidth: true },
            { label: 'تاريخ الإنشاء على المنصة', value: formatDate(item.created_at) },
          ]
        },
        {
          title: 'الاعتماد الإداري وملاحظات اللجنة',
          fields: [
            { label: 'الحالة الإدارية للطلب', value: item.status === 'approved' ? 'مقبول ومعتمد' : item.status === 'rejected' ? 'مرفوض رسمياً' : 'تحت الدراسة' },
            { label: 'مبررات القرار والملاحظات المرفقة', value: item.notes, fullWidth: true },
          ]
        }
      ];
    } else if (activeTab === 'experts') {
      return [
        {
          title: 'المعلومات المهنية والأكاديمية للخبير',
          fields: [
            { label: 'الاسم الكامل بالهوية', value: item.name, fullWidth: true },
            { label: 'التخصص المهني العام', value: item.specialty, icon: <FaBriefcase /> },
            { label: 'سنوات الخبرة العملية', value: `${item.experience_years} سنة` },
            { label: 'الدرجة العلمية الموثقة', value: item.degree, icon: <FaGraduationCap /> },
            { label: 'رقم ترخيص / عضوية النقابة', value: item.license_number, icon: <FaCertificate /> },
            { label: 'البريد الإلكتروني المعتمد', value: item.email, icon: <FaEnvelope /> },
            { label: 'رقم الهاتف المباشر', value: item.phone, icon: <FaPhoneAlt /> },
            { label: 'محل الإقامة والسكن', value: item.address, fullWidth: true },
            { label: 'تاريخ التقديم المالي', value: formatDate(item.created_at) },
          ]
        },
        {
          title: 'الاعتماد الإداري وملاحظات اللجنة',
          fields: [
            { label: 'الحالة الإدارية للطلب', value: item.status === 'approved' ? 'مقبول ومعتمد' : item.status === 'rejected' ? 'مرفوض رسمياً' : 'تحت الدراسة' },
            { label: 'مبررات القرار والملاحظات المرفقة', value: item.notes, fullWidth: true },
          ]
        }
      ];
    } else { // employee_requests
      return [
        {
          title: 'المعلومات الوظيفية لمقدم الطلب',
          fields: [
            { label: 'اسم الموظف الثلاثي', value: item.employee_name, fullWidth: true },
            { label: 'البريد الإلكتروني الداخلي', value: item.employee_email, icon: <FaEnvelope /> },
            { label: 'نوع الطلب الإداري الداخلي', value: getRequestTypeName(item.request_type) },
            { label: 'تاريخ الإرسال الفني', value: formatDate(item.created_at) },
          ]
        },
        {
          title: 'موضوع الطلب وتبريرات العمل',
          fields: [
            { label: 'عنوان الطلب الإداري', value: item.subject, fullWidth: true },
            { label: 'مبررات وتفاصيل الطلب الرسمية', value: item.message, fullWidth: true },
          ]
        },
        {
          title: 'الاعتماد الإداري وملاحظات اللجنة',
          fields: [
            { label: 'الحالة الإدارية للطلب', value: item.status === 'approved' ? 'مقبول ومعتمد' : item.status === 'rejected' ? 'مرفوض رسمياً' : 'تحت الدراسة' },
            { label: 'مبررات القرار والملاحظات المرفقة', value: item.notes, fullWidth: true },
          ]
        }
      ];
    }
  };

  const getTabTitle = (tab) => {
    const item = tabItems.find(t => t.key === tab);
    return item ? item.label : tab;
  };

  return (
    <div style={{
      minHeight: '100vh', direction: 'rtl',
      fontFamily: "'Cairo', 'Tajawal', sans-serif",
      padding: '2rem',
      color: text,
    }}>
      {/* Toast Notification Box */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 className="fw-bold m-0" style={{ color: 'var(--primary)' }}>
          <span><FaClipboardList className="ms-2" /> إدارة المعاملات والطلبات الواردة</span>
        </h3>
      </div>

      {/* Glassmorphic Tabs Selector */}
      <div style={{
        display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem',
        ...glass, padding: '0.65rem', borderRadius: '14px'
      }}>
        {tabItems.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              style={tabStyle(active, subText)}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* DataTable View */}
      <DataTable
        columns={getColumns()}
        data={pageData}
        total={displayed.length}
        page={page}
        limit={limit}
        totalPages={totalPages}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearch={(s) => { setSearch(s); setPage(1); }}
        searchPlaceholder={`بحث في ${getTabTitle(activeTab)}...`}
        statsCards={statCards}
        filters={filtersJSX}
        onExport={() => {
          const csv = [
            ['#', 'مقدم الطلب', 'موضوع الطلب / النشاط', 'تاريخ التقديم', 'الحالة'].join(','),
            ...displayed.map((c, i) => {
              const name = c.name || c.employee_name || c.company_name || '';
              const subject = c.subject || c.complaint_type || c.activity_type || '';
              return [
                i + 1,
                `"${name.replace(/"/g, '""')}"`,
                `"${subject.replace(/"/g, '""')}"`,
                formatDate(c.created_at),
                c.status === 'approved' ? 'مقبول' : c.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
              ].join(',');
            }),
          ].join('\n');
          const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${activeTab}_requests.csv`; a.click();
          URL.revokeObjectURL(url);
          addToast('تم تصدير البيانات بنجاح', 'success');
        }}
        emptyIcon={activeTab === 'companies' ? <FaRegBuilding /> : activeTab === 'experts' ? <FaUserTie /> : <FaFileAlt />}
        emptyText={`لا توجد طلبات في قسم ${getTabTitle(activeTab)} حالياً`}
      />

      {/* ─── Detail Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailModalOpen && selectedItem && (
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
            onClick={(e) => { if (e.target === e.currentTarget) setDetailModalOpen(false); }}
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
                  {activeTab === 'companies' ? <FaRegBuilding /> : activeTab === 'experts' ? <FaUserTie /> : <FaFileAlt />}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: text, fontFamily: "'Cairo', sans-serif" }}>
                    {selectedItem.name || selectedItem.employee_name || selectedItem.company_name}
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: subText, fontFamily: "'Cairo', sans-serif" }}>
                    <StatusBadge status={selectedItem.status} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Export PDF/Letter */}
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={btn('linear-gradient(135deg,#7c3aed,#a855f7)')}
                    onClick={() => { setDetailModalOpen(false); openLetter(selectedItem); }}
                  >
                    <FaPrint /> عرض الرسالة الرسمية
                  </motion.button>
                  {/* Approve */}
                  {selectedItem.status !== 'approved' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      style={btn('linear-gradient(135deg,#047857,#10b981)')}
                      onClick={() => changeStatus(getId(selectedItem), 'approved')}
                      disabled={!!actionLoading[getId(selectedItem)]}
                    >
                      <FaCheck /> قبول
                    </motion.button>
                  )}
                  {/* Reject */}
                  {selectedItem.status !== 'rejected' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      style={btn('linear-gradient(135deg,#991b1b,#ef4444)')}
                      onClick={() => changeStatus(getId(selectedItem), 'rejected')}
                      disabled={!!actionLoading[getId(selectedItem)]}
                    >
                      <FaTimes /> رفض
                    </motion.button>
                  )}
                  {/* Close */}
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={btn(isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', '', subText)}
                    onClick={() => setDetailModalOpen(false)}
                  >
                    <FaTimes />
                  </motion.button>
                </div>
              </div>

              {/* Modal body */}
              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {detailGroups(selectedItem).map((group, gi) => (
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

      {/* ─── Status Decision Note Dialog (Shown Inline above table or modal as a popup when triggered) ─── */}
      <AnimatePresence>
        {showNoteInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)'
            }}
          >
            <div style={{
              background: isDark ? '#0d1b40' : '#fff', padding: '1.5rem',
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
              width: '100%', maxWidth: '480px', direction: 'rtl'
            }}>
              <h5 className="fw-bold mb-3" style={{ color: text }}>إضافة ملاحظات وتوجيهات القرار</h5>
              <textarea
                className="form-control mb-3"
                rows="4"
                style={{ background: 'transparent', color: text }}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="اكتب التوجيهات الرسمية أو مبررات الرفض/القبول..."
              />
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowNoteInput(null)}
                >
                  إلغاء
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const status = showNoteInput.startsWith('approve') ? 'approved' : 'rejected';
                    const id = showNoteInput.split('-')[1];
                    changeStatus(id, status);
                  }}
                >
                  تأكيد القرار والبت
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Official Letter Modal (Print layout) ───────────────────────────────── */}
      {letterModalOpen && selectedItem && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-primary">الخطاب الرسمي الموثق للمعاملة</h5>
                <div className="d-flex gap-2 ms-0 me-auto">
                  <button className="btn btn-success d-flex align-items-center gap-1" onClick={handlePrint}>
                    <FaPrint /> طباعة وتحميل كـ PDF
                  </button>
                  <button type="button" className="btn-close" onClick={() => setLetterModalOpen(false)}></button>
                </div>
              </div>
              <div className="modal-body p-5 bg-white overflow-auto" style={{ maxHeight: '75vh' }}>
                {/* Print layout wrap */}
                <div ref={printRef} style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                  {/* Letterhead */}
                  <div className="letterhead d-flex justify-content-between align-items-center pb-4 mb-4" style={{ borderBottom: '3px double #0d6efd' }}>
                    <div className="text-right">
                      <h4 className="fw-bold text-primary mb-1">الهيئة الوطنية للتخطيط والتنمية</h4>
                      <p className="text-muted text-xs mb-0">National Authority for Urban Planning & Development</p>
                      <p className="text-muted text-xs mb-0">نظام إدارة المعاملات الحكومي الذكي</p>
                    </div>
                    <div className="text-center">
                      <div className="d-inline-block border border-primary border-3 rounded-circle p-2" style={{ width: '70px', height: '70px', lineHeight: '50px' }}>
                        <strong className="text-primary fs-3">UP</strong>
                      </div>
                    </div>
                    <div className="text-left text-xs text-muted" style={{ direction: 'ltr', textAlign: 'left' }}>
                      <div>Ref: UPAW-{selectedItem.serial_number || selectedItem.id_number || selectedItem.id}</div>
                      <div>Date: {new Date(selectedItem.created_at).toLocaleDateString('ar-EG')}</div>
                      <div>System ID: #{selectedItem.id}</div>
                    </div>
                  </div>

                  {/* Letter Info Block */}
                  <div className="mb-4">
                    <p className="mb-2"><strong>الموضوع:</strong> إفادة رسمية ومعلومات طلب وارد رقم {selectedItem.serial_number || `UPAW-${selectedItem.id}`}</p>
                    <p className="mb-2"><strong>نوع الطلب:</strong> {getTabTitle(activeTab)}</p>
                    <p className="mb-2"><strong>حالة الطلب الحالية:</strong> {selectedItem.status === 'approved' ? 'مقبول رسمياً' : selectedItem.status === 'rejected' ? 'مرفوض رسمياً' : 'قيد الدراسة الإدارية'}</p>
                  </div>

                  <hr />

                  {/* Opening Greeting */}
                  <div className="my-4">
                    <p className="fw-bold">سعادة مدير الإدارة العامة لشؤون التنمية والخدمات المحترم،</p>
                    <p className="mb-3">السلام عليكم ورحمة الله وبركاته،، أما بعد:</p>
                    <p style={{ lineHeight: '1.8' }}>
                      نرفع لسعادتكم طي هذا المستند تفاصيل المعاملة والطلب الرسمي الذي تم تقديمه عبر البوابة الإلكترونية للهيئة الوطنية. وفيما يلي جدول مفصل بكامل البيانات الرسمية المدخلة من قبل صاحب العلاقة لتسهيل مراجعتها واتخاذ الإجراء اللازم:
                    </p>
                  </div>

                  {/* Main Details Table */}
                  <table className="table table-bordered align-middle my-4">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '30%' }}>حقل البيانات</th>
                        <th>المعلومات الرسمية المسجلة</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>اسم مقدم الطلب</strong></td>
                        <td>{selectedItem.name || selectedItem.employee_name || selectedItem.company_name}</td>
                      </tr>
                      <tr>
                        <td><strong>البريد الإلكتروني</strong></td>
                        <td>{selectedItem.email || selectedItem.employee_email || 'غير متوفر'}</td>
                      </tr>
                      <tr>
                        <td><strong>رقم الاتصال الموثق</strong></td>
                        <td>{selectedItem.phone || 'غير متوفر'}</td>
                      </tr>
                      <tr>
                        <td><strong>الرقم المرجعي / الترخيص</strong></td>
                        <td>{selectedItem.license_number || selectedItem.id_number || selectedItem.serial_number || 'غير متوفر'}</td>
                      </tr>
                      {selectedItem.activity_type && (
                        <tr>
                          <td><strong>نوع النشاط التجاري</strong></td>
                          <td>{selectedItem.activity_type}</td>
                        </tr>
                      )}
                      {selectedItem.specialty && (
                        <tr>
                          <td><strong>التخصص والخبرة</strong></td>
                          <td>{selectedItem.specialty} ({selectedItem.experience_years} سنة خبرة)</td>
                        </tr>
                      )}
                      {selectedItem.request_type && (
                        <tr>
                          <td><strong>فئة الطلب الداخلي</strong></td>
                          <td>{getRequestTypeName(selectedItem.request_type)}</td>
                        </tr>
                      )}
                      <tr>
                        <td><strong>تاريخ استلام المعاملة</strong></td>
                        <td>{new Date(selectedItem.created_at).toLocaleString('ar-EG')}</td>
                      </tr>
                      <tr>
                        <td><strong>محتوى ونص الطلب</strong></td>
                        <td style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedItem.message || selectedItem.subject}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Decision Section */}
                  <div className="p-3 border rounded bg-light my-4">
                    <h6 className="fw-bold mb-2 text-primary">التوجيه الإداري والقرار الصادر:</h6>
                    <p className="mb-2"><strong>حالة الطلب:</strong> {selectedItem.status === 'approved' ? 'معتمد ومقبول' : selectedItem.status === 'rejected' ? 'غير موافق عليه / مرفوض' : 'قيد المراجعة والمتابعة'}</p>
                    <p className="mb-0"><strong>ملاحظات لجنة الفحص:</strong> {selectedItem.notes || 'لم تصدر أية ملاحظات توجيهية إضافية حتى الآن.'}</p>
                  </div>

                  <p className="text-center mt-5" style={{ lineHeight: '1.8' }}>
                    شاكرين لكم حسن تعاونكم الدائم،، وتفضلوا بقبول فائق الاحترام والتقدير،،
                  </p>

                  {/* Signatures & Seal */}
                  <div className="row mt-5 pt-4 align-items-center">
                    <div className="col-6 text-center">
                      <p className="fw-bold mb-5">توقيع رئيس الهيئة الوطنية</p>
                      <p className="text-muted text-xs mt-4">....................................................</p>
                    </div>
                    <div className="col-6 text-center">
                      <p className="fw-bold mb-3">خاتم الهيئة الرسمي</p>
                      <div className="stamp-box">
                        مساحة الختم الرسمي
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 pt-4 text-center border-top text-xs text-muted" style={{ fontSize: '11px' }}>
                    <p className="mb-1">الهيئة الوطنية للتخطيط والتنمية • الإدارة العامة لشؤون المعاملات والتحول الرقمي</p>
                    <p className="mb-0">الهاتف: 011-2345678 • البريد الإلكتروني: support@national-authority.gov • الموقع: www.national-authority.gov</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button className="btn btn-secondary" onClick={() => setLetterModalOpen(false)}>إغلاق النافذة</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sleek tab style matching design requirements
const tabStyle = (active, subText) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.35rem',
  borderRadius: '10px',
  border: 'none',
  background: active ? 'linear-gradient(135deg,#003087,#1a5fcc)' : 'transparent',
  color: active ? '#fff' : subText,
  fontFamily: "'Cairo', sans-serif",
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  whiteSpace: 'nowrap',
  boxShadow: active ? '0 4px 15px rgba(0,48,135,0.25)' : 'none'
});

export default RequestsDashboard;
