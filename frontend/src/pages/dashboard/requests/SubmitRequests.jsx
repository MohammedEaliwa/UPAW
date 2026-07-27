import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBuilding, FaUserTie, FaExclamationTriangle, FaPaperPlane, 
  FaCalendarAlt, FaLaptopCode, FaWrench, FaBriefcase, FaHistory,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaInfoCircle
} from 'react-icons/fa';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const SubmitRequests = () => {
  const { user } = useAuth();
  const safeUser = user || { username: 'موظف تجريبي', role: { slug: 'employee' } };
  
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' or 'public_links'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Employee form state
  const [form, setForm] = useState({
    employee_name: safeUser.name || safeUser.username || '',
    employee_email: safeUser.email || '',
    request_type: 'leave',
    subject: '',
    message: ''
  });

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getEmployeeRequests();
      const personalRequests = data.filter(r => r.employee_name === (safeUser.name || safeUser.username));
      setHistory(personalRequests);
    } catch (err) {
      console.error('Error fetching request history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [safeUser.name, safeUser.username]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await api.createEmployeeRequest(form);
      setSuccessMsg('تم تقديم طلبك بنجاح وسيتم إشعار مسؤول النظام.');
      setForm({
        employee_name: safeUser.name || safeUser.username || '',
        employee_email: safeUser.email || '',
        request_type: 'leave',
        subject: '',
        message: ''
      });
      fetchHistory();
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const requestTypes = [
    { value: 'leave', label: 'طلب إجازة', icon: <FaCalendarAlt /> },
    { value: 'tech_support', label: 'دعم فني وتقني', icon: <FaLaptopCode /> },
    { value: 'maintenance', label: 'طلب صيانة مرافق', icon: <FaWrench /> },
    { value: 'mission', label: 'مهمة عمل / تكليف خارجي', icon: <FaBriefcase /> }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FaCheckCircle className="text-success text-lg" />;
      case 'rejected': return <FaTimesCircle className="text-danger text-lg" />;
      default: return <FaHourglassHalf className="text-warning text-lg animate-pulse" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 text-xs rounded-full bg-success/15 text-success font-medium">مقبول</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-xs rounded-full bg-danger/15 text-danger font-medium font-bold">مرفوض</span>;
      default:
        return <span className="px-3 py-1 text-xs rounded-full bg-warning/15 text-warning font-medium">قيد المراجعة</span>;
    }
  };

  const getRequestTypeName = (type) => {
    const found = requestTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="container py-4" style={{ direction: 'rtl', textAlign: 'right' }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold text-primary mb-2">مركز تقديم الطلبات</h2>
        <p className="text-muted">يمكنك هنا تقديم الطلبات الرسمية ومتابعة حالتها مباشرة.</p>
      </div>

      {/* Tabs Switcher */}
      <div className="d-flex gap-2 border-bottom pb-2 mb-4">
        <button 
          className={`btn ${activeTab === 'employee' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('employee')}
        >
          تقديم طلب داخلي للموظفين
        </button>
        <button 
          className={`btn ${activeTab === 'public_links' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('public_links')}
        >
          طلبات البوابة الرئيسية
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'employee' && (
          <motion.div
            key="employee"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="row g-4"
          >
            {/* Form Column */}
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 p-4">
                <h4 className="fw-bold mb-4 text-secondary d-flex align-items-center gap-2">
                  <FaPaperPlane className="text-primary" />
                  نموذج تقديم طلب جديد
                </h4>

                {successMsg && (
                  <div className="alert alert-success d-flex align-items-center gap-2" role="alert">
                    <FaCheckCircle />
                    <div>{successMsg}</div>
                  </div>
                )}

                {errorMsg && (
                  <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                    <FaExclamationTriangle />
                    <div>{errorMsg}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label font-bold">اسم الموظف</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="employee_name"
                        value={form.employee_name}
                        onChange={handleInputChange}
                        required
                        placeholder="أدخل الاسم الرباعي"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label font-bold">البريد الإلكتروني المهني</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        name="employee_email"
                        value={form.employee_email}
                        onChange={handleInputChange}
                        placeholder="name@authority.gov"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label font-bold">نوع الطلب</label>
                    <div className="row g-2">
                      {requestTypes.map(type => (
                        <div className="col-sm-6" key={type.value}>
                          <label 
                            className={`d-flex align-items-center gap-3 p-3 border rounded cursor-pointer transition-all ${
                              form.request_type === type.value 
                                ? 'border-primary bg-primary/5 text-primary fw-bold' 
                                : 'border-secondary/20 hover:bg-light'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input 
                              type="radio" 
                              name="request_type" 
                              value={type.value}
                              checked={form.request_type === type.value}
                              onChange={handleInputChange}
                              className="d-none"
                            />
                            <span className="fs-5">{type.icon}</span>
                            <span>{type.label}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label font-bold">عنوان الطلب</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="subject"
                      value={form.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="عنوان موجز يوضح محتوى الطلب"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label font-bold">تفاصيل ومبررات الطلب</label>
                    <textarea 
                      className="form-control" 
                      name="message"
                      rows="4"
                      value={form.message}
                      onChange={handleInputChange}
                      required
                      placeholder="اكتب هنا التفاصيل الكاملة والمبررات أو أية ملاحظات تفصيلية..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 d-flex justify-content-center align-items-center gap-2"
                    disabled={loading}
                  >
                    <FaPaperPlane />
                    {loading ? 'جاري الإرسال...' : 'إرسال الطلب رسمياً'}
                  </button>
                </form>
              </div>
            </div>

            {/* History Column */}
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 p-4 h-100">
                <h4 className="fw-bold mb-4 text-secondary d-flex align-items-center gap-2">
                  <FaHistory className="text-info" />
                  سجل طلباتي الأخيرة
                </h4>

                {loadingHistory ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">جاري التحميل...</span>
                    </div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-5 border border-dashed rounded text-muted">
                    <FaInfoCircle className="fs-2 mb-2 text-info" />
                    <p className="mb-0">لا توجد طلبات سابقة مقدمة من قبلك حتى الآن.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                    <div className="d-flex flex-column gap-3">
                      {history.map(req => (
                        <div key={req.id} className="p-3 border rounded bg-light hover:shadow-sm transition-all">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold text-dark mb-0">{req.subject}</h6>
                            {getStatusIcon(req.status)}
                          </div>
                          
                          <p className="text-xs text-muted mb-2 d-flex align-items-center gap-1">
                            <span>{getRequestTypeName(req.request_type)}</span>
                            <span>•</span>
                            <span>{new Date(req.created_at).toLocaleDateString('ar-EG')}</span>
                          </p>
                          
                          <p className="text-sm text-secondary text-truncate mb-2">{req.message}</p>
                          
                          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                            {getStatusBadge(req.status)}
                            {req.notes && (
                              <span className="text-xs text-info bg-info/10 px-2 py-0.5 rounded cursor-help" title={req.notes}>
                                يوجد ملاحظات من الإدارة
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'public_links' && (
          <motion.div
            key="public_links"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="row g-4"
          >
            <div className="col-12">
              <div className="card shadow-sm border-0 p-4">
                <h4 className="fw-bold mb-4 text-secondary">طلبات البوابة الإلكترونية الرئيسية</h4>
                <p className="text-muted">اضغط على أي من الخيارات التالية للانتقال إلى نماذج التقديم المتوفرة للجمهور والشركات الخارجية:</p>
                
                <div className="row g-4 mt-2">
                  {/* Company Reg */}
                  <div className="col-md-4">
                    <div className="card h-100 border border-secondary/20 hover:border-primary transition-all p-4 text-center cursor-pointer" onClick={() => window.open('/company-registration', '_blank')}>
                      <div className="bg-primary/10 text-primary rounded-circle d-inline-flex p-3 mx-auto mb-3">
                        <FaBuilding className="fs-3" />
                      </div>
                      <h5 className="fw-bold mb-2">تسجيل الشركات والمكاتب الاستشارية</h5>
                      <p className="text-sm text-secondary mb-4">نموذج مخصص لتأهيل الشركات والمكاتب الاستشارية لدى الهيئة الوطنية.</p>
                      <button className="btn btn-primary w-100 mt-auto">فتح نموذج التسجيل</button>
                    </div>
                  </div>

                  {/* Expert Reg */}
                  <div className="col-md-4">
                    <div className="card h-100 border border-secondary/20 hover:border-primary transition-all p-4 text-center cursor-pointer" onClick={() => window.open('/experts-registration', '_blank')}>
                      <div className="bg-info/10 text-info rounded-circle d-inline-flex p-3 mx-auto mb-3">
                        <FaUserTie className="fs-3" />
                      </div>
                      <h5 className="fw-bold mb-2">تسجيل الخبراء والمستشارين المستقلين</h5>
                      <p className="text-sm text-secondary mb-4">نموذج لتسجيل الكفاءات والخبرات الفردية والمستشارين الفنيين.</p>
                      <button className="btn btn-info text-white w-100 mt-auto">فتح نموذج التسجيل</button>
                    </div>
                  </div>

                  {/* Complaints */}
                  <div className="col-md-4">
                    <div className="card h-100 border border-secondary/20 hover:border-danger transition-all p-4 text-center cursor-pointer" onClick={() => window.open('/complaints', '_blank')}>
                      <div className="bg-danger/10 text-danger rounded-circle d-inline-flex p-3 mx-auto mb-3">
                        <FaExclamationTriangle className="fs-3" />
                      </div>
                      <h5 className="fw-bold mb-2">تقديم شكوى أو بلاغ رسمي</h5>
                      <p className="text-sm text-secondary mb-4">خدمة إلكترونية للتبليغ عن المخالفات الحضرية أو تقديم الشكاوى الإدارية.</p>
                      <button className="btn btn-danger w-100 mt-auto">فتح نموذج الشكاوى</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubmitRequests;
