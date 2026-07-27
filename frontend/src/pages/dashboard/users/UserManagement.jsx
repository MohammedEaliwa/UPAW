import { useState } from 'react';
import { Card, Table, Button, Badge, Form } from 'react-bootstrap';
import { FaEdit, FaTrash, FaBan, FaCheckCircle, FaUsersCog, FaUserPlus, FaFileExcel, FaLock } from 'react-icons/fa';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { useEffect } from 'react';
import { api } from '../../../services/api';
import ModernModal from '../../../components/ModernModal';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ToastNotification from '../../../components/ui/ToastNotification';
import { useAuth } from '../../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role?.slug === 'admin';
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    api.getUsers().then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
    api.getRoles().then(d => setRoles(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const branches = [
    'فرع طرابلس', 'فرع بنغازي', 'فرع سبها', 'فرع مصراتة', 'فرع الزاوية',
    'فرع الخمس', 'فرع البيضاء', 'فرع طبرق', 'فرع غريان', 'فرع الجفرة',
    'فرع سرت', 'فرع درنة', 'فرع زوارة', 'فرع الكفرة', 'فرع غات',
    'فرع مرزق', 'فرع نالوت', 'فرع يفرن', 'فرع بني وليد', 'فرع ترهونة',
    'فرع أوباري', 'فرع أجدابيا'
  ];

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    job_number: '',
    email: '',
    phone: '',
    password: '',
    role_id: 3, // Default is "موظف"
    is_active: true,
    branch: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showResult = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };


  const displayedUsers = users.filter(u => {
    if (isAdmin) return true;
    return u.role_id !== 1 && u.role?.slug !== 'admin';
  });

  const displayedRoles = roles.filter(r => {
    if (isAdmin) return true;
    return r.id !== 1 && r.slug !== 'admin';
  });

  const exportToExcel = () => {
    const formattedData = displayedUsers.map(user => ({
      'الرقم الوظيفي': user.job_number,
      'الاسم الرباعي': user.username,
      'البريد الإلكتروني': user.email,
      'رقم الجوال': user.phone,
      'الفرع التابع له': user.branch || 'غير محدد',
      'الصلاحية': roles.find(r => r.id === user.role_id)?.name || 'غير محدد',
      'الحالة': user.is_active ? 'نشط' : 'موقوف'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "تقرير_المستخدمين.xlsx");
  };

  const handleToggleActive = async (user) => {
    if (!user || !user.id) return;
    try {
      const updated = { 
        ...user, 
        is_active: (user.is_active == 1 || user.is_active === true) ? 0 : 1 
      };
      await api.updateUser(user.id, updated);
      showResult('تم تعديل حالة الحساب بنجاح', 'success');
      const d = await api.getUsers();
      setUsers(Array.isArray(d) ? d : []);
    } catch (error) {
      showResult(error.message || 'حدث خطأ أثناء تعديل الحالة', 'danger');
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await api.deleteUser(userToDelete.id);
        showResult('تم حذف المستخدم بنجاح', 'success');
        const d = await api.getUsers();
        setUsers(Array.isArray(d) ? d : []);
        setShowDeleteModal(false);
        setUserToDelete(null);
      } catch (error) {
        showResult(error.message || 'حدث خطأ أثناء الحذف', 'danger');
      }
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editingUser.id, editingUser);
      showResult('تم تعديل بيانات المستخدم بنجاح', 'success');
      const d = await api.getUsers();
      setUsers(Array.isArray(d) ? d : []);
      setShowEditModal(false);
    } catch (error) {
      showResult(error.message || 'حدث خطأ أثناء تعديل البيانات', 'danger');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      showResult('تم إضافة المستخدم بنجاح', 'success');
      const d = await api.getUsers();
      setUsers(Array.isArray(d) ? d : []);
      setShowAddModal(false);
      setNewUser({ username: '', job_number: '', email: '', phone: '', password: '', role_id: 3, is_active: true, branch: '' });
    } catch (error) {
      showResult(error.message || 'حدث خطأ أثناء إضافة المستخدم', 'danger');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 className="fw-bold m-0" style={{ color: 'var(--primary)' }}>
          <FaUsersCog className="ms-2" /> إدارة المستخدمين
        </h3>
        <div className="d-flex gap-2 flex-wrap">
          <Button variant="outline-success" className="rounded-pill d-flex align-items-center gap-2 fw-bold" onClick={exportToExcel}>
            <FaFileExcel size={16} /> تصدير إكسيل
          </Button>
          <PrimaryButton onClick={() => setShowAddModal(true)} icon={<FaUserPlus size={16} />}>
            تسجيل مستخدم جديد
          </PrimaryButton>
          <Badge bg="primary" className="fs-6 py-2 px-3 rounded-pill shadow-sm d-flex align-items-center">
            إجمالي المستخدمين: {displayedUsers.length}
          </Badge>
        </div>
      </div>

      <Card className="border-0 shadow-sm card-custom rounded-4">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle text-center">
              <thead className="bg-light">
                <tr>
                  <th className="py-3">الاسم الرباعي</th>
                  <th className="py-3">الرقم الوظيفي</th>
                  <th className="py-3">الصلاحية</th>
                  <th className="py-3">البيانات الخاصة</th>
                  {isAdmin && <th className="py-3">كلمة المرور</th>}
                  <th className="py-3">الحالة</th>
                  <th className="py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((user) => (
                  <tr key={user.id} className={!user.is_active ? 'opacity-75 bg-light' : ''}>
                    <td className="fw-bold">{user.username}</td>
                    <td><Badge bg="secondary">{user.job_number}</Badge></td>
                    <td>
                      <Badge bg={user.role_id === 1 ? "danger" : user.role_id === 2 ? "warning" : "info"} text="dark">
                        {user.role?.name || 'موظف'}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <div className="small text-muted mb-1"><strong>البريد:</strong> {user.email}</div>
                      <div className="small text-muted mb-1"><strong>الهاتف:</strong> {user.phone}</div>
                      <div className="small text-primary mb-1"><strong>الفرع:</strong> {user.branch || 'غير محدد'}</div>
                    </td>
                    {isAdmin && (
                      <td className="text-center">
                        <div className="small text-danger d-flex align-items-center justify-content-center gap-1">
                          <FaLock size={11} />
                          <span style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{user.password}</span>
                        </div>
                      </td>
                    )}
                    <td>
                      {user.is_active ? (
                        <Badge bg="success" className="p-2"><FaCheckCircle className="ms-1"/> نشط</Badge>
                      ) : (
                        <Badge bg="danger" className="p-2"><FaBan className="ms-1"/> موقوف</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button variant={user.is_active ? "warning" : "success"} size="sm" onClick={() => handleToggleActive(user)} title={user.is_active ? "إيقاف الحساب" : "تفعيل الحساب"}>
                          {user.is_active ? <FaBan /> : <FaCheckCircle />}
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleEditClick(user)}>
                          <FaEdit />
                        </Button>
                        {isAdmin && (
                          <Button variant="danger" size="sm" onClick={() => handleDeleteClick(user)}>
                            <FaTrash />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add User Modal */}
      <ModernModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="تسجيل مستخدم جديد"
        type="primary"
        size="md"
      >
        <Form onSubmit={handleAddUser}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">الاسم الرباعي</Form.Label>
            <Form.Control
              type="text"
              placeholder="أدخل الاسم الرباعي للموظف"
              value={newUser.username}
              onChange={e => setNewUser({...newUser, username: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">الرقم الوظيفي</Form.Label>
            <Form.Control
              type="text"
              placeholder="مثال: UP-1003"
              value={newUser.job_number}
              onChange={e => setNewUser({...newUser, job_number: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">الصلاحية</Form.Label>
            <Form.Select
              value={newUser.role_id}
              onChange={e => setNewUser({...newUser, role_id: Number(e.target.value)})}
              required
            >
              {displayedRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">الفرع التابع له</Form.Label>
            <Form.Select
              value={newUser.branch}
              onChange={e => setNewUser({...newUser, branch: e.target.value})}
              required
            >
              <option value="">اختر الفرع</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">البريد الإلكتروني</Form.Label>
            <Form.Control
              type="email"
              placeholder="example@upa.gov.ly"
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">رقم الهاتف</Form.Label>
            <Form.Control
              type="text"
              placeholder="أدخل رقم الهاتف"
              value={newUser.phone}
              onChange={e => setNewUser({...newUser, phone: e.target.value})}
              required
            />
          </Form.Group>
          {isAdmin && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">كلمة المرور</Form.Label>
            <Form.Control
              type="text"
              placeholder="أدخل كلمة المرور الافتراضية"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              required={isAdmin}
            />
          </Form.Group>
          )}
          <Form.Group className="mb-4">
            <Form.Check
              type="switch"
              id="user-active-switch"
              label="تفعيل الحساب مباشرة"
              checked={newUser.is_active}
              onChange={e => setNewUser({...newUser, is_active: e.target.checked})}
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <PrimaryButton variant="secondary" onClick={() => setShowAddModal(false)}>إلغاء</PrimaryButton>
            <PrimaryButton type="submit">تسجيل الموظف</PrimaryButton>
          </div>
        </Form>
      </ModernModal>

      {/* Edit Modal */}
      <ModernModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="تعديل بيانات المستخدم"
        type="primary"
        size="md"
      >
        {editingUser && (
          <Form onSubmit={handleSaveEdit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">الاسم الرباعي</Form.Label>
              <Form.Control type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">الرقم الوظيفي</Form.Label>
              <Form.Control type="text" value={editingUser.job_number} onChange={e => setEditingUser({...editingUser, job_number: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">الصلاحية</Form.Label>
              <Form.Select
                value={editingUser.role_id}
                onChange={e => setEditingUser({...editingUser, role_id: Number(e.target.value)})}
                required
              >
                {displayedRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">الفرع التابع له</Form.Label>
              <Form.Select
                value={editingUser.branch || ''}
                onChange={e => setEditingUser({...editingUser, branch: e.target.value})}
                required
              >
                <option value="">اختر الفرع</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">البريد الإلكتروني</Form.Label>
              <Form.Control type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">رقم الهاتف</Form.Label>
              <Form.Control type="text" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} required />
            </Form.Group>
            {isAdmin && (
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">كلمة المرور</Form.Label>
              <Form.Control type="text" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
            </Form.Group>
            )}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <PrimaryButton variant="secondary" onClick={() => setShowEditModal(false)}>إلغاء</PrimaryButton>
              <PrimaryButton type="submit">حفظ التعديلات</PrimaryButton>
            </div>
          </Form>
        )}
      </ModernModal>

      {/* Delete Confirmation Modal */}
      <ModernModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="تأكيد حذف الحساب"
        type="danger"
        size="sm"
      >
        <div className="text-center">
          <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
            هل أنت متأكد من حذف الحساب الخاص بـ <br/>
            <span className="text-danger fw-extrabold">"{userToDelete?.username}"</span>؟
          </p>
          <p className="text-muted small mb-4">
            تنبيه: هذا الحذف نهائي وسيتم مسح الرقم الوظيفي ({userToDelete?.job_number}) والوصول للنظام.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <PrimaryButton variant="secondary" onClick={() => setShowDeleteModal(false)}>إلغاء</PrimaryButton>
            <PrimaryButton variant="danger" onClick={handleConfirmDelete}>تأكيد الحذف</PrimaryButton>
          </div>
        </div>
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

export default UserManagement;
