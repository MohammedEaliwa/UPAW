import React, { useState } from 'react';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import { FaCheck, FaTimes, FaUserClock } from 'react-icons/fa';
import { motion } from 'motion/react';
import { useToast } from '../../../context/ToastContext';

const PendingUsers = () => {
  const { showToast } = useToast();
  const [pendingUsers, setPendingUsers] = useState([
    { id: 1, username: 'أحمد محمود', email: 'ahmed@upa.gov.ly', phone: '0912345678', jobNumber: 'UP-1029', date: '2026-06-06' },
    { id: 2, username: 'سالم عبدالله', email: 'salem@upa.gov.ly', phone: '0929876543', jobNumber: 'UP-1030', date: '2026-06-07' }
  ]);

  const handleApprove = (id) => {
    setPendingUsers(pendingUsers.filter(u => u.id !== id));
    showToast('تم قبول المستخدم بنجاح وإرسال إشعار له.', 'success');
  };

  const handleReject = (id) => {
    setPendingUsers(pendingUsers.filter(u => u.id !== id));
    showToast('تم رفض طلب المستخدم.', 'warning');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold" style={{ color: 'var(--primary-color)' }}>
          <FaUserClock className="ms-2" /> طلبات الانضمام المعلقة
        </h3>
        <Badge bg="warning" text="dark" className="fs-6 py-2 px-3 rounded-pill shadow-sm">
          {pendingUsers.length} طلبات جديدة
        </Badge>
      </div>

      <Card className="border-0 shadow-sm card-custom rounded-4">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle text-center">
              <thead className="bg-light">
                <tr>
                  <th className="py-3">الاسم الرباعي</th>
                  <th className="py-3">الرقم الوظيفي</th>
                  <th className="py-3">البريد الإلكتروني</th>
                  <th className="py-3">رقم الهاتف</th>
                  <th className="py-3">تاريخ الطلب</th>
                  <th className="py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.length === 0 ? (
                  <tr><td colSpan="6" className="py-5 text-muted">لا توجد طلبات معلقة حالياً.</td></tr>
                ) : (
                  pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="fw-bold">{user.username}</td>
                      <td><Badge bg="secondary">{user.jobNumber}</Badge></td>
                      <td>{user.email}</td>
                      <td dir="ltr">{user.phone}</td>
                      <td>{user.date}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button variant="success" size="sm" className="rounded-pill px-3" onClick={() => handleApprove(user.id)}>
                            <FaCheck className="ms-1" /> قبول
                          </Button>
                          <Button variant="danger" size="sm" className="rounded-pill px-3" onClick={() => handleReject(user.id)}>
                            <FaTimes className="ms-1" /> رفض
                          </Button>
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
    </motion.div>
  );
};

export default PendingUsers;
