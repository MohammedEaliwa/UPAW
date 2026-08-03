import React from 'react';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import * as FaIcons from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { api } from '../../../services/api';
import { UPLOADS_URL } from '../../../config/apiEndpoints';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import './about.css';

const About = () => {
  const { locale, t } = useLanguage();
  const isRtl = locale === 'ar';
  
  const [pageData, setPageData] = React.useState(null);
  const [isLargeScreen, setIsLargeScreen] = React.useState(window.innerWidth >= 992);
  const [mobileActiveLevel, setMobileActiveLevel] = React.useState('offices'); // 'offices' | 'admins'
  const [selectedNodeModal, setSelectedNodeModal] = React.useState(null);

  React.useEffect(() => {
    const loadData = () => {
      Promise.all([
        api.getPageAbout().catch(() => ({})),
        api.getDirectors().catch(() => []),
      ]).then(([d, directors]) => {
        const presidentRow = directors.find(r => r.role === 'president') || null;
        const offices      = directors.filter(r => r.role === 'office').sort((a, b) => a.order_index - b.order_index);
        const admins       = directors.filter(r => r.role === 'administration').sort((a, b) => a.order_index - b.order_index);

        const tree = {
          president: presidentRow
            ? { name_ar: presidentRow.name_ar || '', name_en: presidentRow.name_en || '', title_ar: presidentRow.title_ar || 'رئيس الهيئة', title_en: presidentRow.title_en || 'Head of the Authority', img: presidentRow.img || '' }
            : { name_ar: '', name_en: '', title_ar: 'رئيس الهيئة', title_en: 'Head of the Authority', img: '' },
          offices,
          administrations: admins,
        };

        setPageData({ ...d, leadership_tree: tree });
      });
    };

    loadData();

    window.addEventListener('upaw:data-updated', loadData);

    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 992);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('upaw:data-updated', loadData);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getDynamicIcon = (iconName) => {
    const Icon = FaIcons[iconName];
    return Icon ? <Icon /> : <FaIcons.FaCheckCircle />;
  };

  const getNodeIcon = (titleAr = '', titleEn = '') => {
    const ar = (titleAr || '').toLowerCase();
    const en = (titleEn || '').toLowerCase();

    if (ar.includes('خطة وطنية') || ar.includes('الخطة الوطنية') || en.includes('national plan')) {
      return FaIcons.FaProjectDiagram;
    }
    if (ar.includes('جغرافية') || ar.includes('جغرافي') || en.includes('gis') || en.includes('geographic') || ar.includes('توثيق') || en.includes('documentation')) {
      return FaIcons.FaMapMarkedAlt;
    }
    if (ar.includes('قانون') || ar.includes('تشريع') || en.includes('legal') || en.includes('law')) {
      return FaIcons.FaBalanceScale;
    }
    if (ar.includes('موارد بشرية') || ar.includes('موظف') || en.includes('hr') || en.includes('human resource') || en.includes('personnel')) {
      return FaIcons.FaUsers;
    }
    if (ar.includes('طبيعي') || en.includes('physical')) {
      return FaIcons.FaDraftingCompass;
    }
    if (ar.includes('حضري') || en.includes('urban') || ar.includes('مدن') || en.includes('city') || en.includes('cities')) {
      return FaIcons.FaCity;
    }
    if (ar.includes('فرع') || ar.includes('فروع') || en.includes('branch') || en.includes('network')) {
      return FaIcons.FaNetworkWired;
    }
    if (ar.includes('مراجعة') || ar.includes('رقاب') || en.includes('audit') || en.includes('control')) {
      return FaIcons.FaClipboardCheck;
    }
    if (ar.includes('تفتيش') || en.includes('inspection')) {
      return FaIcons.FaSearch;
    }
    if (ar.includes('دولي') || ar.includes('خارجي') || en.includes('international') || en.includes('cooperation')) {
      return FaIcons.FaGlobe;
    }
    if (ar.includes('متابعة') || en.includes('follow') || en.includes('monitor')) {
      return FaIcons.FaTasks;
    }
    if (ar.includes('انشاء') || ar.includes('صيان') || ar.includes('مشروع') || en.includes('construction') || en.includes('maintenance') || en.includes('project')) {
      return FaIcons.FaHammer;
    }
    if (ar.includes('مالية') || ar.includes('حساب') || ar.includes('ميزان') || en.includes('financ') || en.includes('budget') || en.includes('account')) {
      return FaIcons.FaMoneyBillWave;
    }
    if (ar.includes('رئيس') || en.includes('president') || en.includes('head')) {
      return FaIcons.FaUserTie;
    }
    if (ar.includes('إدارية') || ar.includes('ادارية') || en.includes('admin')) {
      return FaIcons.FaCogs;
    }

    return FaIcons.FaLandmark;
  };

  const renderTreeCard = (node, index = 0, type = 'office') => {
    if (!node) return null;
    
    const isOffice = type === 'office';
    const themeColor = isOffice ? '#0ea5e9' : '#003087';
    
    const sideBarGradient = isOffice
      ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
      : 'linear-gradient(180deg, #1a4faa 0%, #001d5a 100%)';
      
    const avatarBorder = isOffice ? '#0ea5e9' : '#003087';
    const avatarGlow = isOffice ? 'rgba(14, 165, 233, 0.25)' : 'rgba(0, 48, 135, 0.25)';
    
    const fallbackAvatarBg = isOffice
      ? 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(2,132,199,0.2) 100%)'
      : 'linear-gradient(135deg, rgba(26,79,170,0.12) 0%, rgba(0,29,90,0.2) 100%)';
      
    const badgeGradient = isOffice
      ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
      : 'linear-gradient(135deg, #003087 0%, #001d5a 100%)';
      
    const hoverShadowColor = isOffice
      ? 'rgba(14,165,233,0.22)'
      : 'rgba(0,48,135,0.25)';
      
    const directorNameColor = isOffice ? '#0284c7' : '#003087';

    const DeptIcon = getNodeIcon(node.title_ar, node.title_en);

    return (
      <Col key={node.id}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.04 }}
          onClick={() => setSelectedNodeModal({ ...node, type })}
          style={{
            background: 'var(--card-bg)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            direction: isRtl ? 'rtl' : 'ltr',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
            position: 'relative',
          }}
          whileHover={{ 
            y: -5, 
            scale: 1.015,
            borderColor: themeColor,
            boxShadow: `0 12px 32px ${hoverShadowColor}`, 
            transition: { duration: 0.12, type: 'tween' } 
          }}
        >
          {/* Side Accent Bar */}
          <div style={{
            width: 4, flexShrink: 0,
            background: sideBarGradient,
            borderRadius: isRtl ? '0 16px 16px 0' : '16px 0 0 16px',
          }} />

          {/* Avatar / Director Photo */}
          <div style={{
            width: 68, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px 10px',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
              border: `2px solid ${avatarBorder}`,
              boxShadow: `0 0 0 3px ${avatarGlow}`,
              background: fallbackAvatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {node.img ? (
                <img src={node.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FaIcons.FaUserTie size={20} color={themeColor} style={{ opacity: 0.8 }} />
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{
            flex: 1, minWidth: 0,
            padding: '12px 14px 12px 4px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            textAlign: isRtl ? 'right' : 'left',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: node.name_ar ? 5 : 0,
            }}>
              <span style={{
                color: themeColor,
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <DeptIcon size={15} />
              </span>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--text)',
                lineHeight: 1.4,
              }}>
                {isRtl ? node.title_ar : node.title_en}
              </div>
            </div>

            {/* Director Name */}
            {node.name_ar ? (
              <div style={{
                fontSize: '0.75rem',
                color: directorNameColor,
                fontWeight: 600,
                display: 'flex', alignItems: 'center',
                gap: 4,
              }}>
                <FaIcons.FaUserTie size={10} style={{ opacity: 0.7 }} />
                <span>
                  {isRtl ? node.name_ar : node.name_en}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {isRtl ? 'لم يُعيَّن مدير' : 'No Director Assigned'}
              </div>
            )}
          </div>

          {/* Index Badge */}
          <div style={{
            position: 'absolute',
            top: 8,
            [isRtl ? 'left' : 'right']: 10,
            width: 20, height: 20,
            borderRadius: '50%',
            background: badgeGradient,
            color: '#fff',
            fontSize: '0.62rem',
            fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {index + 1}
          </div>
        </motion.div>
      </Col>
    );
  };

  const renderPresidentCard = (node) => {
    if (!node) return null;
    return (
      <motion.div 
        whileHover={{ scale: 1.03, y: -4 }}
        onClick={() => setSelectedNodeModal({ ...node, type: 'president' })}
        style={{
          background: 'var(--card-bg)',
          borderRadius: 22,
          border: '2px solid var(--primary)',
          boxShadow: '0 8px 32px rgba(0,48,135,0.18)',
          overflow: 'hidden',
          width: 240,
          flexShrink: 0,
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          cursor: 'pointer'
        }}
      >
        <div style={{ width: '100%', height: 220, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #001225 0%, #003087 100%)' }}>
          {node.img ? (
            <img
              src={node.img}
              alt={isRtl ? node.name_ar : node.name_en}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaIcons.FaUser size={72} color="rgba(255,255,255,0.3)" />
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,20,70,0.6) 0%, transparent 55%)' }} />
        </div>
        <div style={{ padding: '16px 16px 20px', background: 'var(--card-bg)' }}>
          <h5 style={{ fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', fontSize: '1.08rem' }}>
            {isRtl ? node.name_ar : node.name_en}
          </h5>
          <span style={{
            background: 'linear-gradient(135deg, #003087 0%, #0066cc 100%)',
            color: '#fff',
            fontSize: '0.76rem',
            fontWeight: 700,
            padding: '5px 16px',
            borderRadius: 99,
            display: 'inline-block',
          }}>
            {isRtl ? node.title_ar : node.title_en}
          </span>
        </div>
      </motion.div>
    );
  };

  const renderSection = (section) => {
    if (!section) return null;
    
    switch (section.type) {
      case 'text_image':
        return (
          <Row className={`g-5 align-items-center mb-5 flex-md-row${section.alignment === 'left' ? '-reverse' : ''}`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <Col md={6}>
              <h3 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: '1.25rem', textAlign: isRtl ? 'right' : 'left' }}>
                {isRtl ? section.title_ar : section.title_en}
              </h3>
              <div 
                style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.8, textAlign: isRtl ? 'right' : 'left' }}
                dangerouslySetInnerHTML={{ __html: isRtl ? section.content_ar : section.content_en }}
              />
            </Col>
            <Col md={6}>
              <div style={{
                position: 'relative',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border)',
                height: 320,
              }}>
                {section.image_url ? (
                  <img
                    src={section.image_url}
                    alt={isRtl ? section.title_ar : section.title_en}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>
                    <FaIcons.FaImage size={48} />
                  </div>
                )}
              </div>
            </Col>
          </Row>
        );
        
      case 'profile_card':
        return (
          <div className="d-flex justify-content-center my-5">
            <div className="card-custom text-center overflow-hidden w-100" style={{ maxWidth: 450, border: '1px solid var(--border)' }}>
              <div style={{ height: 260, overflow: 'hidden', position: 'relative', background: '#eee' }}>
                {section.image_url ? (
                  <img
                    src={section.image_url}
                    alt={isRtl ? section.profile_name_ar : section.profile_name_en}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(0,0,0,0.05)' }}>
                    <FaIcons.FaUser size={60} color="#ccc" />
                  </div>
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,29,90,0.85) 0%, transparent 60%)',
                }} />
                <div style={{ position: 'absolute', bottom: 15, left: 0, right: 0 }}>
                  <h4 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>
                    {isRtl ? section.profile_name_ar : section.profile_name_en}
                  </h4>
                </div>
              </div>
              <div className="p-4" style={{ background: 'var(--card-bg)' }}>
                <div className="mb-3">
                  <span style={{
                    background: 'rgba(0,48,135,0.08)', color: 'var(--primary)',
                    fontSize: '0.82rem', fontWeight: 700, padding: '5px 15px',
                    borderRadius: 99, border: '1px solid rgba(0,48,135,0.15)',
                  }}>
                    {isRtl ? section.profile_title_ar : section.profile_title_en}
                  </span>
                </div>
                {(isRtl ? section.bio_ar : section.bio_en) && (
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', lineHeight: 1.7 }}>
                    {isRtl ? section.bio_ar : section.bio_en}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'cards_grid':
        return (
          <div className="my-5">
            {section.title_ar && (
              <div className="text-center mb-4">
                <div className="section-tag d-inline-flex">
                  <FaIcons.FaLayerGroup size={14} /> {isRtl ? 'تعاريف' : 'Definitions'}
                </div>
                <h3 className="section-title">{isRtl ? section.title_ar : section.title_en}</h3>
                <div className="section-divider mx-auto" />
              </div>
            )}
            <Row className="g-4">
              {(section.items || []).map((item, idx) => (
                <Col md={6} lg={4} key={idx}>
                  <div style={{
                    display: 'flex', gap: 16, padding: '20px 22px',
                    background: 'var(--card-bg)', borderRadius: 16,
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    height: '100%',
                    flexDirection: 'row',
                    textAlign: isRtl ? 'right' : 'left'
                  }}>
                    <div style={{
                      width: 48, height: 48, flexShrink: 0, borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(0,48,135,0.08), rgba(0,168,232,0.08))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--primary)', fontSize: '1.1rem',
                    }}>
                      {getDynamicIcon(item.icon)}
                    </div>
                    <div>
                      <h6 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
                        {isRtl ? item.title_ar : item.title_en}
                      </h6>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
                        {isRtl ? item.desc_ar : item.desc_en}
                      </p>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        );
        
      case 'info_banner':
        return (
          <div className="my-5" style={{
            background: section.banner_bg === 'dark' 
              ? 'linear-gradient(135deg, #0b1528 0%, #112240 100%)'
              : section.banner_bg === 'gradient'
              ? 'linear-gradient(135deg, #003087 0%, #00a8e8 100%)'
              : 'linear-gradient(135deg, #001d5a 0%, #003087 60%, #0066cc 100%)',
            borderRadius: 24, padding: '50px 40px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
            <div className="position-relative">
              <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '0.75rem' }}>
                {isRtl ? section.title_ar : section.title_en}
              </h3>
              {(isRtl ? section.banner_desc_ar : section.banner_desc_en) && (
                <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '2rem', fontSize: '1rem', maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }}>
                  {isRtl ? section.banner_desc_ar : section.banner_desc_en}
                </p>
              )}
              {(isRtl ? section.banner_btn_text_ar : section.banner_btn_text_en) && (
                <PrimaryButton 
                  to={section.banner_btn_link || '#'} 
                  variant="primary"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}
                >
                  <FaIcons.FaArrowLeft size={14} style={{ transform: isRtl ? 'none' : 'rotate(180deg)' }} />
                  {isRtl ? section.banner_btn_text_ar : section.banner_btn_text_en}
                </PrimaryButton>
              )}
            </div>
          </div>
        );
        
      case 'stats_grid':
        return (
          <div className="my-5">
            {section.title_ar && (
              <div className="text-center mb-4">
                <h3 style={{ fontWeight: 800, color: 'var(--text)' }}>
                  {isRtl ? section.title_ar : section.title_en}
                </h3>
              </div>
            )}
            <Row className="g-4 justify-content-center">
              {(section.items || []).map((item, idx) => (
                <Col xs={6} md={3} key={idx}>
                  <div style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '24px 16px', textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)', height: '100%',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 99,
                      background: 'rgba(0,48,135,0.06)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.15rem', marginBottom: 12
                    }}>
                      {getDynamicIcon(item.icon)}
                    </div>
                    <h3 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--primary)', margin: '0 0 4px' }}>
                      {item.value}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {isRtl ? item.label_ar : item.label_en}
                    </span>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #001225 0%, #001d5a 40%, #003087 80%, #0066cc 100%)',
        padding: '80px 0 60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, left: isRtl ? '40%' : 'auto', right: isRtl ? 'auto' : '40%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,168,232,0.1) 0%, transparent 70%)' }} />
        <Container className="position-relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 16px', borderRadius: 99, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
              <FaIcons.FaBuilding size={12} /> {t('nav.about')}
            </div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
              {t('nav.about')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', maxWidth: 650, lineHeight: 1.75 }}>
              {t('home.heroSubtitle')}
            </p>
          </motion.div>
        </Container>
      </div>

      <Container style={{ marginTop: 60 }}>
        {/* Dynamic Content from Database / Skeleton Loader */}
        {!pageData ? (
          <div>
            <Row className="g-4 mb-5">
              <Col lg={12}>
                <div className="card-custom p-5 skeleton-pulse" style={{ height: 280 }} />
              </Col>
            </Row>

            <div style={{ marginBottom: '4rem' }}>
              <div className="text-center mb-5">
                <div className="skeleton-pulse mx-auto" style={{ width: 140, height: 24, marginBottom: 12, borderRadius: 99 }} />
                <div className="skeleton-pulse mx-auto" style={{ width: 220, height: 36, marginBottom: 12 }} />
                <div className="skeleton-pulse mx-auto" style={{ width: 60, height: 4 }} />
              </div>
              <Row className="g-4">
                {[1, 2, 3].map(i => (
                  <Col md={6} lg={4} key={i}>
                    <div className="skeleton-pulse" style={{ height: 110, borderRadius: 16 }} />
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        ) : (
          <Row className="g-4 mb-5">
            <Col lg={12}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div 
                  className="card-custom p-5 h-100" 
                  style={{ textAlign: isRtl ? 'right' : 'left', fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text)' }}
                  dangerouslySetInnerHTML={{ __html: isRtl ? pageData.content_ar : pageData.content_en }}
                />
              </motion.div>
            </Col>
          </Row>
        )}

        {/* Dynamic Sections */}
        {pageData?.sections && pageData.sections.length > 0 && (
          <div className="dynamic-sections mb-5">
            {pageData.sections.map((section, idx) => (
              <motion.div
                key={section.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="mb-5"
              >
                {renderSection(section)}
              </motion.div>
            ))}
          </div>
        )}

        {/* Tasks */}
        {pageData?.tasks && pageData.tasks.length > 0 && (
          <div style={{ marginBottom: '4rem' }}>
            <div className="text-center mb-5">
              <div className="section-tag d-inline-flex">
                <FaIcons.FaStar size={14} /> {t('about.tasksTag')}
              </div>
              <h2 className="section-title">{t('about.tasksTitle')}</h2>
              <div className="section-divider mx-auto" />
            </div>
            <Row className="g-4">
              {pageData.tasks.map((task, idx) => (
                <Col md={6} lg={4} key={idx}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div style={{
                      display: 'flex', gap: 16, padding: '20px 22px',
                      background: 'var(--card-bg)', borderRadius: 16,
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      height: '100%',
                      flexDirection: 'row',
                      textAlign: isRtl ? 'right' : 'left'
                    }}>
                      <div style={{
                        width: 48, height: 48, flexShrink: 0, borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(0,48,135,0.08), rgba(0,168,232,0.08))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)', fontSize: '1.1rem',
                      }}>
                        {getDynamicIcon(task.icon)}
                      </div>
                      <div>
                        <h6 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
                          {isRtl ? task.title_ar : task.title_en}
                        </h6>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
                          {isRtl ? task.desc_ar : task.desc_en}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Leadership Tree Section */}
        {pageData?.leadership_tree && (
          <div style={{ marginBottom: '5rem', direction: 'rtl' }}>

            {/* Header Banner Frame (كادر فاخر مخصص لعنوان القيادة فقط بطابع عمراني) */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                background: 'linear-gradient(135deg, #001225 0%, #001d5a 40%, #003087 80%, #0066cc 100%)',
                borderRadius: 24,
                padding: '40px 30px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0, 30, 90, 0.25)',
                border: '1px solid rgba(0, 168, 232, 0.35)',
                marginBottom: '3rem',
              }}
            >
              {/* Urban Blueprint Grid Overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(rgba(0, 168, 232, 0.18) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
                pointerEvents: 'none',
                opacity: 0.5
              }} />
              <div style={{
                position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
                width: 450, height: 450,
                background: 'radial-gradient(circle, rgba(0, 168, 232, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {/* Architectural Bracket Corner Accents */}
              <div style={{ position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderTop: '2px solid rgba(0, 168, 232, 0.6)', borderRight: '2px solid rgba(0, 168, 232, 0.6)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 14, left: 14, width: 24, height: 24, borderTop: '2px solid rgba(0, 168, 232, 0.6)', borderLeft: '2px solid rgba(0, 168, 232, 0.6)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 14, right: 14, width: 24, height: 24, borderBottom: '2px solid rgba(0, 168, 232, 0.6)', borderRight: '2px solid rgba(0, 168, 232, 0.6)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 14, width: 24, height: 24, borderBottom: '2px solid rgba(0, 168, 232, 0.6)', borderLeft: '2px solid rgba(0, 168, 232, 0.6)', pointerEvents: 'none' }} />

              <div className="position-relative" style={{ zIndex: 2 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '5px 20px', borderRadius: 99,
                  color: '#38bdf8', fontSize: '0.85rem', fontWeight: 800,
                  backdropFilter: 'blur(10px)', marginBottom: 12,
                }}>
                  <FaIcons.FaUsers size={14} /> {t('about.leadershipTag')}
                </div>
                
                <h2 style={{ color: '#ffffff', fontWeight: 900, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', margin: '0 0 10px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  {t('about.leadershipTitle')}
                </h2>
                
                <div style={{ width: 70, height: 4, background: 'linear-gradient(90deg, #38bdf8 0%, #00a8e8 100%)', borderRadius: 99, margin: '0 auto 20px' }} />

                {/* 3 Dynamic Summary Chips: Offices | President | Administrations */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                  {/* Offices chip – RIGHT */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.25) 0%, rgba(2,132,199,0.15) 100%)',
                    border: '1px solid rgba(14,165,233,0.5)',
                    padding: '10px 22px', borderRadius: 14,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    backdropFilter: 'blur(10px)', minWidth: 120
                  }}>
                    <FaIcons.FaBriefcase size={18} color="#38bdf8" />
                    <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>
                      {(pageData.leadership_tree.offices || []).length}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 700 }}>
                      {isRtl ? 'مكتب تابع' : 'Offices'}
                    </span>
                  </div>

                  {/* President chip – CENTER */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    padding: '10px 22px', borderRadius: 14,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    backdropFilter: 'blur(10px)', minWidth: 120,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                  }}>
                    <FaIcons.FaUserTie size={18} color="#fff" />
                    <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>1</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', fontWeight: 700 }}>
                      {isRtl ? 'رئيس الهيئة' : 'Head of Auth.'}
                    </span>
                  </div>

                  {/* Administrations chip – LEFT */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0,48,135,0.4) 0%, rgba(0,29,90,0.3) 100%)',
                    border: '1px solid rgba(0,168,232,0.4)',
                    padding: '10px 22px', borderRadius: 14,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    backdropFilter: 'blur(10px)', minWidth: 120
                  }}>
                    <FaIcons.FaLandmark size={18} color="#38bdf8" />
                    <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>
                      {(pageData.leadership_tree.administrations || []).length}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 700 }}>
                      {isRtl ? 'إدارة رئيسية' : 'Administrations'}
                    </span>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Leadership Tree Content Outside Frame */}
            {isLargeScreen ? (
              /* --- Desktop Org Chart Layout --- */
              <div style={{ position: 'relative', marginTop: 10 }}>
                {/* Level 1: President Card */}
                <div className="d-flex justify-content-center mb-2">
                  {renderPresidentCard(pageData.leadership_tree.president)}
                </div>

                {/* SVG Animated Branch Connector */}
                <div style={{ width: '100%', height: 36, position: 'relative', flexShrink: 0, margin: '10px 0' }}>
                  <svg width="100%" height="36" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                    <motion.path
                      d="M 50% 0 L 50% 36"
                      stroke="var(--primary)"
                      strokeWidth="3"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <circle r="4" fill="#0ea5e9">
                      <animateMotion path="M 50% 0 L 50% 36" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>

                {/* Level 2: Offices Section (7 offices) */}
                {(pageData.leadership_tree.offices || []).length > 0 && (
                  <div className="mb-5">
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      marginBottom: 20,
                      direction: isRtl ? 'rtl' : 'ltr',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(14,165,233,0.35)',
                      }}>
                        <FaIcons.FaBriefcase size={17} color="#fff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '1.08rem', fontWeight: 800,
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                          lineHeight: 1.2,
                        }}>
                          {isRtl ? 'المكاتب التابعة لرئيس الهيئة' : 'Offices Reporting to Head'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {isRtl
                            ? `${(pageData.leadership_tree.offices || []).length} مكتب`
                            : `${(pageData.leadership_tree.offices || []).length} offices`}
                        </div>
                      </div>
                      <div style={{
                        height: 2, flex: 2,
                        background: 'linear-gradient(90deg, rgba(14,165,233,0.4) 0%, transparent 100%)',
                        borderRadius: 99,
                      }} />
                    </div>
                    <Row className="g-3 row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-3">
                      {(pageData.leadership_tree.offices || []).map((o, i) => renderTreeCard(o, i, 'office'))}
                    </Row>
                  </div>
                )}

                {/* Level 3: Main Administrations Section */}
                {(pageData.leadership_tree.administrations || []).length > 0 && (
                  <div className="mb-4">
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      marginBottom: 20,
                      direction: isRtl ? 'rtl' : 'ltr',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #003087 0%, #001d5a 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,48,135,0.35)',
                      }}>
                        <FaIcons.FaLandmark size={17} color="#fff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '1.08rem', fontWeight: 800,
                          background: 'linear-gradient(135deg, #003087 0%, #001d5a 100%)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                          lineHeight: 1.2,
                        }}>
                          {isRtl ? 'الإدارات الرئيسية للهيئة' : 'Main Administrations'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {isRtl
                            ? `${(pageData.leadership_tree.administrations || []).length} إدارة`
                            : `${(pageData.leadership_tree.administrations || []).length} administrations`}
                        </div>
                      </div>
                      <div style={{
                        height: 2, flex: 2,
                        background: 'linear-gradient(90deg, rgba(0,48,135,0.4) 0%, transparent 100%)',
                        borderRadius: 99,
                      }} />
                    </div>
                    <Row className="g-3 row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-3">
                      {(pageData.leadership_tree.administrations || []).map((a, i) => renderTreeCard(a, i, 'admin'))}
                    </Row>
                  </div>
                )}
              </div>
            ) : (
              /* --- Mobile Tabbed Org Chart --- */
              <div className="p-3 border rounded-4 bg-light shadow-sm">
                {/* Level 1: President Card */}
                <div className="d-flex justify-content-center mb-4 pt-3">
                  {renderPresidentCard(pageData.leadership_tree.president)}
                </div>

                {/* Mobile Navigation Tabs */}
                <div className="d-flex justify-content-center gap-2 mb-4 px-2">
                  <Button
                    variant={mobileActiveLevel === 'offices' ? 'info' : 'outline-secondary'}
                    className="rounded-pill px-4 py-2 fw-bold w-50 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setMobileActiveLevel('offices')}
                  >
                    <FaIcons.FaBriefcase size={14} />
                    <span>{isRtl ? 'المكاتب التابعة' : 'Offices'} ({(pageData.leadership_tree.offices || []).length})</span>
                  </Button>
                  <Button
                    variant={mobileActiveLevel === 'admins' ? 'primary' : 'outline-secondary'}
                    className="rounded-pill px-4 py-2 fw-bold w-50 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setMobileActiveLevel('admins')}
                  >
                    <FaIcons.FaLandmark size={14} />
                    <span>{isRtl ? 'الإدارات' : 'Administrations'} ({(pageData.leadership_tree.administrations || []).length})</span>
                  </Button>
                </div>

                {/* Mobile Active Grid View */}
                <div className="px-1 pb-3">
                  {mobileActiveLevel === 'offices' ? (
                    <Row className="g-3 row-cols-1 row-cols-sm-2">
                      {(pageData.leadership_tree.offices || []).map((o, i) => renderTreeCard(o, i, 'office'))}
                    </Row>
                  ) : (
                    <Row className="g-3 row-cols-1 row-cols-sm-2">
                      {(pageData.leadership_tree.administrations || []).map((a, i) => renderTreeCard(a, i, 'admin'))}
                    </Row>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #001d5a 0%, #003087 60%, #0066cc 100%)',
          borderRadius: 24, padding: '50px 40px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,168,232,0.15) 0%, transparent 70%)' }} />
          <div className="position-relative">
            <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '0.75rem' }}>
              {t('about.ctaTitle')}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '2rem', fontSize: '1rem' }}>
              {t('about.ctaDesc')}
            </p>
            <PrimaryButton 
              to="/register" 
              variant="primary" 
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}
            >
              <FaIcons.FaUsers size={16} />
              {t('about.ctaBtn')}
            </PrimaryButton>
          </div>
        </div>
      </Container>

      {/* Interactive Detail Modal for clicked Office / Administration / President */}
      <AnimatePresence>
        {selectedNodeModal && (
          <Modal
            show={!!selectedNodeModal}
            onHide={() => setSelectedNodeModal(null)}
            centered
            size="lg"
            contentClassName="border-0 rounded-4 shadow-lg overflow-hidden"
          >
            <div style={{
              background: selectedNodeModal.type === 'office'
                ? 'linear-gradient(135deg, #001225 0%, #0284c7 100%)'
                : 'linear-gradient(135deg, #001225 0%, #003087 100%)',
              padding: '24px 28px',
              color: '#fff',
              position: 'relative'
            }}>
              <button
                onClick={() => setSelectedNodeModal(null)}
                style={{
                  position: 'absolute', top: 16, [isRtl ? 'left' : 'right']: 16,
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: '#fff', width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <FaIcons.FaTimes size={14} />
              </button>

              <div className="d-flex align-items-center gap-3">
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.8)',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {selectedNodeModal.img ? (
                    <img src={selectedNodeModal.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <FaIcons.FaUserTie size={28} color="#fff" />
                  )}
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, margin: 0 }}>
                    {isRtl ? selectedNodeModal.title_ar : selectedNodeModal.title_en}
                  </h4>
                  <div style={{ fontSize: '0.88rem', opacity: 0.85, marginTop: 4 }}>
                    {selectedNodeModal.type === 'president' ? (isRtl ? 'رئاسة الهيئة' : 'Authority Head') : selectedNodeModal.type === 'office' ? (isRtl ? 'مكتب تابع لرئيس الهيئة' : 'Office') : (isRtl ? 'إدارة رئيسية' : 'Administration')}
                  </div>
                </div>
              </div>
            </div>

            <Modal.Body className="p-4" style={{ background: 'var(--card-bg)', color: 'var(--text)' }}>
              <div className="mb-4">
                <h6 className="fw-extrabold text-primary mb-2">
                  <FaIcons.FaUserTie className="me-2 ms-2" />
                  {isRtl ? 'مسؤول الإدارة / المكتب' : 'Department Manager'}
                </h6>
                <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  {selectedNodeModal.name_ar 
                    ? (isRtl ? selectedNodeModal.name_ar : selectedNodeModal.name_en) 
                    : (isRtl ? 'لم يُعيَّن مدير رسمياً بعد' : 'No Director Assigned Yet')}
                </p>
              </div>

              <div className="mb-4">
                <h6 className="fw-extrabold text-primary mb-2">
                  <FaIcons.FaBullseye className="me-2 ms-2" />
                  {isRtl ? 'مهام واختصاصات التخطيط العمراني' : 'Department Objectives'}
                </h6>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.92rem' }}>
                  {isRtl
                    ? `تختص ${selectedNodeModal.title_ar} بإعداد الخطط والدراسات التخطيطية الهندسية، والإشراف الفني المباشر، وتوثيق البيانات التخطيطية المعتمدة وفق أعلى معايير الجودة والمواصفات القياسية للهيئة الوطنية للتخطيط العمراني.`
                    : `Responsible for physical and urban planning studies, technical supervision, and data documentation according to the official standards of UPAW.`}
                </p>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <Button 
                  variant="outline-secondary" 
                  className="rounded-pill px-4"
                  onClick={() => setSelectedNodeModal(null)}
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </Button>
                <PrimaryButton to="/contact" variant="primary" style={{ padding: '6px 20px', borderRadius: 99 }}>
                  <FaIcons.FaEnvelope size={12} />
                  <span>{isRtl ? 'تواصل مع الإدارة' : 'Contact Department'}</span>
                </PrimaryButton>
              </div>
            </Modal.Body>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default About;
