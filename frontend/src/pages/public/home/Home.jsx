import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import {
  FaMapMarkedAlt, FaRegBuilding, FaCity, FaChartLine,
  FaShieldAlt, FaUsers, FaGlobe, FaFileAlt,
  FaArrowLeft, FaArrowRight, FaCalendarAlt, FaNewspaper,
  FaChevronLeft, FaChevronRight, FaLayerGroup, FaLandmark, FaProjectDiagram
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { api } from '../../../services/api';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import './home.css';

// Animated Counter
const Counter = ({ target, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const HERO_PARTICLES = [
  { id: 0, left: '12%', width: '3px', height: '3px', animationDuration: '9s', animationDelay: '1s' },
  { id: 1, left: '25%', width: '4px', height: '4px', animationDuration: '14s', animationDelay: '3s' },
  { id: 2, left: '38%', width: '2px', height: '2px', animationDuration: '8s', animationDelay: '0s' },
  { id: 3, left: '45%', width: '5px', height: '5px', animationDuration: '11s', animationDelay: '5s' },
  { id: 4, left: '57%', width: '3px', height: '3px', animationDuration: '16s', animationDelay: '2s' },
  { id: 5, left: '68%', width: '4px', height: '4px', animationDuration: '12s', animationDelay: '7s' },
  { id: 6, left: '80%', width: '2px', height: '2px', animationDuration: '10s', animationDelay: '4s' },
  { id: 7, left: '92%', width: '5px', height: '5px', animationDuration: '15s', animationDelay: '1s' },
  { id: 8, left: '18%', width: '3px', height: '3px', animationDuration: '13s', animationDelay: '6s' },
  { id: 9, left: '33%', width: '4px', height: '4px', animationDuration: '9s', animationDelay: '2s' },
  { id: 10, left: '50%', width: '2px', height: '2px', animationDuration: '15s', animationDelay: '0s' },
  { id: 11, left: '62%', width: '5px', height: '5px', animationDuration: '10s', animationDelay: '4s' },
  { id: 12, left: '75%', width: '3px', height: '3px', animationDuration: '17s', animationDelay: '3s' },
  { id: 13, left: '85%', width: '4px', height: '4px', animationDuration: '11s', animationDelay: '5s' },
  { id: 14, left: '95%', width: '2px', height: '2px', animationDuration: '8s', animationDelay: '1s' },
];

const Home = () => {
  const { locale, t } = useLanguage();
  const [stats, setStats] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [homeImages, setHomeImages] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_home_images');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Load data and listen for live updates
  useEffect(() => {
    const fetchHeroImages = () => {
      api.getHomeImages()
        .then(imagesData => {
          if (Array.isArray(imagesData) && imagesData.length > 0) {
            imagesData.forEach(img => {
              const image = new Image();
              image.src = img.image_url;
            });
            setHomeImages(imagesData);
            localStorage.setItem('cached_home_images', JSON.stringify(imagesData));
          }
        })
        .catch(() => {});
    };

    const loadData = async () => {
      fetchHeroImages();
      try {
        const statsData = await api.getStatistics();
        if (Array.isArray(statsData)) setStats(statsData);
      } catch {
        setStats([]);
      }

      try {
        const newsData = await api.getNews();
        const publicPosts = Array.isArray(newsData)
          ? newsData.filter(p => p.is_visible && p.target_audience === 'العامة')
          : [];
        setAllNews(publicPosts);
        setNewsItems(publicPosts.slice(0, 3));
      } catch {
        setAllNews([]);
        setNewsItems([]);
      }
    };

    loadData();

    window.addEventListener('upaw:data-updated', loadData);
    return () => window.removeEventListener('upaw:data-updated', loadData);
  }, []);

  // Auto-play dynamic home slider cross-fade
  useEffect(() => {
    if (homeImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIdx(prev => (prev + 1) % homeImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [homeImages]);

  // Auto-play latest news rotation every 15 seconds
  useEffect(() => {
    if (allNews.length <= 3) return;

    const timer = setInterval(() => {
      setNewsItems(prevItems => {
        const currentIdx = allNews.findIndex(item => item.id === prevItems[0]?.id);
        if (currentIdx === -1) return allNews.slice(0, 3);
        const nextStartIdx = (currentIdx + 3) % allNews.length;
        
        const nextItems = [];
        for (let i = 0; i < 3; i++) {
          const itemIdx = (nextStartIdx + i) % allNews.length;
          nextItems.push(allNews[itemIdx]);
        }
        return nextItems;
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [allNews]);

  const renderStatIcon = (iconName, size = 28, color = 'var(--primary)') => {
    if (!iconName) return <FaChartLine size={size} style={{ color }} />;
    if (iconName.startsWith('http')) {
      return <img src={iconName} alt="icon" style={{ width: size, height: size, objectFit: 'cover', borderRadius: '6px' }} />;
    }
    
    const iconMap = {
      FaUsers: <FaUsers size={size} style={{ color }} />,
      FaMapMarkedAlt: <FaMapMarkedAlt size={size} style={{ color }} />,
      FaRegBuilding: <FaRegBuilding size={size} style={{ color }} />,
      FaGlobe: <FaGlobe size={size} style={{ color }} />,
    };
    
    return iconMap[iconName] || <FaChartLine size={size} style={{ color }} />;
  };

  const services = [
    {
      icon: <FaMapMarkedAlt size={32} />,
      title: t('services.service1.title'),
      desc: t('services.service1.desc'),
      color: '#003087',
    },
    {
      icon: <FaLayerGroup size={32} />,
      title: t('services.service2.title'),
      desc: t('services.service2.desc'),
      color: '#0066cc',
    },
    {
      icon: <FaRegBuilding size={32} />,
      title: t('services.service3.title'),
      desc: t('services.service3.desc'),
      color: '#0088e8',
    },
    {
      icon: <FaCity size={32} />,
      title: t('services.service4.title'),
      desc: t('services.service4.desc'),
      color: '#00a8e8',
    },
    {
      icon: <FaChartLine size={32} />,
      title: t('services.service5.title'),
      desc: t('services.service5.desc'),
      color: '#00bfff',
    },
    {
      icon: <FaProjectDiagram size={32} />,
      title: t('services.service6.title'),
      desc: t('services.service6.desc'),
      color: '#006fa8',
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }),
  };

  // Direction-aware layout calculations
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? FaArrowLeft : FaArrowRight;
  const ChevronIcon = isRtl ? FaChevronLeft : FaChevronRight;
  
  // Dynamic styling for float cards (positioned on the left of the image, overlapping slightly)
  const floatCard1Style = {
    top: '16%',
    left: '-110px',
    width: '170px',
    height: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '12px',
    zIndex: 5
  };

  const floatCard2Style = {
    bottom: '16%',
    left: '-110px',
    width: '170px',
    height: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '12px',
    zIndex: 5
  };

  return (
    <div className="home-page">
      {/* ========== HERO ========== */}
      <section className="hero-section position-relative home-hero" style={{ background: 'none' }}>
        {/* Dynamic background cross-fade slider */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          {homeImages.length > 0 ? homeImages.map((img, idx) => (
            <div
              key={img.id}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `var(--hero-gradient), url('${img.image_url}')`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                opacity: idx === currentImageIdx ? 1 : 0,
                transition: 'opacity 1.2s ease-in-out',
              }}
            />
          )) : (
            // Show only dark gradient while images load — no external placeholder
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #001a4d 0%, #003087 50%, #001233 100%)',
              }}
            />
          )}
        </div>

        {/* Floating particles */}
        <div className="hero-particles" style={{ zIndex: 2 }}>
          {HERO_PARTICLES.map((p) => (
            <span key={p.id} style={{
              left: p.left,
              width: p.width,
              height: p.height,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
            }} />
          ))}
        </div>

        <Container className="position-relative" style={{ zIndex: 10 }}>
          <Row className="align-items-center gy-5">
            <Col lg={7}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                <div className="hero-badge">
                  <FaLandmark size={12} />
                  {t('home.heroBadge')}
                </div>

                <h1 className="hero-title mb-4">
                  {t('home.heroTitlePrefix')}
                  <span className="highlight">{t('home.heroTitleHighlight')}</span>
                  <br />
                  {t('home.heroTitleSuffix')}
                </h1>

                <p className="hero-subtitle mb-5">
                  {t('home.heroSubtitle')}
                </p>

                <div className="d-flex flex-wrap gap-3 mb-5">
                  <PrimaryButton to="/news" variant="primary">
                    {t('home.exploreBtn')}
                    <ArrowIcon size={14} className={isRtl ? 'ms-2' : 'me-2'} />
                  </PrimaryButton>
                  <PrimaryButton to="/about" variant="outline-brand" icon={<FaGlobe size={14} />}>
                    {t('home.aboutBtn')}
                  </PrimaryButton>
                </div>

                <div className="hero-stats">
                  {stats.map((s, i) => (
                    <motion.div
                      key={s.id}
                      className="hero-stat"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                    >
                      <div className="hero-stat-num">
                        <Counter target={s.value} suffix={s.suffix} />
                      </div>
                      <div className="hero-stat-label">
                        {isRtl ? s.label_ar : s.label_en}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </Col>

            <Col lg={5} className="d-none d-lg-block">
              <motion.div
                className="hero-visual animate-float"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <div style={{ position: 'relative' }}>
                  {/* Dynamic slider container */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
                    border: '3px solid rgba(255,255,255,0.15)',
                    position: 'relative',
                    background: 'rgba(0,30,80,0.5)',
                  }}>
                    {homeImages.length > 0 ? homeImages.map((img, idx) => (
                      <img
                        key={img.id}
                        src={img.image_url}
                        alt={`slide-${idx}`}
                        style={{
                          position: 'absolute',
                          top: 0, left: 0,
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          opacity: idx === currentImageIdx ? 1 : 0,
                          transition: 'opacity 1.2s ease-in-out',
                        }}
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.opacity = '0'; }}
                      />
                    )) : (
                      <div
                        className="skeleton-pulse"
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #02162e 0%, #003087 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div className="spinner-border text-light opacity-50" role="status" />
                      </div>
                    )}
                    {/* Slide indicators */}
                    {homeImages.length > 1 && (
                      <div style={{
                        position: 'absolute', bottom: 10, left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex', gap: 6, zIndex: 2,
                      }}>
                        {homeImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIdx(idx)}
                            style={{
                              width: idx === currentImageIdx ? 20 : 8,
                              height: 8,
                              borderRadius: 4,
                              border: 'none',
                              background: idx === currentImageIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                              padding: 0,
                              transition: 'all 0.3s ease',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Floating cards - stacked vertically, identical size */}
                  <motion.div
                    className="hero-card-float"
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ ...floatCard1Style }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🏙️</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{t('home.floatCardPlans')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>60+</div>
                  </motion.div>
                  <motion.div
                    className="hero-card-float"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    style={{ ...floatCard2Style }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📍</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{t('home.floatCardBranches')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>22</div>
                  </motion.div>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ========== SERVICES ========== */}
      <section className="home-section-padding">
        <Container>
          <div className="text-center mb-5">
            <div className="section-tag d-inline-flex">
              <FaShieldAlt size={14} />
              {t('home.servicesTag')}
            </div>
            <h2 className="section-title">{t('home.servicesTitle')}</h2>
            <div className="section-divider mx-auto" />
            <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', fontSize: '1.05rem' }}>
              {t('home.servicesDesc')}
            </p>
          </div>

          <Row className="g-4 pb-3">
            {services.map((service, idx) => (
              <Col lg={4} md={6} key={idx}>
                <motion.div
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={cardVariants}
                >
                  <div className="card-custom p-4 h-100">
                    <div
                      className="card-icon-wrap"
                      style={{ color: service.color }}
                    >
                      {service.icon}
                    </div>
                    <h5 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.6rem' }}>
                      {service.title}
                    </h5>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>
                      {service.desc}
                    </p>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ========== ABOUT STRIP ========== */}
      <section style={{
        background: 'linear-gradient(135deg, #001d5a 0%, #003087 50%, #0066cc 100%)',
        padding: '70px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(0,168,232,0.15) 0%, transparent 70%)',
        }} />
        <Container className="position-relative">
          <Row className="align-items-center gy-4">
            <Col lg={7}>
              <div className="section-tag mb-3" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.2)' }}>
                <FaLandmark size={14} />
                {t('home.aboutTag')}
              </div>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '2rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                {t('home.aboutTitle')}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.85, marginBottom: '1.5rem', fontSize: '1rem' }}>
                {t('home.aboutText1')}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: '2rem', fontSize: '0.95rem' }}>
                {t('home.aboutText2')}
              </p>
              <PrimaryButton 
                to="/about" 
                variant="primary" 
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                {t('home.aboutBtnMore')}
                <ArrowIcon size={14} className={isRtl ? 'ms-2' : 'me-2'} />
              </PrimaryButton>
            </Col>
            <Col lg={5}>
              <Row className="g-3">
                {stats.slice(0, 4).map((item) => (
                  <Col xs={6} key={item.id}>
                    <div style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 16,
                      padding: '24px 20px',
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <div className="mb-2" style={{ display: 'flex', justifyContent: 'center' }}>
                        {renderStatIcon(item.icon, 28, 'rgba(255,255,255,0.85)')}
                      </div>
                      <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 900, lineHeight: 1 }}>
                        {item.value}{item.suffix}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginTop: 6 }}>
                        {isRtl ? item.label_ar : item.label_en}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ========== NEWS ========== */}
      <section className="home-section-padding">
        <Container>
          <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-5">
            <div>
              <div className="section-tag d-inline-flex">
                <FaNewspaper size={14} />
                {t('home.mediaTag')}
              </div>
              <h2 className="section-title mb-0">{t('home.mediaTitle')}</h2>
              <div className="section-divider" style={{ marginRight: isRtl ? 0 : 'auto', marginLeft: isRtl ? 'auto' : 0 }} />
            </div>
            <Link to="/news" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--primary)', fontWeight: 700, textDecoration: 'none',
              border: '2px solid rgba(0,48,135,0.15)', padding: '10px 24px',
              borderRadius: 99, transition: 'all 0.3s', fontSize: '0.92rem',
            }}>
              {t('home.mediaBtn')}
              <ChevronIcon size={12} />
            </Link>
          </div>

          <Row className="g-4 pb-3">
            {newsItems.map((news, idx) => (
              <Col lg={4} md={6} key={news.id}>
                <motion.div
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={cardVariants}
                  className="h-100"
                >
                  <div className="news-card card">
                    <div className="overflow-hidden">
                      <img
                        src={news.image}
                        alt={isRtl ? (news.title_ar || news.title) : (news.title_en || news.title)}
                        className="news-img"
                      />
                    </div>
                    <div className="p-4 d-flex flex-column justify-content-between" style={{ minHeight: '220px' }}>
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                           <span className="news-cat">{news.category}</span>
                           <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.82rem' }}>
                            <FaCalendarAlt size={12} />
                            {news.date}
                          </div>
                        </div>
                        <h5 style={{ fontWeight: 700, lineHeight: 1.55, marginBottom: '0.75rem', color: 'var(--text)' }}>
                          {isRtl ? (news.title_ar || news.title) : (news.title_en || news.title)}
                        </h5>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                          {isRtl ? (news.excerpt_ar || news.excerpt) : (news.excerpt_en || news.excerpt)}
                        </p>
                      </div>
                      <Link to="/news" style={{
                        color: 'var(--primary)', fontWeight: 700, textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem',
                      }}>
                        {t('home.readMore')} <ChevronIcon size={12} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ========== IMPORTANT LINKS ========== */}
      <section className="home-section-padding pt-0">
        <Container>
          <div className="text-center mb-5">
            <div className="section-tag d-inline-flex">
              <FaFileAlt size={14} />
              {t('home.linksTag')}
            </div>
            <h2 className="section-title">{t('home.linksTitle')}</h2>
            <div className="section-divider mx-auto" />
          </div>
          <Row className="g-4 pb-3 justify-content-center">
            {[
              {
                icon: <FaFileAlt size={36} />,
                title: t('links.papers.title'),
                desc: t('links.papers.desc'),
                link: '/working-papers',
                color: '#003087',
              },
              {
                icon: <FaNewspaper size={36} />,
                title: t('links.news.title'),
                desc: t('links.news.desc'),
                link: '/news',
                color: '#0066cc',
              },
              {
                icon: <FaMapMarkedAlt size={36} />,
                title: t('links.map.title'),
                desc: t('links.map.desc'),
                link: '/interactive-map',
                color: '#00a8e8',
              },
            ].map((item, idx) => (
              <Col lg={4} md={6} key={idx}>
                <motion.div
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={cardVariants}
                >
                  <Link to={item.link} className="text-decoration-none d-block">
                    <div className="card-custom p-4 text-center" style={{ cursor: 'pointer' }}>
                      <div
                        className="card-icon-wrap mx-auto"
                        style={{ color: item.color, width: 80, height: 80, borderRadius: 20 }}
                      >
                        {item.icon}
                      </div>
                      <h5 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
                        {item.title}
                      </h5>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
