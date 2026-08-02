import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Row, Col, Button, Spinner, Tab, Tabs, Badge, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import {
  FaSave, FaFileAlt, FaEye, FaPlus, FaTrash, FaArrowUp, FaArrowDown,
  FaImage, FaUser, FaBuilding, FaInfoCircle, FaChartBar, FaLayerGroup,
  FaArrowLeft, FaCheckCircle, FaStar
} from 'react-icons/fa';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import RichTextEditor from '../../../components/RichTextEditor';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';

const FA_ICONS = [
  'FaMapMarkedAlt', 'FaLayerGroup', 'FaBuilding', 'FaCity', 'FaProjectDiagram',
  'FaUsers', 'FaBook', 'FaCheckCircle', 'FaBullseye', 'FaEye', 'FaHammer',
  'FaLandmark', 'FaMap', 'FaRegBuilding', 'FaGlobe', 'FaStar', 'FaChartBar',
  'FaFileAlt', 'FaHandshake', 'FaLeaf'
];

const defaultTask = () => ({
  icon: 'FaMapMarkedAlt',
  title_ar: '',
  desc_ar: '',
  title_en: '',
  desc_en: ''
});

/* ═══════════════════════════════════════════════════════════════
   DirectorsTreeEditor — embedded directly in هيكلية القيادة tab
   Reads/writes /api/directors — auto-saves on blur, no page Save needed
   ═══════════════════════════════════════════════════════════════ */
const DirectorCard = ({ director, onSave, onDelete }) => {
  const [form, setForm]       = useState({ ...director });
  const [saving, setSaving]   = useState(false);
  const [imgPrev, setImgPrev] = useState(director.img || '');
  const [imgFile, setImgFile] = useState(null);
  const fileRef               = useRef();

  useEffect(() => { setForm({ ...director }); setImgPrev(director.img || ''); }, [director]);

  const handleBlurSave = async () => {
    setSaving(true);
    try { await onSave(director.id, form, imgFile); setImgFile(null); }
    finally { setSaving(false); }
  };

  const handleImgChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    setImgPrev(URL.createObjectURL(f));
    setSaving(true);
    try { await onSave(director.id, form, f); }
    finally { setSaving(false); }
  };

  const isPresident = director.role === 'president';

  return (
    <Card className="border border-light rounded-3 mb-3" style={{ background: 'var(--card-bg, #fff)' }}>
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Badge bg={isPresident ? 'primary' : director.role === 'office' ? 'info' : 'success'} className="px-3 py-2">
            {isPresident ? '👑 رئيس الهيئة' : director.title_ar}
          </Badge>
          <div className="d-flex gap-2 align-items-center">
            {saving && <Spinner size="sm" animation="border" variant="primary" />}
            {!isPresident && (
              <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => onDelete(director.id)}>
                <FaTrash size={11} />
              </Button>
            )}
          </div>
        </div>

        <Row className="g-2">
          <Col md={5}>
            <Form.Group>
              <Form.Label className="small fw-bold mb-1">اسم المدير (عربي)</Form.Label>
              <Form.Control type="text" value={form.name_ar || ''}
                onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                onBlur={handleBlurSave} placeholder="الاسم الكامل بالعربية"
                style={{ fontFamily: 'Cairo, sans-serif' }} />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group>
              <Form.Label className="small fw-bold mb-1">Director Name (En)</Form.Label>
              <Form.Control type="text" value={form.name_en || ''}
                onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                onBlur={handleBlurSave} placeholder="Full name in English"
                style={{ direction: 'ltr' }} />
            </Form.Group>
          </Col>
          {isPresident && (
            <>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="small fw-bold mb-1">المسمى الوظيفي (عربي)</Form.Label>
                  <Form.Control type="text" value={form.title_ar || ''}
                    onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
                    onBlur={handleBlurSave} placeholder="رئيس الهيئة" />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="small fw-bold mb-1">Job Title (En)</Form.Label>
                  <Form.Control type="text" value={form.title_en || ''}
                    onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))}
                    onBlur={handleBlurSave} placeholder="Head of the Authority"
                    style={{ direction: 'ltr' }} />
                </Form.Group>
              </Col>
            </>
          )}
          <Col md={2} className="d-flex flex-column align-items-center justify-content-end">
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              {imgPrev
                ? <img src={imgPrev} alt="صورة" style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                : <div className="bg-light border rounded-circle d-flex align-items-center justify-content-center text-muted" style={{ width: 54, height: 54 }}><FaUser size={22} /></div>
              }
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaImage size={9} color="#fff" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImgChange} />
            <div className="text-muted mt-1" style={{ fontSize: '0.62rem', textAlign: 'center' }}>انقر للصورة</div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

const DirectorsTreeEditor = ({ showToast }) => {
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [addRole, setAddRole]     = useState('office');
  const [addForm, setAddForm]     = useState({ title_ar: '', title_en: '', name_ar: '', name_en: '' });
  const [addImg, setAddImg]       = useState(null);
  const [adding, setAdding]       = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const addFileRef                = useRef();

  const load = () => {
    setLoading(true);
    api.getDirectors()
      .then(d => setDirectors(Array.isArray(d) ? d : []))
      .catch(() => showToast('خطأ في تحميل المدراء', 'danger'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (id, form, imgFile) => {
    const fd = new FormData();
    fd.append('name_ar',  form.name_ar  || '');
    fd.append('name_en',  form.name_en  || '');
    fd.append('title_ar', form.title_ar || '');
    fd.append('title_en', form.title_en || '');
    fd.append('role',     form.role);
    if (imgFile) fd.append('img', imgFile);
    try {
      const updated = await api.updateDirector(id, fd);
      setDirectors(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
      showToast('تم الحفظ ✓', 'success');
    } catch { showToast('خطأ أثناء الحفظ', 'danger'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المدير؟')) return;
    try {
      await api.deleteDirector(id);
      setDirectors(prev => prev.filter(d => d.id !== id));
      showToast('تم الحذف', 'warning');
    } catch { showToast('خطأ أثناء الحذف', 'danger'); }
  };

  const handleAdd = async () => {
    if (!addForm.title_ar) { showToast('يرجى إدخال اسم المكتب/الإدارة', 'warning'); return; }
    setAdding(true);
    try {
      const fd = new FormData();
      fd.append('role',     addRole);
      fd.append('title_ar', addForm.title_ar);
      fd.append('title_en', addForm.title_en || '');
      fd.append('name_ar',  addForm.name_ar  || '');
      fd.append('name_en',  addForm.name_en  || '');
      fd.append('order_index', directors.filter(d => d.role === addRole).length + 1);
      if (addImg) fd.append('img', addImg);
      const created = await api.createDirector(fd);
      setDirectors(prev => [...prev, created]);
      setAddForm({ title_ar: '', title_en: '', name_ar: '', name_en: '' });
      setAddImg(null); setShowAdd(false);
      showToast('تمت الإضافة ✓', 'success');
    } catch { showToast('خطأ أثناء الإضافة', 'danger'); }
    finally { setAdding(false); }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  const president       = directors.filter(d => d.role === 'president');
  const offices         = directors.filter(d => d.role === 'office').sort((a, b) => a.order_index - b.order_index);
  const administrations = directors.filter(d => d.role === 'administration').sort((a, b) => a.order_index - b.order_index);

  return (
    <div>
      <Alert variant="info" className="rounded-3 border-0 mb-4" style={{ background: 'rgba(13,110,253,0.07)' }}>
        <FaInfoCircle className="ms-2" />
        <strong>التعديلات تُحفظ فوراً</strong> — عند مغادرة أي حقل أو رفع صورة، يُحفظ تلقائياً في قاعدة البيانات.
      </Alert>

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Header className="bg-primary text-white p-3 fw-bold">👑 رئيس الهيئة</Card.Header>
        <Card.Body className="p-4">
          {president.map(d => <DirectorCard key={d.id} director={d} onSave={handleSave} onDelete={handleDelete} />)}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Header className="bg-info text-white p-3 fw-bold d-flex justify-content-between align-items-center">
          <span>📂 المكاتب التابعة للرئيس ({offices.length})</span>
          <Button variant="light" size="sm" onClick={() => { setAddRole('office'); setShowAdd(true); }}>
            <FaPlus className="ms-1" /> إضافة مكتب
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          {offices.map(d => <DirectorCard key={d.id} director={d} onSave={handleSave} onDelete={handleDelete} />)}
          {offices.length === 0 && <p className="text-muted text-center">لا توجد مكاتب</p>}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Header className="bg-success text-white p-3 fw-bold d-flex justify-content-between align-items-center">
          <span>🏢 الإدارات الرئيسية ({administrations.length})</span>
          <Button variant="light" size="sm" onClick={() => { setAddRole('administration'); setShowAdd(true); }}>
            <FaPlus className="ms-1" /> إضافة إدارة
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          {administrations.map(d => <DirectorCard key={d.id} director={d} onSave={handleSave} onDelete={handleDelete} />)}
          {administrations.length === 0 && <p className="text-muted text-center">لا توجد إدارات</p>}
        </Card.Body>
      </Card>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ width: '95%', maxWidth: 500, borderRadius: 20 }}>
            <Card.Header className="fw-bold d-flex justify-content-between">
              <span>{addRole === 'office' ? '📂 إضافة مكتب جديد' : '🏢 إضافة إدارة جديدة'}</span>
              <Button variant="link" className="p-0 text-muted" onClick={() => setShowAdd(false)}>✕</Button>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">الاسم بالعربية *</Form.Label><Form.Control value={addForm.title_ar} onChange={e => setAddForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="مثال: مكتب التعاون الدولي" /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Name in English</Form.Label><Form.Control value={addForm.title_en} onChange={e => setAddForm(f => ({ ...f, title_en: e.target.value }))} placeholder="e.g. International Cooperation" style={{ direction: 'ltr' }} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">اسم المدير (عربي)</Form.Label><Form.Control value={addForm.name_ar} onChange={e => setAddForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="الاسم الكامل" /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Director Name (En)</Form.Label><Form.Control value={addForm.name_en} onChange={e => setAddForm(f => ({ ...f, name_en: e.target.value }))} placeholder="Full name" style={{ direction: 'ltr' }} /></Form.Group></Col>
                <Col md={12}><Form.Group><Form.Label className="small fw-bold">صورة المدير (اختياري)</Form.Label><Form.Control type="file" accept="image/*" ref={addFileRef} onChange={e => setAddImg(e.target.files?.[0] || null)} /></Form.Group></Col>
              </Row>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>إلغاء</Button>
              <Button variant="primary" onClick={handleAdd} disabled={adding}>
                {adding ? <Spinner size="sm" animation="border" /> : <FaPlus className="ms-1" />} إضافة
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}
    </div>
  );
};
/* ═══════════════════════════════════════════════════════════════ */

const ManageAbout = () => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [previewMode, setPreviewMode] = useState(false);

  const [pageData, setPageData] = useState({
    id: 'about',
    title_ar: 'نبذة عن الهيئة',
    title_en: 'About the Authority',
    content_ar: '',
    content_en: '',
    is_visible: true,
    tasks: [],
    sections: [],
    leadership: [],
    leadership_tree: {
      president: { name_ar: '', name_en: '', title_ar: 'رئيس الهيئة', title_en: 'Head of the Authority', img: '' },
      offices: [],
      administrations: []
    }
  });

  useEffect(() => {
    setLoading(true);
    api.getPageAbout()
      .then(d => {
        let tree = d.leadership_tree;
        if (!tree || typeof tree !== 'object' || !tree.president) {
          tree = {
            president: { name_ar: 'د. أحمد التومي', name_en: 'Dr. Ahmed Al-Toumi', title_ar: 'رئيس الهيئة', title_en: 'Head of the Authority', img: window.location.origin + '/uploads/director_image.jpg' },
            offices: [
              { id: '1', title_ar: 'مكتب الرئيس', title_en: 'President Office', name_ar: '', name_en: '', img: '' },
              { id: '2', title_ar: 'مكتب التخطيط', title_en: 'Planning Office', name_ar: '', name_en: '', img: '' },
              { id: '3', title_ar: 'مكتب التطوير', title_en: 'Development Office', name_ar: '', name_en: '', img: '' },
              { id: '4', title_ar: 'مكتب الشؤون الفنية', title_en: 'Technical Affairs Office', name_ar: '', name_en: '', img: '' }
            ],
            administrations: []
          };
        }

        setPageData(prev => ({
          ...prev,
          ...d,
          tasks: Array.isArray(d.tasks) ? d.tasks : [],
          sections: Array.isArray(d.sections) ? d.sections : [],
          leadership_tree: tree
        }));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showToast('خطأ في تحميل بيانات الصفحة', 'danger');
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title_ar: pageData.title_ar,
        title_en: pageData.title_en,
        content_ar: pageData.content_ar,
        content_en: pageData.content_en,
        is_visible: pageData.is_visible,
        tasks: pageData.tasks,
        sections: pageData.sections || [],
        leadership_tree: pageData.leadership_tree,
        leadership: [] // legacy empty
      };

      try {
        await api.updatePage('about', payload);
        showToast('تم حفظ بيانات نبذة عن الهيئة بنجاح! ✨', 'success');
      } catch (err) {
        console.error('Error saving about page:', err);
        showToast(err.message || 'حدث خطأ أثناء حفظ البيانات', 'danger');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Tasks helpers
  const addTask = () => setPageData(p => ({ ...p, tasks: [...p.tasks, defaultTask()] }));
  const removeTask = (i) => setPageData(p => ({ ...p, tasks: p.tasks.filter((_, idx) => idx !== i) }));
  const updateTask = (i, field, val) => setPageData(p => ({
    ...p,
    tasks: p.tasks.map((t, idx) => idx === i ? { ...t, [field]: val } : t)
  }));
  const moveTask = (i, dir) => {
    const arr = [...pageData.tasks];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setPageData(p => ({ ...p, tasks: arr }));
  };

  // Dynamic Sections helpers
  const addSection = (type) => {
    const newSection = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      ...(type === 'text_image' ? {
        image_url: '',
        bio_ar: '',
        bio_en: ''
      } : type === 'cards_grid' ? {
        items: [
          { icon: 'FaCheckCircle', title_ar: 'تعريف 1', title_en: 'Definition 1', desc_ar: 'الوصف هنا', desc_en: 'Description here' }
        ]
      } : type === 'info_banner' ? {
        banner_desc_ar: '',
        banner_desc_en: '',
        banner_btn_text_ar: '',
        banner_btn_text_en: '',
        banner_btn_link: '',
        banner_bg: 'blue'
      } : type === 'stats_grid' ? {
        items: [
          { icon: 'FaChartBar', value: '100+', label_ar: 'عنصر', label_en: 'Item' }
        ]
      } : {
        // profile_card or other
        profile_name_ar: '',
        profile_name_en: '',
        profile_title_ar: '',
        profile_title_en: '',
        image_url: '',
        bio_ar: '',
        bio_en: ''
      })
    };
    setPageData(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
    showToast('تم إضافة القسم بنجاح! قم بتعبئة بياناته.', 'success');
  };

  const removeSection = (index) => {
    setPageData(prev => ({
      ...prev,
      sections: (prev.sections || []).filter((_, idx) => idx !== index)
    }));
    showToast('تم إزالة القسم', 'warning');
  };

  const updateSection = (index, field, val) => {
    setPageData(prev => {
      const updated = (prev.sections || []).map((sec, idx) => {
        if (idx === index) {
          return { ...sec, [field]: val };
        }
        return sec;
      });
      return { ...prev, sections: updated };
    });
  };

  const moveSection = (index, dir) => {
    const secs = [...(pageData.sections || [])];
    const target = index + dir;
    if (target < 0 || target >= secs.length) return;
    [secs[index], secs[target]] = [secs[target], secs[index]];
    setPageData(prev => ({ ...prev, sections: secs }));
  };

  const addSectionItem = (sectionIndex, type) => {
    const currentItems = pageData.sections[sectionIndex].items || [];
    const newItem = type === 'cards_grid' 
      ? { icon: 'FaCheckCircle', title_ar: '', title_en: '', desc_ar: '', desc_en: '' }
      : { icon: 'FaChartBar', value: '', label_ar: '', label_en: '' };
    
    updateSection(sectionIndex, 'items', [...currentItems, newItem]);
  };

  const removeSectionItem = (sectionIndex, itemIndex) => {
    const currentItems = pageData.sections[sectionIndex].items || [];
    updateSection(sectionIndex, 'items', currentItems.filter((_, idx) => idx !== itemIndex));
  };

  const updateSectionItem = (sectionIndex, itemIndex, field, val) => {
    const currentItems = pageData.sections[sectionIndex].items || [];
    const updatedItems = currentItems.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, [field]: val };
      }
      return item;
    });
    updateSection(sectionIndex, 'items', updatedItems);
  };

  const handleSectionImageUpload = async (sectionIndex, file, field = 'image_url') => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.uploadFile(file);
      const url = res?.url || res?.data?.url;
      if (url) {
        updateSection(sectionIndex, field, url);
        showToast('تم رفع الصورة بنجاح! 📸', 'success');
      } else {
        showToast('فشل في رفع الصورة', 'danger');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err.message || 'خطأ أثناء الاتصال بالخادم لرفع الصورة', 'danger');
    }
  };


  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">جاري تحميل بيانات الصفحة...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: 'var(--primary)' }}>
          <FaBuilding />
          <span>نبذة عن الهيئة</span>
          <Badge bg="primary" className="fs-6 py-1 px-3 rounded-pill ms-2" style={{ fontSize: '0.75rem' }}>
            صفحة /about
          </Badge>
        </h3>
        <div className="d-flex gap-2 align-items-center">
          <Button
            variant="outline-secondary"
            className="rounded-pill px-3"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <FaEye className="ms-1" />
            {previewMode ? 'إخفاء المعاينة' : 'معاينة المحتوى'}
          </Button>
          <a href="/about" target="_blank" rel="noreferrer">
            <Button variant="outline-primary" className="rounded-pill px-3">
              🔗 فتح الصفحة
            </Button>
          </a>
          <PrimaryButton onClick={handleSave} icon={<FaSave />} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </PrimaryButton>
        </div>
      </div>

      <Alert variant="info" className="rounded-3 border-0 mb-4" style={{ background: 'rgba(13,110,253,0.07)' }}>
        <FaInfoCircle className="ms-2" />
        <strong>ملاحظة:</strong> التعديلات هنا ستظهر مباشرة على الصفحة العامة <strong>نبذة عن الهيئة</strong> التي يراها زوار الموقع.
      </Alert>

      <Tabs activeKey={activeTab} onSelect={k => setActiveTab(k)} className="mb-4" style={{ direction: 'rtl' }}>
        {/* ── Tab 1: Main Content ── */}
        <Tab eventKey="content" title="📄 المحتوى الرئيسي">
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header className="bg-white border-bottom p-4">
              <Row className="g-3">
                <Col md={8}>
                  <Form.Label className="fw-bold small text-muted mb-1">عنوان الصفحة (بالعربية)</Form.Label>
                  <Form.Control
                    type="text"
                    value={pageData.title_ar || ''}
                    onChange={e => setPageData({ ...pageData, title_ar: e.target.value })}
                    style={{ borderRadius: 10, fontWeight: 600, fontSize: '1.05rem' }}
                    placeholder="نبذة عن الهيئة"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="fw-bold small text-muted mb-1">حالة الظهور</Form.Label>
                  <div className="d-flex align-items-center gap-3 mt-1 p-3 rounded-3 bg-light">
                    <Form.Check
                      type="switch"
                      id="about-visibility"
                      checked={!!pageData.is_visible}
                      onChange={e => setPageData({ ...pageData, is_visible: e.target.checked })}
                    />
                    <span className="fw-bold small">
                      {pageData.is_visible ? '🟢 ظاهر للعموم' : '🔴 مخفي'}
                    </span>
                  </div>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-4">
              {previewMode && pageData.content_ar && (
                <div className="mb-4 p-3 rounded-3 bg-light border">
                  <div className="fw-bold small text-muted mb-2">📄 معاينة المحتوى الحالي</div>
                  <div
                    style={{ maxHeight: 350, overflowY: 'auto', fontSize: '0.92rem', lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{ __html: pageData.content_ar }}
                  />
                </div>
              )}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">محتوى الصفحة (بالعربية)</Form.Label>
                <RichTextEditor
                  value={pageData.content_ar || ''}
                  onChange={val => setPageData({ ...pageData, content_ar: val })}
                />
              </Form.Group>
            </Card.Body>
          </Card>
          <div className="d-flex justify-content-end">
            <PrimaryButton onClick={handleSave} icon={<FaSave />} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </PrimaryButton>
          </div>
        </Tab>

        {/* ── Tab 2: Page Sections Builder ── */}
        <Tab eventKey="sections" title={`🧩 أقسام وقوالب الصفحة (${(pageData.sections || []).length})`}>
          {/* Section Type Selector */}
          <Card className="border-0 shadow-sm rounded-4 mb-4 p-4">
            <h5 className="fw-bold mb-3">➕ إضافة قالب أو قسم جديد:</h5>
            <Row className="g-3 row-cols-2 row-cols-md-3 row-cols-lg-5">
              <Col>
                <Button 
                  variant="outline-primary" 
                  className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => addSection('text_image')}
                >
                  <FaFileAlt size={22} />
                  <span className="small fw-bold">نص وصورة</span>
                </Button>
              </Col>
              <Col>
                <Button 
                  variant="outline-success" 
                  className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => addSection('profile_card')}
                >
                  <FaUser size={22} />
                  <span className="small fw-bold">بطاقة تعريفية</span>
                </Button>
              </Col>
              <Col>
                <Button 
                  variant="outline-info" 
                  className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => addSection('cards_grid')}
                >
                  <FaLayerGroup size={22} />
                  <span className="small fw-bold">شبكة تعاريف</span>
                </Button>
              </Col>
              <Col>
                <Button 
                  variant="outline-warning" 
                  className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => addSection('info_banner')}
                >
                  <FaBuilding size={22} />
                  <span className="small fw-bold">بنر إعلاني</span>
                </Button>
              </Col>
              <Col>
                <Button 
                  variant="outline-danger" 
                  className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                  onClick={() => addSection('stats_grid')}
                >
                  <FaChartBar size={22} />
                  <span className="small fw-bold">إحصائيات وأرقام</span>
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Sections List */}
          <div className="d-flex flex-column gap-3 mb-4">
            {(pageData.sections || []).map((sec, idx) => (
              <Card key={sec.id || idx} className="border border-light shadow-sm rounded-4">
                <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={
                      sec.type === 'text_image' ? 'primary' :
                      sec.type === 'profile_card' ? 'success' :
                      sec.type === 'cards_grid' ? 'info' :
                      sec.type === 'info_banner' ? 'warning' : 'danger'
                    } className="px-3 py-2 fs-7 rounded-pill">
                      {sec.type === 'text_image' ? 'نص وصورة' :
                       sec.type === 'profile_card' ? 'بطاقة تعريفية مع صورة' :
                       sec.type === 'cards_grid' ? 'شبكة بطاقات تعاريف' :
                       sec.type === 'info_banner' ? 'بنر إعلاني / دعائي' : 'إحصائيات وأرقام'}
                    </Badge>
                    <span className="fw-bold text-dark ms-2">
                      {sec.title_ar || sec.profile_name_ar || `قسم غير معنون (${idx + 1})`}
                    </span>
                  </div>
                  <div className="d-flex gap-1 align-items-center">
                    <Button variant="white" className="border shadow-none" size="sm" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                      <FaArrowUp size={11} />
                    </Button>
                    <Button variant="white" className="border shadow-none" size="sm" onClick={() => moveSection(idx, 1)} disabled={idx === (pageData.sections || []).length - 1}>
                      <FaArrowDown size={11} />
                    </Button>
                    <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => removeSection(idx)}>
                      <FaTrash size={11} className="ms-1" /> حذف القسم
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  
                  {/* Form for text_image */}
                  {sec.type === 'text_image' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">العنوان للقسم (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.title_ar || ''}
                            onChange={e => updateSection(idx, 'title_ar', e.target.value)}
                            placeholder="رؤية المصلحة"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">العنوان للقسم (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.title_en || ''}
                            onChange={e => updateSection(idx, 'title_en', e.target.value)}
                            placeholder="Our Vision"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={8}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small"><FaImage className="ms-1" /> رابط الصورة</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.image_url || ''}
                            onChange={e => updateSection(idx, 'image_url', e.target.value)}
                            placeholder="http://localhost:5000/uploads/..."
                            style={{ direction: 'ltr', fontSize: '0.85rem' }}
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">أو تحميل ملف صورة مباشرة</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={e => handleSectionImageUpload(idx, e.target.files[0])}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">محاذاة الصورة</Form.Label>
                          <Form.Select
                            value={sec.alignment || 'right'}
                            onChange={e => updateSection(idx, 'alignment', e.target.value)}
                          >
                            <option value="right">الصورة على اليمين</option>
                            <option value="left">الصورة على اليسار</option>
                          </Form.Select>
                        </Form.Group>
                        {sec.image_url && (
                          <div className="mt-2 text-center">
                            <img src={sec.image_url} alt="معاينة" style={{ maxWidth: '100%', maxHeight: 110, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                          </div>
                        )}
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">المحتوى النصي (بالعربية - يدعم HTML)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={sec.content_ar || ''}
                            onChange={e => updateSection(idx, 'content_ar', e.target.value)}
                            placeholder="اكتب تفاصيل المحتوى هنا..."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">المحتوى النصي (بالإنكليزية - يدعم HTML)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={sec.content_en || ''}
                            onChange={e => updateSection(idx, 'content_en', e.target.value)}
                            placeholder="Write details content here..."
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {/* Form for profile_card */}
                  {sec.type === 'profile_card' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">الاسم الشخصي (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.profile_name_ar || ''}
                            onChange={e => updateSection(idx, 'profile_name_ar', e.target.value)}
                            placeholder="مثال: د. أحمد التومي"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">الاسم الشخصي (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.profile_name_en || ''}
                            onChange={e => updateSection(idx, 'profile_name_en', e.target.value)}
                            placeholder="Dr. Ahmed Al-Toumi"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">المسمى الوظيفي (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.profile_title_ar || ''}
                            onChange={e => updateSection(idx, 'profile_title_ar', e.target.value)}
                            placeholder="مدير عام المصلحة"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">المسمى الوظيفي (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.profile_title_en || ''}
                            onChange={e => updateSection(idx, 'profile_title_en', e.target.value)}
                            placeholder="General Manager"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={8}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small"><FaImage className="ms-1" /> رابط الصورة</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.image_url || ''}
                            onChange={e => updateSection(idx, 'image_url', e.target.value)}
                            placeholder="http://localhost:5000/uploads/..."
                            style={{ direction: 'ltr', fontSize: '0.85rem' }}
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">تحميل ملف صورة</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={e => handleSectionImageUpload(idx, e.target.files[0])}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="d-flex align-items-center justify-content-center">
                        {sec.image_url ? (
                          <img
                            src={sec.image_url}
                            alt="الشخصية"
                            style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: '50%', border: '3px solid var(--primary)' }}
                          />
                        ) : (
                          <div className="bg-light border rounded-circle d-flex align-items-center justify-content-center text-muted" style={{ width: 90, height: 90 }}>
                            <FaUser size={36} />
                          </div>
                        )}
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نبذة تعريفية (بالعربية)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={sec.bio_ar || ''}
                            onChange={e => updateSection(idx, 'bio_ar', e.target.value)}
                            placeholder="نبذة موجزة..."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نبذة تعريفية (بالإنكليزية)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={sec.bio_en || ''}
                            onChange={e => updateSection(idx, 'bio_en', e.target.value)}
                            placeholder="Short biography..."
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {/* Form for cards_grid */}
                  {sec.type === 'cards_grid' && (
                    <div>
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">العنوان الرئيسي للقسم (بالعربية)</Form.Label>
                            <Form.Control
                              type="text"
                              value={sec.title_ar || ''}
                              onChange={e => updateSection(idx, 'title_ar', e.target.value)}
                              placeholder="مفاهيم تخطيطية رئيسية"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">العنوان الرئيسي للقسم (بالإنكليزية)</Form.Label>
                            <Form.Control
                              type="text"
                              value={sec.title_en || ''}
                              onChange={e => updateSection(idx, 'title_en', e.target.value)}
                              placeholder="Key Planning Concepts"
                              style={{ direction: 'ltr' }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold small text-muted">البطاقات التعريفية المضافة:</span>
                        <Button variant="outline-primary" size="sm" onClick={() => addSectionItem(idx, 'cards_grid')}>
                          <FaPlus className="ms-1" /> إضافة بطاقة جديدة
                        </Button>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        {(sec.items || []).map((item, itemIdx) => (
                          <Card key={itemIdx} className="bg-light border-0 rounded-3">
                            <Card.Body className="p-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <Badge bg="secondary">البطاقة {itemIdx + 1}</Badge>
                                <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => removeSectionItem(idx, itemIdx)}>
                                  <FaTrash size={10} className="ms-1" /> حذف البطاقة
                                </Button>
                              </div>
                              <Row className="g-2">
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">الأيقونة</Form.Label>
                                    <Form.Select
                                      value={item.icon || 'FaCheckCircle'}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'icon', e.target.value)}
                                      style={{ fontSize: '0.8rem' }}
                                    >
                                      {FA_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">العنوان (بالعربية)</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={item.title_ar || ''}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'title_ar', e.target.value)}
                                      placeholder="مفهوم 1"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={5}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">العنوان (بالإنكليزية)</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={item.title_en || ''}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'title_en', e.target.value)}
                                      placeholder="Concept 1"
                                      style={{ direction: 'ltr' }}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">الوصف باللغة العربية</Form.Label>
                                    <Form.Control
                                      as="textarea"
                                      rows={2}
                                      value={item.desc_ar || ''}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'desc_ar', e.target.value)}
                                      placeholder="تفاصيل التعريف..."
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">الوصف باللغة الإنكليزية</Form.Label>
                                    <Form.Control
                                      as="textarea"
                                      rows={2}
                                      value={item.desc_en || ''}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'desc_en', e.target.value)}
                                      placeholder="Definition details..."
                                      style={{ direction: 'ltr' }}
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form for info_banner */}
                  {sec.type === 'info_banner' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">العنوان الرئيسي للبنر (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.title_ar || ''}
                            onChange={e => updateSection(idx, 'title_ar', e.target.value)}
                            placeholder="انضم إلى فريق الهيئة"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">العنوان الرئيسي للبنر (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.title_en || ''}
                            onChange={e => updateSection(idx, 'title_en', e.target.value)}
                            placeholder="Join the Authority Team"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نص البنر التفصيلي (بالعربية)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={sec.banner_desc_ar || ''}
                            onChange={e => updateSection(idx, 'banner_desc_ar', e.target.value)}
                            placeholder="هل تريد المساهمة في بناء مستقبل التخطيط العمراني في ليبيا؟"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نص البنر التفصيلي (بالإنكليزية)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={sec.banner_desc_en || ''}
                            onChange={e => updateSection(idx, 'banner_desc_en', e.target.value)}
                            placeholder="Do you want to contribute to the urban planning future?"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">لون نمط الخلفية</Form.Label>
                          <Form.Select
                            value={sec.banner_bg || 'blue'}
                            onChange={e => updateSection(idx, 'banner_bg', e.target.value)}
                          >
                            <option value="blue">أزرق الهيئة الرئيسي</option>
                            <option value="dark">نمط داكن فخم</option>
                            <option value="gradient">تدرج لوني مشرق</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نص زر الإجراء (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.banner_btn_text_ar || ''}
                            onChange={e => updateSection(idx, 'banner_btn_text_ar', e.target.value)}
                            placeholder="سجل في بوابة الموظفين"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نص زر الإجراء (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.banner_btn_text_en || ''}
                            onChange={e => updateSection(idx, 'banner_btn_text_en', e.target.value)}
                            placeholder="Register in portal"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">رابط الزر (مثل: `/register` أو `https://...` )</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.banner_btn_link || ''}
                            onChange={e => updateSection(idx, 'banner_btn_link', e.target.value)}
                            placeholder="/register"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {/* Form for stats_grid */}
                  {sec.type === 'stats_grid' && (
                    <div>
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">عنوان القسم الرئيسي (بالعربية)</Form.Label>
                            <Form.Control
                              type="text"
                              value={sec.title_ar || ''}
                              onChange={e => updateSection(idx, 'title_ar', e.target.value)}
                              placeholder="منجزات الهيئة في أرقام"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">عنوان القسم الرئيسي (بالإنكليزية)</Form.Label>
                            <Form.Control
                              type="text"
                              value={sec.title_en || ''}
                              onChange={e => updateSection(idx, 'title_en', e.target.value)}
                              placeholder="Our Milestones in Numbers"
                              style={{ direction: 'ltr' }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold small text-muted">الأرقام الإحصائية المضافة:</span>
                        <Button variant="outline-primary" size="sm" onClick={() => addSectionItem(idx, 'stats_grid')}>
                          <FaPlus className="ms-1" /> إضافة رقم إحصائي
                        </Button>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        {(sec.items || []).map((item, itemIdx) => (
                          <Card key={itemIdx} className="bg-light border-0 rounded-3">
                            <Card.Body className="p-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <Badge bg="dark">إحصائية {itemIdx + 1}</Badge>
                                <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => removeSectionItem(idx, itemIdx)}>
                                  <FaTrash size={10} className="ms-1" /> حذف الإحصائية
                                </Button>
                              </div>
                              <Row className="g-2">
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">الأيقونة</Form.Label>
                                    <Form.Select
                                      value={item.icon || 'FaChartBar'}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'icon', e.target.value)}
                                      style={{ fontSize: '0.8rem' }}
                                    >
                                      {FA_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">الرقم/القيمة (مثال: 50+)</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={item.value || ''}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'value', e.target.value)}
                                      placeholder="12+"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">العنوان (بالعربية)</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={item.label_ar || ''}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'label_ar', e.target.value)}
                                      placeholder="مخطط عمراني فرعي"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small fw-bold">العنوان (بالإنكليزية)</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={item.label_en || ''}
                                      onChange={e => updateSectionItem(idx, itemIdx, 'label_en', e.target.value)}
                                      placeholder="Suburban Plan"
                                      style={{ direction: 'ltr' }}
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                </Card.Body>
              </Card>
            ))}
          </div>

          {pageData.sections.length === 0 && (
            <Card className="border-0 shadow-sm rounded-4 p-5 text-center mb-4">
              <FaLayerGroup size={45} className="text-muted mb-3 opacity-25 mx-auto" />
              <p className="text-muted mb-2">لم تُضف أي أقسام إضافية أو قوالب بعد.</p>
              <p className="text-muted small mb-3">اختر أحد القوالب في الأعلى لإضافتها وتنسيق محتواها بشكل مباشر.</p>
            </Card>
          )}

          <div className="d-flex justify-content-end mt-4">
            <PrimaryButton onClick={handleSave} icon={<FaSave />} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </PrimaryButton>
          </div>
        </Tab>

        {/* ── Tab 3: Leadership Tree — connected directly to /directors table ── */}
        <Tab eventKey="leadership" title="👥 هيكلية القيادة (الشجرة)">
          <DirectorsTreeEditor showToast={showToast} />
        </Tab>

        {/* ── Tab 4: Tasks/Duties ── */}
        <Tab eventKey="tasks" title={`🏛️ المهام والاختصاصات (${pageData.tasks.length})`}>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <p className="text-muted mb-0 small">تظهر هذه المهام في بطاقات أسفل المحتوى الرئيسي في صفحة نبذة عن الهيئة.</p>
            <Button variant="primary" className="rounded-pill px-3" onClick={addTask}>
              <FaPlus className="ms-1" /> إضافة مهمة
            </Button>
          </div>
          <AnimatePresence>
            {pageData.tasks.map((task, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-0 shadow-sm rounded-3 mb-3">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Badge bg="primary" className="rounded-pill px-3">مهمة {i + 1}</Badge>
                      <div className="d-flex gap-1">
                        <Button variant="light" size="sm" onClick={() => moveTask(i, -1)} disabled={i === 0}>
                          <FaArrowUp size={11} />
                        </Button>
                        <Button variant="light" size="sm" onClick={() => moveTask(i, 1)} disabled={i === pageData.tasks.length - 1}>
                          <FaArrowDown size={11} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => removeTask(i)}>
                          <FaTrash size={11} />
                        </Button>
                      </div>
                    </div>
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-bold small">الأيقونة</Form.Label>
                          <Form.Select
                            value={task.icon || 'FaMapMarkedAlt'}
                            onChange={e => updateTask(i, 'icon', e.target.value)}
                            style={{ fontSize: '0.85rem' }}
                          >
                            {FA_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-bold small">العنوان (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={task.title_ar || ''}
                            onChange={e => updateTask(i, 'title_ar', e.target.value)}
                            placeholder="مثال: المخططات العمرانية"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-bold small">العنوان (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={task.title_en || ''}
                            onChange={e => updateTask(i, 'title_en', e.target.value)}
                            placeholder="e.g. Urban Plans"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold small">الوصف (بالعربية)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={task.desc_ar || ''}
                            onChange={e => updateTask(i, 'desc_ar', e.target.value)}
                            placeholder="وصف مختصر للمهمة..."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold small">الوصف (بالإنكليزية)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={task.desc_en || ''}
                            onChange={e => updateTask(i, 'desc_en', e.target.value)}
                            placeholder="Short task description..."
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {pageData.tasks.length === 0 && (
            <Card className="border-0 shadow-sm rounded-4 p-5 text-center">
              <FaBuilding size={40} className="text-muted mb-3 opacity-25 mx-auto" />
              <p className="text-muted mb-2">لم تُضف أي مهام بعد.</p>
              <Button variant="primary" className="rounded-pill px-4 mx-auto" style={{ width: 'fit-content' }} onClick={addTask}>
                <FaPlus className="ms-1" /> إضافة مهمة أولى
              </Button>
            </Card>
          )}
          {pageData.tasks.length > 0 && (
            <div className="d-flex justify-content-end mt-3">
              <PrimaryButton onClick={handleSave} icon={<FaSave />} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </PrimaryButton>
            </div>
          )}
        </Tab>
      </Tabs>
    </motion.div>
  );
};

export default ManageAbout;

