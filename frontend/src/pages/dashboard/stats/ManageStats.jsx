import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form, Card, Badge } from 'react-bootstrap';
import { FaPlusCircle, FaEdit, FaTrashAlt, FaChartLine, FaRobot, FaMagic, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ModernModal from '../../../components/ModernModal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';

const ManageStats = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentStat, setCurrentStat] = useState({ id: null, label_ar: '', label_en: '', value: '', suffix: '', icon: 'FaChartLine' });
  const [statToDelete, setStatToDelete] = useState(null);
  
  // AI Generation Simulation State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [generatedIconUrl, setGeneratedIconUrl] = useState('');

  const loadStats = () => {
    api.getStatistics()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        setStats(arr);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setStats([]);
      });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleShowAdd = () => {
    setCurrentStat({ id: null, label_ar: '', label_en: '', value: '', suffix: '', icon: 'FaChartLine' });
    setGeneratedIconUrl('');
    setShowModal(true);
  };

  const handleShowEdit = (stat) => {
    setCurrentStat(stat);
    setGeneratedIconUrl(stat.icon.startsWith('http') ? stat.icon : '');
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...currentStat,
      value: Number(currentStat.value),
      icon: generatedIconUrl || currentStat.icon
    };
    
    const action = currentStat.id ? api.updateStatistic(currentStat.id, dataToSave) : api.createStatistic(dataToSave);
    action
      .then(() => {
        loadStats();
        setShowModal(false);
        showToast(currentStat.id ? 'تم تعديل الإحصائية بنجاح! ✨' : 'تم إضافة الإحصائية بنجاح! ✨', 'success');
      })
      .catch(err => {
        console.error("Error saving stat:", err);
        showToast(err.message || 'حدث خطأ أثناء حفظ الإحصائية', 'danger');
      });
  };

  const handleShowDelete = (stat) => {
    setStatToDelete(stat);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (statToDelete) {
      api.deleteStatistic(statToDelete.id)
        .then(() => {
          loadStats();
          setShowDeleteModal(false);
          setStatToDelete(null);
          showToast('تم حذف الإحصائية بنجاح! ✨', 'success');
        })
        .catch(err => {
          console.error("Error deleting stat:", err);
          showToast(err.message || 'حدث خطأ أثناء حذف الإحصائية', 'danger');
        });
    }
  };

  // AI Generation Simulation
  const handleAiGenerate = async () => {
    if (!currentStat.label_ar && !currentStat.label_en) {
      showToast('يرجى كتابة تصنيف أو عنوان الإحصائية أولاً ليقوم الذكاء الاصطناعي بتحليله.', 'warning');
      return;
    }
    
    setAiGenerating(true);
    setAiStep(1); // Connecting
    await new Promise(r => setTimeout(r, 1000));
    
    setAiStep(2); // Analyzing text
    await new Promise(r => setTimeout(r, 1200));
    
    setAiStep(3); // Generating vector art
    await new Promise(r => setTimeout(r, 1400));
    
    setAiStep(4); // Optimizing assets
    await new Promise(r => setTimeout(r, 1000));

    // Determine illustration based on classification keywords
    const text = (currentStat.label_ar + ' ' + currentStat.label_en).toLowerCase();
    let url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'; // Default abstract illustration
    
    if (text.includes('مخطط') || text.includes('خريطة') || text.includes('أرض') || text.includes('plan') || text.includes('map')) {
      url = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400&auto=format&fit=crop'; // Maps/geometry
    } else if (text.includes('كادر') || text.includes('موظف') || text.includes('مهندس') || text.includes('بشر') || text.includes('staff') || text.includes('team') || text.includes('engineer')) {
      url = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400&auto=format&fit=crop'; // People/team working
    } else if (text.includes('فرع') || text.includes('مبنى') || text.includes('مقر') || text.includes('إدارة') || text.includes('branch') || text.includes('building') || text.includes('office')) {
      url = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop'; // Building architecture
    } else if (text.includes('عام') || text.includes('سنة') || text.includes('عطاء') || text.includes('زمن') || text.includes('year') || text.includes('experience') || text.includes('time')) {
      url = 'https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=400&auto=format&fit=crop'; // Sand clock / time theme
    } else if (text.includes('شريك') || text.includes('تعاون') || text.includes('دول') || text.includes('partner') || text.includes('international')) {
      url = 'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?q=80&w=400&auto=format&fit=crop'; // Global handshake/cooperation
    } else if (text.includes('مشروع') || text.includes('بيانات') || text.includes('رسم') || text.includes('project') || text.includes('chart') || text.includes('data')) {
      url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop'; // Analytical / drawing blueprints
    }

    setGeneratedIconUrl(url);
    setAiStep(5); // Complete
    await new Promise(r => setTimeout(r, 800));
    setAiGenerating(false);
  };

  const getStepText = () => {
    switch (aiStep) {
      case 1: return 'جاري الاتصال بنموذج التوليد الفني UPA-AI DALL-E...';
      case 2: return `جاري تحليل النص والتصنيف: "${currentStat.label_ar || currentStat.label_en}"...`;
      case 3: return 'جاري تصميم الصورة الرمزية ثلاثية الأبعاد بأسلوب Glassmorphism...';
      case 4: return 'تحسين الدقة والتوافقية مع الأبعاد ونظام الألوان...';
      case 5: return 'تم التوليد بنجاح!';
      default: return '';
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Title Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3" style={{ direction: 'rtl', textAlign: 'right' }}>
        <div>
          <h3 className="fw-bold text-primary mb-1 d-flex align-items-center gap-2">
            <FaChartLine />
            <span>إدارة إحصائيات الصفحة الرئيسية</span>
          </h3>
          <p className="text-muted mb-0">يمكنك تعديل وزيادة الإحصائيات التي تظهر للزوار في واجهة الموقع الرسمي للهيئة.</p>
        </div>
        <PrimaryButton 
          onClick={handleShowAdd}
          icon={<FaPlusCircle />}
        >
          إضافة إحصائية جديدة
        </PrimaryButton>
      </div>

      {/* Grid of existing stats */}
      <Row className="g-4 mb-4" style={{ direction: 'rtl' }}>
        {stats.map((stat) => (
          <Col key={stat.id} xl={3} md={6}>
            <Card className="card-custom border-0 h-100 shadow-sm" style={{ textAlign: 'right' }}>
              <Card.Body className="d-flex flex-column justify-content-between p-4">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div style={{
                      width: 54, height: 54, borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(0,48,135,0.08) 0%, rgba(0,168,232,0.08) 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {stat.icon.startsWith('http') ? (
                        <img src={stat.icon} alt={stat.label_ar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>📊</span>
                      )}
                    </div>
                    {stat.icon.startsWith('http') && (
                      <Badge bg="success" style={{ fontSize: '0.72rem', borderRadius: 99, padding: '5px 10px' }}>
                        <FaRobot className="me-1" /> رمزية ذكية
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '2rem' }}>
                    {stat.value}{stat.suffix}
                  </h3>
                  <div className="text-muted fw-bold mb-2" style={{ fontSize: '0.92rem' }}>
                    {stat.label_ar}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                    {stat.label_en || 'لا توجد ترجمة إنجليزية'}
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => handleShowEdit(stat)}
                    style={{ flex: 1, borderRadius: 8, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <FaEdit /> تعديل
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleShowDelete(stat)}
                    style={{ flex: 1, borderRadius: 8, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <FaTrashAlt /> حذف
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Table view */}
      <Card className="card-custom border-0 shadow-sm overflow-hidden" style={{ direction: 'rtl', textAlign: 'right' }}>
        <Card.Header className="bg-transparent py-3 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <h5 className="fw-bold m-0 text-dark">جدول إحصائيات الهيئة</h5>
        </Card.Header>
        <Table responsive hover className="table-custom mb-0">
          <thead>
            <tr>
              <th className="py-3 px-4">الصورة/الأيقونة</th>
              <th className="py-3">العنوان بالعربية</th>
              <th className="py-3">العنوان بالإنجليزية</th>
              <th className="py-3">القيمة الرقمية</th>
              <th className="py-3">اللاحقة (suffix)</th>
              <th className="py-3 text-center px-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.id} style={{ verticalAlign: 'middle' }}>
                <td className="py-3 px-4">
                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    background: 'rgba(0,48,135,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {stat.icon.startsWith('http') ? (
                      <img src={stat.icon} alt={stat.label_ar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>📊</span>
                    )}
                  </div>
                </td>
                <td className="fw-bold py-3 text-dark">{stat.label_ar}</td>
                <td className="text-muted py-3">{stat.label_en || '-'}</td>
                <td className="fw-bold py-3 text-dark">{stat.value}</td>
                <td className="text-secondary py-3">{stat.suffix || 'لا يوجد'}</td>
                <td className="py-3 text-center px-4">
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <Button variant="link" className="p-1 text-primary" onClick={() => handleShowEdit(stat)}>
                      <FaEdit size={18} />
                    </Button>
                    <Button variant="link" className="p-1 text-danger" onClick={() => handleShowDelete(stat)}>
                      <FaTrashAlt size={17} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Add / Edit Modal */}
      <ModernModal 
        show={showModal} 
        onClose={() => !aiGenerating && setShowModal(false)} 
        title={currentStat.id ? 'تعديل الإحصائية' : 'إضافة إحصائية جديدة'}
        type="primary"
        size="lg"
      >
        <Form onSubmit={handleSave}>
          <div className="position-relative">
            {/* AI Generator Overlay */}
            {aiGenerating && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                zIndex: 10, borderRadius: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '30px', textAlign: 'center'
              }}>
                <div style={{
                  position: 'relative', width: 80, height: 80, marginBottom: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    border: '4px solid rgba(0,48,135,0.1)', borderTopColor: 'var(--primary)',
                    borderRadius: '50%', animation: 'spin 1.2s linear infinite'
                  }} />
                  <FaRobot size={32} className="text-primary" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
                <h5 className="fw-bold text-dark mb-2">توليد الذكاء الاصطناعي نشط</h5>
                <p className="text-primary fw-medium" style={{ fontSize: '0.95rem' }}>{getStepText()}</p>
                <div style={{ width: '80%', maxWidth: '300px', height: '6px', background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginTop: 10 }}>
                  <div style={{
                    width: `${aiStep * 20}%`, height: '100%',
                    background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            )}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark">اسم الإحصائية / التصنيف (بالعربية) *</Form.Label>
                  <Form.Control
                    type="text" required
                    placeholder="مثال: كادراً متخصصاً"
                    value={currentStat.label_ar}
                    onChange={(e) => setCurrentStat({ ...currentStat, label_ar: e.target.value })}
                    className="form-control-custom"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark">اسم الإحصائية / التصنيف (بالإنجليزية)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Example: Specialized Cadres"
                    value={currentStat.label_en}
                    onChange={(e) => setCurrentStat({ ...currentStat, label_en: e.target.value })}
                    className="form-control-custom"
                    style={{ textAlign: 'left', direction: 'ltr' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark">القيمة الرقمية الإجمالية *</Form.Label>
                  <Form.Control
                    type="number" required min="0"
                    placeholder="مثال: 500"
                    value={currentStat.value}
                    onChange={(e) => setCurrentStat({ ...currentStat, value: e.target.value })}
                    className="form-control-custom"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark">اللاحقة (مثال: + أو ٪)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="مثال: +"
                    value={currentStat.suffix}
                    onChange={(e) => setCurrentStat({ ...currentStat, suffix: e.target.value })}
                    className="form-control-custom"
                  />
                </Form.Group>
              </Col>

              {/* AI Symbol Generation Area */}
              <Col md={12}>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(0,48,135,0.03) 0%, rgba(0,168,232,0.03) 100%)',
                  border: '1px dashed var(--border)',
                  borderRadius: 16,
                  padding: '20px'
                }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{
                        width: 76, height: 76, borderRadius: 14,
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0
                      }}>
                        {generatedIconUrl ? (
                          <img src={generatedIconUrl} alt="AI Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.8rem' }}>🎨</span>
                        )}
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-1">
                          الصورة الرمزية الذكية للإحصائية
                        </h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
                          {generatedIconUrl ? 'تم إنشاء رمز تعبيري متطور بالذكاء الاصطناعي.' : 'يقوم الذكاء الاصطناعي بتوليد صورة فنية مسطحة تماشي تصنيف الإحصائية.'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline-primary"
                      onClick={handleAiGenerate}
                      disabled={aiGenerating}
                      style={{
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 18px',
                        borderWidth: 2
                      }}
                    >
                      <FaMagic /> توليد بالذكاء الاصطناعي
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <PrimaryButton variant="secondary" onClick={() => setShowModal(false)} disabled={aiGenerating}>
              إلغاء
            </PrimaryButton>
            <PrimaryButton type="submit" disabled={aiGenerating}>
              حفظ التعديلات
            </PrimaryButton>
          </div>
        </Form>
      </ModernModal>

      {/* Beautiful modern confirmation modal */}
      <ModernModal 
        show={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="تأكيد عملية الحذف"
        type="primary"
        size="sm"
      >
        <div className="text-center">
          <p className="text-muted mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
            هل أنت متأكد من رغبتك في حذف الإحصائية <span className="fw-bold text-danger">"{statToDelete?.label_ar}"</span>؟
            سيتم إزالتها من شاشات العرض بالصفحة الرئيسية للموقع الرسمي على الفور.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <PrimaryButton variant="secondary" onClick={() => setShowDeleteModal(false)}>
              تراجع وإلغاء
            </PrimaryButton>
            <PrimaryButton variant="danger" onClick={handleDeleteConfirm}>
              تأكيد الحذف النهائي
            </PrimaryButton>
          </div>
        </div>
      </ModernModal>

      {/* Animation & spin style helper */}
      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </Container>
  );
};

export default ManageStats;
