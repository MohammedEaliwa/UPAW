import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { motion } from 'motion/react';
import { FaNewspaper, FaFileAlt, FaMapMarkedAlt, FaClock, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import InternalNews from '../news/InternalNews';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardHome = () => {
  const [visitorCount, setVisitorCount] = useState(0);
  const [visitorStats, setVisitorStats] = useState([]);
  const { user } = useAuth();
  const loggedInUser = user || { role_id: 3, username: 'موظف' };

  const [postsCount, setPostsCount] = useState(0);
  const [mapsCount, setMapsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    if (loggedInUser.role_id !== 3) {
      api.getVisitorCount().then(d => setVisitorCount(d.total || 0)).catch(() => {});
      api.getVisitorStats().then(d => setVisitorStats(d)).catch(() => {});
      api.getNews().then(d => setPostsCount(Array.isArray(d) ? d.length : (d.data ? d.data.length : 0))).catch(() => {});
      api.getMapLocations().then(d => setMapsCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
      api.getUsers().then(d => setUsersCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
    }
  }, [loggedInUser.role_id]);

  // If the user is a normal employee (role_id === 3), show the internal news feed immediately as homepage
  if (loggedInUser.role_id === 3) {
    return <InternalNews />;
  }


  // Otherwise, show the premium Admin/Data Entry statistics dashboard
  const cards = [
    { title: 'إجمالي الزوار للموقع', count: visitorCount, icon: <FaUsers size={30} />, color: '#8b5cf6', description: 'زيارات مسجلة ديناميكياً' },
    { title: 'إجمالي الأخبار والمنشورات', count: postsCount, icon: <FaNewspaper size={30} />, color: '#003087', description: 'منشورات عامة وداخلية مفعلة' },
    { title: 'معالم الخريطة التفاعلية', count: mapsCount, icon: <FaMapMarkedAlt size={30} />, color: '#10b981', description: 'مباني وتصنيفات مرسومة' },
    { title: 'إجمالي المستخدمين المسجلين', count: usersCount, icon: <FaFileAlt size={30} />, color: '#f59e0b', description: 'موظفين ومدخلين ومسؤولين' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ direction: 'rtl', textAlign: 'right' }}>
      
      {/* Admin Welcome Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-extrabold mb-1" style={{ color: 'var(--primary)', fontSize: '1.7rem' }}>
            مرحباً بك، {loggedInUser.username}
          </h2>
          <p className="text-muted small mb-0">نظرة عامة على إحصائيات ومنظومة الهيئة الوطنية للتخطيط العمراني</p>
        </div>
        <Badge bg="primary" className="py-2.5 px-3 rounded-pill shadow-sm d-flex align-items-center gap-2">
          <FaClock />
          <span>بوابة {loggedInUser.role?.name || 'الإدارة'}</span>
        </Badge>
      </div>

      <Row className="gy-4">
        {cards.map((card, idx) => (
          <Col lg={3} md={6} key={idx}>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                <Card.Body className="p-4 position-relative">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="text-muted fw-bold mb-1" style={{ fontSize: '0.85rem' }}>{card.title}</h6>
                      <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{card.description}</p>
                    </div>
                    <div style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '12px', 
                      background: `${card.color}15`, 
                      color: card.color,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {card.icon}
                    </div>
                  </div>
                  <h2 className="fw-extrabold mb-0" style={{ color: card.color, fontSize: '2.3rem' }}>{card.count}</h2>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
      
      <Row className="mt-4 gy-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm rounded-4 p-4" style={{ background: 'var(--card-bg)', minHeight: '350px' }}>
            <h5 className="fw-bold mb-4 pb-2 border-bottom">حركة الزوار وتفاعلهم (آخر 14 يوم)</h5>
            
            <div style={{ width: '100%', height: 300 }}>
              {visitorStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visitorStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--card-bg)', color: 'var(--text)' }}
                    />
                    <Area type="monotone" dataKey="count" name="عدد الزيارات" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex h-100 justify-content-center align-items-center text-muted">
                  لا توجد بيانات كافية لعرض الرسم البياني
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4 p-4 text-white" style={{ background: 'linear-gradient(135deg, #001d5a 0%, #003087 100%)', minHeight: '280px' }}>
            <h5 className="fw-bold text-white mb-3">سرعة الوصول والمتابعة</h5>
            <p className="small text-white-50 mb-4" style={{ lineHeight: 1.6 }}>
              بصفتك مسؤولاً أو مدخل بيانات، يمكنك إدارة الأخبار، تحديث الخرائط المعتمدة للبلدية، ومراقبة حسابات الموظفين وتفعيلها بشكل مباشر وسهل.
            </p>
            <div className="mt-auto">
              <Badge bg="light" text="dark" className="p-2 w-100 rounded text-center fw-bold" style={{ fontSize: '0.82rem' }}>
                النظام الداخلي مؤمن بالكامل 🔐
              </Badge>
            </div>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default DashboardHome;
