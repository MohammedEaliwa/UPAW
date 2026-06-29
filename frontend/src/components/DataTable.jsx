import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FaSearch, FaFileDownload, FaChevronLeft, FaChevronRight,
  FaSort, FaSortUp, FaSortDown,
  FaAngleDoubleLeft, FaAngleDoubleRight, FaFilter
} from 'react-icons/fa';
import { Spinner } from 'react-bootstrap';

const LIMIT_OPTIONS = [5, 10, 15, 25, 50, 100];

/**
 * DataTable – Reusable premium data table component
 *
 * Props:
 *  columns       : [ { key, label, sortable?, style?, render?(value, row) } ]
 *  data          : array of row objects
 *  total         : total record count (from API)
 *  page          : current page number (1-indexed)
 *  limit         : rows per page
 *  totalPages    : total pages
 *  loading       : boolean
 *  onPageChange  : (page) => void
 *  onLimitChange : (limit) => void
 *  onSearch      : (query) => void   (debounced 400ms)
 *  onSortChange  : ({ key, dir }) => void  (optional)
 *  searchPlaceholder : string
 *  statsCards    : [ { label, value, icon, color } ]
 *  filters       : JSX – extra filter controls rendered in toolbar
 *  onExport      : () => void  (if provided, Export button shown)
 *  emptyIcon     : JSX
 *  emptyText     : string
 */
const DataTable = ({
  columns = [],
  data = [],
  total = 0,
  page = 1,
  limit = 15,
  totalPages = 1,
  loading = false,
  onPageChange,
  onLimitChange,
  onSearch,
  onSortChange,
  searchPlaceholder = 'بحث...',
  statsCards = [],
  filters,
  onExport,
  emptyIcon,
  emptyText = 'لا توجد بيانات',
  rtl = false,
  plain = false,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [showLimitMenu, setShowLimitMenu] = useState(false);
  const limitRef = useRef(null);
  const searchTimeout = useRef(null);

  // Close limit menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (limitRef.current && !limitRef.current.contains(e.target)) {
        setShowLimitMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (onSearch) onSearch(val);
    }, 400);
  };

  const handleSort = (key) => {
    let newDir = 'asc';
    if (sortKey === key) newDir = sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(newDir);
    if (onSortChange) onSortChange({ key, dir: newDir });
  };

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);
  // Compute effective total pages (derive from total/limit if totalPages not provided)
  const effectiveTotalPages = (totalPages && totalPages > 0)
    ? totalPages
    : Math.max(1, Math.ceil((total || 0) / (limit || 1)));

  // Compute visible page numbers (max 5)
  const getPageNumbers = () => {
    if (effectiveTotalPages <= 5) return Array.from({ length: effectiveTotalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= effectiveTotalPages - 2) return [effectiveTotalPages - 4, effectiveTotalPages - 3, effectiveTotalPages - 2, effectiveTotalPages - 1, effectiveTotalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  // Return page numbers array, reversed in RTL so visual order matches RTL layouts
  const getDisplayPageNumbers = () => {
    const nums = getPageNumbers();
    return rtl ? nums.slice().reverse() : nums;
  };

  return (
    <div className="dt-root" dir={rtl ? 'rtl' : 'ltr'}>

      {/* ── Stats Cards ── */}
      {statsCards.length > 0 && (
        <div className="dt-stats-grid">
          {statsCards.map((card, i) => (
            <motion.div
              key={i}
              className="dt-stat-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              style={{ '--card-accent': card.color || 'var(--primary)' }}
            >
              <div className="dt-stat-icon">{card.icon}</div>
              <div className="dt-stat-body">
                <div className="dt-stat-value">{card.value}</div>
                <div className="dt-stat-label">{card.label}</div>
              </div>
              <div className="dt-stat-bar" />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Main Table Card ── */}
      <div className={`dt-card ${plain ? 'dt-card-plain' : ''}`}>

        {/* Toolbar */}
        <div className="dt-toolbar">

          {/* Limit Selector */}
          <div className="dt-limit-wrap" ref={limitRef}>
            <span className="dt-limit-label">عرض</span>
            <button
              className="dt-limit-btn"
              onClick={() => setShowLimitMenu(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={showLimitMenu}
            >
              <span>{limit}</span>
              <svg
                width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"
                style={{ transform: showLimitMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            <span className="dt-limit-label">سجل</span>

            <AnimatePresence>
              {showLimitMenu && (
                <motion.div
                  className="dt-limit-menu"
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  role="listbox"
                >
                  {LIMIT_OPTIONS.map(opt => (
                    <div
                      key={opt}
                      className={`dt-limit-opt ${opt === limit ? 'active' : ''}`}
                      role="option"
                      aria-selected={opt === limit}
                      onClick={() => {
                        setShowLimitMenu(false);
                        if (onLimitChange) onLimitChange(opt);
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center Controls */}
          <div className="dt-toolbar-center">
            {filters}
            {onExport && (
              <button className="dt-export-btn" onClick={onExport} title="تصدير البيانات">
                <FaFileDownload size={13} />
                <span>تصدير</span>
              </button>
            )}
          </div>

          {/* Search */}
          <label className="dt-search-box" htmlFor="dt-search-input">
            <FaSearch size={13} className="dt-search-icon" />
            <input
              id="dt-search-input"
              type="text"
              className="dt-search-input"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearch}
              autoComplete="off"
            />
            {searchValue && (
              <button
                className="dt-search-clear"
                onClick={() => { setSearchValue(''); if (onSearch) onSearch(''); }}
                aria-label="مسح البحث"
              >
                ×
              </button>
            )}
          </label>

        </div>{/* /toolbar */}

        {/* Table */}
        <div className="dt-scroll">
          {loading ? (
            <div className="dt-loading-box">
              <div className="dt-loading-spinner">
                <Spinner animation="border" style={{ color: 'var(--primary)' }} />
              </div>
              <p className="dt-loading-text">جاري التحميل...</p>
            </div>
          ) : (
            <table className="dt-table" aria-label="جدول البيانات">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={() => col.sortable && handleSort(col.key)}
                      style={col.headStyle || col.style || {}}
                      aria-sort={
                        col.sortable && sortKey === col.key
                          ? sortDir === 'asc' ? 'ascending' : 'descending'
                          : undefined
                      }
                    >
                      <div className="dt-th-inner">
                        <span>{col.label}</span>
                        {col.sortable && (
                          <span className="dt-sort-icon" aria-hidden="true">
                            {sortKey === col.key
                              ? sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />
                              : <FaSort />}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="dt-empty-cell">
                      {emptyIcon && <div className="dt-empty-icon">{emptyIcon}</div>}
                      <p className="dt-empty-text">{emptyText}</p>
                    </td>
                  </tr>
                ) : (
                  data.map((row, i) => (
                    <motion.tr
                      key={row.id ? `row-${row.id}` : `row-${i}`}
                      className="dt-row"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.25 }}
                    >
                      {columns.map(col => (
                        <td
                          key={col.key}
                          style={col.style || {}}
                          data-label={col.label}
                        >
                          {col.render ? col.render(row[col.key], row, i) : (row[col.key] ?? '—')}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>{/* /scroll */}

        {/* Footer: info + pagination */}
        <div className="dt-footer">
          <div className="dt-footer-info">
            {total > 0
              ? <>عرض <strong>{startRecord}</strong> – <strong>{endRecord}</strong> من أصل <strong>{total}</strong> سجل</>
              : 'لا توجد نتائج'}
          </div>

          {effectiveTotalPages > 1 && (
            <nav className="dt-pagination" aria-label="التنقل بين الصفحات">
              {/* First */}
              <button
                className="dt-pg-btn"
                onClick={() => onPageChange && onPageChange(1)}
                disabled={page <= 1}
                title="الصفحة الأولى"
                aria-label="الصفحة الأولى"
              >
                <FaAngleDoubleRight size={12} />
              </button>
              {/* Prev */}
              <button
                className="dt-pg-btn"
                onClick={() => onPageChange && onPageChange(page - 1)}
                disabled={page <= 1}
                title="السابقة"
                aria-label="الصفحة السابقة"
              >
                <FaChevronRight size={11} />
              </button>

              {/* Page numbers */}
              {getDisplayPageNumbers().map(p => (
                <button
                  key={p}
                  className={`dt-pg-btn ${p === page ? 'active' : ''}`}
                  onClick={() => onPageChange && onPageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}

              {/* Next */}
              <button
                className="dt-pg-btn"
                onClick={() => onPageChange && onPageChange(page + 1)}
                disabled={page >= effectiveTotalPages}
                title="التالية"
                aria-label="الصفحة التالية"
              >
                <FaChevronLeft size={11} />
              </button>
              {/* Last */}
              <button
                className="dt-pg-btn"
                onClick={() => onPageChange && onPageChange(effectiveTotalPages)}
                disabled={page >= effectiveTotalPages}
                title="الصفحة الأخيرة"
                aria-label="الصفحة الأخيرة"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
            </nav>
          )}
        </div>

      </div>{/* /dt-card */}

      {/* ── Embedded Styles ── */}
      <style>{`
        /* ===== DataTable Root ===== */
        .dt-root { }

        /* ===== Stats Grid ===== */
        .dt-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .dt-stat-card {
          background: var(--card-bg, #fff);
          border-radius: 16px;
          padding: 18px 20px 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 14px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
          transition: box-shadow 0.25s, transform 0.25s;
        }

        .dt-stat-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.10);
          transform: translateY(-2px);
        }

        .dt-stat-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3.5px;
          background: var(--card-accent);
          border-radius: 0 0 16px 16px;
        }

        .dt-stat-icon {
          width: 46px; height: 46px;
          background: color-mix(in srgb, var(--card-accent) 13%, transparent);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--card-accent);
          font-size: 1.15rem;
          flex-shrink: 0;
        }

        .dt-stat-value {
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--text, #1a1a2e);
          line-height: 1.1;
          margin-bottom: 3px;
        }

        .dt-stat-label {
          font-size: 0.76rem;
          color: var(--text-muted, #888);
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        /* ===== Card Wrapper ===== */
        .dt-card {
          background: var(--card-bg, #fff);
          border-radius: 20px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.07);
          border: 1px solid rgba(0,0,0,0.05);
          overflow: hidden;
        }

        /* Plain mode: remove card styling so table can span full width */
        .dt-card.dt-card-plain {
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          border: none;
          overflow: visible;
        }

        /* ===== Toolbar ===== */
        .dt-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          gap: 10px;
          flex-wrap: wrap;
        }

        .dt-toolbar-center {
          display: flex; align-items: center; gap: 8px;
        }

        /* Limit Selector */
        .dt-limit-wrap {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.84rem; color: var(--text,#444); font-weight: 500;
          position: relative;
        }

        .dt-limit-label { white-space: nowrap; }

        .dt-limit-btn {
          display: flex; align-items: center; gap: 7px;
          background: var(--bg, #f5f7fa);
          border: 1.5px solid rgba(0,48,135,0.14);
          border-radius: 10px;
          padding: 7px 13px;
          cursor: pointer;
          font-size: 0.88rem; font-weight: 700;
          color: var(--primary, #003087);
          min-width: 72px; justify-content: space-between;
          transition: border-color 0.2s, background 0.2s;
        }

        .dt-limit-btn:hover {
          border-color: var(--primary);
          background: rgba(0,48,135,0.05);
        }

        .dt-limit-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 24px;
          background: var(--card-bg, #fff);
          border: 1.5px solid rgba(0,48,135,0.15);
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.13);
          overflow: hidden;
          z-index: 1100;
          min-width: 100px;
        }

        .dt-limit-opt {
          padding: 10px 18px;
          cursor: pointer;
          font-size: 0.88rem; font-weight: 600;
          color: var(--text, #333);
          text-align: center;
          transition: background 0.15s, color 0.15s;
        }

        .dt-limit-opt:hover { background: rgba(0,48,135,0.06); color: var(--primary); }
        .dt-limit-opt.active { background: var(--primary, #003087); color: #fff; }

        /* Export Button */
        .dt-export-btn {
          display: flex; align-items: center; gap: 7px;
          background: var(--primary, #003087);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 8px 18px;
          font-size: 0.84rem; font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }

        .dt-export-btn:hover {
          background: var(--primary-dark, #002060);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,48,135,0.28);
        }

        /* Search */
        .dt-search-box {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg, #f5f7fa);
          border: 1.5px solid rgba(0,0,0,0.09);
          border-radius: 12px;
          padding: 8px 14px;
          min-width: 230px;
          cursor: text;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .dt-search-box:focus-within {
          border-color: var(--primary, #003087);
          background: var(--card-bg, #fff);
          box-shadow: 0 0 0 3px rgba(0,48,135,0.09);
        }

        .dt-search-icon { color: #aaa; flex-shrink: 0; }

        .dt-search-input {
          border: none; outline: none;
          background: transparent;
          font-size: 0.84rem;
          width: 100%;
          color: var(--text, #333);
          text-align: right;
        }

        .dt-search-input::placeholder { color: #bbb; }

        .dt-search-clear {
          background: none; border: none;
          color: #aaa; cursor: pointer; font-size: 1rem;
          padding: 0; line-height: 1;
          transition: color 0.15s;
        }
        .dt-search-clear:hover { color: #666; }

        /* ===== Table ===== */
        .dt-scroll { overflow-x: auto; }

        .dt-loading-box {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 70px 20px; gap: 14px;
        }

        .dt-loading-text {
          font-size: 0.85rem; color: var(--text-muted, #999); margin: 0;
        }

        .dt-table {
          width: 100%; border-collapse: collapse;
          direction: rtl;
        }

        .dt-table thead tr {
          background: rgba(0,48,135,0.025);
          border-bottom: 2px solid rgba(0,48,135,0.07);
        }

        .dt-table th {
          padding: 13px 16px;
          font-size: 0.78rem; font-weight: 700;
          color: var(--text-muted, #556080) !important;
          text-align: right;
          white-space: nowrap;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .dt-table th.sortable { cursor: pointer; user-select: none; }
        .dt-table th.sortable:hover { color: var(--primary); }

        .dt-th-inner { display: flex; align-items: center; gap: 6px; }

        .dt-sort-icon { opacity: 0.45; font-size: 10px; transition: opacity 0.15s; }
        .dt-table th.sortable:hover .dt-sort-icon { opacity: 1; }

        .dt-table td {
          padding: 13px 16px;
          font-size: 0.875rem;
          color: var(--text, #1a2035) !important;
          border-bottom: 1px solid rgba(0,0,0,0.038);
          vertical-align: middle;
          text-align: right;
        }

        .dt-row:last-child td { border-bottom: none; }

        .dt-row { transition: background 0.15s; }
        .dt-row:hover td { background: rgba(0,48,135,0.025); }

        .dt-empty-cell {
          text-align: center !important;
          padding: 70px 20px !important;
          color: #ccc;
        }

        .dt-empty-icon { font-size: 2.8rem; margin-bottom: 14px; opacity: 0.28; }
        .dt-empty-text { font-size: 0.9rem; margin: 0; color: #bbb; }

        /* ===== Footer ===== */
        .dt-footer {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-top: 1px solid rgba(0,0,0,0.06);
          flex-wrap: wrap; gap: 12px;
        }

        .dt-footer-info {
          font-size: 0.81rem;
          color: var(--text-muted, #999);
        }

        .dt-footer-info strong { color: var(--text, #444); font-weight: 700; }

        /* Pagination */
        .dt-pagination {
          display: flex; align-items: center; gap: 4px;
        }

        .dt-pg-btn {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(0,0,0,0.1);
          border-radius: 9px;
          background: transparent;
          color: var(--text, #555);
          font-size: 0.82rem; font-weight: 600;
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s, background 0.18s, box-shadow 0.18s;
        }

        .dt-pg-btn:hover:not(:disabled):not(.active) {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(0,48,135,0.05);
        }

        .dt-pg-btn.active {
          background: var(--primary, #003087);
          color: #fff;
          border-color: var(--primary);
          box-shadow: 0 3px 10px rgba(0,48,135,0.3);
        }

        .dt-pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Responsive */
        @media (max-width: 640px) {
          .dt-toolbar { flex-direction: column; align-items: stretch; }
          .dt-search-box { min-width: unset; }
          .dt-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default DataTable;
