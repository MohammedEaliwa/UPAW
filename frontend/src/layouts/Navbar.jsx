import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import {
  FaBars, FaTimes, FaGlobe, FaSignInAlt, FaMoon, FaSun, FaChevronDown, FaChevronLeft, FaChevronRight,
  FaHome, FaInfoCircle, FaUsers, FaBookOpen, FaGavel,
  FaMapMarkedAlt, FaCity, FaBuilding, FaMap,
  FaProjectDiagram, FaHouseUser, FaUmbrellaBeach,
  FaFileAlt, FaChartBar, FaFlask,
  FaNewspaper, FaMapPin, FaComments, FaEnvelope,
  FaArrowLeft, FaArrowRight, FaLayerGroup, FaLandmark,
  FaImages, FaRegBuilding
} from 'react-icons/fa';
import {
  MdOutlineAccountBalance, MdOutlineLocationCity, MdOutlineMap,
  MdOutlineArticle, MdOutlineContactMail, MdOutlineDesignServices
} from 'react-icons/md';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const NAV_STRUCTURE = [
  {
    to: '/',
    label: 'الرئيسية',
    labelEn: 'Home',
    icon: <FaHome />,
  },
  {
    label: 'عن الهيئة',
    labelEn: 'About Us',
    icon: <MdOutlineAccountBalance />,
    description: 'تعرف على هيئة التخطيط العمراني',
    descriptionEn: 'Learn about the Urban Planning Authority',
    children: [
      { to: '/about', label: 'نبذة عن الهيئة', labelEn: 'About Authority', icon: <FaInfoCircle />, desc: 'التاريخ والرؤية والرسالة', descEn: 'History, vision & mission' },
      { to: '/page/%d8%aa%d8%b9%d8%b1%d9%8a%d9%81-%d8%a8%d8%a7%d9%84%d9%85%d8%b5%d9%84%d8%ad%d8%a9', label: 'التعريف بالمصلحة', labelEn: 'About the Authority', icon: <FaUsers />, desc: 'الهيكل التنظيمي والإدارة', descEn: 'Organizational structure' },
      {
        label: 'المكتبة',
        labelEn: 'Library',
        icon: <FaBookOpen />,
        desc: 'الوثائق والمراجع',
        descEn: 'Documents & references',
        _noDbChildren: true,
        children: [
          { to: '/library', label: 'كتب', labelEn: 'Books', icon: <FaBookOpen />, desc: 'قائمة الكتب والمراجع', descEn: 'Books & references list' },
        ],
      },
      { to: '/decisions', label: 'القرارات واللوائح', labelEn: 'Decisions & Regulations', icon: <FaGavel />, desc: 'اللوائح والقرارات الرسمية', descEn: 'Official rules & decisions' },
    ],
  },
  {
    label: 'الأقاليم التخطيطية',
    labelEn: 'Planning Regions',
    icon: <MdOutlineMap />,
    description: 'الأقاليم التخطيطية في ليبيا',
    descriptionEn: 'Planning regions across Libya',
    children: [
      { to: '/page/%d9%86%d8%a8%d8%b0%d8%a9-%d8%b9%d9%86-%d8%a7%d9%84%d8%a7%d9%82%d8%a7%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a%d8%a9', label: 'نبذة عن الاقاليم التخطيطية', labelEn: 'Overview of Planning Regions', icon: <FaLayerGroup />, desc: 'نظرة عامة على الأقاليم', descEn: 'Overview of all regions' },
      {
        to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b7%d8%b1%d8%a7%d8%a8%d9%84%d8%b3-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
        label: 'إقليم طرابلس التخطيطي',
        labelEn: 'Tripoli Planning Region',
        icon: <FaLandmark />,
        desc: 'المنطقة الغربية وأقاليمها الفرعية',
        descEn: 'Western region and sub-regions',
        children: [
          { to: '/page/%d8%a7%d9%84%d8%a3%d9%82%d8%a7%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a%d8%a9-%d9%84%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b7%d8%b1%d8%a7%d8%a8%d9%84%d8%b3-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7', label: 'الأقاليم الفرعية لإقليم طرابلس', labelEn: 'Tripoli Sub-regions', icon: <FaLayerGroup /> },
          { to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%85%d8%b3-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a', label: 'إقليم الخمس الفرعي', labelEn: 'Al-Khums Sub-region', icon: <FaMapPin /> },
          { to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b2%d9%88%d8%a7%d8%b1%d8%a9-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a', label: 'إقليم زوارة الفرعي', labelEn: 'Zawara Sub-region', icon: <FaMapPin /> },
          { to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b7%d8%b1%d8%a7%d8%a8%d9%84%d8%b3-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a', label: 'إقليم طرابلس الفرعي', labelEn: 'Tripoli Sub-region', icon: <FaMapPin /> },
          { to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%ba%d8%b1%d9%8a%d8%a7%d9%86-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a', label: 'إقليم غريان الفرعي', labelEn: 'Gharyan Sub-region', icon: <FaMapPin /> },
          { to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%85%d8%b5%d8%b1%d8%a7%d8%aa%d9%87-%d8%a7%d9%84%d9%81%d8%b1%d8%b9%d9%8a', label: 'إقليم مصراته الفرعي', labelEn: 'Misurata Sub-region', icon: <FaMapPin /> },
        ],
      },
      {
        to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%84%d9%8a%d8%ac-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a',
        label: 'إقليم الخليج التخطيطي',
        labelEn: 'Al-Khalij Planning Region',
        icon: <FaMapMarkedAlt />,
        desc: 'المنطقة الشمالية الشرقية',
        descEn: 'Northeast region',
        children: [
          { to: '/page/sub-regions-alkhalig-region', label: 'الاقاليم الفرعية لإقليم الخليج', labelEn: 'Al-Khalij Sub-regions', icon: <FaLayerGroup /> },
          { to: '/page/kufra-sub-region', label: 'إقليم الكفرة الفرعي', labelEn: 'Kufra Sub-region', icon: <FaMapPin /> },
          { to: '/page/sirt-subregion', label: 'إقليم سرت الفرعي', labelEn: 'Sirte Sub-region', icon: <FaMapPin /> },
        ],
      },
      { to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a8%d9%86%d8%ba%d8%a7%d8%b2%d9%8a-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a', label: 'إقليم بنغازي التخطيطي', labelEn: 'Benghazi Planning Region', icon: <FaCity />, desc: 'المنطقة الشرقية', descEn: 'Eastern region' },
      { to: '/page/%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%81%d8%b2%d8%a7%d9%86-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a', label: 'إقليم فزان التخطيطي', labelEn: 'Fezzan Planning Region', icon: <FaMap />, desc: 'المنطقة الجنوبية', descEn: 'Southern region' },
    ],
  },
  {
    label: 'المشاريع',
    labelEn: 'Projects',
    icon: <FaProjectDiagram />,
    description: 'المشاريع الجارية والمنجزة',
    descriptionEn: 'Ongoing and completed projects',
    children: [
      {
        to: '/page/%d9%85%d8%b4%d8%a7%d8%b1%d9%8a%d8%b9-%d8%a5%d8%b3%d9%83%d8%a7%d9%86%d9%8a%d8%a9',
        label: 'مشاريع إسكانية',
        labelEn: 'Housing Projects',
        icon: <FaHouseUser />,
        desc: 'مشاريع السكن بالأقاليم',
        descEn: 'Residential & housing projects',
        children: [
          { to: '/page/%d9%85%d8%b4%d8%a7%d8%b1%d9%8a%d8%b9-%d8%a5%d8%b3%d9%83%d8%a7%d9%86%d9%8a%d8%a9-%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%b7%d8%b1%d8%a7%d8%a8%d9%84%d8%b3', label: 'مشاريع إسكانية إقليم طرابلس', labelEn: 'Housing - Tripoli Region', icon: <FaLandmark /> },
          { to: '/page/%d9%85%d8%b4%d8%a7%d8%b1%d9%8a%d8%b9-%d8%a5%d8%b3%d9%83%d8%a7%d9%86%d9%8a%d8%a9-%d8%a3%d9%82%d9%84%d9%8a%d9%85-%d8%a8%d9%86%d8%ba%d8%a7%d8%b2%d9%8a', label: 'مشاريع إسكانية إقليم بنغازي', labelEn: 'Housing - Benghazi Region', icon: <FaCity /> },
          { to: '/page/%d9%85%d8%b4%d8%a7%d8%b1%d9%8a%d8%b9-%d8%a5%d8%b3%d9%83%d8%a7%d9%86%d9%8a%d8%a9-%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%ae%d9%84%d9%8a%d8%ac', label: 'مشاريع إسكانية إقليم الخليج', labelEn: 'Housing - Al-Khalij Region', icon: <FaMapMarkedAlt /> },
          { to: '/page/%d9%85%d8%b4%d8%a7%d8%b1%d9%8a%d8%b9-%d8%a5%d8%b3%d9%83%d8%a7%d9%86%d9%8a%d8%a9-%d8%a5%d9%82%d9%84%d9%8a%d9%85-%d9%81%d8%b2%d8%a7%d9%86', label: 'مشاريع إسكانية إقليم فزان', labelEn: 'Housing - Fezzan Region', icon: <FaMap /> },
        ],
      },
      {
        to: '/page/%d9%85%d8%b4%d8%a7%d8%b1%d9%8a%d8%b9-%d8%aa%d8%b1%d9%81%d9%8a%d9%87%d9%8a%d8%a9',
        label: 'مشاريع ترفيهية',
        labelEn: 'Recreational Projects',
        icon: <FaUmbrellaBeach />,
        desc: 'مشاريع الترفيه والمجمعات',
        descEn: 'Recreation & tourism projects',
        children: [
          { to: '/page/tripoli_masharie_tarfihia', label: 'مشاريع ترفيهية إقليم طرابلس', labelEn: 'Recreational - Tripoli', icon: <FaLandmark /> },
          { to: '/page/tripoli_parks', label: 'منتزهات إقليم طرابلس', labelEn: 'Tripoli Parks', icon: <FaUmbrellaBeach /> },
          { to: '/page/tripoli_moal', label: 'المجمعات التجارية', labelEn: 'Commercial Complexes', icon: <FaBuilding /> },
        ],
      },
    ],
  },
  {
    label: 'الأوراق والتقارير',
    labelEn: 'Papers & Reports',
    icon: <MdOutlineArticle />,
    description: 'الأبحاث والتقارير التخطيطية',
    descriptionEn: 'Research & planning reports',
    children: [
      { to: '/page/%d8%aa%d9%82%d8%a7%d8%b1%d9%8a%d8%b1', label: 'التقارير', labelEn: 'Reports', icon: <FaChartBar />, desc: 'التقارير السنوية والدورية', descEn: 'Annual & periodic reports', _noDbChildren: true },
      {
        label: 'المخططات',
        labelEn: 'Plans',
        icon: <FaFileAlt />,
        desc: 'مخططات التنمية والتطوير',
        descEn: 'Development & growth plans',
        children: [
          { to: '/page/%d9%85%d8%ae%d8%b7%d8%b7%d8%a7%d8%aa-%d8%a7%d9%84%d8%ac%d9%8a%d9%84-%d8%a7%d9%84%d8%a3%d9%88%d9%84', label: 'الجيل الأول', labelEn: '1st Generation', icon: <FaLayerGroup /> },
          { to: '/page/%d9%85%d8%ae%d8%b7%d8%b7%d8%a7%d8%aa-%d8%a7%d9%84%d8%ac%d9%8a%d9%84-%d8%a7%d9%84%d8%ab%d8%a7%d9%86%d9%8a', label: 'الجيل الثاني', labelEn: '2nd Generation', icon: <FaLayerGroup /> },
          { to: '/page/%d9%85%d8%ae%d8%b7%d8%b7%d8%a7%d8%aa-%d8%a7%d9%84%d8%ac%d9%8a%d9%84-%d8%a7%d9%84%d8%ab%d8%a7%d9%84%d8%ab', label: 'الجيل الثالث', labelEn: '3rd Generation', icon: <FaLayerGroup /> },
        ],
      },
      { to: '/working-papers', label: 'الأوراق العلمية', labelEn: 'Working Papers', icon: <FaFlask />, desc: 'الأبحاث والدراسات العلمية', descEn: 'Scientific studies & research' },
    ],
  },
  {
    to: '/news',
    label: 'الأخبار',
    labelEn: 'News',
    icon: <FaNewspaper />,
  },
  {
    label: 'الخدمات',
    labelEn: 'Services',
    icon: <MdOutlineDesignServices />,
    description: 'الخدمات الإلكترونية المتاحة',
    descriptionEn: 'Available electronic services',
    children: [
      { to: '/interactive-map', label: 'الخريطة التفاعلية', labelEn: 'Interactive Map', icon: <FaMapPin />, desc: 'استعرض المناطق التخطيطية', descEn: 'Browse planning areas' },
      {
        label: 'تسجيل',
        labelEn: 'Registration',
        icon: <FaRegBuilding />,
        desc: 'تسجيل الشركات والخبراء',
        descEn: 'Register companies & experts',
        children: [
          { to: '/company-registration', label: 'تسجيل الشركات', labelEn: 'Company Registration', icon: <FaRegBuilding />, desc: 'سجّل شركتك وتعرف على المسجلين', descEn: 'Register your company' },
          { to: '/experts-registration', label: 'تسجيل الخبراء والمستشارين', labelEn: 'Experts & Consultants Registration', icon: <FaUsers />, desc: 'تسجيل الخبراء والمستشارين المعتمدين', descEn: 'Register as an expert or consultant' },
        ],
      },
      { to: '/gallery', label: 'معرض الصور', labelEn: 'Photo Gallery', icon: <FaImages />, desc: 'صور وفعاليات الهيئة الوطنية', descEn: 'Authority photos & events' },
      { to: '/complaints', label: 'تقديم شكوى', labelEn: 'Submit Complaint', icon: <FaComments />, desc: 'تقديم شكاوى ومقترحات', descEn: 'Submit complaints & suggestions' },
    ],
  },
  {
    to: '/contact',
    label: 'تواصل معنا',
    labelEn: 'Contact',
    icon: <MdOutlineContactMail />,
  },
];

/* ─── Sub Dropdown (2nd level flyout) ─────────────────────────── */
const SubDropdown = ({ items, isRtl, isDarkMode, onClose }) => (
  <motion.div
    initial={{ opacity: 0, x: isRtl ? 10 : -10, scale: 0.97 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: isRtl ? 10 : -10, scale: 0.97 }}
    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    style={{
      position: 'absolute',
      top: 0,
      ...(isRtl ? { right: 'calc(100% + 6px)' } : { left: 'calc(100% + 6px)' }),
      minWidth: 240,
      background: 'var(--card-bg)',
      borderRadius: 14,
      boxShadow: '0 20px 50px rgba(0,0,0,0.22), 0 6px 16px rgba(0,0,0,0.1)',
      border: '1px solid var(--border)',
      zIndex: 10001,
      padding: '8px',
      overflow: 'visible',
    }}
  >
    {items.map((item, i) => (
      <Link
        key={i}
        to={item.to}
        onClick={onClose}
        className="dropdown-item-premium"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 10,
          textDecoration: 'none', marginBottom: 2,
          transition: 'all 0.18s ease',
        }}
      >
        {item.icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,120,255,0.15))'
              : 'linear-gradient(135deg, rgba(0,48,135,0.1), rgba(0,120,255,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDarkMode ? '#fff' : '#003087', fontSize: '0.8rem',
            transition: 'all 0.18s ease',
          }} className="dropdown-icon-box">
            {item.icon}
          </div>
        )}
        <div style={{ flex: 1, fontWeight: 700, fontSize: '0.84rem', color: isDarkMode ? '#fff' : '#1a2850', fontFamily: 'Cairo, Tajawal, sans-serif', lineHeight: 1.3 }}>
          {isRtl ? item.label : (item.labelEn || item.label)}
        </div>
        <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,48,135,0.3)', fontSize: '0.65rem', flexShrink: 0 }}>
          {isRtl ? <FaArrowLeft /> : <FaArrowRight />}
        </div>
      </Link>
    ))}
  </motion.div>
);

/* ─── Premium Dropdown ──────────────────────────────────────────── */
const DropdownMenu = ({ item, isRtl, onClose }) => {
  const items = item.children;
  const { isDarkMode } = useTheme();
  const headerLabel = isRtl ? item.label : item.labelEn;
  const headerDesc = isRtl ? item.description : item.descriptionEn;
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97, x: isRtl ? '50%' : '-50%' }}
      animate={{ opacity: 1, y: 0, scale: 1, x: isRtl ? '50%' : '-50%' }}
      exit={{ opacity: 0, y: 6, scale: 0.97, x: isRtl ? '50%' : '-50%' }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        ...(isRtl ? { right: '50%' } : { left: '50%' }),
        minWidth: 300,
        background: isDarkMode
          ? 'rgba(10, 22, 48, 0.97)'
          : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 18,
        boxShadow: isDarkMode
          ? '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)'
          : '0 24px 60px rgba(0,48,135,0.14), 0 0 0 1px rgba(0,48,135,0.08)',
        overflow: 'visible',
        zIndex: 9999,
      }}
    >
      {/* Header — clean accent top bar + title */}
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: isDarkMode
          ? '1px solid rgba(255,255,255,0.07)'
          : '1px solid rgba(0,48,135,0.08)',
        background: isDarkMode
          ? 'rgba(255,255,255,0.03)'
          : 'rgba(0,48,135,0.03)',
        borderRadius: '18px 18px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #003087 0%, #0077e6 50%, #00c2ff 100%)',
          borderRadius: '0 0 2px 2px',
        }} />
        <div style={{
          fontWeight: 800,
          fontSize: '0.9rem',
          color: isDarkMode ? '#e8f0ff' : '#003087',
          fontFamily: 'Cairo, Tajawal, sans-serif',
          marginTop: 4,
        }}>
          {headerLabel}
        </div>
        {headerDesc && (
          <div style={{
            fontSize: '0.73rem',
            color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,48,135,0.5)',
            marginTop: 3,
            fontFamily: 'Cairo, Tajawal, sans-serif',
          }}>
            {headerDesc}
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: '8px', overflow: 'visible' }}>
        {items.map((child, i) => (
          child.children ? (
            /* Item with nested sub-menu */
            <div
              key={i}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(-1)}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                  marginBottom: 2,
                  transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
                  background: hoveredIdx === i
                    ? (isDarkMode ? 'rgba(0,120,255,0.1)' : 'rgba(0,48,135,0.06)')
                    : 'transparent',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: hoveredIdx === i
                    ? 'linear-gradient(135deg,#003087,#0077e6)'
                    : (isDarkMode
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(0,48,135,0.07)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: hoveredIdx === i ? '#fff' : (isDarkMode ? 'rgba(255,255,255,0.75)' : '#003087'),
                  fontSize: '0.9rem', transition: 'all 0.18s ease',
                }}>
                  {child.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: '0.87rem',
                    color: hoveredIdx === i
                      ? (isDarkMode ? '#60aaff' : '#003087')
                      : (isDarkMode ? '#dbe8ff' : '#1a2850'),
                    fontFamily: 'Cairo, Tajawal, sans-serif', lineHeight: 1.3,
                    transition: 'color 0.15s ease',
                  }}>
                    {isRtl ? child.label : (child.labelEn || child.label)}
                  </div>
                  {(child.desc || child.descEn) && (
                    <div style={{
                      fontSize: '0.72rem',
                      color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,48,135,0.45)',
                      marginTop: 1, fontFamily: 'Cairo, Tajawal, sans-serif',
                    }}>
                      {isRtl ? child.desc : child.descEn}
                    </div>
                  )}
                </div>
                <div style={{
                  color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,48,135,0.3)',
                  fontSize: '0.65rem', flexShrink: 0,
                }}>
                  {isRtl ? <FaChevronLeft /> : <FaChevronRight />}
                </div>
              </div>
              {/* Flyout Sub-dropdown */}
              <AnimatePresence>
                {hoveredIdx === i && (
                  <SubDropdown
                    items={child.children}
                    isRtl={isRtl}
                    isDarkMode={isDarkMode}
                    onClose={onClose}
                  />
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Regular Link Item */
            <Link
              key={i}
              to={child.to}
              onClick={onClose}
              className="dropdown-item-premium"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 12,
                textDecoration: 'none',
                marginBottom: 2,
                transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,48,135,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDarkMode ? 'rgba(255,255,255,0.75)' : '#003087',
                fontSize: '0.9rem', flexShrink: 0, transition: 'all 0.18s ease',
              }} className="dropdown-icon-box">
                {child.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 700, fontSize: '0.87rem',
                  color: isDarkMode ? '#dbe8ff' : '#1a2850',
                  fontFamily: 'Cairo, Tajawal, sans-serif', lineHeight: 1.3,
                }}>
                  {isRtl ? child.label : (child.labelEn || child.label)}
                </div>
                {(child.desc || child.descEn) && (
                  <div style={{
                    fontSize: '0.72rem',
                    color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,48,135,0.45)',
                    marginTop: 1, fontFamily: 'Cairo, Tajawal, sans-serif',
                  }}>
                    {isRtl ? child.desc : child.descEn}
                  </div>
                )}
              </div>
              <div style={{
                color: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,48,135,0.25)',
                fontSize: '0.65rem', flexShrink: 0,
              }}>
                {isRtl ? <FaArrowLeft /> : <FaArrowRight />}
              </div>
            </Link>
          )
        ))}
      </div>
    </motion.div>
  );
};

/* ─── NavItem ───────────────────────────────────────────────────── */
const NavItem = ({ item, isActive, isRtl }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = isRtl ? item.label : item.labelEn;

  if (item.children) {
    return (
      <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setOpen(o => !o)}
          className={`nav-btn-glass${open ? ' nav-btn-open' : ''}`}
          style={{
            background: open ? 'rgba(0,48,135,0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'Cairo, Tajawal, sans-serif',
            fontWeight: 600, fontSize: '0.88rem',
            padding: '8px 12px', borderRadius: 12,
            transition: 'all 0.2s ease',
            width: '100%',
          }}
        >
          <span className="nav-icon-glass" style={{ fontSize: '0.85rem', display: 'flex' }}>
            {item.icon}
          </span>
          <span>{label}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', opacity: 0.6, fontSize: '0.65rem' }}
          >
            <FaChevronDown />
          </motion.span>
        </button>
        <AnimatePresence>
          {open && (
            <DropdownMenu item={item} isRtl={isRtl} onClose={() => setOpen(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      className={`nav-btn-glass${isActive ? ' nav-btn-active' : ''}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: 12,
        textDecoration: 'none',
        fontFamily: 'Cairo, Tajawal, sans-serif',
        fontWeight: isActive ? 700 : 600,
        fontSize: '0.88rem',
        transition: 'all 0.2s ease',
        background: isActive ? 'rgba(0,48,135,0.12)' : 'transparent',
      }}
    >
      <span className="nav-icon-glass" style={{ fontSize: '0.85rem', display: 'flex' }}>
        {item.icon}
      </span>
      <span>{label}</span>
      {isActive && (
        <motion.span
          layoutId="active-pill"
          style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 20, height: 3, borderRadius: 99,
            background: 'var(--primary)',
          }}
        />
      )}
    </Link>
  );
};

/* ─── Navbar ────────────────────────────────────────────────────── */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const location = useLocation();
  const { locale, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const isRtl = locale === 'ar';

  const [dbPages, setDbPages] = useState([]);

  useEffect(() => {
    api.getPages()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.data || []);
        setDbPages(arr);
      })
      .catch(err => console.error('Navbar error fetching pages:', err));
  }, [location.pathname]);

  const parentMapping = useMemo(() => ({
    'projects': ['المشاريع', 'projects'],
    'about': ['عن الهيئة', 'about us'],
    '%d8%a7%d9%84%d8%a3%d9%82%d8%a7%d9%84%d9%8a%d9%85-%d8%a7%d9%84%d8%aa%d8%ae%d8%b7%d9%8a%d8%b7%d9%8a%d8%a9': ['الأقاليم التخطيطية', 'planning regions'],
    'الأقاليم التخطيطية': ['الأقاليم التخطيطية', 'planning regions'],
  }), []);

  const navItems = useMemo(() => {
    const cloneNavStructure = (items) => {
      return items.map(item => {
        const cloned = { ...item };
        if (item.children) {
          cloned.children = cloneNavStructure(item.children);
        }
        return cloned;
      });
    };

    const clone = cloneNavStructure(NAV_STRUCTURE);
    const visiblePages = dbPages.filter(p => p.is_visible !== 0);

    const findNode = (nodes, parentId) => {
      if (!parentId) return null;
      const decodedParentId = decodeURIComponent(parentId).toLowerCase();
      
      for (const node of nodes) {
        if (node.to) {
          const parts = node.to.split('/');
          const slug = decodeURIComponent(parts[parts.length - 1] || '').toLowerCase();
          if (slug === decodedParentId) {
            return node;
          }
        }
        
        const labelAr = (node.label || '').toLowerCase();
        const labelEn = (node.labelEn || '').toLowerCase();
        if (labelAr === decodedParentId || labelEn === decodedParentId) {
          return node;
        }
        
        const mappedValues = parentMapping[decodedParentId] || parentMapping[parentId];
        if (mappedValues) {
          if (mappedValues.includes(node.label) || mappedValues.includes(node.labelEn?.toLowerCase())) {
            return node;
          }
        }
        
        if (node.children) {
          const found = findNode(node.children, parentId);
          if (found) return found;
        }
      }
      return null;
    };

    const sortedPages = [...visiblePages].sort((a, b) => {
      if ((a.order_index || 0) !== (b.order_index || 0)) {
        return (a.order_index || 0) - (b.order_index || 0);
      }
      return (a.title_ar || '').localeCompare(b.title_ar || '', 'ar');
    });

    sortedPages.forEach(page => {
      if (['about', 'contact'].includes(page.id)) return;

      if (page.parent_id) {
        const parentNode = findNode(clone, page.parent_id);
        if (parentNode && !parentNode._noDbChildren) {
          if (!parentNode.children) parentNode.children = [];
          
          const exists = parentNode.children.some(child => {
            const childSlug = child.to?.split('/').pop();
            return childSlug === page.id;
          });

          if (!exists) {
            parentNode.children.push({
              to: `/page/${encodeURIComponent(page.id)}`,
              label: page.title_ar,
              labelEn: page.title_en || page.title_ar,
              icon: <FaMapPin />
            });
          }
        }
      }
    });

    return clone;
  }, [dbPages, parentMapping]);


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setExpanded(false); }, [location]);

  const navBg = scrolled
    ? (isDarkMode
        ? 'rgba(15,20,40,0.88)'
        : 'rgba(255,255,255,0.82)')
    : 'transparent';

  const navShadow = scrolled
    ? '0 8px 40px rgba(0,48,135,0.12), 0 2px 8px rgba(0,0,0,0.06)'
    : 'none';

  const navBorder = scrolled
    ? '1px solid rgba(0,48,135,0.10)'
    : '1px solid transparent';

  const textColor = (!scrolled && !isDarkMode) ? 'rgba(255,255,255,0.95)' : 'var(--text)';
  const iconColor = (!scrolled && !isDarkMode) ? 'rgba(255,255,255,0.8)' : 'rgba(0,48,135,0.6)';

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          backgroundColor: navBg,
          backdropFilter: scrolled ? 'blur(24px) saturate(200%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(200%)' : 'none',
          boxShadow: navShadow,
          border: 'none',
          borderBottom: navBorder,
          transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
          padding: scrolled ? '0.4rem 0' : '0.8rem 0',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        <div className="container-fluid px-3 px-lg-5 d-flex align-items-center justify-content-between">

          {/* ── Brand ─────────────────────────────────────────── */}
          <Link to="/" className="d-flex align-items-center gap-3 text-decoration-none">
            <motion.div
              whileHover={{ scale: 1.06, rotate: 3 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: 46, height: 46, borderRadius: 13,
                background: scrolled
                  ? (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,48,135,0.06)')
                  : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: scrolled
                  ? '0 4px 16px rgba(0,48,135,0.12)'
                  : '0 4px 20px rgba(0,0,0,0.2)',
                flexShrink: 0, padding: '5px',
                border: scrolled
                  ? '1px solid rgba(0,48,135,0.1)'
                  : '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.4s ease',
              }}
            >
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </motion.div>
            <div>
              <div style={{
                fontFamily: 'Cairo', fontWeight: 800, fontSize: '1rem',
                color: scrolled ? 'var(--primary)' : (isDarkMode ? 'var(--primary)' : '#fff'),
                lineHeight: 1.2, transition: 'color 0.4s',
              }}>
                {isRtl ? 'الهيئة الوطنية' : 'National Authority'}
              </div>
              <div style={{
                fontSize: '0.73rem', fontWeight: 600, lineHeight: 1.2,
                color: scrolled ? 'var(--text-muted)' : (isDarkMode ? 'var(--text-muted)' : 'rgba(255,255,255,0.75)'),
                transition: 'color 0.4s',
              }}>
                {isRtl ? 'للتخطيط العمراني' : 'for Urban Planning'}
              </div>
            </div>
          </Link>

          {/* ── Desktop Nav ───────────────────────────────────── */}
          <div
            className="d-none d-lg-flex align-items-center gap-0 flex-wrap justify-content-center"
            style={{ flex: 1, padding: '0 12px' }}
          >
            {navItems.map((item, i) => (
              <NavItem
                key={i}
                item={item}
                isActive={item.to && location.pathname === item.to}
                isRtl={isRtl}
                textColor={textColor}
                iconColor={iconColor}
                scrolled={scrolled}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>

          {/* ── Action Buttons ────────────────────────────────── */}
          <div className="d-none d-lg-flex align-items-center gap-2">
            {/* Language */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLanguage}
              className="action-btn-glass"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                fontWeight: 700, fontSize: '0.82rem',
                fontFamily: 'Cairo, Tajawal, sans-serif',
              }}
            >
              <FaGlobe size={13} />
              <span>{isRtl ? 'English' : 'العربية'}</span>
            </motion.button>

            {/* Theme */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="action-btn-glass icon-only"
              style={{ padding: '8px 10px', borderRadius: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
            >
              <motion.span
                key={isDarkMode ? 'sun' : 'moon'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex' }}
              >
                {isDarkMode ? <FaSun size={15} /> : <FaMoon size={15} />}
              </motion.span>
            </motion.button>

            {/* Login */}
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="login-btn-glass"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 12, cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.85rem',
                  fontFamily: 'Cairo, Tajawal, sans-serif',
                  border: 'none',
                }}
              >
                <FaSignInAlt size={13} />
                <span>{isRtl ? 'تسجيل الدخول' : 'Login'}</span>
              </motion.button>
            </Link>
          </div>

          {/* ── Mobile Toggle ─────────────────────────────────── */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="d-lg-none action-btn-glass icon-only"
            onClick={() => setExpanded(!expanded)}
            style={{ padding: '8px 10px', borderRadius: 12, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center' }}
            aria-label="Toggle Menu"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={expanded ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', fontSize: '1.1rem' }}
              >
                {expanded ? <FaTimes /> : <FaBars />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── Mobile Menu ───────────────────────────────────────── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                overflow: 'hidden',
                borderTop: '1px solid rgba(0,48,135,0.08)',
                background: isDarkMode ? 'rgba(15,20,40,0.97)' : 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(24px)',
              }}
            >
              {/* Scrollable inner container */}
              <div style={{ maxHeight: '80vh', overflowY: 'auto', overflowX: 'hidden' }}>
                <div className="container py-3">
                  {navItems.map((item, i) => (
                    <div key={i} style={{ borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,48,135,0.06)'}` }}>
                      {item.children ? (
                        <>
                          {/* Accordion header — tappable to expand/collapse */}
                          <button
                            onClick={() => setOpenSections(prev => ({ ...prev, [i]: !prev[i] }))}
                            style={{
                              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '13px 12px', gap: 8,
                              fontWeight: 700, color: 'var(--primary)', fontSize: '0.92rem',
                              fontFamily: 'Cairo, Tajawal, sans-serif',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>
                              {isRtl ? item.label : item.labelEn}
                            </span>
                            <motion.span
                              animate={{ rotate: openSections[i] ? 180 : 0 }}
                              transition={{ duration: 0.25 }}
                              style={{ display: 'flex', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                            >
                              <FaChevronDown />
                            </motion.span>
                          </button>
                          {/* Accordion content */}
                          <AnimatePresence>
                            {openSections[i] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22 }}
                                style={{ overflow: 'hidden' }}
                              >
                                {item.children.map((child, j) => (
                                  child.children ? (
                                    <div key={j}>
                                      <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '7px 28px', color: 'var(--primary)',
                                        fontSize: '0.82rem', fontWeight: 700,
                                        fontFamily: 'Cairo, Tajawal, sans-serif',
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,48,135,0.03)',
                                      }}>
                                        <span style={{ fontSize: '0.78rem' }}>{child.icon}</span>
                                        {isRtl ? child.label : (child.labelEn || child.label)}
                                      </div>
                                      {child.children.map((grandchild, k) => (
                                        <Link
                                          key={k}
                                          to={grandchild.to}
                                          onClick={() => setExpanded(false)}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '9px 44px', color: 'var(--text)',
                                            textDecoration: 'none', fontSize: '0.84rem', fontWeight: 500,
                                            fontFamily: 'Cairo, Tajawal, sans-serif',
                                            borderRight: isRtl ? '2px solid var(--primary)' : 'none',
                                            borderLeft: isRtl ? 'none' : '2px solid var(--primary)',
                                            minHeight: 44,
                                          }}
                                        >
                                          <span style={{ color: 'var(--primary)', fontSize: '0.76rem', flexShrink: 0 }}>{grandchild.icon}</span>
                                          {isRtl ? grandchild.label : (grandchild.labelEn || grandchild.label)}
                                        </Link>
                                      ))}
                                    </div>
                                  ) : (
                                    <Link
                                      key={j}
                                      to={child.to}
                                      onClick={() => setExpanded(false)}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 28px', color: 'var(--text)',
                                        textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500,
                                        fontFamily: 'Cairo, Tajawal, sans-serif',
                                        minHeight: 44,
                                      }}
                                    >
                                      <span style={{ color: 'var(--primary)', fontSize: '0.8rem', flexShrink: 0 }}>{child.icon}</span>
                                      {isRtl ? child.label : child.labelEn}
                                    </Link>
                                  )
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={item.to}
                          onClick={() => setExpanded(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '13px 12px', color: 'var(--text)',
                            textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem',
                            fontFamily: 'Cairo, Tajawal, sans-serif',
                            minHeight: 44,
                          }}
                        >
                          <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{item.icon}</span>
                          {isRtl ? item.label : item.labelEn}
                        </Link>
                      )}
                    </div>
                  ))}
                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    <button className="action-btn-glass" onClick={toggleLanguage} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Cairo, Tajawal, sans-serif', border: 'none', minHeight: 44 }}>
                      <FaGlobe size={13} />{isRtl ? 'English' : 'العربية'}
                    </button>
                    <button className="action-btn-glass icon-only" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: 'none', minHeight: 44 }}>
                      {isDarkMode ? <FaSun size={15} /> : <FaMoon size={15} />}
                    </button>
                    <Link to="/login" onClick={() => setExpanded(false)}>
                      <button className="login-btn-glass" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Cairo, Tajawal, sans-serif', border: 'none', minHeight: 44 }}>
                        <FaSignInAlt size={13} />{isRtl ? 'تسجيل الدخول' : 'Login'}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Spacer so content doesn't hide under fixed nav ─── */}
      <div style={{ height: scrolled ? '66px' : '0px', transition: 'height 0.4s ease' }} className="navbar-spacer" />

      <style>{`
        /* ── Nav button glass ── */
        .nav-btn-glass {
          position: relative;
          color: ${(!scrolled && !isDarkMode) ? 'rgba(255,255,255,0.92)' : 'var(--text)'};
        }
        .nav-btn-glass:hover {
          background: ${(!scrolled && !isDarkMode)
            ? 'rgba(255,255,255,0.15) !important'
            : 'rgba(0,48,135,0.08) !important'};
          color: ${(!scrolled && !isDarkMode) ? '#fff !important' : 'var(--primary) !important'};
        }
        .nav-btn-active {
          color: ${(!scrolled && !isDarkMode) ? '#fff !important' : 'var(--primary) !important'};
        }
        .nav-icon-glass {
          opacity: 0.75;
          transition: opacity 0.2s, transform 0.2s;
        }
        .nav-btn-glass:hover .nav-icon-glass,
        .nav-btn-open .nav-icon-glass,
        .nav-btn-active .nav-icon-glass {
          opacity: 1;
          transform: scale(1.15);
        }

        /* ── Action buttons ── */
        .action-btn-glass {
          background: ${(!scrolled && !isDarkMode)
            ? 'rgba(255,255,255,0.15)'
            : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,48,135,0.06)')};
          border: 1px solid ${(!scrolled && !isDarkMode)
            ? 'rgba(255,255,255,0.25)'
            : 'rgba(0,48,135,0.12)'};
          color: ${(!scrolled && !isDarkMode) ? 'rgba(255,255,255,0.92)' : 'var(--text)'};
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }
        .action-btn-glass:hover {
          background: ${(!scrolled && !isDarkMode)
            ? 'rgba(255,255,255,0.25)'
            : 'rgba(0,48,135,0.1)'} !important;
          border-color: ${(!scrolled && !isDarkMode)
            ? 'rgba(255,255,255,0.4)'
            : 'rgba(0,48,135,0.2)'} !important;
          color: ${(!scrolled && !isDarkMode) ? '#fff' : 'var(--primary)'} !important;
          transform: translateY(-1px);
        }

        /* ── Login button ── */
        .login-btn-glass {
          background: ${(!scrolled && !isDarkMode)
            ? 'rgba(255,255,255,0.22)'
            : 'linear-gradient(135deg,#003087,#0057c8)'};
          border: 1px solid ${(!scrolled && !isDarkMode)
            ? 'rgba(255,255,255,0.35)'
            : 'transparent'};
          color: #fff !important;
          transition: all 0.25s ease;
          backdrop-filter: blur(10px);
          box-shadow: ${(!scrolled && !isDarkMode)
            ? '0 4px 15px rgba(0,0,0,0.15)'
            : '0 4px 15px rgba(0,48,135,0.3)'};
        }
        .login-btn-glass:hover {
          background: ${(!scrolled && !isDarkMode)
            ? 'rgba(255,255,255,0.32)'
            : 'linear-gradient(135deg,#0041b0,#006ae8)'} !important;
          box-shadow: ${(!scrolled && !isDarkMode)
            ? '0 6px 20px rgba(0,0,0,0.2)'
            : '0 6px 20px rgba(0,48,135,0.4)'} !important;
        }

        /* ── Dropdown item hover ── */
        .dropdown-item-premium:hover {
          background: ${isDarkMode ? 'rgba(56, 194, 255, 0.12)' : 'rgba(0,48,135,0.06)'} !important;
        }
        .dropdown-item-premium:hover .dropdown-icon-box {
          background: ${isDarkMode
            ? 'linear-gradient(135deg, rgba(56, 194, 255, 0.25), rgba(0, 120, 255, 0.3))'
            : 'linear-gradient(135deg, rgba(0,48,135,0.18), rgba(0,120,255,0.14))'} !important;
          transform: scale(1.08);
        }
        .dropdown-item-premium:hover > div:nth-child(2) > div:first-child {
          color: ${isDarkMode ? '#38c2ff' : '#003087'} !important;
        }

        /* ── Navbar spacer (only when not scrolled at top of page) ── */
        .navbar-spacer {
          display: none;
        }
      `}</style>
    </>
  );
};

export default Navbar;
