import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import {
  FaEdit, FaTrash, FaPlus, FaEye, FaEyeSlash,
  FaNewspaper, FaSave, FaTimes, FaArrowRight,
  FaChartBar, FaToggleOn, FaLayerGroup, FaBookOpen,
  FaFilter
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import ModernModal from '../../../components/ModernModal';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import RichTextEditor from '../../../components/RichTextEditor';
import DataTable from '../../../components/DataTable';
import { api } from '../../../services/api';

const CATEGORIES = ['أخبار الهيئة', 'مشاريع', 'تصنيف حضري', 'اجتماعات', 'إعلانات', 'أخبار داخلية'];

// ── Helpers ──────────────────────────────────────────────────────────────────
const categoryColors = {
  'أخبار الهيئة':  '#003087',
  'مشاريع':        '#0d6efd',
  'تصنيف حضري':   '#6610f2',
  'اجتماعات':      '#0dcaf0',
  'إعلانات':       '#fd7e14',
  'أخبار داخلية': '#dc3545',
};

// ── ManageNews Component ──────────────────────────────────────────────────────
const ManageNews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  /* ── Table state ── */
  const [data, setData]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(15);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [dbStats, setDbStats]       = useState({ total: 0, visible: 0, hidden: 0 });

  /* ── Edit / Delete state ── */
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete]   = useState(null);
  const [saving, setSaving]               = useState(false);

  /* ── Fetch (server-side paginated) ── */
  const fetchStats = useCallback(() => {
    api.getNewsStats()
      .then(d => {
        if (d && typeof d.total === 'number') setDbStats(d);
      })
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback((opts = {}) => {
    setLoading(true);
    const p   = opts.page   ?? page;
    const l   = opts.limit  ?? limit;
    const s   = opts.search !== undefined ? opts.search : search;
    const cat = opts.cat    !== undefined ? opts.cat    : filterCat;

    const params = new URLSearchParams({ page: p, limit: l });
    if (s)   params.set('search', s);
    if (cat) params.set('category', cat);

    api.getNews({ page: p, limit: l, search: s, category: cat })
      .then(resp => {
        // Backend returns { total, rows } when paginated, or plain array otherwise
        if (resp && resp.rows) {
          setData(Array.isArray(resp.rows) ? resp.rows : []);
          setTotal(resp.total || 0);
          setTotalPages(Math.max(1, Math.ceil((resp.total || 0) / l)));
          setPage(p);
          setLimit(l);
        } else if (resp && resp.data) {
          setData(Array.isArray(resp.data) ? resp.data : []);
          setTotal(resp.total || 0);
          setTotalPages(resp.totalPages || Math.max(1, Math.ceil((resp.total || 0) / l)));
          setPage(p);
          setLimit(l);
        } else {
          const arr = Array.isArray(resp) ? resp : [];
          setData(arr);
          setTotal(arr.length);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
      });
  }, [page, limit, search, filterCat]);

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [fetchPosts, fetchStats]);

  /* ── Handlers ── */
  const handlePageChange  = (p) => { setPage(p);   fetchPosts({ page: p }); };
  const handleLimitChange = (l) => { setLimit(l);  fetchPosts({ page: 1, limit: l }); };
  const handleSearch      = (s) => { setSearch(s); fetchPosts({ page: 1, search: s }); };

  const handleFilterCat = (cat) => {
    setFilterCat(cat);
    fetchPosts({ page: 1, cat });
  };

  const handleRowClick = (post) => setSelectedPost({ ...post });
  const handleCloseEditor = () => { setSelectedPost(null); };

  const handleSaveEdit = (e) => {
    e?.preventDefault();
    setSaving(true);
    const loggedInUser = user || { username: 'مدخل البيانات' };
    api.updateNews(selectedPost.id, { ...selectedPost, editor_username: loggedInUser.username })
      .then(() => {
        fetchPosts();
        fetchStats();
        showToast("تم حفظ التعديلات بنجاح! ✨", "success");
        setSaving(false);
        setSelectedPost(null);
      })
      .catch(() => {
        setSaving(false);
        showToast("حدث خطأ أثناء حفظ التعديلات", "danger");
      });
  };

  const handleDeleteClick = (post, e) => {
    e?.stopPropagation();
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!postToDelete) return;
    const loggedInUser = user || { username: 'مدخل البيانات' };
    api.deleteNews(postToDelete.id, { editor_username: loggedInUser.username })
      .then(() => {
        fetchPosts();
        fetchStats();
        showToast("تم حذف الخبر بنجاح! ✨", "success");
        setShowDeleteModal(false);
        setPostToDelete(null);
        if (selectedPost?.id === postToDelete.id) setSelectedPost(null);
      })
      .catch(() => {
        showToast("حدث خطأ أثناء حذف الخبر", "danger");
      });
  };

  const toggleVisibility = (id, e) => {
    e?.stopPropagation();
    const post = data.find(p => p.id === id);
    if (!post) return;
    api.updateNews(id, { ...post, is_visible: !post.is_visible })
      .then(() => {
        fetchPosts();
        fetchStats();
        showToast(post.is_visible ? "تم إخفاء الخبر بنجاح! ✨" : "تم إظهار الخبر بنجاح! ✨", "success");
      })
      .catch(() => {
        showToast("حدث خطأ أثناء تعديل حالة الظهور", "danger");
      });
  };

  /* ── Stats Cards ── */
  const statsCards = [
    {
      label: 'إجمالي الأخبار',
      value: dbStats.total.toLocaleString('ar'),
      icon:  <FaNewspaper />,
      color: '#003087',
    },
    {
      label: 'أخبار ظاهرة',
      value: dbStats.visible.toLocaleString('ar'),
      icon:  <FaEye />,
      color: '#198754',
    },
    {
      label: 'أخبار مخفية',
      value: dbStats.hidden.toLocaleString('ar'),
      icon:  <FaEyeSlash />,
      color: '#dc3545',
    },
    {
      label: 'الصفحة الحالية',
      value: `${page} / ${totalPages}`,
      icon:  <FaBookOpen />,
      color: '#fd7e14',
    },
  ];

  /* ── Table Columns ── */
  const columns = [
    {
      key: 'id',
      label: '#',
      style: { width: 60, color: '#aaa', fontWeight: 700 },
      render: (_, row, i) => (page - 1) * limit + i + 1,
    },
    {
      key: 'title_ar',
      label: 'عنوان الخبر',
      sortable: true,
      style: { minWidth: 260 },
      render: (val, row) => (
        <div
          className="d-flex align-items-center gap-3"
          style={{ cursor: 'pointer' }}
          onClick={() => handleRowClick(row)}
        >
          {row.image && (
            <img
              src={row.image}
              alt=""
              style={{ width: 46, height: 34, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          <span className="text-truncate fw-semibold" style={{ maxWidth: 240 }} title={val}>
            {val || row.title}
          </span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'التصنيف',
      sortable: true,
      render: (val) => (
        <span
          className="mn-badge"
          style={{ background: `${categoryColors[val] || '#6c757d'}18`, color: categoryColors[val] || '#6c757d' }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'target_audience',
      label: 'الجمهور',
      render: (val) => (
        <span
          className="mn-badge"
          style={{
            background: val === 'الموظفين' ? '#dc354518' : '#19875418',
            color:      val === 'الموظفين' ? '#dc3545'   : '#198754',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'تاريخ النشر',
      sortable: true,
      style: { color: '#888', fontSize: '0.82rem' },
    },
    {
      key: 'is_visible',
      label: 'الحالة',
      render: (val) => val
        ? <span className="mn-badge" style={{ background: '#19875418', color: '#198754' }}><FaEye className="me-1" size={10}/>ظاهر</span>
        : <span className="mn-badge" style={{ background: '#6c757d18', color: '#6c757d' }}><FaEyeSlash className="me-1" size={10}/>مخفي</span>,
    },
    {
      key: '_actions',
      label: 'الإجراءات',
      style: { width: 120, textAlign: 'center' },
      render: (_, row) => (
        <div className="d-flex justify-content-center gap-2">
          <button
            className="mn-icon-btn"
            style={{ color: row.is_visible ? '#aaa' : '#198754', borderColor: row.is_visible ? '#ddd' : '#19875455' }}
            onClick={e => toggleVisibility(row.id, e)}
            title={row.is_visible ? 'إخفاء' : 'إظهار'}
          >
            {row.is_visible ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
          </button>
          <button
            className="mn-icon-btn"
            style={{ color: '#003087', borderColor: '#00308755' }}
            onClick={e => { e.stopPropagation(); handleRowClick(row); }}
            title="تعديل"
          >
            <FaEdit size={12} />
          </button>
          <button
            className="mn-icon-btn"
            style={{ color: '#dc3545', borderColor: '#dc354555' }}
            onClick={e => handleDeleteClick(row, e)}
            title="حذف"
          >
            <FaTrash size={12} />
          </button>
        </div>
      ),
    },
  ];

  /* ── Filter JSX (for toolbar) ── */
  const filtersJSX = (
    <div className="d-flex align-items-center gap-2">
      <select
        className="mn-filter-select"
        value={filterCat}
        onChange={e => handleFilterCat(e.target.value)}
        title="فلترة حسب التصنيف"
      >
        <option value="">كل التصنيفات</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-5">

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 className="fw-bold m-0" style={{ color: 'var(--primary)' }}>
          {selectedPost ? (
            <span className="d-flex align-items-center gap-2">
              <Button variant="link" className="p-0 text-primary" onClick={handleCloseEditor}>
                <FaArrowRight />
              </Button>
              <span>تعديل: {(selectedPost.title_ar || selectedPost.title || '').substring(0, 50)}…</span>
            </span>
          ) : (
            <span><FaNewspaper className="ms-2" /> إدارة الأخبار والتنويهات</span>
          )}
        </h3>

        {!selectedPost && (
          <PrimaryButton onClick={() => navigate('/dashboard/add-news')} icon={<FaPlus size={13} />}>
            إضافة خبر جديد
          </PrimaryButton>
        )}

        {selectedPost && (
          <div className="d-flex gap-2">
            <Button variant="light" className="rounded-pill px-4" onClick={handleCloseEditor}>
              <FaTimes className="ms-1" /> إلغاء
            </Button>
            <PrimaryButton onClick={handleSaveEdit} icon={saving ? <Spinner size="sm" animation="border" /> : <FaSave />}>
              {saving ? 'جاري الحفظ…' : 'حفظ التعديلات'}
            </PrimaryButton>
          </div>
        )}
      </div>

      {/* Success Banner removed - uses global toasts */}

      {/* ── Editor or DataTable ── */}
      <AnimatePresence mode="wait">
        {selectedPost ? (
          /* ── Editor Panel ── */
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.25 }}
          >
            <Form onSubmit={handleSaveEdit}>
              <Row className="g-4">
                {selectedPost.image && (
                  <Col md={12}>
                    <div className="rounded-4 overflow-hidden shadow-sm" style={{ maxHeight: 280 }}>
                      <img
                        src={selectedPost.image} alt="News"
                        style={{ width: '100%', height: 280, objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </Col>
                )}
                <Col md={8}>
                  <div className="border-0 shadow-sm rounded-4 p-4 bg-white">
                     <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">عنوان الخبر</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedPost.title_ar || selectedPost.title || ''}
                        onChange={e => setSelectedPost({ ...selectedPost, title_ar: e.target.value, title: e.target.value })}
                        style={{ borderRadius: 10, fontSize: '1.05rem', fontWeight: 600 }}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">عنوان الخبر (إنجليزي)</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedPost.title_en || ''}
                        onChange={e => setSelectedPost({ ...selectedPost, title_en: e.target.value })}
                        style={{ borderRadius: 10, fontSize: '1.05rem', fontWeight: 600 }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">المقتطف / الوصف المختصر</Form.Label>
                      <Form.Control
                        as="textarea" rows={3}
                        value={selectedPost.excerpt_ar || selectedPost.excerpt || ''}
                        onChange={e => setSelectedPost({ ...selectedPost, excerpt_ar: e.target.value, excerpt: e.target.value })}
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">المقتطف / الوصف المختصر (إنجليزي)</Form.Label>
                      <Form.Control
                        as="textarea" rows={3}
                        value={selectedPost.excerpt_en || ''}
                        onChange={e => setSelectedPost({ ...selectedPost, excerpt_en: e.target.value })}
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">محتوى الخبر الكامل</Form.Label>
                      <RichTextEditor
                        value={selectedPost.content_ar || selectedPost.content || ''}
                        onChange={val => setSelectedPost({ ...selectedPost, content_ar: val, content: val })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label className="fw-bold">محتوى الخبر الكامل (إنجليزي)</Form.Label>
                      <RichTextEditor
                        value={selectedPost.content_en || ''}
                        onChange={val => setSelectedPost({ ...selectedPost, content_en: val })}
                      />
                    </Form.Group>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="border-0 shadow-sm rounded-4 p-4 bg-white">
                    <h6 className="fw-bold mb-4 text-primary">إعدادات الخبر</h6>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted">التصنيف</Form.Label>
                      <Form.Select
                        value={selectedPost.category || ''}
                        onChange={e => setSelectedPost({ ...selectedPost, category: e.target.value })}
                        style={{ borderRadius: 10 }}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted">الجمهور المستهدف</Form.Label>
                      <Form.Select
                        value={selectedPost.target_audience || 'العامة'}
                        onChange={e => setSelectedPost({ ...selectedPost, target_audience: e.target.value })}
                        style={{ borderRadius: 10 }}
                      >
                        <option value="العامة">العامة</option>
                        <option value="الموظفين">الموظفين</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted">تاريخ النشر</Form.Label>
                      <Form.Control
                        type="date"
                        value={selectedPost.date || ''}
                        onChange={e => setSelectedPost({ ...selectedPost, date: e.target.value })}
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted">رابط الصورة</Form.Label>
                      <Form.Control
                        type="url"
                        value={selectedPost.image || ''}
                        onChange={e => setSelectedPost({ ...selectedPost, image: e.target.value })}
                        style={{ borderRadius: 10, direction: 'ltr' }}
                        placeholder="https://..."
                      />
                    </Form.Group>
                    <div className="d-flex align-items-center gap-2 mt-4 p-3 rounded-3 bg-light">
                      <Form.Check
                        type="switch"
                        id="visibility-switch"
                        checked={!!selectedPost.is_visible}
                        onChange={e => setSelectedPost({ ...selectedPost, is_visible: e.target.checked })}
                      />
                      <span className="fw-bold small">
                        {selectedPost.is_visible ? '🟢 ظاهر للعموم' : '🔴 مخفي'}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </Form>
          </motion.div>
        ) : (
          /* ── DataTable View ── */
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DataTable
              columns={columns}
              data={data}
              total={total}
              page={page}
              limit={limit}
              totalPages={totalPages}
              loading={loading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              onSearch={handleSearch}
              searchPlaceholder="بحث في الأخبار..."
              statsCards={statsCards}
              filters={filtersJSX}
              onExport={() => {
                const csv = [
                  ['#', 'العنوان', 'التصنيف', 'الجمهور', 'التاريخ', 'الحالة'].join(','),
                  ...data.map((p, i) => [
                    i + 1,
                    `"${(p.title_ar || p.title || '').replace(/"/g, '""')}"`,
                    p.category,
                    p.target_audience,
                    p.date,
                    p.is_visible ? 'ظاهر' : 'مخفي',
                  ].join(',')),
                ].join('\n');
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'news.csv'; a.click();
                URL.revokeObjectURL(url);
              }}
              emptyIcon={<FaNewspaper />}
              emptyText="لا توجد أخبار مضافة حالياً"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ModernModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="تأكيد حذف الخبر"
        type="danger"
        size="sm"
      >
        <div className="text-center">
          <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
            هل أنت متأكد من حذف الخبر بشكل نهائي؟ <br />
            <span className="text-danger">"{postToDelete?.title_ar || postToDelete?.title}"</span>
          </p>
          <p className="text-muted small mb-4">
            تنبيه: هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowDeleteModal(false)}>إلغاء</Button>
            <Button variant="danger"    className="rounded-pill px-4" onClick={handleConfirmDelete}>تأكيد الحذف</Button>
          </div>
        </div>
      </ModernModal>

      {/* Local Styles */}
      <style>{`
        .mn-badge {
          display: inline-flex; align-items: center;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.78rem; font-weight: 700;
          white-space: nowrap;
        }
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
    </motion.div>
  );
};

export default ManageNews;
