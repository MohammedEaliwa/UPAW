import { useState } from 'react';
import { Card, Row, Col, Button, Form, Badge } from 'react-bootstrap';
import { motion } from 'motion/react';
import { 
  FaUser, FaEnvelope, FaPhone, FaBriefcase, FaIdCard, FaLock, 
  FaInstagram, FaLinkedin, FaTwitter, FaFacebook, 
  FaEdit, FaSignOutAlt, FaShieldAlt, FaIdBadge
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';
import ModernModal from '../../../components/ModernModal';

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, updateUser, logout } = useAuth();

  const loggedInUser = user || {
    id: 2,
    username: 'User_DataEntry',
    email: 'data_entry@example.com',
    phone: '091-0123091',
    job_number: 'DataEntry',
    password: 'password123',
    role_id: 2,
    role: { name: 'مدخل بيانات', slug: 'data_entry' },
    is_active: true
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  const [editForm, setEditForm] = useState({
    username: loggedInUser.username,
    email: loggedInUser.email,
    phone: loggedInUser.phone,
    job_number: loggedInUser.job_number || loggedInUser.username,
  });

  const handleOpenEditModal = () => {
    setEditForm({
      username: loggedInUser.username,
      email: loggedInUser.email,
      phone: loggedInUser.phone,
      job_number: loggedInUser.job_number || loggedInUser.username,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...loggedInUser,
      username: editForm.username,
      email: editForm.email,
      phone: editForm.phone,
      job_number: editForm.job_number
    };
    api.updateUser(loggedInUser.id, updated)
      .then(() => {
        updateUser(updated);
        setLocalUser(updated);
        setShowEditModal(false);
        showToast('تم تحديث البيانات الشخصية بنجاح! ✨', 'success');
      })
      .catch(() => {
        showToast('حدث خطأ في تحديث البيانات', 'danger');
      });
  };

  const handlePwSubmit = (e) => {
    e.preventDefault();
    if (pwForm.oldPassword !== loggedInUser.password) {
      showToast('كلمة المرور القديمة غير صحيحة!', 'danger');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('كلمتا المرور الجديدتان غير متطابقتين!', 'danger');
      return;
    }
    const updated = { ...loggedInUser, password: pwForm.newPassword };
    api.updateUser(loggedInUser.id, updated)
      .then(() => {
        updateUser(updated);
        setLocalUser(updated);
        setShowPwModal(false);
        setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        showToast('تم تغيير كلمة المرور بنجاح! ✨', 'success');
      })
      .catch(() => {
        showToast('حدث خطأ في تغيير كلمة المرور', 'danger');
      });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-5" style={{ direction: 'rtl', textAlign: 'right' }}>

      <Row className="gy-4">
        {/* Left Section: Personal details & Action buttons */}
        <Col lg={8} md={12} className="order-2 order-lg-1">
          <Card className="border-0 shadow-sm rounded-5 p-4 mb-4" style={{ backgroundColor: '#ffffff' }}>
            <Card.Body className="p-0">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <FaIdBadge className="text-secondary" />
                  <span>البيانات الشخصية</span>
                </h5>
              </div>

              <Row className="g-4">
                {/* Full Name */}
                <Col md={6}>
                  <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                        <FaUser size={18} />
                      </div>
                      <div>
                        <div className="small text-muted mb-0.5">الاسم الكامل</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>{loggedInUser.username}</div>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Username */}
                <Col md={6}>
                  <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                        <FaIdCard size={18} />
                      </div>
                      <div>
                        <div className="small text-muted mb-0.5">اسم المستخدم</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>{loggedInUser.job_number || loggedInUser.username}</div>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Role / Job */}
                <Col md={6}>
                  <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                        <FaBriefcase size={18} />
                      </div>
                      <div>
                        <div className="small text-muted mb-0.5">المنصب</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>{loggedInUser.role?.name || 'موظف'}</div>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Email Address */}
                <Col md={6}>
                  <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <FaEnvelope size={18} />
                      </div>
                      <div>
                        <div className="small text-muted mb-0.5">البريد الإلكتروني</div>
                        <div className="fw-bold text-dark text-truncate" style={{ fontSize: '1.05rem', maxWidth: '220px' }}>{loggedInUser.email}</div>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Phone Number */}
                <Col md={12}>
                  <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                        <FaPhone size={18} />
                      </div>
                      <div>
                        <div className="small text-muted mb-0.5">رقم الهاتف</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>{loggedInUser.phone || 'غير مسجل'}</div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Social links */}
              <div className="d-flex justify-content-center gap-3 mt-4 pt-3 border-top">
                <a href="#" className="text-secondary" style={{ fontSize: '1.3rem' }}><FaInstagram /></a>
                <a href="#" className="text-secondary" style={{ fontSize: '1.3rem' }}><FaLinkedin /></a>
                <a href="#" className="text-secondary" style={{ fontSize: '1.3rem' }}><FaTwitter /></a>
                <a href="#" className="text-secondary" style={{ fontSize: '1.3rem' }}><FaFacebook /></a>
              </div>
            </Card.Body>
          </Card>

          {/* Action Row */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {/* Account security card on the left */}
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: '20px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,48,135,0.05)',
              flexGrow: 1
            }}>
              <FaShieldAlt className="text-success" size={26} />
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.88rem' }}>أمان الحساب</div>
                <div style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 600 }}>الأمان في أعلى مستوياته</div>
              </div>
            </div>

            {/* Buttons */}
            <Button 
              variant="info" 
              className="text-white px-4 py-2.5 rounded-pill shadow-sm fw-bold d-flex align-items-center gap-2"
              onClick={handleOpenEditModal}
              style={{ background: '#0d9488', border: 'none' }}
            >
              <FaEdit />
              تعديل الحساب
            </Button>

            <Button 
              variant="outline-secondary" 
              className="px-4 py-2.5 rounded-pill bg-white fw-bold d-flex align-items-center gap-2"
              onClick={() => setShowPwModal(true)}
            >
              <FaLock />
              تغيير كلمة المرور
            </Button>

            <Button 
              variant="danger" 
              className="px-4 py-2.5 rounded-pill shadow-sm fw-bold d-flex align-items-center gap-2"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              خروج
            </Button>
          </div>
        </Col>

        {/* Right Section: Profile avatar & Activity summary */}
        <Col lg={4} md={12} className="order-1 order-lg-2">
          {/* Profile Card */}
          <Card className="border-0 shadow-sm rounded-5 p-4 mb-4 text-center" style={{ backgroundColor: '#ffffff' }}>
            <Card.Body className="p-0">
              <div className="text-muted small mb-3">أهلاً بك مجدداً</div>
              
              <div 
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '30%', 
                  background: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)',
                  margin: '0 auto 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 20px rgba(13,148,136,0.2)'
                }}
              >
                {(loggedInUser.username || '').charAt(0).toUpperCase()}
              </div>

              <h4 className="fw-extrabold text-dark mb-3">{loggedInUser.username}</h4>
              
              <div className="d-flex justify-content-center gap-2">
                <Badge style={{ background: '#0d9488', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
                  {loggedInUser.role?.name || 'موظف'}
                </Badge>
                <Badge bg="success" className="d-flex align-items-center gap-1.5" style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--card-bg)', display: 'inline-block' }}></span>
                  متصل الآن
                </Badge>
              </div>
            </Card.Body>
          </Card>

          {/* Activity teal block */}
          <div style={{
            background: 'linear-gradient(150deg, #115e59 0%, #0d9488 50%, #14b8a6 100%)',
            borderRadius: '24px',
            color: '#ffffff',
            padding: '30px 24px',
            boxShadow: '0 10px 30px rgba(13,148,136,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h5 className="fw-bold mb-4" style={{ fontSize: '1rem', opacity: 0.95 }}>النشاط</h5>
            
            <div className="text-center my-4 py-3">
              <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>100%</div>
              <div className="fw-bold mt-2" style={{ fontSize: '1.25rem' }}>الحساب موثق</div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px', fontSize: '0.85rem' }}>
              <div className="d-flex justify-content-between mb-2" style={{ opacity: 0.85 }}>
                <span>تاريخ الانضمام:</span>
                <span className="fw-bold">غير متوفر</span>
              </div>
              <div className="d-flex justify-content-between" style={{ opacity: 0.85 }}>
                <span>آخر تسجيل دخول:</span>
                <span className="fw-bold">6 يونيو، 07:32 ص</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <ModernModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="تعديل البيانات الشخصية"
        type="primary"
        size="md"
      >
        <Form onSubmit={handleEditSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">الاسم الكامل</Form.Label>
            <Form.Control
              type="text"
              value={editForm.username}
              onChange={e => setEditForm({...editForm, username: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">اسم المستخدم</Form.Label>
            <Form.Control
              type="text"
              value={editForm.job_number}
              onChange={e => setEditForm({...editForm, job_number: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">البريد الإلكتروني</Form.Label>
            <Form.Control
              type="email"
              value={editForm.email}
              onChange={e => setEditForm({...editForm, email: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">رقم الهاتف</Form.Label>
            <Form.Control
              type="text"
              value={editForm.phone}
              onChange={e => setEditForm({...editForm, phone: e.target.value})}
              required
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowEditModal(false)}>إلغاء</Button>
            <Button variant="primary" className="rounded-pill px-4" type="submit">حفظ التغييرات</Button>
          </div>
        </Form>
      </ModernModal>

      {/* Change Password Modal */}
      <ModernModal
        show={showPwModal}
        onClose={() => setShowPwModal(false)}
        title="تغيير كلمة المرور"
        type="primary"
        size="md"
      >
        <Form onSubmit={handlePwSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">كلمة المرور الحالية</Form.Label>
            <Form.Control
              type="password"
              placeholder="أدخل كلمة المرور الحالية"
              value={pwForm.oldPassword}
              onChange={e => setPwForm({...pwForm, oldPassword: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">كلمة المرور الجديدة</Form.Label>
            <Form.Control
              type="password"
              placeholder="أدخل كلمة المرور الجديدة"
              value={pwForm.newPassword}
              onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">تأكيد كلمة المرور الجديدة</Form.Label>
            <Form.Control
              type="password"
              placeholder="أعد إدخال كلمة المرور الجديدة"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
              required
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowPwModal(false)}>إلغاء</Button>
            <Button variant="primary" className="rounded-pill px-4" type="submit">تغيير كلمة المرور</Button>
          </div>
        </Form>
      </ModernModal>
    </motion.div>
  );
};

export default Profile;
