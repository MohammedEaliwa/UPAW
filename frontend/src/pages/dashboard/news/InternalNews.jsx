import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FaBullhorn, FaCalendarAlt, FaUser, FaComments, FaArrowLeft, 
  FaFileAlt, FaCheckCircle, FaExclamationCircle, FaDownload, FaArrowRight,
  FaMapMarkedAlt, FaImages, FaChevronLeft, FaChevronRight, FaPlus, FaPrint, FaEdit, FaTrash
} from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import ModernModal from '../../../components/ModernModal';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ToastNotification from '../../../components/ui/ToastNotification';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as togeojson from 'togeojson';
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

const kmlIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const KML_LAYER_COLORS = [
  '#003087', '#198754', '#fd7e14', '#dc3545', '#6f42c1', '#0dcaf0', '#ffc107'
];

// Click selector component
const MapClickSelector = ({ onSelectCoords }) => {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const InternalNews = () => {
  const [internalPosts, setInternalPosts] = useState([]);

  useEffect(() => {
    api.getNews()
      .then(data => {
        const posts = Array.isArray(data) ? data : (data.data || []);
        const mapped = posts.map(p => ({
          ...p,
          title: p.title_ar || p.title_en || p.title || '',
          excerpt: p.excerpt_ar || p.excerpt_en || p.excerpt || '',
          content: p.content_ar || p.content_en || p.content || ''
        }));
        setInternalPosts(mapped.filter(p => p.target_audience === 'الموظفين'));
      })
      .catch(() => setInternalPosts([]));
  }, []);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ author_name: '', content: '' });

  const [activeMapNews, setActiveMapNews] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [activeGalleryNews, setActiveGalleryNews] = useState(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMapBlurred, setIsMapBlurred] = useState(false);

  // --- Smart Document Builder States ---
  const [documents, setDocuments] = useState([]);
  const [showDocBuilder, setShowDocBuilder] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocFieldsStr, setNewDocFieldsStr] = useState('');
  const [editingDocument, setEditingDocument] = useState(null);
  
  // --- Smart Document Fill States ---
  const [showDocFill, setShowDocFill] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [docFormData, setDocFormData] = useState({});

  useEffect(() => {
    api.getDocuments()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        if (Array.isArray(arr)) setDocuments(arr);
      })
      .catch(err => console.error("Error fetching docs:", err));
  }, []);

  useEffect(() => {
    const handleBlur = () => setIsMapBlurred(true);
    const handleFocus = () => setIsMapBlurred(false);
    
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  const { user } = useAuth();
  const loggedInUser = user || { username: 'موظف الهيئة' };

  const [activeTab, setActiveTab] = useState('news'); // 'news' or 'map'

  const [locations, setLocations] = useState([]);
  const [kmlFeatures, setKmlFeatures] = useState([]);
  const [mapForm, setMapForm] = useState({
    name: '',
    category: 'حكومي',
    latitude: '',
    longitude: '',
    details: '',
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showResult = (message, type = 'success') => setToast({ show: true, message, type });

  const fetchLocations = () => {
    api.getMapLocations()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        setLocations(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setLocations([]));
  };

  const fetchKmlFeatures = () => {
    api.getKmlFeatures()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        if (Array.isArray(arr)) setKmlFeatures(arr);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (activeTab === 'map') {
      fetchLocations();
      fetchKmlFeatures();
    }
  }, [activeTab]);

  const handleSelectCoords = (lat, lng) => {
    setMapForm(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!mapForm.latitude || !mapForm.longitude) {
      showResult('يرجى النقر على الخريطة لتحديد الإحداثيات أولاً!', 'danger');
      return;
    }

    const newLocation = {
      name_ar: mapForm.name,
      name_en: mapForm.name,
      category: mapForm.category,
      latitude: parseFloat(mapForm.latitude),
      longitude: parseFloat(mapForm.longitude),
      details_ar: mapForm.details,
      details_en: mapForm.details,
      created_by: loggedInUser.id || 3,
      is_approved: 0
    };

    api.createMapLocation(newLocation)
      .then(() => {
        fetchLocations();
        showResult('تم إرسال طلب إضافة المشروع للمسؤول بانتظار الاعتماد! ✨', 'success');
        setMapForm({ name: '', category: 'حكومي', latitude: '', longitude: '', details: '' });
      })
      .catch(err => {
        console.error("Error adding project:", err);
        showResult(err.message || 'حدث خطأ أثناء الإضافة', 'danger');
      });
  };

  const categories = ['حكومي', 'سكني', 'تجاري', 'خدمات'];

  const catColors = {
    'حكومي': '#003087',
    'سكني': '#10b981',
    'تجاري': '#f59e0b',
    'خدمات': '#ef4444'
  };

  const kmlFolders = [...new Set(kmlFeatures.map(f => f.folder).filter(Boolean))];

  const handleOpenDetail = (post) => {
    setSelectedPost(post);
    api.getComments(post.id).then(d => setComments(Array.isArray(d) ? d : [])).catch(() => setComments([]));
    setNewComment({ author_name: loggedInUser.username, content: '' });
    setShowDetailModal(true);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.content.trim()) return;

    api.addComment(selectedPost.id, {
      author_name: newComment.author_name,
      content: newComment.content
    }).then(added => {
      setComments(prev => [...prev, added]);
      setNewComment(prev => ({ ...prev, content: '' }));
    }).catch(() => {});
  };

  const handleSaveDocTemplate = () => {
    if(!newDocTitle || !newDocFieldsStr) return;
    
    const parsedFields = newDocFieldsStr.split(',').map(f => f.trim()).filter(f => f).map(f => {
      let type = 'text';
      if(f.includes('تاريخ') || f.includes('موعد')) type = 'date';
      else if(f.includes('مبلغ') || f.includes('رقم')) type = 'number';
      else if(f.includes('سبب') || f.includes('تفاصيل') || f.includes('ملاحظات')) type = 'textarea';
      
      return { name: f, label: f, type };
    });

    if (editingDocument) {
      api.updateDocument(editingDocument.id, { title: newDocTitle, fields: JSON.stringify(parsedFields), size: 'Dyna-Form' })
        .then((data) => {
          setDocuments(documents.map(d => d.id === editingDocument.id ? { ...d, title: newDocTitle, fields: JSON.stringify(parsedFields) } : d));
          setShowDocBuilder(false);
          setNewDocTitle('');
          setNewDocFieldsStr('');
          setEditingDocument(null);
          showResult('تم تعديل النموذج بنجاح!', 'success');
        })
        .catch(err => {
          console.error("Error saving doc:", err);
          showResult(err.message || 'حدث خطأ أثناء الحفظ', 'danger');
        });
    } else {
      api.createDocument({ title: newDocTitle, fields: JSON.stringify(parsedFields), size: 'Dyna-Form' })
        .then((data) => {
          setDocuments([...documents, data]);
          setShowDocBuilder(false);
          setNewDocTitle('');
          setNewDocFieldsStr('');
          showResult('تم إضافة النموذج بنجاح!', 'success');
        })
        .catch(err => {
          console.error("Error saving doc:", err);
          showResult(err.message || 'حدث خطأ أثناء الحفظ', 'danger');
        });
    }
  };

  const handleEditDocument = (doc, e) => {
    e.stopPropagation();
    setEditingDocument(doc);
    setNewDocTitle(doc.title);
    setNewDocFieldsStr(JSON.parse(doc.fields).map(f => f.label).join(', '));
    setShowDocBuilder(true);
  };

  const handleDeleteDocument = (id, e) => {
    e.stopPropagation();
    if(window.confirm('هل أنت متأكد من حذف هذا النموذج؟')) {
      api.deleteDocument(id)
        .then(() => {
          setDocuments(documents.filter(d => d.id !== id));
          showResult('تم حذف النموذج بنجاح!', 'success');
        })
        .catch(err => {
          console.error("Error deleting doc:", err);
          showResult(err.message || 'حدث خطأ أثناء الحذف', 'danger');
        });
    }
  };

  const handleOpenDocFill = (doc) => {
    setActiveDocument(doc);
    setDocFormData({});
    setShowDocFill(true);
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const getCategoryBadge = (cat) => {
    const badges = {
      'أخبار داخلية': { bg: 'danger', text: 'تعميم رسمي' },
      'اجتماعات': { bg: 'warning text-dark', text: 'مواعيد عمل' },
      'إعلانات': { bg: 'info text-dark', text: 'إعلان داخلي' },
      'مناسبات': { bg: 'success', text: 'مناسبة اجتماعية' }
    };
    const current = badges[cat] || { bg: 'primary', text: cat };
    return <Badge bg={current.bg} className="rounded-pill px-3 py-1.5">{current.text}</Badge>;
  };

  const handleOpenMap = (post, e) => {
    e.preventDefault();
    setActiveMapNews(post);
    setShowMapModal(true);
  };

  const handleOpenGallery = (post, e) => {
    e.preventDefault();
    setActiveGalleryNews(post);
    setCurrentImageIndex(0);
    setShowGalleryModal(true);
  };

  const parseKmlToGeoJson = (kmlString) => {
    if (!kmlString) return null;
    try {
      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlString, 'text/xml');
      return togeojson.kml(kmlDoc);
    } catch (err) {
      console.error('Error parsing KML', err);
      return null;
    }
  };

  // Urgent announcement (most recent post)
  const urgentPost = internalPosts[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-5" style={{ direction: 'rtl', textAlign: 'right' }}>
      
      {/* Welcome Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #001225 0%, #001d5a 50%, #003087 100%)',
          borderRadius: '24px',
          padding: '35px 30px',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,29,90,0.15)',
          marginBottom: '30px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: -50, left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,168,232,0.12) 0%, transparent 70%)' }} />
        <div className="position-relative">
          <div className="d-flex align-items-center gap-2 mb-2" style={{ opacity: 0.9, color: '#ffffff' }}>
            <FaBullhorn style={{ color: '#7eb8ff' }} />
            <span style={{ color: '#ffffff', fontWeight: 600 }}>بوابة الموظف الموحدة</span>
          </div>
          <h2 className="fw-extrabold mb-2 text-white" style={{ fontSize: '1.8rem', color: '#ffffff' }}>
            أهلاً بك مجدداً، <span style={{ color: '#7eb8ff' }}>{loggedInUser.username}</span>
          </h2>
          <p className="mb-0 text-white-50" style={{ fontSize: '0.98rem', color: 'rgba(255, 255, 255, 0.85)' }}>
            المنصة الداخلية لاستعراض التعاميم الإدارية، الأخبار والمستجدات الخاصة بالهيئة الوطنية للتخطيط العمراني.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="d-flex gap-3 mb-4 border-bottom pb-2">
        <Button 
          variant={activeTab === 'news' ? 'primary' : 'outline-primary'} 
          onClick={() => setActiveTab('news')}
          className="rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2"
          style={{ transition: 'all 0.3s' }}
        >
          <FaBullhorn />
          <span>التعاميم والأخبار الداخلية</span>
        </Button>
        {loggedInUser?.role_id !== 1 && (
          <Button 
            variant={activeTab === 'map' ? 'primary' : 'outline-primary'} 
            onClick={() => setActiveTab('map')}
            className="rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2"
            style={{ transition: 'all 0.3s' }}
          >
            <FaMapMarkedAlt />
            <span>خريطة المشاريع المعتمدة والمقترحة</span>
          </Button>
        )}
      </div>

      {activeTab === 'news' ? (
        <Row className="gy-4">
        {/* Main Feed */}
        <Col lg={8} md={12}>
          
          {/* Urgent Announcement Alert */}
          {urgentPost && (
            <div 
              style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1.5px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '20px',
                padding: '20px 24px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}
              className="animate-pulse"
            >
              <div 
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                <FaBullhorn size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="d-flex align-items-center gap-2 mb-1.5">
                  <Badge bg="danger">هام وعاجل</Badge>
                  <span className="text-muted small d-flex align-items-center gap-1">
                    <FaCalendarAlt />
                    {urgentPost.date}
                  </span>
                </div>
                <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1.05rem', lineHeight: 1.4 }}>{urgentPost.title || urgentPost.title_ar || urgentPost.title_en}</h5>
                <p className="text-muted small mb-2.5" style={{ lineHeight: 1.6 }}>{urgentPost.excerpt || urgentPost.excerpt_ar || urgentPost.excerpt_en}</p>
                <Button 
                  variant="link" 
                  className="p-0 text-danger fw-bold d-flex align-items-center gap-1.5"
                  onClick={() => handleOpenDetail(urgentPost)}
                  style={{ textDecoration: 'none', fontSize: '0.88rem' }}
                >
                  <span>اقرأ التعميم الإداري بالكامل</span>
                  <FaArrowLeft size={10} />
                </Button>
              </div>
            </div>
          )}

          {/* Section title */}
          <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
            <span>📰 آخر التعاميم والمستجدات</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </h5>

          {/* News Cards Grid */}
          {internalPosts.length === 0 ? (
            <div className="text-center py-5 text-muted rounded-4 border" style={{ background: 'var(--card-bg)' }}>
              <FaBullhorn size={42} className="opacity-25 mb-3" />
              <h5 style={{ color: 'var(--text)' }}>لا توجد إعلانات داخلية حالياً</h5>
              <p className="small">سيتم إشعارك فور نشر الإدارة لأي تعميم جديد.</p>
            </div>
          ) : (
            <Row className="gy-4">
              {internalPosts.map((post) => (
                <Col md={12} key={post.id}>
                  <Card 
                    className="border-0 shadow-sm rounded-4 overflow-hidden" 
                    style={{ 
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      transition: 'all 0.25s'
                    }}
                    className="hover-card-list"
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-2">
                          {getCategoryBadge(post.category)}
                          <span className="text-muted small d-flex align-items-center gap-1">
                            <FaCalendarAlt size={12} />
                            {post.date}
                          </span>
                        </div>
                        <Badge bg="light" text="dark" className="border">
                          رقم المنشور: {post.id}
                        </Badge>
                      </div>

                      <h5 className="fw-extrabold text-dark mb-2.5" style={{ fontSize: '1.15rem', lineHeight: 1.45 }}>
                        {post.title || post.title_ar || post.title_en}
                      </h5>

                      <p className="text-muted mb-3" style={{ fontSize: '0.92rem', lineHeight: 1.7 }}>
                        {post.excerpt || post.excerpt_ar || post.excerpt_en}
                      </p>

                      <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-3 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-1.5 text-muted small">
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaUser size={12} />
                          </div>
                          <span>بواسطة: إدارة تقنية المعلومات</span>
                        </div>
                        
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {post.images && post.images.length > 1 && (
                            <PrimaryButton 
                              variant="outline-primary" 
                              onClick={(e) => handleOpenGallery(post, e)}
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                              <FaImages /> معرض الصور ({post.images.length})
                            </PrimaryButton>
                          )}

                          {post.kml_data && (
                            <PrimaryButton 
                              variant="outline-primary" 
                              onClick={(e) => handleOpenMap(post, e)}
                              style={{ padding: '4px 10px', fontSize: '0.8rem', borderColor: '#10b981', color: '#10b981' }}
                            >
                              <FaMapMarkedAlt /> استعراض الخريطة التفاعلية
                            </PrimaryButton>
                          )}

                          <Button 
                            variant="outline-primary" 
                            className="rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2"
                            style={{ fontSize: '0.85rem' }}
                            onClick={() => handleOpenDetail(post)}
                          >
                            <span>عرض تفاصيل المنشور</span>
                            <FaArrowLeft size={10} />
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

        </Col>

        {/* Sidebar widgets */}
        <Col lg={4} md={12}>
          
          {/* Circular links */}
          <Card className="border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'var(--card-bg)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-extrabold text-dark m-0 d-flex align-items-center gap-2">
                <FaFileAlt className="text-primary" />
                <span>مستندات داخلية سريعة</span>
              </h6>
              {loggedInUser.role_id === 1 && (
                <Button variant="outline-primary" size="sm" className="rounded-pill d-flex align-items-center gap-1" onClick={() => setShowDocBuilder(true)}>
                  <FaPlus size={10} /> جديد
                </Button>
              )}
            </div>
            
            <div className="d-flex flex-column gap-2">
              {documents.length === 0 && (
                <div className="text-muted small text-center py-3">لا توجد مستندات حالياً</div>
              )}
              {documents.map((doc, idx) => (
                <div 
                  key={idx} 
                  style={{
                    background: 'var(--body-bg)',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover-card-list"
                  onClick={() => handleOpenDocFill(doc)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{doc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.size || 'نموذج إلكتروني'}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {loggedInUser.role_id === 1 && (
                      <>
                        <Button variant="link" className="p-0 text-primary" onClick={(e) => handleEditDocument(doc, e)}>
                          <FaEdit size={14} />
                        </Button>
                        <Button variant="link" className="p-0 text-danger" onClick={(e) => handleDeleteDocument(doc.id, e)}>
                          <FaTrash size={14} />
                        </Button>
                      </>
                    )}
                    {!loggedInUser.role_id || loggedInUser.role_id !== 1 ? (
                      <FaFileAlt className="text-primary opacity-75" size={14} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Notice card */}
          <Card className="border-0 shadow-sm rounded-4 p-4 text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <FaExclamationCircle className="text-warning" size={20} />
              <h6 className="fw-bold m-0 text-white">إرشادات الأمان الرقمي</h6>
            </div>
            <p className="small text-white-50 mb-0" style={{ lineHeight: 1.6 }}>
              يرجى عدم مشاركة كلمة المرور الخاصة بك أو رقمك الوظيفي مع أي جهة. نظام الهيئة مشفر وآمن ولا تطلب الإدارة كلمات المرور إطلاقاً.
            </p>
          </Card>

        </Col>
      </Row>
      ) : (
        <Row className="gy-4">
          {/* Add project form */}
          <Col lg={4} md={12}>
            <Card className="border-0 shadow-sm card-custom rounded-4 p-4 mb-4" style={{ background: 'var(--card-bg)' }}>
              <h5 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                <FaPlus size={16} />
                <span>اقتراح مشروع / معلم جديد</span>
              </h5>

              <Form onSubmit={handleAddProject}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">اسم المشروع / المعلم *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="مثال: إنشاء حديقة عامة بالفرع"
                    value={mapForm.name}
                    onChange={e => setMapForm({...mapForm, name: e.target.value})}
                    required
                  />
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">تصنيف المعلم *</Form.Label>
                      <Form.Select
                        value={mapForm.category}
                        onChange={e => setMapForm({...mapForm, category: e.target.value})}
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-2 mb-3">
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">خط العرض (Lat) *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="انقر على الخريطة"
                        value={mapForm.latitude}
                        disabled
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">خط الطول (Lng) *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="انقر على الخريطة"
                        value={mapForm.longitude}
                        disabled
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small">تفاصيل المشروع / الوصف</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="أدخل وصفاً كافياً وتفاصيل للمشروع المقترح..."
                    value={mapForm.details}
                    onChange={e => setMapForm({...mapForm, details: e.target.value})}
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 fw-bold py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2">
                  <FaPlus />
                  <span>إرسال الاقتراح للمسؤول</span>
                </Button>
              </Form>
            </Card>

            {/* List of employee's own submitted projects */}
            <Card className="border-0 shadow-sm card-custom rounded-4 p-4" style={{ background: 'var(--card-bg)' }}>
              <h6 className="fw-bold mb-3 text-dark">مشاريعك المرسلة وبانتظار الموافقة:</h6>
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {locations.filter(l => l.created_by === loggedInUser.id).length === 0 ? (
                  <p className="text-muted small text-center my-2">لم تقم بإرسال أي مشاريع بعد.</p>
                ) : (
                  locations.filter(l => l.created_by === loggedInUser.id).map(loc => (
                    <div 
                      key={loc.id}
                      style={{
                        background: 'var(--body-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{loc.name_ar || loc.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{loc.category}</div>
                      </div>
                      <Badge bg={loc.is_approved ? "success" : "warning"} text={loc.is_approved ? "white" : "dark"}>
                        {loc.is_approved ? "معتمد" : "قيد الانتظار"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </Col>

          {/* Interactive Map */}
          <Col lg={8} md={12}>
            <Card className="border-0 shadow-sm card-custom rounded-4 p-2 overflow-hidden" style={{ height: '560px' }}>
              <div className="bg-light p-2.5 mb-2 rounded text-center small text-muted" style={{ direction: 'rtl' }}>
                💡 <strong>توجيه:</strong> انقر على أي مكان بالخريطة لتحديد إحداثيات المشروع تلقائياً في النموذج على اليمين.
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={[32.8872, 13.1932]} zoom={6} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickSelector onSelectCoords={handleSelectCoords} />

                  {/* Temporary marker */}
                  {mapForm.latitude && mapForm.longitude && (
                    <Marker position={[Number(mapForm.latitude), Number(mapForm.longitude)]}>
                      <Popup>الموقع المختار للمشروع</Popup>
                    </Marker>
                  )}

                  {/* Approved and own pending projects markers */}
                  {locations.map((loc) => {
                    // Only show approved locations OR employee's own unapproved locations
                    if (!loc.is_approved && loc.created_by !== loggedInUser.id) return null;
                    if (!loc.latitude || !loc.longitude) return null;

                    return (
                      <Marker 
                        key={loc.id} 
                        position={[Number(loc.latitude), Number(loc.longitude)]}
                        icon={loc.is_approved ? DefaultIcon : pendingIcon}
                      >
                        <Popup>
                          <div className="text-center" style={{ fontFamily: 'Cairo', direction: 'rtl', textAlign: 'right' }}>
                            <Badge bg={loc.is_approved ? "primary" : "warning"} text={loc.is_approved ? "white" : "dark"} className="mb-2">
                              {loc.category} {!loc.is_approved && '(قيد الانتظار)'}
                            </Badge>
                            <h6 className="fw-bold mb-1">{loc.name_ar || loc.name}</h6>
                            <p className="text-muted small m-0">{loc.details_ar || loc.details}</p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Boundary Polygons with interactive={false} */}
                  {kmlFeatures.map((feat) => {
                    let coords;
                    try {
                      coords = JSON.parse(feat.coordinates);
                    } catch (e) {
                      console.error("Invalid coordinates JSON:", feat.coordinates, e);
                      return null;
                    }
                    if (!coords) return null;
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
      )}

      {/* Internal Post Details & Comments Modal */}
      <ModernModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedPost?.title || selectedPost?.title_ar || selectedPost?.title_en || "تفاصيل التعميم"}
        type="primary"
        size="lg"
      >
        {selectedPost && (
          <div>
            {/* Top metadata */}
            <div className="d-flex align-items-center gap-3 mb-3 flex-wrap pb-3 border-bottom">
              {getCategoryBadge(selectedPost.category)}
              <span className="text-muted small d-flex align-items-center gap-1.5">
                <FaCalendarAlt />
                تاريخ النشر: {selectedPost.date}
              </span>
              <span className="text-muted small d-flex align-items-center gap-1.5">
                <FaUser />
                الناشر: إدارة الهيئة
              </span>
            </div>

            {/* Post Title inside Modal Body */}
            <h3 className="fw-extrabold mb-4 text-dark" style={{ color: 'var(--text)', fontFamily: 'Cairo, sans-serif', fontSize: '1.4rem' }}>
              {selectedPost.title || selectedPost.title_ar || selectedPost.title_en}
            </h3>

            {/* Post Content */}
            <div 
              style={{ 
                fontSize: '1rem', 
                lineHeight: 1.85, 
                color: 'var(--text)',
                marginBottom: '40px' 
              }}
              dangerouslySetInnerHTML={{ __html: selectedPost.content || selectedPost.content_ar || selectedPost.content_en || selectedPost.excerpt || selectedPost.excerpt_ar || '' }}
            />

            {/* Comments Section */}
            <div className="border-top pt-4">
              <h6 className="fw-extrabold text-primary mb-3 d-flex align-items-center gap-2">
                <FaComments />
                <span>التعليقات والمناقشات ({comments.length})</span>
              </h6>

              {/* Comments list */}
              <div className="d-flex flex-column gap-3 mb-4" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {comments.length === 0 ? (
                  <p className="text-muted small text-center my-3">لا توجد تعليقات بعد. كن أول من يعلّق!</p>
                ) : (
                  comments.map((comment) => (
                    <div 
                      key={comment.id}
                      style={{
                        background: 'rgba(var(--card-bg-rgb), 0.6)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '14px 18px'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{comment.author_name}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{comment.date}</span>
                      </div>
                      <p className="text-muted mb-0 small" style={{ lineHeight: 1.5 }}>
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <Form onSubmit={handleAddComment}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-secondary">إضافة تعليق أو استفسار</Form.Label>
                  <InputGroup>
                    <Form.Control
                      placeholder="اكتب تعليقك هنا..."
                      value={newComment.content}
                      onChange={e => setNewComment({ ...newComment, content: e.target.value })}
                      required
                    />
                    <Button variant="primary" type="submit" className="fw-bold">إرسال تعليق</Button>
                  </InputGroup>
                </Form.Group>
              </Form>

            </div>
          </div>
        )}
      </ModernModal>

      {/* Gallery Modal */}
      <ModernModal 
        show={showGalleryModal} 
        onClose={() => setShowGalleryModal(false)}
        title={activeGalleryNews?.title || 'معرض الصور'}
        type="primary"
        size="lg"
      >
        {activeGalleryNews && activeGalleryNews.images && (
          <div>
            <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden' }}>
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentImageIndex}
                  src={activeGalleryNews.images[currentImageIndex]} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </AnimatePresence>
              
              {activeGalleryNews.images.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? activeGalleryNews.images.length - 1 : prev - 1)}
                    style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
                  >
                    <FaChevronLeft />
                  </button>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => prev === activeGalleryNews.images.length - 1 ? 0 : prev + 1)}
                    style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
            </div>
            <div className="d-flex gap-2 mt-3 overflow-auto pb-2">
              {activeGalleryNews.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  style={{ width: 80, height: 60, flexShrink: 0, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: currentImageIndex === idx ? '2px solid var(--primary)' : '2px solid transparent', opacity: currentImageIndex === idx ? 1 : 0.6 }}
                >
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </ModernModal>

      {/* Map Protection KML Modal */}
      <ModernModal 
        show={showMapModal} 
        onClose={() => setShowMapModal(false)}
        title={activeMapNews?.title || 'الخريطة التفاعلية'}
        type="primary"
        size="lg"
      >
        {activeMapNews && activeMapNews.kml_data && (
          <div 
            className="kml-map-container"
            onContextMenu={(e) => { e.preventDefault(); showResult('عذراً، هذا المخطط محمي ولا يمكن حفظه.', 'warning'); }}
            style={{ 
              position: 'relative', height: '450px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)',
              filter: isMapBlurred ? 'blur(15px)' : 'blur(0px)',
              transition: 'filter 0.2s ease-in-out'
            }}
          >
            <MapContainer center={[32.8872, 13.1932]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <GeoJSON data={parseKmlToGeoJson(activeMapNews.kml_data)} style={() => ({ color: 'red', weight: 4, opacity: 0.8 })} />
            </MapContainer>
            
            {/* Watermark overlay */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', zIndex: 10,
              background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 10px)',
            }}>
              <div style={{
                transform: 'rotate(-30deg)',
                color: 'rgba(0,0,0,0.1)',
                fontSize: '4rem',
                fontWeight: 900,
                userSelect: 'none',
                fontFamily: 'Cairo, sans-serif'
              }}>
                سري للغاية - للعرض فقط
              </div>
            </div>
          </div>
        )}
        <div className="text-muted text-center mt-3 small" style={{ direction: 'rtl' }}>
          💡 <span className="text-danger fw-bold">تنويه أمني:</span> هذه البيانات محمية ولا يسمح بتحميل ملف المخطط KML أو مشاركته. تم تطبيق تقنيات لمنع النسخ أو التقاط الشاشة للحفاظ على سرية المشاريع والمخططات.
        </div>
      </ModernModal>

      {/* Smart Document Builder Modal */}
      <ModernModal 
        show={showDocBuilder} 
        onClose={() => {
          setShowDocBuilder(false);
          setEditingDocument(null);
          setNewDocTitle('');
          setNewDocFieldsStr('');
        }}
        title={editingDocument ? "تعديل نموذج مستند" : "إنشاء نموذج مستند ذكي"}
        type="primary"
      >
        <div style={{ direction: 'rtl', textAlign: 'right' }}>
          <p className="text-muted small mb-4">أدخل اسم المستند والحقول المطلوبة، وسيقوم النظام بتصميم النموذج تلقائياً.</p>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-dark">اسم المستند</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="مثال: نموذج طلب إجازة" 
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold text-dark">الحقول المطلوبة (مفصول بينها بفاصلة)</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3}
              placeholder="مثال: اسم الموظف, تاريخ الإجازة, سبب المغادرة" 
              value={newDocFieldsStr}
              onChange={(e) => setNewDocFieldsStr(e.target.value)}
            />
          </Form.Group>
          <PrimaryButton onClick={handleSaveDocTemplate} style={{ width: '100%' }}>
            {editingDocument ? "حفظ التعديلات" : "إنشاء المستند واعتماده"}
          </PrimaryButton>
        </div>
      </ModernModal>

      {/* Smart Document Fill & Print Modal */}
      <ModernModal 
        show={showDocFill} 
        onClose={() => setShowDocFill(false)}
        title={activeDocument?.title || 'تعبئة المستند'}
        type="primary"
        size="lg"
      >
        {activeDocument && (
          <div style={{ direction: 'rtl', textAlign: 'right' }}>
            <div className="printable-form p-4 bg-white rounded-4 border" style={{ color: '#000' }}>
              <div className="text-center mb-5 pb-3 border-bottom">
                <h4 className="fw-bold" style={{ color: '#003087' }}>الجمهورية الليبية</h4>
                <h5 className="fw-bold mb-4 text-dark">الهيئة الوطنية للتخطيط العمراني</h5>
                <h3 className="fw-extrabold text-decoration-underline mt-4 text-dark">{activeDocument.title}</h3>
              </div>
              
              <Row className="gy-4">
                {JSON.parse(activeDocument.fields).map((field, idx) => (
                  <Col md={field.type === 'textarea' ? 12 : 6} key={idx}>
                    <Form.Group>
                      <Form.Label className="fw-bold text-dark">{field.label}</Form.Label>
                      {field.type === 'textarea' ? (
                        <Form.Control 
                          as="textarea" 
                          rows={4} 
                          className="bg-light border-1 text-dark"
                          value={docFormData[field.name] || ''}
                          onChange={(e) => setDocFormData({...docFormData, [field.name]: e.target.value})}
                        />
                      ) : (
                        <Form.Control 
                          type={field.type} 
                          className="bg-light border-1 text-dark"
                          value={docFormData[field.name] || ''}
                          onChange={(e) => setDocFormData({...docFormData, [field.name]: e.target.value})}
                        />
                      )}
                    </Form.Group>
                  </Col>
                ))}
              </Row>
              
              <div className="mt-5 pt-5 d-flex justify-content-between text-dark">
                <div className="text-center">
                  <div className="fw-bold mb-4">توقيع الموظف</div>
                  <div>..............................</div>
                </div>
                <div className="text-center">
                  <div className="fw-bold mb-4">توقيع المسؤول المباشر</div>
                  <div>..............................</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 d-flex justify-content-end gap-2 no-print">
              <Button variant="secondary" className="px-4" onClick={() => setShowDocFill(false)}>إغلاق</Button>
              <PrimaryButton onClick={handlePrintDocument} className="d-flex align-items-center gap-2">
                <FaPrint /> طباعة أو حفظ كـ PDF
              </PrimaryButton>
            </div>
          </div>
        )}
      </ModernModal>

      {/* Security CSS */}
      <style>{`
        /* Blur map when page loses focus to deter screenshotting tools */
        .kml-map-container {
          filter: blur(0px);
          transition: filter 0.2s;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-form, .printable-form * {
            visibility: visible;
          }
          .printable-form {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .kml-map-container {
            display: none !important;
          }
          .modal-content {
            border: none !important;
            box-shadow: none !important;
          }
          .modal-header {
            display: none !important;
          }
        }
      `}</style>

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

export default InternalNews;
