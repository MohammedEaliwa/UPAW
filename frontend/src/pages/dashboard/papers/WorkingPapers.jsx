import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import { FaFilePdf, FaFileWord, FaUpload, FaTrash, FaEdit, FaSpinner, FaDownload, FaBan } from 'react-icons/fa';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';


const WorkingPapers = () => {
  const { showToast } = useToast();
  
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states for Add
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState('تقارير');
  const [authorAr, setAuthorAr] = useState('');
  const [authorEn, setAuthorEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [allowDownload, setAllowDownload] = useState(true);

  // Modal / Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitleAr, setEditTitleAr] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editCategory, setEditCategory] = useState('تقارير');
  const [editAuthorAr, setEditAuthorAr] = useState('');
  const [editAuthorEn, setEditAuthorEn] = useState('');
  const [editDescAr, setEditDescAr] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editFileUrl, setEditFileUrl] = useState('');
  const [editSize, setEditSize] = useState('1.5 MB');
  const [editType, setEditType] = useState('pdf');
  const [editAllowDownload, setEditAllowDownload] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkingPapers();
      const arr = Array.isArray(res) ? res : (res.data || []);
      setPapers(arr);
    } catch (e) {
      console.error(e);
      showToast('خطأ في تحميل أوراق العمل!', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleEditFileChange = (e) => {
    setEditFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!titleAr.trim()) {
      showToast('يرجى إدخال العنوان باللغة العربية!', 'danger');
      return;
    }
    if (!selectedFile) {
      showToast('يرجى اختيار ملف لرفعه!', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload file first
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await api.uploadFile(selectedFile);
      const fileUrl = uploadRes?.url || uploadRes?.data?.url;

      // Extract size and type
      const sizeStr = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
      const typeStr = selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc') ? 'word' : 'pdf';

      // 2. Save working paper
      const paperData = {
        title_ar: titleAr,
        title_en: titleEn,
        category,
        author_ar: authorAr,
        author_en: authorEn,
        desc_ar: descAr,
        desc_en: descEn,
        file_url: fileUrl,
        size: sizeStr,
        type: typeStr,
        date: new Date().toISOString().split('T')[0],
        allow_download: allowDownload ? 1 : 0
      };

      await api.createWorkingPaper(paperData);
      
      showToast('تم رفع وحفظ ورقة العمل بنجاح! ✨', 'success');
      
      // Reset Form
      setTitleAr('');
      setTitleEn('');
      setCategory('تقارير');
      setAuthorAr('');
      setAuthorEn('');
      setDescAr('');
      setDescEn('');
      setSelectedFile(null);
      
      // Reload list
      fetchPapers();
    } catch (err) {
      console.error(err);
      showToast('فشل رفع ورقة العمل!', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (paper) => {
    setEditId(paper.id);
    setEditTitleAr(paper.title_ar || '');
    setEditTitleEn(paper.title_en || '');
    setEditCategory(paper.category || 'تقارير');
    setEditAuthorAr(paper.author_ar || '');
    setEditAuthorEn(paper.author_en || '');
    setEditDescAr(paper.desc_ar || '');
    setEditDescEn(paper.desc_en || '');
    setEditFileUrl(paper.file_url || '');
    setEditSize(paper.size || '1.5 MB');
    setEditType(paper.type || 'pdf');
    setEditFile(null);
    setEditAllowDownload(paper.allow_download !== 0);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitleAr.trim()) {
      showToast('يرجى إدخال العنوان باللغة العربية!', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      let finalUrl = editFileUrl;
      let finalSize = editSize;
      let finalType = editType;

      // Upload new file if selected
      if (editFile) {
        const formData = new FormData();
        formData.append('file', editFile);
        const uploadRes = await api.uploadFile(editFile);
        finalUrl = uploadRes?.url || uploadRes?.data?.url;
        finalSize = `${(editFile.size / (1024 * 1024)).toFixed(1)} MB`;
        finalType = editFile.name.endsWith('.docx') || editFile.name.endsWith('.doc') ? 'word' : 'pdf';
      }

      const updatedData = {
        title_ar: editTitleAr,
        title_en: editTitleEn,
        category: editCategory,
        author_ar: editAuthorAr,
        author_en: editAuthorEn,
        desc_ar: editDescAr,
        desc_en: editDescEn,
        file_url: finalUrl,
        size: finalSize,
        type: finalType,
        date: new Date().toISOString().split('T')[0],
        allow_download: editAllowDownload ? 1 : 0
      };

      await api.updateWorkingPaper(editId, updatedData);
      showToast('تم تعديل ورقة العمل بنجاح! ✨', 'success');
      setShowEditModal(false);
      fetchPapers();
    } catch (err) {
      console.error(err);
      showToast('فشل تعديل ورقة العمل!', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف ورقة العمل هذه؟')) {
      try {
        await api.deleteWorkingPaper(id);
        showToast('تم حذف ورقة العمل بنجاح! ✨', 'success');
        fetchPapers();
      } catch (err) {
        console.error(err);
        showToast('فشل حذف ورقة العمل!', 'danger');
      }
    }
  };

  const handleToggleDownload = async (paper) => {
    const newVal = paper.allow_download === 1 ? 0 : 1;

    // Optimistic UI update immediately
    setPapers(prev =>
      prev.map(p => p.id === paper.id ? { ...p, allow_download: newVal } : p)
    );

    try {
      const res = await api.updateWorkingPaper(paper.id, { allow_download: newVal });
      const confirmed = res?.allow_download ?? (res?.data?.allow_download);
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, allow_download: confirmed ?? newVal } : p));
      showToast((confirmed ?? newVal) === 1 ? 'تم السماح بالتنزيل ✅' : 'تم منع التنزيل 🚫', 'success');
    } catch (err) {
      console.error('Toggle download error:', err);
      setPapers(prev => prev.map(p => p.id === paper.id ? { ...p, allow_download: paper.allow_download } : p));
      showToast('فشل تحديث صلاحية التنزيل!', 'danger');
    }
  };


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ direction: 'rtl', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="fw-bold text-primary mb-0">إدارة ورقات العمل والأوراق العلمية</h2>
      </div>

      <Row className="gy-4">
        {/* Upload Section */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4" style={{ backgroundColor: 'var(--card-bg)' }}>
            <Card.Body className="p-4">
              <h5 className="fw-bold text-secondary mb-4">رفع ورقة عمل جديدة</h5>
              <Form onSubmit={handleUploadSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">العنوان (عربي) *</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="مثال: التقرير التقييمي للمخطط الوطني" 
                    className="bg-light border-0 py-2 rounded-3" 
                    value={titleAr}
                    onChange={e => setTitleAr(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="allow-download-switch"
                    label="السماح بالتحميل"
                    checked={allowDownload}
                    onChange={e => setAllowDownload(e.target.checked)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">التصنيف</Form.Label>
                  <Form.Select 
                    className="bg-light border-0 py-2 rounded-3"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="تقارير">تقارير (Reports)</option>
                    <option value="دراسات تخطيطية">دراسات تخطيطية (Planning Studies)</option>
                    <option value="أوراق بحثية">أوراق بحثية (Research Papers)</option>
                    <option value="لوائح وتشريعات">لوائح وتشريعات (Regulations)</option>
                    <option value="مخططات">مخططات (Plans)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">الكاتب / الجهة (عربي)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="مثال: قسم التخطيط الإقليمي" 
                    className="bg-light border-0 py-2 rounded-3" 
                    value={authorAr}
                    onChange={e => setAuthorAr(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">الوصف (عربي)</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={2}
                    placeholder="وصف مختصر للورقة..." 
                    className="bg-light border-0 py-2 rounded-3" 
                    value={descAr}
                    onChange={e => setDescAr(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">الملف (PDF, DOCX) *</Form.Label>
                  <Form.Control 
                    type="file" 
                    className="bg-light border-0 py-2 rounded-3" 
                    accept=".pdf,.doc,.docx" 
                    onChange={handleFileChange}
                    required
                  />
                </Form.Group>
                
                <PrimaryButton type="submit" icon={submitting ? <FaSpinner className="spinning" /> : <FaUpload />} style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'جاري الرفع والحفظ...' : 'رفع وحفظ ورقة العمل'}
                </PrimaryButton>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Files Table Section */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4" style={{ backgroundColor: 'var(--card-bg)' }}>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-5">
                  <FaSpinner className="spinning text-primary" size={40} />
                  <p className="mt-2 text-muted">جاري تحميل البيانات...</p>
                </div>
              ) : (
                <>
                  <Table responsive hover className="mb-0 align-middle text-nowrap" style={{ color: 'var(--text-color)' }}>
                    <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <tr>
                        <th className="py-3 px-4 border-0">اسم الملف / العنوان</th>
                        <th className="py-3 px-4 border-0">التصنيف</th>
                        <th className="py-3 px-4 border-0">تاريخ الرفع</th>
                        <th className="py-3 px-4 border-0">الكاتب</th>
                        <th className="py-3 px-4 border-0 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {papers.map((paper) => (
                        <tr key={paper.id}>
                          <td className="px-4 fw-bold">
                            <div className="d-flex align-items-center gap-2">
                              {paper.type === 'word' ? (
                                <FaFileWord className="text-primary" size={20} />
                              ) : (
                                <FaFilePdf className="text-danger" size={20} />
                              )}
                              <div>
                                <div style={{ fontSize: '0.95rem' }}>{paper.title_ar}</div>
                                {paper.title_en && <div className="text-muted small" style={{ fontSize: '0.8rem' }}>{paper.title_en}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 text-muted small">
                            <span className="badge bg-secondary">{paper.category}</span>
                          </td>
                          <td className="px-4 text-muted small">{paper.date}</td>
                          <td className="px-4 text-muted small">{paper.author_ar || '-'}</td>
                          <td className="px-4 text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="rounded-circle d-flex justify-content-center align-items-center" 
                                style={{ width: '32px', height: '32px' }} 
                                onClick={() => handleOpenEdit(paper)}
                              >
                                <FaEdit size={14} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="rounded-circle d-flex justify-content-center align-items-center" 
                                style={{ width: '32px', height: '32px' }} 
                                onClick={() => handleDelete(paper.id)}
                              >
                                <FaTrash size={14} />
                              </Button>
                              <Button
                                size="sm"
                                title={paper.allow_download === 1 ? 'مسموح بالتنزيل للزوار — اضغط للمنع' : 'ممنوع التنزيل للزوار — اضغط للسماح'}
                                onClick={() => handleToggleDownload(paper)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '50%',
                                  border: 'none',
                                  background: paper.allow_download === 1
                                    ? 'linear-gradient(135deg,#0d6efd,#0a58ca)'
                                    : 'linear-gradient(135deg,#dc3545,#b02a37)',
                                  color: '#fff',
                                  boxShadow: paper.allow_download === 1
                                    ? '0 2px 8px rgba(13,110,253,0.35)'
                                    : '0 2px 8px rgba(220,53,69,0.35)',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {paper.allow_download === 1 ? <FaDownload size={13} /> : <FaBan size={13} />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {papers.length === 0 && (
                    <div className="text-center p-5 text-muted">
                      لا توجد أوراق عمل مرفوعة حالياً.
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">تعديل ورقة العمل</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <Form onSubmit={handleEditSubmit}>
            <Row className="gy-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">العنوان (عربي) *</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editTitleAr}
                    onChange={e => setEditTitleAr(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">العنوان (إنجليزي)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editTitleEn}
                    onChange={e => setEditTitleEn(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">التصنيف</Form.Label>
                  <Form.Select 
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                  >
                    <option value="تقارير">تقارير</option>
                    <option value="دراسات تخطيطية">دراسات تخطيطية</option>
                    <option value="أوراق بحثية">أوراق بحثية</option>
                    <option value="لوائح وتشريعات">لوائح وتشريعات</option>
                    <option value="مخططات">مخططات</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">الكاتب / الجهة (عربي)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editAuthorAr}
                    onChange={e => setEditAuthorAr(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">الكاتب / الجهة (إنجليزي)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={editAuthorEn}
                    onChange={e => setEditAuthorEn(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">الملف الجديد (اختياري)</Form.Label>
                  <Form.Control 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleEditFileChange}
                  />
                  {editFileUrl && <div className="text-muted small mt-1">الملف الحالي: <a href={editFileUrl} target="_blank" rel="noopener noreferrer">عرض الملف</a></div>}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">الوصف (عربي)</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={2}
                    value={editDescAr}
                    onChange={e => setEditDescAr(e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">الوصف (إنجليزي)</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={2}
                    value={editDescEn}
                    onChange={e => setEditDescEn(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setShowEditModal(false)} disabled={submitting}>إلغاء</Button>
              <PrimaryButton type="submit" icon={submitting ? <FaSpinner className="spinning" /> : null} disabled={submitting}>
                {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </PrimaryButton>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </motion.div>
  );
};

export default WorkingPapers;
