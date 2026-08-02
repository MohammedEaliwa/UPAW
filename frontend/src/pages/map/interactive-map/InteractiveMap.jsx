import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Badge, ListGroup } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { motion } from 'framer-motion';
import { FaSearch, FaMapMarkedAlt, FaFilter, FaMapMarkerAlt } from 'react-icons/fa';
import L from 'leaflet';
import { useLanguage } from '../../../context/LanguageContext';
import { autoTranslateText } from '../../../context/LanguageContext';
import { api } from '../../../services/api';
import 'leaflet/dist/leaflet.css';
import './interactive-map.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map controller to center clicked point with moderate zoom (11) and reset to default view on popup close
const MapController = ({ targetCoords, defaultCenter = [27.0, 17.5], defaultZoom = 5, onResetView }) => {
  const map = useMap();
  const prevTriggerId = useRef(null);
  const isPointActiveRef = useRef(false);

  useEffect(() => {
    if (targetCoords && targetCoords.id && targetCoords.id !== prevTriggerId.current) {
      prevTriggerId.current = targetCoords.id;
      isPointActiveRef.current = true;
      const zoomLevel = targetCoords.zoom || 11; // Moderate zoom-in (less tight)
      map.flyTo([targetCoords.lat, targetCoords.lng], zoomLevel, { duration: 1.0 });
    }
  }, [targetCoords, map]);

  useMapEvents({
    popupclose: () => {
      // When popup is closed, check if no popups remain open, then fly back to default map center and zoom
      setTimeout(() => {
        if (!document.querySelector('.leaflet-popup')) {
          if (isPointActiveRef.current) {
            isPointActiveRef.current = false;
            prevTriggerId.current = null;
            map.flyTo(defaultCenter, defaultZoom, { duration: 1.0 });
            if (onResetView) onResetView();
          }
        }
      }, 60);
    }
  });

  return null;
};

// Helper to compute centroid of multi-coordinate polygons/lines
const getFeatureCenter = (coords) => {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  let points = coords;
  if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
    points = coords[0];
  }
  let sumLat = 0, sumLng = 0, count = 0;
  for (const pt of points) {
    if (Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1])) {
      sumLat += pt[0];
      sumLng += pt[1];
      count++;
    }
  }
  if (count === 0) return null;
  return [sumLat / count, sumLng / count];
};

// Palette of colors for KML layers
const KML_LAYER_COLORS = [
  '#003087', '#198754', '#fd7e14', '#dc3545', '#6f42c1', '#0dcaf0', '#ffc107'
];

const KML_FOLDER_MAP_EN = {
  'إدارة الهيئة': 'Authority Management',
  'الفروع': 'Branches',
  'المكاتب': 'Offices',
  'Boundry_Libya': 'Libya Boundary',
  'الحدود': 'Boundaries',
};

// Sleek modern micro-marker icon creator
const createModernMarkerIcon = (color = '#003087') => {
  return L.divIcon({
    className: 'modern-leaflet-marker',
    html: `
      <div class="marker-pin-inner" style="width:22px;height:28px;position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.32));">
        <svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 0C4.925 0 0 4.925 0 11C0 19.25 11 28 11 28C11 28 22 19.25 22 11C22 4.925 17.075 0 11 0Z" fill="${color}"/>
          <circle cx="11" cy="10.5" r="5" fill="#FFFFFF" opacity="0.96"/>
          <circle cx="11" cy="10.5" r="3" fill="${color}"/>
        </svg>
      </div>
    `,
    iconSize: [22, 28],
    iconAnchor: [11, 28],
    popupAnchor: [0, -25],
  });
};

const InteractiveMap = () => {
  const { locale, t, autoTranslateText: tx } = useLanguage();
  const isEn = locale === 'en';
  const isRtl = !isEn;
  // Helper: translate Arabic text to English using auto-mapper
  const txLabel = (text) => isEn ? autoTranslateText(text, 'en') : text;
  const [locations, setLocations] = useState([]);
  const [kmlFeatures, setKmlFeatures] = useState([]);
  const [kmlFolders, setKmlFolders] = useState([]); 
  const [hiddenFolders, setHiddenFolders] = useState(new Set()); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('الكل');
  const [activeLocation, setActiveLocation] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const defaultCenter = [27.0, 17.5]; // Center of Libya
  const defaultZoom = 5;
  const [showLocations, setShowLocations] = useState(true);

  const toggleFolder = (folderName) => {
    setHiddenFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderName)) {
        newSet.delete(folderName);
      } else {
        newSet.add(folderName);
      }
      return newSet;
    });
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMapLocations().then(data => setLocations(Array.isArray(data) ? data : [])).catch(() => setLocations([])),
      api.getKmlFeatures().then(data => {
        if (Array.isArray(data)) {
          setKmlFeatures(data);
          const folders = [...new Set(data.map(f => f.folder).filter(Boolean))];
          setKmlFolders(folders);
        }
      }).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const categories = [
    { value: 'الكل', label: isRtl ? 'الكل' : 'All' },
    { value: 'حكومي', label: isRtl ? 'حكومي' : 'Government' },
    { value: 'سكني', label: isRtl ? 'سكني' : 'Residential' },
    { value: 'تجاري', label: isRtl ? 'تجاري' : 'Commercial' },
    { value: 'طرق ومحاور', label: isRtl ? 'طرق ومحاور' : 'Roads & Networks' },
    { value: 'خدمات', label: isRtl ? 'خدمات' : 'Services' },
  ];

  const catColors = {
    'حكومي': '#003087',
    'سكني': '#10b981',
    'تجاري': '#f59e0b',
    'طرق ومحاور': '#4b5563',
    'خدمات': '#ef4444'
  };

  const getCategoryLabel = (catVal) => {
    const match = categories.find(c => c.value === catVal);
    return match ? match.label : catVal;
  };

  const filteredLocations = locations.filter((loc) => {
    const name = (isRtl ? loc.name_ar : loc.name_en) || loc.name || '';
    const details = (isRtl ? loc.details_ar : loc.details_en) || loc.details || '';
    
    const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCat === 'الكل' || loc.category === selectedCat;
    return matchSearch && matchCat;
  });

  const handleLocationSelect = (loc) => {
    setActiveLocation(loc);
    setFlyTarget({ lat: loc.latitude, lng: loc.longitude, zoom: 11, id: `sidebar-${loc.id}-${Date.now()}` });
  };

  const handleResetView = () => {
    setActiveLocation(null);
    setFlyTarget(null);
  };

  return (
    <div className="interactive-map-page" style={{ paddingBottom: 80 }}>
      {/* Page Header */}
      <div className="map-header">
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,168,232,0.12) 0%, transparent 70%)' }} />
        <Container className="position-relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 16px', borderRadius: 99, color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
              <FaMapMarkedAlt size={12} />
              {t('map.tag')}
            </div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {t('map.title')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', margin: 0 }}>
              {t('map.subtitle')}
            </p>
          </motion.div>
        </Container>
      </div>

      <Container style={{ marginTop: '50px' }}>
        <Row className="gy-4">
          {/* Sidebar controls */}
          <Col lg={4}>
            <div className="map-sidebar">
              {/* Title */}
              <h5 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--primary)', flexShrink: 0 }}>
                <FaFilter size={16} /> {t('map.filterTitle')}
              </h5>

              {/* Layer Manager with custom scrollbar */}
              <div style={{ flexShrink: 0 }}>
                <h6 className="fw-bold mb-1 text-secondary" style={{ fontSize: '0.82rem' }}>
                  🗺️ {isRtl ? 'طبقات الخريطة:' : 'Map Layers:'}
                </h6>
                <div className="mb-2 p-2 rounded layers-scroll-container" style={{ 
                  fontSize: '0.82rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 6, 
                  background: 'var(--bg)', 
                  border: '1px solid var(--border)',
                  maxHeight: '210px',
                  overflowY: 'auto'
                }}>
                  <Form.Check 
                    type="checkbox"
                    id="layer-locations"
                    label={isRtl ? 'معالم ومشروعات الهيئة' : 'Authority Landmarks & Projects'}
                    checked={showLocations}
                    onChange={e => setShowLocations(e.target.checked)}
                  />
                  {kmlFolders.map((folder, idx) => (
                    <Form.Check 
                      key={folder}
                      type="checkbox"
                      id={`layer-kml-${idx}`}
                      label={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ 
                            width: 10, height: 10, borderRadius: '50%', 
                            background: KML_LAYER_COLORS[idx % KML_LAYER_COLORS.length],
                            display: 'inline-block', flexShrink: 0
                          }} />
                          {isRtl ? folder : (KML_FOLDER_MAP_EN[folder] || autoTranslateText(folder, 'en') || folder)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(KML)</span>
                        </span>
                      }
                      checked={!hiddenFolders.has(folder)}
                      onChange={() => toggleFolder(folder)}
                    />
                  ))}
                  {kmlFolders.length === 0 && (
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>{isRtl ? 'لا توجد طبقات KML مستوردة' : 'No imported KML layers'}</span>
                  )}
                </div>
              </div>
              
              {/* Search */}
              <div style={{ position: 'relative', flexShrink: 0 }} className="mb-2">
                <Form.Control
                  placeholder={t('map.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: '2px solid var(--border)',
                    borderRadius: 10,
                    paddingRight: isRtl ? '38px' : '14px',
                    paddingLeft: isRtl ? '14px' : '38px',
                    paddingTop: '7px',
                    paddingBottom: '7px',
                    fontSize: '0.85rem',
                    background: 'var(--bg)', color: 'var(--text)',
                    fontFamily: 'inherit',
                    boxShadow: 'none',
                    width: '100%',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  right: isRtl ? '12px' : 'auto',
                  left: isRtl ? 'auto' : '12px',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  display: 'flex',
                }}>
                  <FaSearch size={14} />
                </span>
              </div>

              {/* Categories */}
              <div className="d-flex gap-1 mb-2 flex-wrap" style={{ flexShrink: 0 }}>
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCat(cat.value)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 99,
                      border: selectedCat === cat.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedCat === cat.value ? 'var(--primary)' : 'transparent',
                      color: selectedCat === cat.value ? '#fff' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Locations List */}
              <div style={{ flex: 1, overflowY: 'auto' }} className="pe-1">
                {loading ? (
                  <div className="d-flex flex-column gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="skeleton-pulse" style={{ height: 60, borderRadius: 12 }} />
                    ))}
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <FaMapMarkerAlt size={32} className="opacity-25 mb-2" />
                    <p style={{ fontSize: '0.9rem' }}>{t('map.empty')}</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {filteredLocations.map((loc) => {
                      const isSelected = activeLocation?.id === loc.id;
                      return (
                        <ListGroup.Item
                          key={loc.id}
                          onClick={() => handleLocationSelect(loc)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: isSelected ? 'rgba(0,48,135,0.05)' : 'transparent',
                            marginBottom: '8px',
                            padding: '12px 14px',
                            transition: 'all 0.2s',
                            textAlign: isRtl ? 'right' : 'left'
                          }}
                          className="hover-card-list map-custom-marker"
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1 gap-2">
                            <span className="fw-bold text-dark" style={{ fontSize: '0.92rem', lineHeight: 1.3 }}>
                              {isRtl ? (loc.name_ar || loc.name) : (loc.name_en || loc.name)}
                            </span>
                            <Badge style={{ background: catColors[loc.category] || '#6c757d', fontSize: '0.7rem' }}>
                              {getCategoryLabel(loc.category)}
                            </Badge>
                          </div>
                          <p className="text-muted text-truncate mb-0" style={{ fontSize: '0.8rem' }}>
                            {(isRtl ? (loc.details_ar || loc.details) : (loc.details_en || loc.details)) || t('map.floatingInfo')}
                          </p>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                )}
              </div>
            </div>
          </Col>

          {/* Leaflet Map with beautiful markers */}
          <Col lg={8}>
            <div className="map-wrapper">
              <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController 
                  targetCoords={flyTarget} 
                  defaultCenter={defaultCenter} 
                  defaultZoom={defaultZoom} 
                  onResetView={handleResetView} 
                />
                
                {/* Municipal locations layer */}
                {showLocations && (
                  <MarkerClusterGroup chunkedLoading>
                    {filteredLocations.map((loc) => {
                      const markerColor = loc.color || '#003087';
                      const coloredIcon = createModernMarkerIcon(markerColor);
                      return (
                        <Marker
                          key={loc.id}
                          position={[loc.latitude, loc.longitude]}
                          icon={coloredIcon}
                          eventHandlers={{
                            click: () => {
                              setActiveLocation(loc);
                              setFlyTarget({ lat: loc.latitude, lng: loc.longitude, zoom: 11, id: `loc-${loc.id}-${Date.now()}` });
                            },
                          }}
                        >
                          <Popup autoPan={true} autoPanPadding={[40, 40]}>
                            <div style={{ fontFamily: 'inherit', direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                              <h6 className="fw-bold mb-1" style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                                {isRtl ? (loc.name_ar || loc.name) : (loc.name_en || loc.name)}
                              </h6>
                              <Badge style={{ background: catColors[loc.category] || '#6c757d', marginBottom: '8px' }}>
                                {getCategoryLabel(loc.category)}
                              </Badge>
                              <p className="mb-2 text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                                {(isRtl ? (loc.details_ar || loc.details) : (loc.details_en || loc.details))}
                              </p>
                              <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: '0.75rem', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                                <FaMapMarkerAlt />
                                <span>{t('map.coordinates')}: {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</span>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MarkerClusterGroup>
                )}

                {/* KML Features layers – dynamic by folder/color */}
                {kmlFeatures.map((feat) => {
                  if (hiddenFolders.has(feat.folder)) return null;

                  const coords = JSON.parse(feat.coordinates);
                  const isPoint = feat.type === 'Point';
                  const folderIdx = kmlFolders.indexOf(feat.folder);
                  const color = feat.color || KML_LAYER_COLORS[folderIdx >= 0 ? folderIdx % KML_LAYER_COLORS.length : 0];

                  if (isPoint) {
                    const pointIcon = createModernMarkerIcon(color);
                    return (
                      <Marker 
                        key={feat.id} 
                        position={coords}
                        icon={pointIcon}
                        eventHandlers={{
                          click: () => {
                            if (Array.isArray(coords) && coords.length >= 2) {
                              setFlyTarget({ lat: coords[0], lng: coords[1], zoom: 11, id: `kml-${feat.id}-${Date.now()}` });
                            }
                          }
                        }}
                      >
                        <Popup autoPan={true} autoPanPadding={[40, 40]}>
                          <div style={{ fontFamily: 'inherit', direction: 'rtl', textAlign: 'right', minWidth: 180 }}>
                            <Badge className="mb-2" style={{ backgroundColor: color }}>{isEn ? (KML_FOLDER_MAP_EN[feat.folder] || autoTranslateText(feat.folder, 'en') || feat.folder) : feat.folder}</Badge>
                            <h6 className="fw-bold mb-1" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{feat.name || 'نقطة KML'}</h6>
                            {feat.details ? (
                              <div dangerouslySetInnerHTML={{ __html: feat.details }} style={{ fontSize: '0.82rem', lineHeight: 1.4 }} />
                            ) : (
                              <p className="m-0 text-muted small">نقطة مستوردة من ملف الخريطة.</p>
                            )}
                            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 6, borderTop: '1px solid #eee', paddingTop: 5 }}>
                              📍 {coords[0]?.toFixed(5)}, {coords[1]?.toFixed(5)}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  } else {
                    const center = getFeatureCenter(coords);
                    return (
                      <Polygon
                        key={feat.id}
                        positions={coords}
                        pathOptions={{
                          color: color,
                          fillColor: color,
                          fillOpacity: 0.25,
                          weight: 3,
                        }}
                        eventHandlers={{
                          click: () => {
                            if (center) {
                              setFlyTarget({ lat: center[0], lng: center[1], zoom: 11, id: `poly-${feat.id}-${Date.now()}` });
                            }
                          }
                        }}
                      >
                        <Popup autoPan={true} autoPanPadding={[40, 40]}>
                          <div style={{ fontFamily: 'inherit', direction: 'rtl', textAlign: 'right', maxWidth: 300, maxHeight: 250, overflow: 'auto' }}>
                            <Badge className="mb-2" style={{ backgroundColor: color }}>{isEn ? (KML_FOLDER_MAP_EN[feat.folder] || autoTranslateText(feat.folder, 'en') || feat.folder) : feat.folder}</Badge>
                            <h6 className="fw-bold mb-2">{feat.name || 'نطاق جغرافي'}</h6>
                            {feat.details ? (
                              <div dangerouslySetInnerHTML={{ __html: feat.details }} className="kml-popup-details" style={{ fontSize: '0.8rem', lineHeight: 1.4 }} />
                            ) : (
                              <p className="m-0 text-muted small">نطاق مستورد من ملف الخريطة.</p>
                            )}
                          </div>
                        </Popup>
                      </Polygon>
                    );
                  }
                })}
              </MapContainer>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InteractiveMap;
