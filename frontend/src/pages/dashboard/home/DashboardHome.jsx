import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  FaNewspaper, FaMapMarkedAlt, FaClock, FaUsers,
  FaPlus, FaChartBar, FaLayerGroup, FaBuilding,
  FaFileAlt, FaImage, FaUserShield, FaClipboardList,
  FaArrowRight, FaEye, FaArrowUp, FaArrowDown,
  FaSync, FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import InternalNews from '../news/InternalNews';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const BASE_URL = import.meta.env.VITE_API_BASE || `${window.location.origin}/api`;

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loggedInUser = user || { role_id: 3, username: 'موظف' };

  // Stats state
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [stats, setStats]   = useState({
    visitorTotal: 0,
    visitorToday: 0,
    visitorWeek:  0,
    postsCount:   0,
    mapsTotal:    0,
    mapsPending:  0,
    mapsApproved: 0,
    usersCount:   0,
    chartData:    [],
  });

  const fetchAllStats = useCallback(async () => {
    if (loggedInUser.role_id === 3) return;
    setLoading(true);
    setError(null);
    try {
      const [visitorRes, newsRes, mapRes, usersRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/visitors/stats`).then(r => r.json()),
        api.getNews().catch(() => []),
        fetch(`${BASE_URL}/map_locations?all=true`).then(r => r.json()),
        api.getUsers().catch(() => []),
      ]);

      const visitorData = visitorRes.status === 'fulfilled' ? visitorRes.value : {};
      const newsData    = newsRes.status  === 'fulfilled' ? newsRes.value  : [];
      const mapData     = mapRes.status   === 'fulfilled' ? mapRes.value   : [];
      const usersData   = usersRes.status === 'fulfilled' ? usersRes.value : [];

      const mapArr     = Array.isArray(mapData) ? mapData : [];
      const mapsApproved = mapArr.filter(m => m.is_approved == 1).length;
      const mapsPending  = mapArr.filter(m => m.is_approved == 0).length;

      const newsArr = Array.isArray(newsData) ? newsData : (newsData?.data || []);

      setStats({
        visitorTotal: visitorData.total || 0,
        visitorToday: visitorData.today || 0,
        visitorWeek:  visitorData.week  || 0,
        postsCount:   newsArr.length,
        mapsTotal:    mapArr.length,
        mapsPending,
        mapsApproved,
        usersCount:   Array.isArray(usersData) ? usersData.length : 0,
        chartData:    Array.isArray(visitorData.chart) ? visitorData.chart : [],
      });
    } catch (e) {
      setError('فشل تحميل بعض البيانات');
    } finally {
      setLoading(false);
    }
  }, [loggedInUser.role_id]);

  useEffect(() => {
    fetchAllStats();
    // Track visit
    fetch(`${BASE_URL}/visitors/count`).catch(() => {});
  }, [fetchAllStats]);

  // If employee → show internal news feed
  if (loggedInUser.role_id === 3 || String(loggedInUser.role_id) === '3') {
    return <InternalNews />;
  }

  const isAdmin     = loggedInUser.role_id == 1 || String(loggedInUser.role_id) === '1';
  const isDataEntry = loggedInUser.role_id == 2 || String(loggedInUser.role_id) === '2';

  const cards = [
    {
      title: 'إجمالي الزوار للموقع',
      count: stats.visitorTotal,
      sub: `اليوم: ${stats.visitorToday} | الأسبوع: ${stats.visitorWeek}`,
      icon: <FaUsers size={26} />,
      color: '#8b5cf6',
      bg: '#8b5cf615',
    },
    {
      title: 'إجمالي الأخبار والمنشورات',
      count: stats.postsCount,
      sub: 'أخبار عامة وداخلية',
      icon: <FaNewspaper size={26} />,
      color: '#003087',
      bg: '#00308715',
    },
    {
      title: 'معالم الخريطة التفاعلية',
      count: stats.mapsTotal,
      sub: `معتمدة: ${stats.mapsApproved} | قيد المراجعة: ${stats.mapsPending}`,
      icon: <FaMapMarkedAlt size={26} />,
      color: '#10b981',
      bg: '#10b98115',
    },
    {
      title: 'المستخدمون المسجلون',
      count: stats.usersCount,
      sub: 'موظفون ومدخلو بيانات ومسؤولون',
      icon: <FaFileAlt size={26} />,
      color: '#f59e0b',
      bg: '#f59e0b15',
    },
  ];

  // Quick access shortcuts — role-based
  const allShortcuts = [
    { label: 'إضافة خبر جديد',     icon: <FaPlus />,          path: '/dashboard/add-news',          color: '#003087', roles: [1, 2] },
    { label: 'إدارة الأخبار',       icon: <FaNewspaper />,     path: '/dashboard/manage-news',       color: '#003087', roles: [1, 2] },
    { label: 'إدارة الخريطة',       icon: <FaMapMarkedAlt />,  path: '/dashboard/manage-map',        color: '#10b981', roles: [1, 2] },
    { label: 'إدارة الصفحات',       icon: <FaLayerGroup />,    path: '/dashboard/manage-pages',      color: '#8b5cf6', roles: [1, 2] },
    { label: 'إدارة المستخدمين',    icon: <FaUserShield />,    path: '/dashboard/user-management',   color: '#ef4444', roles: [1] },
    { label: 'الطلبات الواردة',     icon: <FaClipboardList />, path: '/dashboard/requests',          color: '#f59e0b', roles: [1, 2] },
    { label: 'إدارة الشركات',       icon: <FaBuilding />,      path: '/dashboard/companies',         color: '#06b6d4', roles: [1, 2] },
    { label: 'معرض الصور',          icon: <FaImage />,         path: '/dashboard/manage-gallery',    color: '#ec4899', roles: [1, 2] },
    { label: 'سجلات التدقيق',       icon: <FaChartBar />,      path: '/dashboard/audit-logs',        color: '#6366f1', roles: [1] },
    { label: 'الأوراق البحثية',     icon: <FaFileAlt />,       path: '/dashboard/working-papers',    color: '#0ea5e9', roles: [1, 2] },
  ];

  const shortcuts = allShortcuts.filter(s => s.roles.includes(Number(loggedInUser.role_id)));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };
  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ direction: 'rtl', textAlign: 'right' }}>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-extrabold mb-1" style={{ color: 'var(--primary)', fontSize: '1.7rem' }}>
            مرحباً بك، {loggedInUser.username}
          </h2>
          <p className="text-muted small mb-0">نظرة عامة على إحصائيات ومنظومة الهيئة الوطنية للتخطيط العمراني</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="primary" className="py-2 px-3 rounded-pill shadow-sm d-flex align-items-center gap-2">
            <FaClock />
            <span>بوابة {isAdmin ? 'المسؤول' : isDataEntry ? 'مدخل البيانات' : 'الإدارة'}</span>
          </Badge>
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-pill px-3"
            onClick={fetchAllStats}
            disabled={loading}
            title="تحديث الإحصائيات"
          >
            <FaSync className={loading ? 'spin-anim' : ''} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3 rounded-3">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Stats Cards */}
      <Row className="gy-3 mb-4">
        {cards.map((card, idx) => (
          <Col lg={3} md={6} key={idx}>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h6 className="text-muted fw-bold mb-1" style={{ fontSize: '0.82rem' }}>{card.title}</h6>
                      <p className="text-muted mb-0" style={{ fontSize: '0.72rem', opacity: 0.75 }}>{card.sub}</p>
                    </div>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: card.bg, color: card.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {card.icon}
                    </div>
                  </div>
                  {loading ? (
                    <Spinner animation="border" size="sm" style={{ color: card.color }} />
                  ) : (
                    <h2 className="fw-extrabold mb-0" style={{ color: card.color, fontSize: '2.1rem' }}>
                      {card.count.toLocaleString('en-US')}
                    </h2>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row className="gy-4 mb-4">
        {/* Visitor Chart */}
        <Col md={8}>
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm rounded-4 p-4" style={{ background: 'var(--card-bg)', minHeight: 360 }}>
              <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <h5 className="fw-bold mb-0">حركة الزوار وتفاعلهم (آخر 14 يوم)</h5>
                <div className="d-flex gap-3 small text-muted">
                  <span>
                    <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:'#8b5cf6', marginLeft:4 }}></span>
                    زوار يومياً
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 280 }}>
                  <Spinner animation="border" style={{ color: '#8b5cf6' }} />
                </div>
              ) : stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12, border: 'none',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text)',
                        direction: 'rtl'
                      }}
                      formatter={(value) => [`${value} زائر`, 'عدد الزيارات']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="عدد الزيارات"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorVisit)"
                      dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#8b5cf6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex flex-column justify-content-center align-items-center text-muted gap-3" style={{ height: 280 }}>
                  <FaChartBar size={40} style={{ opacity: 0.25 }} />
                  <div>
                    <p className="mb-1 fw-bold">لا توجد بيانات كافية بعد</p>
                    <p className="small mb-0">ستظهر البيانات بعد تسجيل زيارات على الموقع</p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* Map Stats Mini */}
        <Col md={4}>
          <motion.div variants={itemVariants} className="h-100">
            <Card className="border-0 shadow-sm rounded-4 p-4 text-white h-100"
              style={{ background: 'linear-gradient(135deg, #001d5a 0%, #003087 100%)', minHeight: 280 }}>
              <h5 className="fw-bold text-white mb-4">إحصائيات الخريطة</h5>

              {loading ? (
                <div className="d-flex justify-content-center pt-4">
                  <Spinner animation="border" variant="light" />
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <FaMapMarkedAlt />
                      <span className="small">إجمالي المعالم</span>
                    </div>
                    <span className="fw-bold fs-5">{stats.mapsTotal}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'rgba(16,185,129,0.25)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <FaArrowUp />
                      <span className="small">معتمدة</span>
                    </div>
                    <span className="fw-bold fs-5 text-success">{stats.mapsApproved}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: 'rgba(245,158,11,0.25)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <FaClock />
                      <span className="small">قيد المراجعة</span>
                    </div>
                    <span className="fw-bold fs-5 text-warning">{stats.mapsPending}</span>
                  </div>
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="rounded-pill mt-2"
                    onClick={() => navigate('/dashboard/manage-map')}
                  >
                    <FaArrowRight className="ms-2" /> إدارة الخريطة
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Quick Access Shortcuts */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm rounded-4" style={{ background: 'var(--card-bg)' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <FaChartBar style={{ color: 'var(--primary)' }} />
                الاختصارات السريعة
              </h5>
              <span className="small text-muted">الصفحات الأكثر استخداماً</span>
            </div>

            <Row className="g-3">
              {shortcuts.map((s, idx) => (
                <Col md={3} sm={4} xs={6} key={idx}>
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Button
                      variant="light"
                      className="w-100 rounded-3 d-flex flex-column align-items-center gap-2 py-3 border"
                      style={{
                        background: `${s.color}0d`,
                        borderColor: `${s.color}22`,
                        color: s.color,
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        minHeight: 90,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => navigate(s.path)}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                      <span>{s.label}</span>
                    </Button>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-anim { animation: spin 0.8s linear infinite; }
      `}</style>
    </motion.div>
  );
};

export default DashboardHome;
