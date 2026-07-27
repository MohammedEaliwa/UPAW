import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table, Badge, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import { motion } from 'motion/react';
import { FaMapMarkedAlt, FaPlusCircle, FaTrash, FaMapMarkerAlt, FaCheckCircle, FaTrashAlt, FaLayerGroup } from 'react-icons/fa';
import L from 'leaflet';
import { useAuth } from '../../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ModernModal from '../../../components/ModernModal';
import ToastNotification from '../../../components/ui/ToastNotification';
import 'leaflet/dist/leaflet.css';

const KML_LAYER_COLORS = [
  '#003087', '#198754', '#fd7e14', '#dc3545', '#6f42c1', '#0dcaf0', '#ffc107'
];

const kmlIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Fix Leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const pendingIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const restudyIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});



// Custom Map click handler to select coordinates
const MapClickSelector = ({ onSelectCoords }) => {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Custom Map click handler for review map
const ReviewMapClickSelector = ({ onSelectCoords }) => {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ManageMap = () => {
  const [locations, setLocations] = useState([]);
  const { user } = useAuth();
  const loggedInUser = user || { username: 'المسؤول' };
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showResult = (message, type = 'success') => setToast({ show: true, message, type });

  const [searchParams, setSearchParams] = useSearchParams();
  const reviewId = searchParams.get('review');
  const reStudyId = searchParams.get('re_study');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    id: '',
    name_ar: '',
    name_en: '',
    category: 'حكومي',
    latitude: '',
    longitude: '',
    details_ar: '',
    details_en: '',
    is_approved: 0,
    rejection_comment: '',
  });

  // Re-study states for employees
  const [showReStudyModal, setShowReStudyModal] = useState(false);
  const [reStudyForm, setReStudyForm] = useState({
    id: '',
    name_ar: '',
    name_en: '',
    category: 'حكومي',
    latitude: '',
    longitude: '',
    details_ar: '',
    details_en: '',
    rejection_comment: '',
    color: '#003087',
  });

  const [kmlFolderColors, setKmlFolderColors] = useState({});

  // Admin rejection reason input modal state
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // KML upload and display states
  const [kmlFile, setKmlFile] = useState(null);
  const [uploadingKml, setUploadingKml] = useState(false);
  const [kmlFeatures, setKmlFeatures] = useState([]);

  const fetchLocations = () => {
    api.getMapLocations({ all: true })
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        setLocations(Array.isArray(arr) ? arr : []);
      })
      .catch(err => {
        console.error('Error fetching map locations:', err);
        setLocations([]);
      });
  };

  const fetchKmlFeatures = () => {
    api.getKmlFeatures()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        if (Array.isArray(arr)) setKmlFeatures(arr);
      })
      .catch(() => {});
  };

  const handleOpenReview = (loc) => {
    setReviewForm({
      id: loc.id,
      name_ar: loc.name_ar || '',
      name_en: loc.name_en || '',
      category: loc.category || 'حكومي',
      latitude: loc.latitude,
      longitude: loc.longitude,
      details_ar: loc.details_ar || '',
      details_en: loc.details_en || '',
      is_approved: loc.is_approved,
      rejection_comment: loc.rejection_comment || '',
      color: loc.color || '#003087',
    });
    setShowReviewModal(true);
  };

  const handleSaveMarkerColor = async (id, color) => {
    try {
      await api.updateMapLocation(id, { color });
      setLocations(prev => prev.map(l => l.id === id ? { ...l, color } : l));
      showResult('تم تغيير لون المعلم بنجاح! 🎨', 'success');
    } catch (err) {
      showResult(err.message || 'خطأ في تغيير اللون', 'danger');
    }
  };

  const handleSaveKmlFolderColor = async (folder, color) => {
    try {
      await api.updateKmlFolderColor(folder, color);
      setKmlFeatures(prev => prev.map(f => f.folder === folder ? { ...f, color } : f));
      setKmlFolderColors(prev => ({ ...prev, [folder]: color }));
      showResult(`تم تغيير لون طبقة "${folder}" بنجاح! 🎨`, 'success');
    } catch (err) {
      showResult(err.message || 'خطأ في تغيير اللون', 'danger');
    }
  };

  const handleSelectReviewCoords = (lat, lng) => {
    setReviewForm(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
  };

  // Handler for re-study modal map clicks (employee resubmissions)
  const handleSelectReStudyCoords = (lat, lng) => {
    setReStudyForm(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
  };

  const handleApproveReview = async (e) => {
    if (e) e.preventDefault();
    try {
      await api.updateMapLocation(reviewForm.id, {
        name_ar: reviewForm.name_ar,
        name_en: reviewForm.name_en || reviewForm.name_ar,
        category: reviewForm.category,
        latitude: parseFloat(reviewForm.latitude),
        longitude: parseFloat(reviewForm.longitude),
        details_ar: reviewForm.details_ar,
        details_en: reviewForm.details_en || reviewForm.details_ar,
        is_approved: Number(reviewForm.is_approved) === 1 ? 1 : 1,
        rejection_comment: null,
        color: reviewForm.color || '#003087',
      });
      showResult(
        reviewForm.is_approved === 1
          ? 'تم تحديث بيانات المعلم بنجاح! ✨' 
          : 'تمت الموافقة على الموقع ونشره بنجاح! ✨', 
        'success'
      );
      setShowReviewModal(false);
      setSearchParams({});
      fetchLocations();
    } catch (err) {
      showResult(err.message || 'خطأ في الاتصال بالخادم', 'danger');
      console.error(err);
    }
  };

  const handleRejectAndRestudy = () => {
    // Open sub-modal to input rejection reason
    setRejectReason('');
    setShowRejectReasonModal(true);
  };

  const handleSubmitRejectReason = async (e) => {
    if (e) e.preventDefault();
    if (!rejectReason.trim()) {
      showResult('يرجى كتابة سبب الرفض وإعادة الدراسة!', 'danger');
      return;
    }

    try {
      await api.updateMapLocation(reviewForm.id, {
        name_ar: reviewForm.name_ar,
        name_en: reviewForm.name_en || reviewForm.name_ar,
        category: reviewForm.category,
        latitude: parseFloat(reviewForm.latitude),
        longitude: parseFloat(reviewForm.longitude),
        details_ar: reviewForm.details_ar,
        details_en: reviewForm.details_en || reviewForm.details_ar,
        is_approved: 2,
        rejection_comment: rejectReason
      });
      showResult('تم رفض المعلم وإعادته لإعادة الدراسة بنجاح. ✍️', 'success');
      setShowRejectReasonModal(false);
      setShowReviewModal(false);
      setSearchParams({});
      fetchLocations();
    } catch (err) {
      showResult(err.message || 'خطأ في الاتصال بالخادم', 'danger');
      console.error(err);
    }
  };

  // Re-study resubmit and cancel handlers
  const handleResubmitReStudy = async (e) => {
    if (e) e.preventDefault();
    try {
      await api.updateMapLocation(reStudyForm.id, {
        name_ar: reStudyForm.name_ar,
        name_en: reStudyForm.name_en || reStudyForm.name_ar,
        category: reStudyForm.category,
        latitude: parseFloat(reStudyForm.latitude),
        longitude: parseFloat(reStudyForm.longitude),
        details_ar: reStudyForm.details_ar,
        details_en: reStudyForm.details_en || reStudyForm.details_ar,
        is_approved: 0,
        rejection_comment: reStudyForm.rejection_comment
      });
      showResult('تم تعديل بيانات المعلم وإعادة إرساله بنجاح للمسؤول! 🚀', 'success');
      setShowReStudyModal(false);
      setSearchParams({});
      fetchLocations();
    } catch (err) {
      showResult(err.message || 'خطأ في الاتصال بالخادم', 'danger');
      console.error(err);
    }
  };

  const handleCancelReStudyPoint = async () => {
    if (window.confirm('هل أنت متأكد من إلغاء وحذف هذا المعلم/النقطة بالكامل؟')) {
      try {
        await api.deleteMapLocation(reStudyForm.id);
        showResult('تم إلغاء وحذف المعلم بنجاح.', 'success');
        setShowReStudyModal(false);
        setSearchParams({});
        fetchLocations();
      } catch (err) {
          showResult(err.message || 'خطأ في الاتصال بالخادم', 'danger');
          console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchKmlFeatures();
  }, []);

  useEffect(() => {
    if (reviewId && locations.length > 0) {
      const locToReview = locations.find(l => l.id === Number(reviewId));
      if (locToReview) {
        setReviewForm({
          id: locToReview.id,
          name_ar: locToReview.name_ar || '',
          name_en: locToReview.name_en || '',
          category: locToReview.category || 'حكومي',
          latitude: locToReview.latitude,
          longitude: locToReview.longitude,
          details_ar: locToReview.details_ar || '',
          details_en: locToReview.details_en || '',
          is_approved: locToReview.is_approved,
          rejection_comment: locToReview.rejection_comment || '',
        });
        setShowReviewModal(true);
      }
    }
  }, [reviewId, locations]);

  useEffect(() => {
    if (reStudyId && locations.length > 0) {
      const locToReStudy = locations.find(l => l.id === Number(reStudyId));
      if (locToReStudy) {
        setReStudyForm({
          id: locToReStudy.id,
          name_ar: locToReStudy.name_ar || '',
          name_en: locToReStudy.name_en || '',
          category: locToReStudy.category || 'حكومي',
          latitude: locToReStudy.latitude,
          longitude: locToReStudy.longitude,
          details_ar: locToReStudy.details_ar || '',
          details_en: locToReStudy.details_en || '',
          rejection_comment: locToReStudy.rejection_comment || '',
        });
        setShowReStudyModal(true);
      }
    }
  }, [reStudyId, locations]);

  const handleKmlUpload = (e) => {
    e.preventDefault();
    if (!kmlFile) return;

    setUploadingKml(true);
    const formData = new FormData();
    formData.append('file', kmlFile);
    const username = loggedInUser?.username || 'مدخل البيانات';
    api.uploadKml(formData, username)
      .then(data => {
        setUploadingKml(false);
        if (data && data.success) {
          showResult(`تم رفع واستيراد ${data.count} معلم جغرافي بنجاح!`, 'success');
          setKmlFile(null);
          fetchKmlFeatures();
          e.target.reset();
        } else {
          showResult('فشل استيراد الملف: ' + (data?.error || 'خطأ غير معروف'), 'danger');
        }
      })
      .catch(err => {
        setUploadingKml(false);
        console.error(err);
        showResult(err.message || 'حدث خطأ أثناء الاتصال بالخادم.', 'danger');
      });
  };

  const [form, setForm] = useState({
    name: '',
    category: 'حكومي',
    latitude: '',
    longitude: '',
    details: '',
    color: '#003087',
  });

  const categories = ['حكومي', 'سكني', 'تجاري', 'خدمات'];

  const handleSelectCoords = (lat, lng) => {
    setForm(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      showResult('يرجى النقر على الخريطة لتحديد الإحداثيات أولاً!', 'danger');
      return;
    }

    const isPending = loggedInUser.role?.slug !== 'admin';
    const newLocation = {
      name_ar: form.name,
      name_en: form.name,
      category: form.category,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      details_ar: form.details,
      details_en: form.details,
      created_by: loggedInUser.id || 1,
      is_approved: isPending ? 0 : 1,
      color: form.color || '#003087',
    };

    api.createMapLocation(newLocation)
      .then(() => {
        fetchLocations();
        const successMsg = isPending
          ? 'تم تقديم طلب إضافة المعلم بنجاح وبانتظار مراجعة واعتماد المسؤول! ⏳'
          : 'تمت إضافة الموقع بنجاح ومشاركته على الخريطة! ✨';
        showResult(successMsg, 'success');
        setForm({ name: '', category: 'حكومي', latitude: '', longitude: '', details: '', color: '#003087' });
      })
      .catch(err => {
        showResult(err.message || 'حدث خطأ أثناء الإضافة', 'danger');
        console.error("Error adding location:", err);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموقع؟')) {
      api.deleteMapLocation(id)
        .then(() => {
          fetchLocations();
          showResult('تم حذف الموقع بنجاح!', 'success');
        })
        .catch(err => {
          showResult(err.message || 'حدث خطأ أثناء الحذف', 'danger');
          console.error("Error deleting location:", err);
        });
    }
  };

  const catColors = {
    'حكومي': '#003087',
    'سكني': '#10b981',
    'تجاري': '#f59e0b',
    'خدمات': '#ef4444'
  };

  const kmlFolders = [...new Set(kmlFeatures.map(f => f.folder).filter(Boolean))];

  const handleClearKml = () => {
    if (!window.confirm('هل تريد حذف جميع معالم KML المستوردة؟ يمكنك استيراد ملف جديد لاحقاً.')) return;
    api.clearKmlFeatures()
      .then(() => {
        setKmlFeatures([]);
        showResult('تم حذف جميع معالم KML بنجاح.', 'success');
      })
      .catch(() => showResult('حدث خطأ أثناء الحذف.', 'danger'));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h3 className="fw-bold m-0" style={{ color: 'var(--primary)' }}>
          <FaMapMarkedAlt className="ms-2" /> إدارة الخريطة العمرانية
        </h3>
        <div className="d-flex gap-2 align-items-center">
          <Badge bg="primary" className="fs-6 py-2 px-3 rounded-pill shadow-sm">
            معالم الهيئة: {locations.length}
          </Badge>
          <Badge bg="success" className="fs-6 py-2 px-3 rounded-pill shadow-sm">
            <FaLayerGroup className="me-1" /> معالم KML: {kmlFeatures.length}
          </Badge>
        </div>
      </div>


      <Row className="gy-4">
        {/* Form and map layout */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm card-custom rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
              <FaPlusCircle />
              <span>إضافة معلم جديد للبلدية</span>
            </h5>

            <Form onSubmit={handleAddLocation}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">اسم المعلم / المشروع</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="مثال: مجمع عيادات طرابلس المركزي"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required
                />
              </Form.Group>

              <Row className="g-3 mb-3">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">تصنيف المعلم</Form.Label>
                    <Form.Select
                      value={form.category}
                      onChange={e => setForm({...form, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">اسم المدخل</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={loggedInUser?.username || 'مدخل البيانات'}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">خط العرض (Lat)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="انقر على الخريطة"
                      value={form.latitude}
                      disabled
                      required
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">خط الطول (Lng)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="انقر على الخريطة"
                      value={form.longitude}
                      disabled
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">تفاصيل المعلم / الوصف</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="أدخل وصفاً كافياً لزوار الموقع..."
                  value={form.details}
                  onChange={e => setForm({...form, details: e.target.value})}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold d-flex align-items-center gap-2">
                  🎨 لون المعلم على الخريطة
                </Form.Label>
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm({...form, color: e.target.value})}
                    style={{ width: 48, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                    title="اختر لون المعلم"
                  />
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: form.color, border: '3px solid #dee2e6', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                  <span className="text-muted small">{form.color}</span>
                  {['#003087','#10b981','#f59e0b','#ef4444','#8b5cf6','#0dcaf0','#fd7e14'].map(c => (
                    <div
                      key={c}
                      onClick={() => setForm({...form, color: c})}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #000' : '2px solid #dee2e6', transition: 'transform 0.15s' }}
                      title={c}
                    />
                  ))}
                </div>
              </Form.Group>

              <PrimaryButton type="submit" style={{ width: '100%' }} icon={<FaCheckCircle />}>
                إدراج في الخريطة التفاعلية
              </PrimaryButton>
            </Form>
          </Card>

          {/* KML / KMZ Upload Card */}
          <Card className="border-0 shadow-sm card-custom rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-3 text-success d-flex align-items-center gap-2">
              <FaMapMarkedAlt />
              <span>استيراد ملفات الخرائط (KML / KMZ)</span>
            </h5>
            <div className="p-3 rounded-3 mb-3 small" style={{ direction: 'rtl', lineHeight: 1.6, background: 'rgba(25,135,84,0.07)', border: '1px solid rgba(25,135,84,0.2)' }}>
              📥 <strong>استيراد معالم الخريطة:</strong> رفع ملفات <code>.kml</code> أو <code>.kmz</code> — يقوم النظام بتحليلها واستخراج كافة المعالم والحدود الجغرافية تلقائياً.
            </div>
            
            <Form onSubmit={handleKmlUpload}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">اختر ملف KML أو KMZ</Form.Label>
                <Form.Control 
                  type="file" 
                  accept=".kml,.kmz" 
                  onChange={e => setKmlFile(e.target.files[0])}
                  required
                />
              </Form.Group>
              
              <Button 
                variant="success" 
                type="submit" 
                disabled={uploadingKml} 
                style={{ width: '100%', borderRadius: 10, fontWeight: 700, marginBottom: 8 }}
              >
                {uploadingKml ? '⏳ جاري رفع وتحليل الملف...' : '🚀 رفع وتحليل ملف الخريطة'}
              </Button>

              {kmlFeatures.length > 0 && (
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  type="button"
                  onClick={handleClearKml}
                  style={{ width: '100%', borderRadius: 10, fontWeight: 600 }}
                >
                  <FaTrashAlt className="me-1" /> حذف جميع معالم KML ({kmlFeatures.length} معلم)
                </Button>
              )}
            </Form>

            {/* KML Folders Summary with color pickers */}
            {kmlFolders.length > 0 && (
              <div className="mt-3">
                <div className="fw-bold small mb-2" style={{ color: 'var(--text-muted)' }}>الطبقات المستوردة (اضغط على اللون لتغييره):</div>
                <div className="d-flex flex-wrap gap-2">
                  {kmlFolders.map((folder, idx) => {
                    const folderColor = kmlFolderColors[folder] || KML_LAYER_COLORS[idx % KML_LAYER_COLORS.length];
                    return (
                      <div key={folder} className="d-flex align-items-center gap-1" style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 99, padding: '4px 10px 4px 4px', border: '1px solid #dee2e6' }}>
                        <input
                          type="color"
                          value={folderColor}
                          onChange={e => setKmlFolderColors(prev => ({ ...prev, [folder]: e.target.value }))}
                          onBlur={e => handleSaveKmlFolderColor(folder, e.target.value)}
                          style={{ width: 24, height: 24, border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 1 }}
                          title="غيِّر لون الطبقة"
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333' }}>
                          {folder} ({kmlFeatures.filter(f => f.folder === folder).length})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Map view selection */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm card-custom rounded-4 p-2 overflow-hidden" style={{ height: '490px' }}>
            <div className="bg-light p-2 mb-2 rounded text-center small text-muted" style={{ direction: 'rtl' }}>
              💡 <strong>تنبيه للآدمن/مدخل البيانات:</strong> انقر على الخريطة في أي مكان لتحديد إحداثيات المعلم تلقائياً.
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <MapContainer center={[27.0, 17.5]} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickSelector onSelectCoords={handleSelectCoords} />
                
                {/* Temporary selected location marker */}
                {form.latitude && form.longitude && (
                  <Marker position={[Number(form.latitude), Number(form.longitude)]}>
                    <Popup>الموقع الذي حددته</Popup>
                  </Marker>
                )}

                {/* Locations markers with custom colors */}
                {locations.map((loc) => {
                  const markerColor = loc.color || '#003087';
                  const coloredIcon = Number(loc.is_approved) === 1
                    ? L.divIcon({
                        className: '',
                        html: `<div style="width:25px;height:41px;position:relative">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
                            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${markerColor}"/>
                            <circle cx="12.5" cy="12.5" r="5.5" fill="white" opacity="0.9"/>
                          </svg>
                        </div>`,
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                      })
                    : (Number(loc.is_approved) === 2 ? restudyIcon : pendingIcon);
                  return (
                    <Marker 
                      key={loc.id} 
                      position={[loc.latitude, loc.longitude]}
                      icon={coloredIcon}
                    >
                      <Popup>
                      <div className="text-center" style={{ fontFamily: 'Cairo', direction: 'rtl', textAlign: 'right' }}>
                        <Badge 
                          bg={Number(loc.is_approved) === 1 ? "success" : (Number(loc.is_approved) === 2 ? "danger" : "warning")} 
                          text={Number(loc.is_approved) === 1 ? "white" : (Number(loc.is_approved) === 2 ? "white" : "dark")} 
                          className="mb-2"
                        >
                          {loc.category} {Number(loc.is_approved) === 0 && '(قيد المراجعة)'} {Number(loc.is_approved) === 2 && '(إعادة دراسة)'}
                        </Badge>
                        <h6 className="fw-bold mb-1">{loc.name_ar || loc.name}</h6>
                        <p className="text-muted small m-0">{loc.details_ar || loc.details}</p>
                        {Number(loc.is_approved) === 2 && loc.rejection_comment && (
                          <div className="mt-2 p-1.5 rounded text-danger bg-danger-subtle small fw-bold" style={{ fontSize: '0.75rem' }}>
                            ⚠️ سبب الرفض: {loc.rejection_comment}
                          </div>
                        )}
                        <div className="text-muted small mt-1.5 border-top pt-1">
                          أنشئ بواسطة: {loc.creator_name || 'مدير النظام'}
                        </div>
                      </div>
                    </Popup>
                    </Marker>
                  );
                })}

                {/* KML Features layers – dynamic colors */}
                {kmlFeatures.map((feat) => {
                  const coords = JSON.parse(feat.coordinates);
                  const isPoint = feat.type === 'Point';
                  const folderIdx = kmlFolders.indexOf(feat.folder);
                  const color = KML_LAYER_COLORS[folderIdx >= 0 ? folderIdx % KML_LAYER_COLORS.length : 0];

                  if (isPoint) {
                    return (
                      <Marker 
                        key={feat.id} 
                        position={coords}
                        icon={kmlIcon}
                      >
                        <Popup>
                          <div style={{ fontFamily: 'inherit', direction: 'rtl', textAlign: 'right', maxWidth: 300, maxHeight: 250, overflow: 'auto' }}>
                            <Badge className="mb-2" style={{ backgroundColor: color }}>{feat.folder}</Badge>
                            <h6 className="fw-bold mb-2">{feat.name || 'معلم خرائط'}</h6>
                            {feat.details && <div dangerouslySetInnerHTML={{ __html: feat.details }} style={{ fontSize: '0.8rem' }} />}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  } else {
                    return (
                      <Polygon
                        key={feat.id}
                        positions={coords}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 2 }}
                        interactive={false}
                      />
                    );
                  }
                })}
              </MapContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Locations table */}
      <Card className="border-0 shadow-sm card-custom rounded-4 mt-4 overflow-hidden">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle text-center">
              <thead className="bg-light">
                <tr>
                  <th className="py-3">اسم المعلم / المبنى</th>
                  <th className="py-3">التصنيف</th>
                  <th className="py-3">إحداثيات الموقع</th>
                  <th className="py-3">أنشئ بواسطة</th>
                  <th className="py-3">الحالة</th>
                  <th className="py-3">اللون</th>
                  <th className="py-3">التفاصيل</th>
                  <th className="py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-5 text-muted">لا توجد معالم مضافة حالياً.</td>
                  </tr>
                ) : (
                  locations.map((loc) => (
                    <tr key={loc.id}>
                      <td><div className="fw-bold">{loc.name_ar || loc.name}</div></td>
                      <td>
                        <Badge style={{ background: catColors[loc.category] || '#6c757d', padding: '6px 12px' }}>
                          {loc.category}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="secondary" className="font-monospace small">
                          Lat: {loc.latitude.toFixed(5)}, Lng: {loc.longitude.toFixed(5)}
                        </Badge>
                      </td>
                      <td>
                        <div className="small fw-semibold">{loc.creator_name || 'مدير النظام'}</div>
                      </td>
                      <td>
                        {Number(loc.is_approved) === 1 ? (
                          <Badge bg="success" className="py-1.5 px-2.5">معتمد</Badge>
                        ) : Number(loc.is_approved) === 2 ? (
                          <Badge bg="danger" className="py-1.5 px-2.5">إعادة دراسة</Badge>
                        ) : (
                          <Badge bg="warning" text="dark" className="py-1.5 px-2.5">قيد المراجعة</Badge>
                        )}
                      </td>
                      {/* Color cell with quick color picker */}
                      <td>
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: loc.color || '#003087', border: '2px solid #dee2e6', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          {(loggedInUser.role?.slug === 'admin' || loggedInUser.role?.slug === 'data_entry') && (
                            <input
                              type="color"
                              defaultValue={loc.color || '#003087'}
                              onChange={e => {
                                setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, color: e.target.value } : l));
                              }}
                              onBlur={e => handleSaveMarkerColor(loc.id, e.target.value)}
                              style={{ width: 26, height: 26, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                              title="غيِّر لون المعلم"
                            />
                          )}
                        </div>
                      </td>
                      <td className="text-end text-muted small" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {loc.details_ar || loc.details || '-'}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          {loggedInUser.role?.slug === 'admin' || loggedInUser.role?.slug === 'data_entry' ? (
                            <>
                              <Button 
                                variant={Number(loc.is_approved) === 1 ? "primary" : "warning"} 
                                size="sm" 
                                onClick={() => handleOpenReview(loc)}
                                className="d-flex align-items-center justify-content-center px-2.5 fw-bold"
                              >
                                {Number(loc.is_approved) === 1 ? 'تعديل' : 'مراجعة'}
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => handleDelete(loc.id)} 
                                className="d-flex align-items-center justify-content-center gap-1"
                                title="حذف المعلم"
                              >
                                <FaTrashAlt />
                                <span>حذف</span>
                              </Button>
                            </>
                          ) : (
                            /* Creator or employee can edit/cancel their own points */
                            (loc.created_by === loggedInUser.id) && (
                              <>
                                {Number(loc.is_approved) === 2 ? (
                                  <Button 
                                    variant="danger" 
                                    size="sm" 
                                    onClick={() => {
                                      setReStudyForm({
                                        id: loc.id,
                                        name_ar: loc.name_ar || '',
                                        name_en: loc.name_en || '',
                                        category: loc.category || 'حكومي',
                                        latitude: loc.latitude,
                                        longitude: loc.longitude,
                                        details_ar: loc.details_ar || '',
                                        details_en: loc.details_en || '',
                                        rejection_comment: loc.rejection_comment || '',
                                      });
                                      setShowReStudyModal(true);
                                    }}
                                    className="d-flex align-items-center justify-content-center px-2.5 fw-bold"
                                  >
                                    تعديل وإعادة دراسة
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="primary" 
                                    size="sm" 
                                    onClick={() => handleOpenReview(loc)}
                                    className="d-flex align-items-center justify-content-center px-2.5 fw-bold"
                                    disabled={Number(loc.is_approved) === 0}
                                  >
                                    {Number(loc.is_approved) === 0 ? 'قيد المراجعة' : 'تعديل'}
                                  </Button>
                                )}
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Review Modal */}
      <ModernModal
        show={showReviewModal}
        onClose={() => { setShowReviewModal(false); setSearchParams({}); }}
        title={reviewForm.is_approved ? "تعديل معلم الخريطة" : "مراجعة واعتماد معلم الخريطة"}
        type="primary"
        size="lg"
      >
        <Form onSubmit={handleApproveReview}>
          <div className="mb-4">
            <h6 className="fw-bold mb-3">موقع المعلم على الخريطة:</h6>
            <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {reviewForm.latitude && reviewForm.longitude && (
                <MapContainer center={[Number(reviewForm.latitude), Number(reviewForm.longitude)]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[Number(reviewForm.latitude), Number(reviewForm.longitude)]} />
                  <ReviewMapClickSelector onSelectCoords={handleSelectReviewCoords} />
                </MapContainer>
              )}
            </div>
            <Form.Text className="text-muted text-center d-block mt-2">
              💡 يمكنك النقر على الخريطة أعلاه لتعديل الإحداثيات مباشرة.
            </Form.Text>
          </div>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">اسم المعلم (بالعربية)</Form.Label>
                <Form.Control
                  type="text"
                  value={reviewForm.name_ar}
                  onChange={e => setReviewForm({ ...reviewForm, name_ar: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">اسم المعلم (بالإنكليزية)</Form.Label>
                <Form.Control
                  type="text"
                  value={reviewForm.name_en}
                  onChange={e => setReviewForm({ ...reviewForm, name_en: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">التصنيف</Form.Label>
                <Form.Select
                  value={reviewForm.category}
                  onChange={e => setReviewForm({ ...reviewForm, category: e.target.value })}
                  required
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">خط العرض (Lat)</Form.Label>
                <Form.Control
                  type="text"
                  value={reviewForm.latitude}
                  disabled
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">خط الطول (Lng)</Form.Label>
                <Form.Control
                  type="text"
                  value={reviewForm.longitude}
                  disabled
                  required
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">تفاصيل المعلم / الوصف (بالعربية)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reviewForm.details_ar}
                  onChange={e => setReviewForm({ ...reviewForm, details_ar: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">تفاصيل المعلم / الوصف (بالإنكليزية)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reviewForm.details_en}
                  onChange={e => setReviewForm({ ...reviewForm, details_en: e.target.value })}
                />
              </Form.Group>
            </Col>
            {/* Color picker for the marker */}
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold d-flex align-items-center gap-2">
                  🎨 لون المعلم على الخريطة
                </Form.Label>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <input
                    type="color"
                    value={reviewForm.color || '#003087'}
                    onChange={e => setReviewForm({ ...reviewForm, color: e.target.value })}
                    style={{ width: 48, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                    title="اختر لون المعلم"
                  />
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: reviewForm.color || '#003087', border: '3px solid #dee2e6', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                  <span className="text-muted small">{reviewForm.color || '#003087'}</span>
                  {['#003087','#10b981','#f59e0b','#ef4444','#8b5cf6','#0dcaf0','#fd7e14','#6c757d'].map(c => (
                    <div
                      key={c}
                      onClick={() => setReviewForm({ ...reviewForm, color: c })}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: (reviewForm.color || '#003087') === c ? '3px solid #000' : '2px solid #dee2e6', transition: 'transform 0.15s' }}
                      title={c}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
            <div className="d-flex gap-2">
              {reviewForm.is_approved === 1 ? (
                <Button variant="success" type="submit" className="fw-bold px-4 py-2">
                  ✔️ حفظ التعديلات
                </Button>
              ) : (
                <>
                  <Button variant="success" type="submit" className="fw-bold px-4 py-2">
                    ✔️ موافقة واعتماد النشر
                  </Button>
                  <Button variant="danger" type="button" className="fw-bold px-4 py-2" onClick={handleRejectAndRestudy}>
                    ❌ رفض وإعادة دراسة
                  </Button>
                </>
              )}
            </div>
            <Button variant="secondary" type="button" className="px-3" onClick={() => { setShowReviewModal(false); setSearchParams({}); }}>
              إلغاء
            </Button>
          </div>
        </Form>
      </ModernModal>

      {/* Reject & Re-study Reason Modal */}
      <ModernModal
        show={showRejectReasonModal}
        onClose={() => setShowRejectReasonModal(false)}
        title="سبب رفض وإعادة دراسة المعلم"
        type="danger"
        size="md"
      >
        <Form onSubmit={handleSubmitRejectReason}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-danger">الرجاء إدخال سبب الرفض بالتفصيل ليظهر للموظف:</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="مثال: الإحداثيات المحددة تقع خارج نطاق البلدية، أو يرجى مراجعة مسمى المعلم وتفاصيله..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              required
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="danger" type="submit" className="fw-bold px-4">
              إرسال لإعادة الدراسة
            </Button>
            <Button variant="secondary" onClick={() => setShowRejectReasonModal(false)}>
              إلغاء
            </Button>
          </div>
        </Form>
      </ModernModal>

      {/* Employee Re-study Modal */}
      <ModernModal
        show={showReStudyModal}
        onClose={() => { setShowReStudyModal(false); setSearchParams({}); }}
        title="تعديل وإعادة دراسة معلم"
        type="warning"
        size="lg"
      >
        <Form onSubmit={handleResubmitReStudy}>
          {reStudyForm.rejection_comment && (
            <Alert variant="danger" className="mb-4 rounded-3 border-0 shadow-sm d-flex flex-column gap-1">
              <strong className="text-danger">⚠️ تعليق وسبب رفض المسؤول:</strong>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{reStudyForm.rejection_comment}</div>
            </Alert>
          )}

          <div className="mb-4">
            <h6 className="fw-bold mb-3 text-primary">الموقع الجديد على الخريطة (انقر للتعديل):</h6>
            <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {reStudyForm.latitude && reStudyForm.longitude && (
                <MapContainer center={[Number(reStudyForm.latitude), Number(reStudyForm.longitude)]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[Number(reStudyForm.latitude), Number(reStudyForm.longitude)]} />
                  <ReviewMapClickSelector onSelectCoords={handleSelectReStudyCoords} />
                </MapContainer>
              )}
            </div>
            <Form.Text className="text-muted text-center d-block mt-2">
              💡 يرجى النقر على المكان الصحيح في الخريطة لتعديل الإحداثيات تلقائياً.
            </Form.Text>
          </div>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">اسم المعلم (بالعربية)</Form.Label>
                <Form.Control
                  type="text"
                  value={reStudyForm.name_ar}
                  onChange={e => setReStudyForm({ ...reStudyForm, name_ar: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">اسم المعلم (بالإنكليزية)</Form.Label>
                <Form.Control
                  type="text"
                  value={reStudyForm.name_en}
                  onChange={e => setReStudyForm({ ...reStudyForm, name_en: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">التصنيف</Form.Label>
                <Form.Select
                  value={reStudyForm.category}
                  onChange={e => setReStudyForm({ ...reStudyForm, category: e.target.value })}
                  required
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">خط العرض (Lat)</Form.Label>
                <Form.Control
                  type="text"
                  value={reStudyForm.latitude}
                  disabled
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">خط الطول (Lng)</Form.Label>
                <Form.Control
                  type="text"
                  value={reStudyForm.longitude}
                  disabled
                  required
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">تفاصيل المعلم / الوصف (بالعربية)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reStudyForm.details_ar}
                  onChange={e => setReStudyForm({ ...reStudyForm, details_ar: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">تفاصيل المعلم / الوصف (بالإنكليزية)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reStudyForm.details_en}
                  onChange={e => setReStudyForm({ ...reStudyForm, details_en: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
            <div className="d-flex gap-2">
              <Button variant="success" type="submit" className="fw-bold px-4 py-2">
                🚀 إرسال التعديلات للمراجعة
              </Button>
              <Button variant="danger" type="button" className="fw-bold px-4 py-2" onClick={handleCancelReStudyPoint}>
                ❌ إلغاء وحذف النقطة بالكامل
              </Button>
            </div>
            <Button variant="secondary" type="button" className="px-3" onClick={() => { setShowReStudyModal(false); setSearchParams({}); }}>
              إغاء
            </Button>
          </div>
        </Form>
      </ModernModal>

      {/* Result Toast */}
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

    </motion.div>
  );
};

export default ManageMap;
