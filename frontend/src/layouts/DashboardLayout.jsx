import React, { useState, useEffect, useRef } from 'react';
import './sidebar.css';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import {
  FaTachometerAlt, FaNewspaper, FaFileAlt, FaSignOutAlt,
  FaBuilding, FaBars, FaTimes, FaUsers, FaMoon, FaSun,
  FaPlusCircle, FaMapMarkedAlt, FaChartLine, FaBell,
  FaChevronDown, FaUser, FaImages, FaRegBuilding, FaInfoCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-bs-theme') === 'dark');
  const profileRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user: loggedInUser, logout } = useAuth();
  const safeUser = loggedInUser || { username: 'زائر', role_id: 3, role: { name: 'موظف', slug: 'employee' } };

  useEffect(() => {
    if (safeUser.role?.slug === 'employee' && location.pathname !== '/dashboard' && !location.pathname.startsWith('/dashboard/manage-map')) {
      navigate('/dashboard');
    }
  }, [location.pathname, safeUser.role?.slug, navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-bs-theme', next ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allMenuItems = [
    { path: '/dashboard', name: 'لوحة القيادة', icon: <FaTachometerAlt /> },
    { path: '/dashboard/manage-news', name: 'إدارة الأخبار', icon: <FaNewspaper />, roles: ['admin', 'data_entry'] },
    { path: '/dashboard/add-news', name: 'إضافة خبر جديد', icon: <FaPlusCircle />, roles: ['admin', 'data_entry'] },
    { path: '/dashboard/working-papers', name: 'ورقات العمل', icon: <FaFileAlt />, roles: ['admin', 'data_entry'] },
    { path: '/dashboard/manage-map', name: 'إدارة الخرائط', icon: <FaMapMarkedAlt />, roles: ['admin', 'data_entry', 'employee'] },
    { path: '/dashboard/manage-about', name: 'نبذة عن الهيئة', icon: <FaInfoCircle />, roles: ['admin', 'data_entry'] },
    { path: '/dashboard/manage-pages', name: 'إدارة الصفحات', icon: <FaFileAlt />, roles: ['admin', 'data_entry'] },
    { path: '/dashboard/manage-stats', name: 'الإحصائيات', icon: <FaChartLine />, roles: ['admin', 'data_entry'] },
    { path: '/dashboard/companies', name: 'الشركات', icon: <FaRegBuilding />, roles: ['admin', 'data_entry'] },
    { path: '/dashboard/manage-gallery', name: 'إدارة معرض الصور', icon: <FaImages />, roles: ['admin', 'data_entry'] },
    { path: '/dashboard/user-management', name: 'إدارة المستخدمين', icon: <FaUsers />, roles: ['admin'] },
    { path: '/dashboard/internal-news', name: 'الأخبار الداخلية', icon: <FaNewspaper />, roles: ['admin', 'data_entry'] },
  ];

  const menuItems = allMenuItems.map(item => {
    if (item.path === '/dashboard' && safeUser.role.slug === 'employee') {
      return { ...item, name: 'الأخبار الداخلية', icon: <FaNewspaper /> };
    }
    return item;
  }).filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(safeUser.role.slug);
  });

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '0 20px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '3px' }}>
            <img
              src="/logo.png"
              alt="شعار الهيئة"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
              بوابة {safeUser.role.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              {safeUser.username}
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', padding: '0 8px 8px', textTransform: 'uppercase' }}>
          القائمة الرئيسية
        </div>
        <div className="d-flex flex-column gap-1">
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setShowSidebar(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10,
                  textDecoration: 'none', transition: 'all 0.25s',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                  fontWeight: isActive ? 700 : 500,
                  borderRight: isActive ? '3px solid rgba(0,168,232,0.8)' : '3px solid transparent',
                  fontSize: '0.92rem',
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; } }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {safeUser.role.slug !== 'employee' && (
          <Link to="/" onClick={() => setShowSidebar(false)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', marginBottom: 4, transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
            <FaBuilding />
            <span>الموقع الرسمي</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
            padding: '10px 14px', borderRadius: 10, border: 'none',
            background: 'rgba(239,68,68,0.12)', color: '#f87171',
            fontWeight: 600, fontSize: '0.88rem', fontFamily: 'Tajawal',
            cursor: 'pointer', transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >
          <FaSignOutAlt />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  );

  const getBreadcrumb = () => {
    const pathTitles = {
      '/dashboard': 'لوحة القيادة',
      '/dashboard/manage-news': 'إدارة الأخبار',
      '/dashboard/add-news': 'إضافة خبر جديد',
      '/dashboard/working-papers': 'ورقات العمل',
      '/dashboard/manage-map': 'إدارة الخرائط',
      '/dashboard/manage-pages': 'إدارة الصفحات',
      '/dashboard/manage-about': 'نبذة عن الهيئة',
      '/dashboard/manage-stats': 'الإحصائيات',
      '/dashboard/user-management': 'إدارة المستخدمين',
      '/dashboard/internal-news': 'التعاميم الداخلية',
      '/dashboard/profile': 'الملف الشخصي',
      '/dashboard/companies': 'الشركات',
      '/dashboard/manage-gallery': 'إدارة معرض الصور',
    };
    const currentTitle = pathTitles[location.pathname] || 'لوحة التحكم';
    return (
      <div className="d-none d-md-flex align-items-center gap-2 text-muted small" style={{ fontSize: '0.86rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>بوابة {safeUser.role.name}</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span className="fw-bold text-primary">{currentTitle}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>

      {/* Desktop Sidebar with Fixed Sizing */}
      <div style={{
        width: '280px',
        minWidth: '280px',
        maxWidth: '280px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #001225 0%, #001d5a 50%, #003087 100%)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.15)',
        zIndex: 100,
        paddingTop: 28,
      }} className="d-none d-lg-flex sidebar-fixed">
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
                background: 'linear-gradient(160deg, #001225 0%, #001d5a 50%, #003087 100%)',
                zIndex: 201, display: 'flex', flexDirection: 'column', paddingTop: 24,
              }}
            >
              <button
                onClick={() => setShowSidebar(false)}
                style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer' }}
              >
                <FaTimes />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        
        {/* Modern Interactive Top Bar */}
        <header style={{
          background: 'rgba(var(--card-bg-rgb), 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0, 48, 135, 0.03)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="link"
              className="d-lg-none p-1 border-0 text-primary"
              onClick={() => setShowSidebar(true)}
            >
              <FaBars size={22} />
            </Button>
            {getBreadcrumb()}
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Animated Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.08, rotate: 15 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleDark}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                boxShadow: '0 2px 8px rgba(0,48,135,0.03)',
                transition: 'all 0.2s',
              }}
              title="تبديل الوضع اللوني"
            >
              {isDark ? <FaSun size={16} className="text-warning" /> : <FaMoon size={16} />}
            </motion.button>

            {/* Notifications */}
            <NotificationDropdown />

            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

            {/* Custom Profile Dropdown Toggle Pill */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 4px 15px rgba(0,48,135,0.06)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfileOpen(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '5px 16px 5px 6px',
                  borderRadius: 99,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,48,135,0.02)',
                  transition: 'all 0.2s',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.86rem'
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 8px rgba(0,48,135,0.15)',
                  flexShrink: 0
                }}>
                  {safeUser.username.charAt(0)}
                </div>
                <span className="d-none d-md-inline" style={{ fontWeight: 700 }}>
                  {safeUser.username}
                </span>
                <FaChevronDown size={11} style={{ opacity: 0.7, transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'none' }} />
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      left: 0,
                      width: 240,
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 16,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                      padding: 12,
                      zIndex: 2000,
                      direction: 'rtl',
                      textAlign: 'right'
                    }}
                  >
                    {/* Header: User Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 6px 12px 6px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 10px rgba(0,48,135,0.15)',
                      }}>
                        {safeUser.username.charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {safeUser.username}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {safeUser.role.name}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {safeUser.role.slug !== 'employee' && (
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setProfileOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 10,
                            color: 'var(--text)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'all 0.15s'
                          }}
                          className="profile-menu-item"
                        >
                          <FaUser size={14} style={{ color: 'var(--primary)' }} />
                          <span>الصفحة الشخصية</span>
                        </Link>
                      )}

                      {/* Dark Mode toggle inside listbox */}
                      <button
                        onClick={() => {
                          toggleDark();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 10,
                          color: 'var(--text)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'right',
                          transition: 'all 0.15s'
                        }}
                        className="profile-menu-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isDark ? <FaSun size={14} style={{ color: '#fd7e14' }} /> : <FaMoon size={14} style={{ color: 'var(--primary)' }} />}
                          <span>الوضع الداكن</span>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: isDark ? 'rgba(253,126,20,0.1)' : 'rgba(0,48,135,0.06)',
                          color: isDark ? '#fd7e14' : 'var(--primary)'
                        }}>
                          {isDark ? 'مفعّل' : 'ملغى'}
                        </span>
                      </button>

                      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 10,
                          color: '#dc3545',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'right',
                          transition: 'all 0.15s'
                        }}
                        className="profile-menu-item logout"
                      >
                        <FaSignOutAlt size={14} />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <style>{`
              .profile-menu-item:hover {
                background: rgba(0, 48, 135, 0.05) !important;
              }
              .profile-menu-item.logout:hover {
                background: rgba(220, 53, 69, 0.06) !important;
              }
              [data-bs-theme="dark"] .profile-menu-item:hover {
                background: rgba(255, 255, 255, 0.05) !important;
              }
              [data-bs-theme="dark"] .profile-menu-item.logout:hover {
                background: rgba(220, 53, 69, 0.1) !important;
              }
            `}</style>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content" style={{ flex: 1, padding: '28px', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
