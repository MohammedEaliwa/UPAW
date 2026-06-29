import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FaBell, FaPlus, FaEdit, FaTrash, FaInfoCircle,
  FaNewspaper, FaUsers, FaMapMarkedAlt, FaFileAlt,
  FaCheckDouble, FaTimes, FaExclamationTriangle,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const POLL_INTERVAL = 30_000; // 30 seconds

/* ── helpers ────────────────────────────────────────────────────────────── */
const relativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'الآن';
  if (diff < 3600)  return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800)return `منذ ${Math.floor(diff / 86400)} يوم`;
  return new Date(dateStr).toLocaleDateString('ar');
};

const TYPE_CONFIG = {
  add:    { color: '#198754', bg: '#19875415', Icon: FaPlus },
  edit:   { color: '#0d6efd', bg: '#0d6efd15', Icon: FaEdit },
  delete: { color: '#dc3545', bg: '#dc354515', Icon: FaTrash },
  info:   { color: '#0dcaf0', bg: '#0dcaf015', Icon: FaInfoCircle },
  warning:{ color: '#fd7e14', bg: '#fd7e1415', Icon: FaExclamationTriangle },
};

const ENTITY_ICON = {
  news:   <FaNewspaper />,
  user:   <FaUsers />,
  map:    <FaMapMarkedAlt />,
  page:   <FaFileAlt />,
};

/* ── component ──────────────────────────────────────────────────────────── */
const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleId = user?.role_id;
  const userId = user?.id;

  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const wrapRef = useRef(null);

  /* Fetch unread count only (lightweight polling) */
  const fetchCount = useCallback(async () => {
    try {
      const data = await api.getUnreadNotificationCount(roleId, userId);
      setUnreadCount(data?.count || 0);
    } catch {
      // ignore
    }
  }, [roleId, userId]);

  /* Fetch full notification list */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications(roleId, userId, 30);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [roleId, userId]);

  /* Initial load + polling */
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount]);

  /* Load list when dropdown opens */
  useEffect(() => {
    if (open) {
      fetchList();
    }
  }, [open, fetchList]);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Mark single as read + navigate */
  const handleClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id, userId);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  /* Mark all as read */
  const markAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.markAllNotificationsRead(roleId, userId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  /* Clear all */
  const clearAll = async (e) => {
    e.stopPropagation();
    try {
      await api.clearAllNotifications(roleId, userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>

      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(v => !v)}
        className="nd-bell-btn"
        aria-label="الإشعارات"
        aria-expanded={open}
      >
        <FaBell size={16} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              className="nd-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="nd-panel"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="nd-header">
              <div className="nd-header-title">
                <FaBell size={14} style={{ color: 'var(--primary)' }} />
                <span>الإشعارات</span>
                {unreadCount > 0 && (
                  <span className="nd-count-pill">{unreadCount} جديد</span>
                )}
              </div>
              <div className="nd-header-actions">
                {unreadCount > 0 && (
                  <button className="nd-action-btn" onClick={markAllRead} title="قراءة كل الإشعارات">
                    <FaCheckDouble size={12} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button className="nd-action-btn danger" onClick={clearAll} title="حذف كل الإشعارات">
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="nd-list">
              {loading ? (
                <div className="nd-loading">
                  <div className="nd-spinner" />
                  <span>جاري التحميل…</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="nd-empty">
                  <FaBell size={28} style={{ opacity: 0.2 }} />
                  <p>لا توجد إشعارات</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                  const TypeIcon = cfg.Icon;
                  const entityIcon = ENTITY_ICON[n.entity_type] || <FaFileAlt />;
                  return (
                    <motion.div
                      key={n.id}
                      className={`nd-item ${!n.is_read ? 'unread' : ''}`}
                      onClick={() => handleClick(n)}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ '--item-color': cfg.color, '--item-bg': cfg.bg }}
                    >
                      {/* Icon */}
                      <div className="nd-item-icon">
                        <div className="nd-item-type-icon">
                          <TypeIcon size={10} />
                        </div>
                        <div className="nd-item-entity-icon">
                          {entityIcon}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="nd-item-content">
                        <div className="nd-item-title">{n.title}</div>
                        {n.message && (
                          <div className="nd-item-message">{n.message}</div>
                        )}
                        <div className="nd-item-time">{relativeTime(n.created_at)}</div>
                      </div>

                      {/* Unread dot */}
                      {!n.is_read && <div className="nd-unread-dot" />}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles */}
      <style>{`
        /* Bell Button */
        .nd-bell-btn {
          position: relative;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          color: var(--text-muted);
          box-shadow: 0 2px 8px rgba(0,48,135,0.04);
          transition: all 0.2s;
        }
        .nd-bell-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 4px 14px rgba(0,48,135,0.12);
        }

        /* Badge */
        .nd-badge {
          position: absolute;
          top: -5px; left: -5px;
          background: #ef4444;
          color: #fff;
          font-size: 0.62rem;
          font-weight: 800;
          border-radius: 99px;
          min-width: 18px; height: 18px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--card-bg);
          line-height: 1;
        }

        /* Panel */
        .nd-panel {
          position: absolute;
          top: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%);
          width: 360px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.14);
          overflow: hidden;
          z-index: 2000;
          direction: rtl;
        }

        @media (max-width: 480px) {
          .nd-panel {
            width: calc(100vw - 24px);
            left: auto;
            right: -10px;
            transform: none;
          }
        }

        /* Header */
        .nd-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid var(--border);
          background: rgba(0,48,135,0.02);
        }

        .nd-header-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.88rem; font-weight: 700;
          color: var(--text);
        }

        .nd-count-pill {
          background: rgba(0,48,135,0.1);
          color: var(--primary);
          font-size: 0.72rem; font-weight: 700;
          padding: 2px 8px; border-radius: 99px;
        }

        .nd-header-actions {
          display: flex; align-items: center; gap: 6px;
        }

        .nd-action-btn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .nd-action-btn:hover { background: rgba(0,48,135,0.06); color: var(--primary); }
        .nd-action-btn.danger:hover { background: rgba(220,53,69,0.08); color: #dc3545; border-color: #dc3545; }

        /* List */
        .nd-list {
          max-height: 380px;
          overflow-y: auto;
          scrollbar-width: thin;
        }
        .nd-list::-webkit-scrollbar { width: 4px; }
        .nd-list::-webkit-scrollbar-track { background: transparent; }
        .nd-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 99px; }

        /* Loading */
        .nd-loading {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px; gap: 12px;
          color: var(--text-muted); font-size: 0.82rem;
        }
        .nd-spinner {
          width: 24px; height: 24px;
          border: 2.5px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: nd-spin 0.6s linear infinite;
        }
        @keyframes nd-spin { to { transform: rotate(360deg); } }

        /* Empty */
        .nd-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 20px; gap: 10px;
          color: var(--text-muted);
        }
        .nd-empty p { font-size: 0.85rem; margin: 0; }

        /* Item */
        .nd-item {
          display: flex; align-items: flex-start;
          gap: 12px; padding: 13px 16px;
          cursor: pointer;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          transition: background 0.15s;
          position: relative;
        }
        .nd-item:last-child { border-bottom: none; }
        .nd-item:hover { background: rgba(0,48,135,0.025); }
        .nd-item.unread { background: rgba(0,48,135,0.02); }

        /* Item Icon */
        .nd-item-icon {
          position: relative;
          flex-shrink: 0;
          width: 38px; height: 38px;
        }

        .nd-item-entity-icon {
          width: 38px; height: 38px;
          background: var(--item-bg);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--item-color);
          font-size: 0.95rem;
        }

        .nd-item-type-icon {
          position: absolute;
          bottom: -3px; right: -3px;
          width: 16px; height: 16px;
          background: var(--item-color);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          border: 2px solid var(--card-bg);
        }

        /* Item Content */
        .nd-item-content { flex: 1; min-width: 0; }

        .nd-item-title {
          font-size: 0.84rem; font-weight: 700;
          color: var(--text);
          margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .nd-item-message {
          font-size: 0.77rem;
          color: var(--text-muted);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 4px;
        }

        .nd-item-time {
          font-size: 0.72rem;
          color: var(--text-muted);
          opacity: 0.7;
        }

        /* Unread Dot */
        .nd-unread-dot {
          width: 8px; height: 8px;
          background: var(--primary);
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
