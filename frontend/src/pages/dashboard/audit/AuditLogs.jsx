import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate } from 'react-router-dom';
import {
  FaShieldAlt, FaSearch, FaFilter, FaDownload, FaTimes, FaChevronLeft,
  FaChevronRight, FaExclamationTriangle, FaUserLock, FaCheck, FaEye,
  FaTrash, FaSync, FaExclamationCircle, FaInfoCircle, FaList, FaHistory,
  FaBan, FaClock, FaDesktop, FaUnlock
} from 'react-icons/fa';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY = {
  critical:      { label: 'حرج',        color: '#dc3545', bg: 'rgba(220,53,69,0.12)'  },
  high:          { label: 'مرتفع',      color: '#fd7e14', bg: 'rgba(253,126,20,0.12)' },
  medium:        { label: 'متوسط',      color: '#ffc107', bg: 'rgba(255,193,7,0.12)'  },
  low:           { label: 'منخفض',      color: '#20c997', bg: 'rgba(32,201,151,0.12)' },
  informational: { label: 'معلوماتي',   color: '#0dcaf0', bg: 'rgba(13,202,240,0.12)' },
};

// ─── Action labels ────────────────────────────────────────────────────────────
const ACTION_LABELS = {
  login: 'تسجيل دخول', logout: 'تسجيل خروج',
  login_failed: 'فشل الدخول', register: 'تسجيل جديد',
  create: 'إنشاء', update: 'تحديث', delete: 'حذف',
  force_delete: 'حذف نهائي', restore: 'استعادة',
  upload_file: 'رفع ملف', delete_file: 'حذف ملف',
  export: 'تصدير', import: 'استيراد',
  role_change: 'تغيير دور', account_activate: 'تفعيل حساب',
  account_deactivate: 'إلغاء تفعيل', settings_change: 'تغيير إعدادات',
  unauthorized_access: 'وصول غير مصرح', forbidden: 'محظور',
  not_found: 'غير موجود', server_error: 'خطأ خادم',
  approve: 'موافقة', reject: 'رفض', view: 'عرض',
  block_ip: 'حظر IP', unblock_ip: 'فك حظر IP',
};

// Calculate session duration helper
const calculateSessionDuration = (logTime, action) => {
  if (!logTime) return '—';
  const start = new Date(logTime);
  const now = new Date();
  const diffMs = Math.abs(now - start);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let parts = [];
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  parts.push(`${seconds} ثانية`);

  return parts.join(' ');
};

// ─── SeverityBadge ────────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const s = SEVERITY[severity] || SEVERITY.informational;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
      color: s.color, background: s.bg, border: `1px solid ${s.color}40`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sub, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    style={{
      background: 'var(--card-bg)',
      border: `1px solid ${color}30`,
      borderRadius: 14, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 160px',
      boxShadow: `0 4px 24px ${color}15`,
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    <div style={{
      width: 48, height: 48, borderRadius: 12, background: `${color}20`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.3rem', color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
        {value?.toLocaleString('ar-LY') ?? '—'}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color, marginTop: 2 }}>{sub}</div>}
    </div>
  </motion.div>
);

// ─── User Activity Trail Modal ────────────────────────────────────────────────
const UserTrailModal = ({ userId, username, onClose }) => {
  const [trail, setTrail] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.getUserTrail(userId)
      .then(res => {
        setTrail(res.trail || []);
      })
      .catch(() => setTrail([]))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 18, width: '100%', maxWidth: 750, maxHeight: '85vh',
            overflow: 'auto', padding: 28, position: 'relative',
            fontFamily: 'Cairo, sans-serif', direction: 'rtl',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ color: 'var(--text)', margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>
                <FaHistory className="ms-2 text-primary" /> سجل أنشطة وتنقلات المستخدم: {username}
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.8rem' }}>
                تتبع كامل زمني لكافة الإجراءات والطلبات التي قام بها الحساب داخل النظام
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#94a3b8', width: 34, height: 34, cursor: 'pointer' }}>
              <FaTimes />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5 text-muted">
              <FaSync className="spin ms-2" /> جاري تحميل خط أنشطة المستخدم...
            </div>
          ) : trail.length === 0 ? (
            <div className="text-center py-5 text-muted">لا توجد أنشطة مسجلة لهذا المستخدم</div>
          ) : (
            <div style={{ position: 'relative', paddingRight: 20, borderRight: '2px solid var(--primary)' }}>
              {trail.map((item, idx) => (
                <div key={item.id || idx} style={{ position: 'relative', marginBottom: 20 }}>
                  <div style={{
                    position: 'absolute', right: -27, top: 4, width: 12, height: 12,
                    borderRadius: '50%', background: 'var(--primary)', border: '2px solid #fff'
                  }} />
                  <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                        {ACTION_LABELS[item.action] || item.action}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleString('ar-LY')}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.description}</p>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span><strong>IP:</strong> {item.ip_address}</span>
                      <span><strong>المتصفح:</strong> {item.browser}</span>
                      <span><strong>الرابط:</strong> {item.request_url}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Blocked IPs Management Modal ─────────────────────────────────────────────
const BlockedIpsModal = ({ onClose }) => {
  const [blockedIps, setBlockedIps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = () => {
    setLoading(true);
    api.getBlockedIps()
      .then(data => setBlockedIps(Array.isArray(data) ? data : []))
      .catch(() => setBlockedIps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBlocked(); }, []);

  const handleUnblock = async (ip) => {
    if (!window.confirm(`هل أنت تأكد من فك الحظر عن الجهاز / IP: ${ip}؟`)) return;
    try {
      await api.unblockIp(ip);
      fetchBlocked();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء فك الحظر');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 18, width: '100%', maxWidth: 750, maxHeight: '85vh',
            overflow: 'auto', padding: 28, position: 'relative',
            fontFamily: 'Cairo, sans-serif', direction: 'rtl',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ color: 'var(--text)', margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>
                <FaBan className="ms-2 text-danger" /> قائمة الأجهزة والعناوين المحظورة (Blocked IPs)
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.8rem' }}>
                إدارة الأجهزة المحظورة من الوصول للنظام
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#94a3b8', width: 34, height: 34, cursor: 'pointer' }}>
              <FaTimes />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5 text-muted">جاري تحميل القائمة...</div>
          ) : blockedIps.length === 0 ? (
            <div className="text-center py-5 text-muted">لا توجد عناوين IP محظورة حالياً</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: 10 }}>عنوان IP</th>
                    <th style={{ padding: 10 }}>سبب الحظر</th>
                    <th style={{ padding: 10 }}>تاريخ الحظر</th>
                    <th style={{ padding: 10 }}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedIps.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <td style={{ padding: 10, fontFamily: 'monospace', fontWeight: 700 }}>{item.ip_address}</td>
                      <td style={{ padding: 10 }}>{item.reason || '—'}</td>
                      <td style={{ padding: 10, fontSize: '0.78rem' }}>{new Date(item.created_at).toLocaleString('ar-LY')}</td>
                      <td style={{ padding: 10 }}>
                        <button
                          onClick={() => handleUnblock(item.ip_address)}
                          className="btn btn-sm btn-outline-success rounded-pill d-flex align-items-center gap-1"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <FaUnlock /> فك الحظر
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ log, onClose, onViewTrail, onBlockIp }) => {
  if (!log) return null;

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))', paddingBottom: 6,
      }}>{title}</div>
      {children}
    </div>
  );

  const Field = ({ label, value }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.83rem' }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 130 }}>{label}:</span>
      <span style={{ color: 'var(--text)', wordBreak: 'break-all' }}>{value || '—'}</span>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh',
            overflow: 'auto', padding: 32, position: 'relative',
            fontFamily: 'Cairo, sans-serif', direction: 'rtl',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <SeverityBadge severity={log.severity} />
                <span style={{
                  background: 'rgba(255,255,255,0.07)', padding: '2px 10px',
                  borderRadius: 20, fontSize: '0.75rem', color: '#94a3b8',
                }}>
                  #{log.id}
                </span>
              </div>
              <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                {ACTION_LABELS[log.action] || log.action}
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.85rem' }}>{log.description}</p>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8,
              color: '#94a3b8', width: 34, height: 34, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaTimes />
            </button>
          </div>

          {/* Actions Bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, padding: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
            {log.user_id && (
              <button
                onClick={() => onViewTrail(log.user_id, log.username)}
                className="btn btn-sm btn-primary rounded-pill d-flex align-items-center gap-2"
                style={{ fontSize: '0.8rem' }}
              >
                <FaHistory /> تتبع كافة أنشطة وتنقلات المستخدم
              </button>
            )}
            {log.ip_address && (
              <button
                onClick={() => onBlockIp(log.ip_address)}
                className="btn btn-sm btn-outline-danger rounded-pill d-flex align-items-center gap-2"
                style={{ fontSize: '0.8rem' }}
              >
                <FaBan /> حظر هذا الجهاز / IP ({log.ip_address})
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <Section title="معلومات المستخدم">
                <Field label="اسم المستخدم" value={log.username} />
                <Field label="البريد الإلكتروني" value={log.email} />
                <Field label="الدور" value={log.role} />
                <Field label="معرف المستخدم" value={log.user_id} />
              </Section>
              <Section title="معلومات الطلب">
                <Field label="طريقة HTTP" value={log.request_method} />
                <Field label="مسار الطلب" value={log.request_url} />
                <Field label="حالة الاستجابة" value={log.response_status} />
                <Field label="وقت التنفيذ" value={log.execution_time ? `${log.execution_time}s` : null} />
              </Section>
              <Section title="معلومات الجلسة والوقت">
                <Field label="الوقت المنقضي للجلسة" value={calculateSessionDuration(log.created_at, log.action)} />
                <Field label="التاريخ والوقت" value={log.created_at ? new Date(log.created_at).toLocaleString('ar-LY') : null} />
              </Section>
            </div>
            <div>
              <Section title="معلومات الجهاز والأمان">
                <Field label="عنوان IP" value={log.ip_address} />
                <Field label="المتصفح" value={log.browser} />
                <Field label="نظام التشغيل" value={log.operating_system} />
                <Field label="نوع الجهاز" value={log.device_type} />
                <Field label="User Agent" value={log.user_agent?.substring(0, 80)} />
              </Section>
              <Section title="معلومات النموذج">
                <Field label="النموذج" value={log.model_type ? log.model_type.split('\\').pop() : null} />
                <Field label="معرف السجل" value={log.model_id} />
                <Field label="الوحدة" value={log.module} />
              </Section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AuditLogs = () => {
  const [logs, setLogs]             = useState([]);
  const [stats, setStats]           = useState(null);
  const [filterOpts, setFilterOpts] = useState({ actions: [], severities: [], modules: [], roles: [] });
  const [loading, setLoading]       = useState(false);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [limit]                     = useState(25);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Modals state
  const [activeTrailUser, setActiveTrailUser] = useState(null);
  const [showBlockedIpsModal, setShowBlockedIpsModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '', action: '', severity: '', module: '', role: '',
    date_from: '', date_to: '', ip_address: '', response_status: '',
    sort_by: 'created_at', sort_dir: 'desc',
  });

  // User context from AuthContext & localStorage
  const auth = useAuth() || {};
  let user = auth.user;
  if (!user || Object.keys(user).length === 0) {
    try {
      const stored = localStorage.getItem('upaw_logged_user') || localStorage.getItem('user') || '{}';
      user = JSON.parse(stored);
    } catch {
      user = {};
    }
  }

  const roleSlug = user?.role_slug || user?.role?.slug || '';
  const roleId = String(user?.role_id || user?.role?.id || '');
  const roleName = user?.role_name || user?.role?.name || (typeof user?.role === 'string' ? user?.role : '');

  const isAdmin =
    roleId === '1' ||
    roleSlug === 'admin' ||
    roleName === 'admin' ||
    roleName === 'مسؤول النظام' ||
    user?.username?.toLowerCase() === 'admin' ||
    Boolean(user?.is_admin);

  // Security Guard: Block regular employees
  if (!isAdmin) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#ef4444', background: 'var(--card-bg)', borderRadius: 16, border: '1px solid #ef444440', margin: 20 }}>
        <FaExclamationTriangle size={48} className="mb-3" />
        <h3 style={{ fontWeight: 800, color: 'var(--text)' }}>عذراً، صفحة سجلات التدقيق مخصصة لمسؤول النظام فقط</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>يرجى التواصل مع مسؤول منظومة التخطيط العمراني للحصول على الصلاحيات المطلوبة</p>
      </div>
    );
  }

  const headers = {
    'X-User-Id': user?.id || '',
    'X-Username': user?.username || 'Admin',
    'X-User-Email': user?.email || '',
    'X-User-Role': user?.role_slug || user?.role?.slug || 'admin',
  };

  // ─── Fetch stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/audit-logs/stats`, { headers });
      const data = await res.json();
      setStats(data);
    } catch {}
  }, []);

  // ─── Fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, ...filters });
      for (const [k, v] of [...params]) { if (!v) params.delete(k); }
      const res = await fetch(`${API}/audit-logs?${params}`, { headers });
      const data = await res.json();
      setLogs(data.rows || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  // ─── Fetch filter options ─────────────────────────────────────────────────────
  const fetchFilterOpts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/audit-logs/filter-options`, { headers });
      const data = await res.json();
      setFilterOpts(data);
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); fetchFilterOpts(); }, []);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '', action: '', severity: '', module: '', role: '',
      date_from: '', date_to: '', ip_address: '', response_status: '',
      sort_by: 'created_at', sort_dir: 'desc',
    });
    setPage(1);
  };

  // ─── Export ──────────────────────────────────────────────────────────────────
  const doExport = async (format) => {
    const params = new URLSearchParams({ format, ...filters });
    for (const [k, v] of [...params]) { if (!v || k === 'search') params.delete(k); }
    window.open(`${API}/audit-logs/export?${params}`, '_blank');
  };

  // ─── Block IP ─────────────────────────────────────────────────────────────────
  const handleBlockIp = async (ip) => {
    const reason = window.prompt(`أدخل سبب حظر الجهاز / IP (${ip}):`, 'حظر أمني بسبب نشاط مشبوه');
    if (reason === null) return;
    try {
      await api.blockIp(ip, reason, user.username || 'مسؤول النظام');
      alert(`تم حظر الجهاز / IP: ${ip} بنجاح!`);
      setSelectedLog(null);
      fetchLogs();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء تنفيذ الحظر');
    }
  };

  // ─── Delete log ───────────────────────────────────────────────────────────────
  const deleteLog = async (id) => {
    if (!window.confirm('هل تريد حذف هذا السجل؟')) return;
    await fetch(`${API}/audit-logs/${id}`, { method: 'DELETE', headers });
    fetchLogs();
  };

  // ─── Sort handler ─────────────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (filters.sort_by === col) {
      handleFilterChange('sort_dir', filters.sort_dir === 'asc' ? 'desc' : 'asc');
    } else {
      setFilters(f => ({ ...f, sort_by: col, sort_dir: 'desc' }));
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  // ─── Styles ───────────────────────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border, rgba(0,0,0,0.08))',
    borderRadius: 14, padding: 20,
  };
  const inputStyle = {
    background: 'var(--input-bg, rgba(255,255,255,0.05))',
    border: '1px solid var(--border, rgba(0,0,0,0.1))',
    borderRadius: 8, padding: '8px 12px',
    color: 'var(--text)',
    fontSize: '0.85rem',
    outline: 'none', width: '100%',
  };
  const selectStyle = { ...inputStyle };
  const thStyle = {
    padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right',
    cursor: 'pointer', userSelect: 'none',
    borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))',
    whiteSpace: 'nowrap',
  };
  const tdStyle = {
    padding: '11px 14px', fontSize: '0.82rem',
    color: 'var(--text)',
    borderBottom: '1px solid var(--border, rgba(255,255,255,0.04))',
    verticalAlign: 'middle',
    maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  };

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', padding: '10px 4px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem',
          }}>
            <FaShieldAlt />
          </div>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text)', fontSize: '1.25rem', fontWeight: 800 }}>سجلات التدقيق والأمان الحصري</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>مخصصة لمسؤول النظام فقط لمراقبة وحظر الأجهزة وتتبع الأنشطة</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowBlockedIpsModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.3)',
            borderRadius: 8, color: '#dc3545', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700
          }}>
            <FaBan /> الأجهزة المحظورة (IPs)
          </button>
          <button onClick={() => setShowFilters(f => !f)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: showFilters ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${showFilters ? '#4f46e5' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, color: showFilters ? '#818cf8' : '#94a3b8', fontSize: '0.85rem', cursor: 'pointer',
          }}>
            <FaFilter /> الفلاتر
          </button>
          <button onClick={() => doExport('csv')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 8, color: '#10b981', fontSize: '0.85rem', cursor: 'pointer',
          }}>
            <FaDownload /> تصدير CSV
          </button>
          <button onClick={() => doExport('json')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 8, color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer',
          }}>
            <FaDownload /> تصدير JSON
          </button>
          <button onClick={() => { fetchStats(); fetchLogs(); }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#94a3b8', cursor: 'pointer',
          }}>
            <FaSync />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <StatCard label="إجمالي السجلات"    value={stats?.total}         icon={<FaList />}              color="#4f46e5" />
        <StatCard label="سجلات اليوم"        value={stats?.today}         icon={<FaInfoCircle />}        color="#0dcaf0" />
        <StatCard label="أحداث حرجة"         value={stats?.critical}      icon={<FaExclamationCircle />} color="#dc3545" />
        <StatCard label="محاولات دخول فاشلة" value={stats?.failed_logins} icon={<FaUserLock />}          color="#fd7e14" />
        <StatCard label="IPs مشبوهة (آخر ساعة)" value={stats?.suspicious_ips} icon={<FaExclamationTriangle />} color="#ffc107"
          sub={stats?.suspicious_ips > 0 ? 'انقر لعرض الأجهزة المحظورة' : null}
          onClick={() => setShowBlockedIpsModal(true)} />
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ ...cardStyle, marginBottom: 20, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem', fontWeight: 700 }}>فلترة النتائج</h3>
              <button onClick={resetFilters} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                color: '#94a3b8', padding: '4px 12px', fontSize: '0.78rem', cursor: 'pointer',
              }}>
                إعادة ضبط
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>بحث</label>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.75rem' }} />
                  <input style={{ ...inputStyle, paddingRight: 30 }} placeholder="بحث..." value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)} />
                </div>
              </div>

              {[
                { key: 'action',   label: 'الإجراء',  opts: filterOpts.actions,    labelFn: a => ACTION_LABELS[a] || a },
                { key: 'severity', label: 'الخطورة',  opts: filterOpts.severities, labelFn: s => SEVERITY[s]?.label || s },
                { key: 'module',   label: 'الوحدة',   opts: filterOpts.modules,    labelFn: m => m },
                { key: 'role',     label: 'الدور',    opts: filterOpts.roles,      labelFn: r => r },
              ].map(({ key, label, opts, labelFn }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>{label}</label>
                  <select style={selectStyle} value={filters[key]} onChange={e => handleFilterChange(key, e.target.value)}>
                    <option value="">الكل</option>
                    {(opts || []).map(o => <option key={o} value={o}>{labelFn(o)}</option>)}
                  </select>
                </div>
              ))}

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>عنوان IP</label>
                <input style={inputStyle} placeholder="192.168.1.1" value={filters.ip_address}
                  onChange={e => handleFilterChange('ip_address', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>كود الحالة</label>
                <input style={inputStyle} placeholder="404" type="number" value={filters.response_status}
                  onChange={e => handleFilterChange('response_status', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>من تاريخ</label>
                <input style={inputStyle} type="date" value={filters.date_from}
                  onChange={e => handleFilterChange('date_from', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 4 }}>إلى تاريخ</label>
                <input style={inputStyle} type="date" value={filters.date_to}
                  onChange={e => handleFilterChange('date_to', e.target.value)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {loading ? 'جاري التحميل...' : `${total.toLocaleString('ar-LY')} سجل`}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {[
                  { label: '#', col: 'id' },
                  { label: 'التاريخ والتوقيت', col: 'created_at' },
                  { label: 'المستخدم', col: 'username' },
                  { label: 'الإجراء', col: 'action' },
                  { label: 'مدة الجلسة المنقضية', col: null },
                  { label: 'الخطورة', col: 'severity' },
                  { label: 'الوحدة', col: 'module' },
                  { label: 'IP', col: 'ip_address' },
                  { label: 'الحالة', col: 'response_status' },
                  { label: 'خيارات التحكم', col: null },
                ].map(({ label, col }) => (
                  <th key={label} style={thStyle} onClick={() => col && handleSort(col)}>
                    {label}
                    {col && filters.sort_by === col && (
                      <span style={{ marginRight: 4, opacity: 0.7 }}>
                        {filters.sort_dir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#64748b' }}>
                  <FaSync style={{ animation: 'spin 1s linear infinite', marginLeft: 8 }} />
                  جاري التحميل...
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#64748b' }}>
                  لا توجد سجلات تطابق الفلاتر
                </td></tr>
              ) : (
                logs.map(log => (
                  <motion.tr key={log.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.id}</td>
                    <td style={{ ...tdStyle, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString('ar-LY', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{log.username || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.role || ''}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: 'rgba(0,0,0,0.05)', padding: '2px 8px',
                        borderRadius: 6, fontSize: '0.75rem', color: 'var(--text-muted)',
                      }}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                      <FaClock className="ms-1 opacity-75" />
                      {calculateSessionDuration(log.created_at, log.action)}
                    </td>
                    <td style={tdStyle}><SeverityBadge severity={log.severity} /></td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{log.module || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.ip_address || '—'}
                    </td>
                    <td style={tdStyle}>
                      {log.response_status ? (
                        <span style={{
                          padding: '1px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                          color: log.response_status >= 500 ? '#dc3545' : log.response_status >= 400 ? '#fd7e14' : '#20c997',
                          background: log.response_status >= 500 ? '#dc354520' : log.response_status >= 400 ? '#fd7e1420' : '#20c99720',
                        }}>
                          {log.response_status}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ ...tdStyle, width: 110 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button title="عرض التفاصيل" onClick={() => setSelectedLog(log)} style={{
                          background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)',
                          borderRadius: 6, color: '#818cf8', width: 28, height: 28,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FaEye size={11} />
                        </button>
                        {log.user_id && (
                          <button title="تتبع أنشطة المستخدم" onClick={() => setActiveTrailUser({ id: log.user_id, name: log.username })} style={{
                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                            borderRadius: 6, color: '#3b82f6', width: 28, height: 28,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <FaHistory size={11} />
                          </button>
                        )}
                        {log.ip_address && (
                          <button title="حظر هذا الجهاز / IP" onClick={() => handleBlockIp(log.ip_address)} style={{
                            background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)',
                            borderRadius: 6, color: '#dc3545', width: 28, height: 28,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <FaBan size={11} />
                          </button>
                        )}
                        <button title="حذف السجل" onClick={() => deleteLog(log.id)} style={{
                          background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)',
                          borderRadius: 6, color: '#dc3545', width: 28, height: 28,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border, rgba(255,255,255,0.06))' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 8, color: page <= 1 ? 'var(--text-muted)' : 'var(--text)',
              padding: '6px 12px', cursor: page <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <FaChevronRight size={11} /> السابق
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              الصفحة {page.toLocaleString('ar-LY')} من {totalPages.toLocaleString('ar-LY')}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 8, color: page >= totalPages ? 'var(--text-muted)' : 'var(--text)',
              padding: '6px 12px', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              التالي <FaChevronLeft size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onViewTrail={(userId, name) => {
          setSelectedLog(null);
          setActiveTrailUser({ id: userId, name });
        }}
        onBlockIp={handleBlockIp}
      />

      {/* User Activity Trail Modal */}
      {activeTrailUser && (
        <UserTrailModal
          userId={activeTrailUser.id}
          username={activeTrailUser.name}
          onClose={() => setActiveTrailUser(null)}
        />
      )}

      {/* Blocked IPs Modal */}
      {showBlockedIpsModal && (
        <BlockedIpsModal
          onClose={() => setShowBlockedIpsModal(false)}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuditLogs;
