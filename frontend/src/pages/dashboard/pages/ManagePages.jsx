import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Row, Col, Button, Badge, Spinner, InputGroup, Tab, Tabs, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FaSave, FaFileAlt, FaTrash, FaPlus, FaEye, FaEyeSlash, FaSearch, 
  FaTimes, FaArrowRight, FaExternalLinkAlt, FaImage, FaUser, 
  FaBuilding, FaInfoCircle, FaChartBar, FaLayerGroup, FaArrowUp, 
  FaArrowDown, FaCheckCircle, FaStar, FaDesktop 
} from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import RichTextEditor from '../../../components/RichTextEditor';
import ModernModal from '../../../components/ModernModal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';

const FA_ICONS = [
  'FaMapMarkedAlt', 'FaLayerGroup', 'FaBuilding', 'FaCity', 'FaProjectDiagram',
  'FaUsers', 'FaBook', 'FaCheckCircle', 'FaBullseye', 'FaEye', 'FaHammer',
  'FaLandmark', 'FaMap', 'FaRegBuilding', 'FaGlobe', 'FaStar', 'FaChartBar',
  'FaFileAlt', 'FaHandshake', 'FaLeaf'
];

const ManagePages = () => {
  const { showToast } = useToast();
  const [pagesList, setPagesList] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageData, setPageData] = useState(null);
  
  // Sub-pages state
  const [activeTab, setActiveTab] = useState('content');
  const [subPageData, setSubPageData] = useState(null);
  const [loadingSubPage, setLoadingSubPage] = useState(false);
  
  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddMainModal, setShowAddMainModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSubModal, setShowDeleteSubModal] = useState(false);
  
  // Form fields for new pages
  const [newPageId, setNewPageId] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newSubPageId, setNewSubPageId] = useState('');
  const [newSubPageTitle, setNewSubPageTitle] = useState('');

  // Fetch all pages
  const fetchPagesList = () => {
    api.getPages()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        setPagesList(arr);
      })
      .catch(err => console.error('Error fetching pages:', err));
  };

  useEffect(() => {
    fetchPagesList();
  }, []);

  // Fetch details of selected main page
  useEffect(() => {
    if (selectedPageId) {
      setLoadingPage(true);
      setPageData(null);
      setSubPageData(null);
      setActiveTab('content');
      
      api.getPageById(selectedPageId)
        .then(data => {
          const payload = data || {};
          setPageData({
            ...payload,
            sections: Array.isArray(payload.sections) ? payload.sections : [],
            tasks: Array.isArray(payload.tasks) ? payload.tasks : []
          });
          setLoadingPage(false);
        })
        .catch(() => {
          setPageData({ 
            id: selectedPageId, 
            title_ar: '', 
            title_en: '',
            content_ar: '', 
            content_en: '', 
            is_visible: true,
            parent_id: '',
            sections: [],
            tasks: []
          });
          setLoadingPage(false);
        });
    } else {
      setPageData(null);
      setSubPageData(null);
    }
  }, [selectedPageId]);

  // Fetch sub-page details when tab switches to a subpage
  useEffect(() => {
    if (activeTab && activeTab.startsWith('subpage_')) {
      const subId = activeTab.replace('subpage_', '');
      setLoadingSubPage(true);
      setSubPageData(null);
      
      api.getPageById(subId)
        .then(data => {
          const payload = data || {};
          setSubPageData({
            ...payload,
            sections: Array.isArray(payload.sections) ? payload.sections : [],
            tasks: Array.isArray(payload.tasks) ? payload.tasks : []
          });
          setLoadingSubPage(false);
        })
        .catch(err => {
          console.error('Error fetching subpage details:', err);
          setLoadingSubPage(false);
        });
    } else {
      setSubPageData(null);
    }
  }, [activeTab]);

  // Save changes (main page or sub-page depending on active tab)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    
    const isSub = activeTab.startsWith('subpage_') && subPageData;
    const dataToSave = isSub ? subPageData : pageData;
    if (!dataToSave) return;
    
    setSaving(true);
    try {
      try {
        await api.updatePage(dataToSave.id, dataToSave);
        showToast('تم حفظ التعديلات بنجاح! ✨', 'success');
        fetchPagesList();
        if (!isSub) setPageData(prev => ({ ...prev, ...dataToSave }));
        else setSubPageData(prev => ({ ...prev, ...dataToSave }));
      } catch (err) {
        console.error('Error saving page:', err);
        showToast(err.message || 'حدث خطأ أثناء حفظ الصفحة', 'danger');
      }
    } catch (err) {
      console.error('Error saving page:', err);
      showToast('حدث خطأ أثناء الاتصال بالخادم', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Visibility
  const handleToggleVisibility = async (id, currentVisible, isSub = false) => {
    try {
      try {
        await api.togglePageVisibility(id, !currentVisible);
        showToast(currentVisible ? 'تم إخفاء الصفحة بنجاح! ✨' : 'تم إظهار الصفحة بنجاح! ✨', 'success');
        fetchPagesList();
        if (isSub && subPageData && subPageData.id === id) setSubPageData(prev => ({ ...prev, is_visible: !currentVisible }));
        else if (!isSub && pageData && pageData.id === id) setPageData(prev => ({ ...prev, is_visible: !currentVisible }));
      } catch (err) {
        console.error('Error toggling visibility:', err);
        showToast(err.message || 'حدث خطأ أثناء تعديل حالة الظهور', 'danger');
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
      showToast('حدث خطأ أثناء الاتصال بالخادم', 'danger');
    }
  };

  // Delete Main Page
  const handleDeleteMain = async () => {
    if (!pageData) return;
    try {
      try {
        await api.deletePage(pageData.id);
        showToast('تم حذف الصفحة بنجاح! ✨', 'success');
        setSelectedPageId(null);
        setShowDeleteModal(false);
        fetchPagesList();
      } catch (err) {
        console.error('Error deleting page:', err);
        showToast(err.message || 'حدث خطأ أثناء حذف الصفحة', 'danger');
      }
    } catch (err) {
      console.error('Error deleting page:', err);
      showToast('حدث خطأ أثناء الاتصال بالخادم', 'danger');
    }
  };

  // Delete Sub-page
  const handleDeleteSub = async () => {
    if (!subPageData) return;
    try {
      try {
        await api.deletePage(subPageData.id);
        showToast('تم حذف الصفحة الفرعية بنجاح! ✨', 'success');
        setActiveTab('content');
        setShowDeleteSubModal(false);
        fetchPagesList();
      } catch (err) {
        console.error('Error deleting sub-page:', err);
        showToast(err.message || 'حدث خطأ أثناء حذف الصفحة الفرعية', 'danger');
      }
    } catch (err) {
      console.error('Error deleting sub-page:', err);
      showToast('حدث خطأ أثناء الاتصال بالخادم', 'danger');
    }
  };

  // Create Main Page
  const handleCreateMainPage = async (e) => {
    e.preventDefault();
    if (!newPageId) return;
    const formattedId = newPageId.trim().toLowerCase().replace(/\s+/g, '-');
    
    const newPage = {
      id: formattedId,
      title_ar: newPageTitle,
      title_en: newPageTitle,
      content_ar: '<p>محتوى الصفحة الجديدة...</p>',
      content_en: '<p>New page content...</p>',
      is_visible: true,
      parent_id: '',
      sections: [],
      tasks: []
    };

    try {
      try {
        await api.updatePage(formattedId, newPage);
        showToast('تم إنشاء الصفحة الرئيسية بنجاح! ✨', 'success');
        setSelectedPageId(formattedId);
        setShowAddMainModal(false);
        setNewPageId('');
        setNewPageTitle('');
        fetchPagesList();
      } catch (err) {
        console.error('Error creating page:', err);
        showToast(err.message || 'خطأ في إنشاء الصفحة', 'danger');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'danger');
    }
  };

  // Create Sub-page
  const handleCreateSubPage = async (e) => {
    e.preventDefault();
    if (!newSubPageId || !selectedPageId) return;
    const formattedId = newSubPageId.trim().toLowerCase().replace(/\s+/g, '-');
    
    const newSub = {
      id: formattedId,
      title_ar: newSubPageTitle,
      title_en: newSubPageTitle,
      content_ar: '<p>محتوى الصفحة الفرعية الجديدة...</p>',
      content_en: '<p>New sub-page content...</p>',
      is_visible: true,
      parent_id: selectedPageId,
      sections: [],
      tasks: []
    };

    try {
      try {
        await api.updatePage(formattedId, newSub);
        showToast('تم إنشاء الصفحة الفرعية بنجاح! 🎉', 'success');
        setShowAddSubModal(false);
        setNewSubPageId('');
        setNewSubPageTitle('');
        fetchPagesList();
        setTimeout(() => setActiveTab(`subpage_${formattedId}`), 300);
      } catch (err) {
        console.error('Error creating sub-page:', err);
        showToast(err.message || 'خطأ في إنشاء الصفحة الفرعية', 'danger');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'danger');
    }
  };

  // Filter main pages for sidebar
  const filteredMainPages = useMemo(() => {
    // 1. Find all pages that are main pages
    const mains = pagesList.filter(p => {
      const hasNoParent = !p.parent_id || p.parent_id === '';
      const isParent = pagesList.some(child => child.parent_id === p.id);
      return hasNoParent || isParent;
    });

    if (!searchTerm.trim()) return mains;
    const s = searchTerm.toLowerCase();
    return mains.filter(p =>
      (p.title_ar || '').toLowerCase().includes(s) ||
      (p.id || '').toLowerCase().includes(s)
    );
  }, [pagesList, searchTerm]);

  // Find sub-pages for currently selected main page
  const currentSubPages = useMemo(() => {
    if (!selectedPageId) return [];
    return pagesList.filter(p => p.parent_id === selectedPageId);
  }, [pagesList, selectedPageId]);

  const getPageTitle = (page) => {
    if (page.title_ar) return page.title_ar;
    try {
      return decodeURIComponent(page.id).replace(/-/g, ' ');
    } catch {
      return page.id;
    }
  };

  // Image Upload helper
  const handleImageUpload = async (file, dataState, setDataState, sectionIndex, field = 'image_url') => {
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      const url = res?.url || res?.data?.url;
      if (url) {
        const updatedSections = [...dataState.sections];
        updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], [field]: url };
        setDataState({ ...dataState, sections: updatedSections });
        showToast('تم رفع الصورة بنجاح! 📸', 'success');
      } else {
        showToast('فشل في رفع الصورة', 'danger');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      showToast(err.message || 'خطأ أثناء رفع الصورة', 'danger');
    }
  };

  // Section builders helpers
  const addSection = (type, dataState, setDataState) => {
    const newSection = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      title_ar: '',
      title_en: '',
      ...(type === 'text_image' ? {
        alignment: 'right',
        image_url: '',
        content_ar: '',
        content_en: ''
      } : type === 'profile_card' ? {
        profile_name_ar: '',
        profile_name_en: '',
        profile_title_ar: '',
        profile_title_en: '',
        image_url: '',
        bio_ar: '',
        bio_en: ''
      } : type === 'cards_grid' ? {
        items: [
          { icon: 'FaCheckCircle', title_ar: 'تعريف 1', title_en: 'Definition 1', desc_ar: 'الوصف هنا', desc_en: 'Description here' }
        ]
      } : type === 'info_banner' ? {
        banner_desc_ar: '',
        banner_desc_en: '',
        banner_btn_text_ar: '',
        banner_btn_text_en: '',
        banner_btn_link: '',
        banner_bg: 'blue'
      } : type === 'stats_grid' ? {
        items: [
          { icon: 'FaChartBar', value: '100+', label_ar: 'عنصر', label_en: 'Item' }
        ]
      } : {})
    };
    
    setDataState({
      ...dataState,
      sections: [...(dataState.sections || []), newSection]
    });
    showToast('تم إضافة القالب بنجاح! قم بتعبئة بياناته.', 'success');
  };

  const removeSection = (index, dataState, setDataState) => {
    setDataState({
      ...dataState,
      sections: dataState.sections.filter((_, idx) => idx !== index)
    });
    showToast('تم إزالة القسم', 'warning');
  };

  const updateSection = (index, field, val, dataState, setDataState) => {
    const updated = dataState.sections.map((sec, idx) => {
      if (idx === index) {
        return { ...sec, [field]: val };
      }
      return sec;
    });
    setDataState({ ...dataState, sections: updated });
  };

  const moveSection = (index, dir, dataState, setDataState) => {
    const secs = [...dataState.sections];
    const target = index + dir;
    if (target < 0 || target >= secs.length) return;
    [secs[index], secs[target]] = [secs[target], secs[index]];
    setDataState({ ...dataState, sections: secs });
  };

  const addSectionItem = (sectionIndex, type, dataState, setDataState) => {
    const currentItems = dataState.sections[sectionIndex].items || [];
    const newItem = type === 'cards_grid' 
      ? { icon: 'FaCheckCircle', title_ar: '', title_en: '', desc_ar: '', desc_en: '' }
      : { icon: 'FaChartBar', value: '', label_ar: '', label_en: '' };
    
    updateSection(sectionIndex, 'items', [...currentItems, newItem], dataState, setDataState);
  };

  const removeSectionItem = (sectionIndex, itemIndex, dataState, setDataState) => {
    const currentItems = dataState.sections[sectionIndex].items || [];
    updateSection(sectionIndex, 'items', currentItems.filter((_, idx) => idx !== itemIndex), dataState, setDataState);
  };

  const updateSectionItem = (sectionIndex, itemIndex, field, val, dataState, setDataState) => {
    const currentItems = dataState.sections[sectionIndex].items || [];
    const updatedItems = currentItems.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, [field]: val };
      }
      return item;
    });
    updateSection(sectionIndex, 'items', updatedItems, dataState, setDataState);
  };

  const getDynamicIcon = (iconName) => {
    const Icon = FA_ICONS.includes(iconName) ? FaIcons[iconName] : FaIcons.FaCheckCircle;
    return Icon ? <Icon /> : <FaIcons.FaCheckCircle />;
  };

  // ── Live Page Preview renderer (mirrors DynamicPage.jsx) ──────────────────
  const renderPreviewSection = (section, idx) => {
    if (!section) return null;
    switch (section.type) {
      case 'text_image':
        return (
          <div key={section.id || idx} style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 40, flexDirection: section.alignment === 'left' ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              {section.title_ar && <h4 style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{section.title_ar}</h4>}
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: section.content_ar }} />
            </div>
            <div style={{ flex: 1, minWidth: 220, borderRadius: 16, overflow: 'hidden', height: 220, background: '#f0f4ff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {section.image_url
                ? <img src={section.image_url} alt={section.title_ar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <FaIcons.FaImage size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />}
            </div>
          </div>
        );
      case 'profile_card':
        return (
          <div key={section.id || idx} style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <div style={{ background: 'var(--card-bg)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,48,135,0.08)', maxWidth: 380, width: '100%', textAlign: 'center' }}>
              <div style={{ height: 200, overflow: 'hidden', background: 'linear-gradient(135deg,#001225,#003087)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {section.image_url
                  ? <img src={section.image_url} alt={section.profile_name_ar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <FaIcons.FaUser size={50} color='rgba(255,255,255,0.3)' />}
                <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0 }}>
                  <h5 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>{section.profile_name_ar}</h5>
                </div>
              </div>
              <div style={{ padding: 20, background: 'var(--card-bg)' }}>
                <span style={{ background: 'rgba(0,48,135,0.08)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, padding: '4px 14px', borderRadius: 99, border: '1px solid rgba(0,48,135,0.15)' }}>{section.profile_title_ar}</span>
                {section.bio_ar && <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.88rem', lineHeight: 1.7 }}>{section.bio_ar}</p>}
              </div>
            </div>
          </div>
        );
      case 'cards_grid':
        return (
          <div key={section.id || idx} style={{ marginBottom: 40 }}>
            {section.title_ar && <h4 style={{ fontWeight: 800, textAlign: 'center', marginBottom: 20, color: 'var(--text)' }}>{section.title_ar}</h4>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {(section.items || []).map((item, i) => (
                <div key={i} style={{ background: 'var(--card-bg)', borderRadius: 14, border: '1px solid var(--border)', padding: '18px', display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,48,135,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1rem', flexShrink: 0 }}>{getDynamicIcon(item.icon)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: 4 }}>{item.title_ar}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc_ar}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'info_banner':
        return (
          <div key={section.id || idx} style={{ background: 'linear-gradient(135deg,#001d5a,#003087,#0066cc)', borderRadius: 20, padding: '40px 32px', textAlign: 'center', marginBottom: 40, position: 'relative', overflow: 'hidden' }}>
            <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>{section.title_ar}</h4>
            {section.banner_desc_ar && <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 20 }}>{section.banner_desc_ar}</p>}
            {section.banner_btn_text_ar && <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 22px', borderRadius: 99, fontWeight: 600, display: 'inline-block' }}>{section.banner_btn_text_ar}</span>}
          </div>
        );
      case 'stats_grid':
        return (
          <div key={section.id || idx} style={{ marginBottom: 40 }}>
            {section.title_ar && <h4 style={{ fontWeight: 800, textAlign: 'center', marginBottom: 20, color: 'var(--text)' }}>{section.title_ar}</h4>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              {(section.items || []).map((item, i) => (
                <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 14px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 99, background: 'rgba(0,48,135,0.06)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', margin: '0 auto 10px' }}>{getDynamicIcon(item.icon)}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.label_ar}</div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPagePreview = (data) => {
    if (!data) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>لا توجد بيانات للمعاينة</div>;
    const hasSections = data.sections && data.sections.length > 0;
    const hasContent = data.content_ar && data.content_ar.trim();
    return (
      <div style={{ direction: 'rtl', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
        {/* Preview header */}
        <div style={{ background: 'linear-gradient(135deg,#001225,#001d5a,#003087)', borderRadius: 16, padding: '32px 28px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(0,168,232,0.1) 0%,transparent 70%)' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 99, color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', fontWeight: 600, marginBottom: 12 }}>
            <FaDesktop size={10} /> معاينة مباشرة
          </div>
          <h2 style={{ color: '#fff', fontWeight: 900, margin: 0, fontSize: 'clamp(1.2rem,3vw,1.8rem)' }}>{data.title_ar || 'الصفحة'}</h2>
        </div>
        {/* Sections */}
        {hasSections && data.sections.map((sec, idx) => renderPreviewSection(sec, idx))}
        {/* HTML content */}
        {hasContent && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,48,135,0.06)', lineHeight: 1.9, color: 'var(--text)', fontSize: '1rem' }} dangerouslySetInnerHTML={{ __html: data.content_ar }} />
        )}
        {!hasSections && !hasContent && (
          <div style={{ textAlign: 'center', padding: 60, background: 'var(--card-bg)', borderRadius: 16, border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
            <FaFileAlt size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p style={{ margin: 0 }}>لا يوجد محتوى مضاف لهذه الصفحة بعد</p>
          </div>
        )}
      </div>
    );
  };

  // Reusable sections builder builder function
  const renderSectionsTab = (data, setData) => {
    if (!data) return null;
    return (
      <>
        {/* Section Type Selector */}
        <Card className="border-0 shadow-sm rounded-4 mb-4 p-4">
          <h5 className="fw-bold mb-3">➕ إضافة قالب أو قسم جديد:</h5>
          <Row className="g-3 row-cols-2 row-cols-md-3 row-cols-lg-5">
            <Col>
              <Button 
                variant="outline-primary" 
                className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                onClick={() => addSection('text_image', data, setData)}
              >
                <FaFileAlt size={22} />
                <span className="small fw-bold">نص وصورة</span>
              </Button>
            </Col>
            <Col>
              <Button 
                variant="outline-success" 
                className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                onClick={() => addSection('profile_card', data, setData)}
              >
                <FaUser size={22} />
                <span className="small fw-bold">بطاقة تعريفية</span>
              </Button>
            </Col>
            <Col>
              <Button 
                variant="outline-info" 
                className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                onClick={() => addSection('cards_grid', data, setData)}
              >
                <FaLayerGroup size={22} />
                <span className="small fw-bold">شبكة تعاريف</span>
              </Button>
            </Col>
            <Col>
              <Button 
                variant="outline-warning" 
                className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                onClick={() => addSection('info_banner', data, setData)}
              >
                <FaBuilding size={22} />
                <span className="small fw-bold">بنر إعلاني</span>
              </Button>
            </Col>
            <Col>
              <Button 
                variant="outline-danger" 
                className="w-100 h-100 p-3 rounded-4 d-flex flex-column align-items-center justify-content-center gap-2"
                onClick={() => addSection('stats_grid', data, setData)}
              >
                <FaChartBar size={22} />
                <span className="small fw-bold">إحصائيات وأرقام</span>
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Sections List */}
        <div className="d-flex flex-column gap-3 mb-4">
          {(data.sections || []).length === 0 ? (
            <div className="text-center py-5 text-muted bg-white rounded-4 border-0 shadow-sm">
              <FaLayerGroup size={40} className="mb-3 opacity-25" />
              <p className="mb-0 small">لا توجد أقسام ديناميكية مضافة لهذه الصفحة بعد.</p>
            </div>
          ) : (
            data.sections.map((sec, idx) => (
              <Card key={sec.id || idx} className="border border-light shadow-sm rounded-4">
                <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={
                      sec.type === 'text_image' ? 'primary' :
                      sec.type === 'profile_card' ? 'success' :
                      sec.type === 'cards_grid' ? 'info' :
                      sec.type === 'info_banner' ? 'warning' : 'danger'
                    } className="px-3 py-2 fs-7 rounded-pill">
                      {sec.type === 'text_image' ? 'نص وصورة' :
                       sec.type === 'profile_card' ? 'بطاقة تعريفية مع صورة' :
                       sec.type === 'cards_grid' ? 'شبكة بطاقات تعاريف' :
                       sec.type === 'info_banner' ? 'بنر إعلاني / دعائي' : 'إحصائيات وأرقام'}
                    </Badge>
                    <span className="fw-bold text-dark ms-2">
                      {sec.title_ar || sec.profile_name_ar || `قسم غير معنون (${idx + 1})`}
                    </span>
                  </div>
                  <div className="d-flex gap-1 align-items-center">
                    <Button variant="white" className="border shadow-none" size="sm" onClick={() => moveSection(idx, -1, data, setData)} disabled={idx === 0}>
                      <FaArrowUp size={11} />
                    </Button>
                    <Button variant="white" className="border shadow-none" size="sm" onClick={() => moveSection(idx, 1, data, setData)} disabled={idx === data.sections.length - 1}>
                      <FaArrowDown size={11} />
                    </Button>
                    <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => removeSection(idx, data, setData)}>
                      <FaTrash size={11} className="ms-1" /> حذف القسم
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  {sec.type === 'text_image' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">العنوان للقسم (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.title_ar || ''}
                            onChange={e => updateSection(idx, 'title_ar', e.target.value, data, setData)}
                            placeholder="أدخل عنوان القسم..."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">العنوان للقسم (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.title_en || ''}
                            onChange={e => updateSection(idx, 'title_en', e.target.value, data, setData)}
                            placeholder="Enter section title..."
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={8}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small"><FaImage className="ms-1" /> رابط الصورة</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.image_url || ''}
                            onChange={e => updateSection(idx, 'image_url', e.target.value, data, setData)}
                            placeholder="http://localhost:5000/uploads/..."
                            style={{ direction: 'ltr', fontSize: '0.85rem' }}
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">أو تحميل ملف صورة مباشرة</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageUpload(e.target.files[0], data, setData, idx, 'image_url')}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">محاذاة الصورة</Form.Label>
                          <Form.Select
                            value={sec.alignment || 'right'}
                            onChange={e => updateSection(idx, 'alignment', e.target.value, data, setData)}
                          >
                            <option value="right">الصورة على اليمين</option>
                            <option value="left">الصورة على اليسار</option>
                          </Form.Select>
                        </Form.Group>
                        {sec.image_url && (
                          <div className="mt-2 text-center">
                            <img src={sec.image_url} alt="معاينة" style={{ maxWidth: '100%', maxHeight: 110, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                          </div>
                        )}
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">المحتوى النصي (بالعربية - يدعم HTML)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={sec.content_ar || ''}
                            onChange={e => updateSection(idx, 'content_ar', e.target.value, data, setData)}
                            placeholder="اكتب تفاصيل المحتوى هنا..."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">المحتوى النصي (بالإنكليزية - يدعم HTML)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={sec.content_en || ''}
                            onChange={e => updateSection(idx, 'content_en', e.target.value, data, setData)}
                            placeholder="Write details content here..."
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {sec.type === 'profile_card' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">الاسم الشخصي (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.profile_name_ar || ''}
                            onChange={e => updateSection(idx, 'profile_name_ar', e.target.value, data, setData)}
                            placeholder="مثال: د. أحمد التومي"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">الاسم الشخصي (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.profile_name_en || ''}
                            onChange={e => updateSection(idx, 'profile_name_en', e.target.value, data, setData)}
                            placeholder="Dr. Ahmed Al-Toumi"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">المسمى الوظيفي (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.profile_title_ar || ''}
                            onChange={e => updateSection(idx, 'profile_title_ar', e.target.value, data, setData)}
                            placeholder="مدير عام المصلحة"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">المسمى الوظيفي (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.profile_title_en || ''}
                            onChange={e => updateSection(idx, 'profile_title_en', e.target.value, data, setData)}
                            placeholder="General Manager"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={8}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small"><FaImage className="ms-1" /> رابط الصورة</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.image_url || ''}
                            onChange={e => updateSection(idx, 'image_url', e.target.value, data, setData)}
                            placeholder="http://localhost:5000/uploads/..."
                            style={{ direction: 'ltr', fontSize: '0.85rem' }}
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">تحميل ملف صورة</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageUpload(e.target.files[0], data, setData, idx, 'image_url')}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="text-center">
                        {sec.image_url ? (
                          <img src={sec.image_url} alt="Profile" style={{ width: 85, height: 85, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', padding: 2 }} />
                        ) : (
                          <div style={{ width: 85, height: 85, borderRadius: '50%', background: '#eee', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaUser size={28} color="#aaa" />
                          </div>
                        )}
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نبذة عامة (بالعربية)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={sec.bio_ar || ''}
                            onChange={e => updateSection(idx, 'bio_ar', e.target.value, data, setData)}
                            placeholder="نبذة سيرة ذاتية صغيرة..."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نبذة عامة (بالإنكليزية)</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={sec.bio_en || ''}
                            onChange={e => updateSection(idx, 'bio_en', e.target.value, data, setData)}
                            placeholder="Short biography..."
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {sec.type === 'cards_grid' && (
                    <div>
                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">عنوان شبكة البطاقات (بالعربية)</Form.Label>
                            <Form.Control
                              type="text"
                              value={sec.title_ar || ''}
                              onChange={e => updateSection(idx, 'title_ar', e.target.value, data, setData)}
                              placeholder="أهدافنا"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">عنوان شبكة البطاقات (بالإنكليزية)</Form.Label>
                            <Form.Control
                              type="text"
                              value={sec.title_en || ''}
                              onChange={e => updateSection(idx, 'title_en', e.target.value, data, setData)}
                              placeholder="Our Goals"
                              style={{ direction: 'ltr' }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="p-3 bg-light rounded-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-bold small text-primary">📦 عناصر الشبكة ({(sec.items || []).length})</span>
                          <Button variant="primary" size="sm" className="rounded-pill" onClick={() => addSectionItem(idx, 'cards_grid', data, setData)}>
                            <FaPlus className="ms-1" /> إضافة بطاقة للشبكة
                          </Button>
                        </div>

                        <div className="d-flex flex-column gap-3">
                          {(sec.items || []).map((item, itemIdx) => (
                            <div key={itemIdx} className="bg-white p-3 rounded-3 border d-flex gap-3 position-relative">
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                style={{ position: 'absolute', top: 10, left: 10 }}
                                onClick={() => removeSectionItem(idx, itemIdx, data, setData)}
                              >
                                <FaTrash size={10} />
                              </Button>
                              <div style={{ width: 80 }}>
                                <Form.Label className="small fw-bold mb-1">الأيقونة</Form.Label>
                                <Form.Select
                                  value={item.icon || 'FaCheckCircle'}
                                  onChange={e => updateSectionItem(idx, itemIdx, 'icon', e.target.value, data, setData)}
                                  style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                                >
                                  {FA_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                                </Form.Select>
                                <div className="text-center mt-2 text-primary" style={{ fontSize: '1.4rem' }}>
                                  {getDynamicIcon(item.icon)}
                                </div>
                              </div>
                              <div className="flex-grow-1 row g-2">
                                <Col md={6}>
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    value={item.title_ar || ''}
                                    onChange={e => updateSectionItem(idx, itemIdx, 'title_ar', e.target.value, data, setData)}
                                    placeholder="العنوان بالعربية..."
                                    className="mb-1"
                                  />
                                  <Form.Control
                                    as="textarea"
                                    rows={2}
                                    size="sm"
                                    value={item.desc_ar || ''}
                                    onChange={e => updateSectionItem(idx, itemIdx, 'desc_ar', e.target.value, data, setData)}
                                    placeholder="الوصف بالعربية..."
                                    style={{ fontSize: '0.8rem' }}
                                  />
                                </Col>
                                <Col md={6}>
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    value={item.title_en || ''}
                                    onChange={e => updateSectionItem(idx, itemIdx, 'title_en', e.target.value, data, setData)}
                                    placeholder="Title in English..."
                                    className="mb-1"
                                    style={{ direction: 'ltr' }}
                                  />
                                  <Form.Control
                                    as="textarea"
                                    rows={2}
                                    size="sm"
                                    value={item.desc_en || ''}
                                    onChange={e => updateSectionItem(idx, itemIdx, 'desc_en', e.target.value, data, setData)}
                                    placeholder="Description in English..."
                                    style={{ fontSize: '0.8rem', direction: 'ltr' }}
                                  />
                                </Col>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {sec.type === 'info_banner' && (
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">العنوان الرئيسي للبنر (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.title_ar || ''}
                            onChange={e => updateSection(idx, 'title_ar', e.target.value, data, setData)}
                            placeholder="مثال: جاهز للبدء بالتخطيط؟"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">العنوان الرئيسي للبنر (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.title_en || ''}
                            onChange={e => updateSection(idx, 'title_en', e.target.value, data, setData)}
                            placeholder="Example: Ready to start planning?"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">الوصف الفرعي (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.banner_desc_ar || ''}
                            onChange={e => updateSection(idx, 'banner_desc_ar', e.target.value, data, setData)}
                            placeholder="نص فرعي يشجع على النقر..."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">الوصف الفرعي (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.banner_desc_en || ''}
                            onChange={e => updateSection(idx, 'banner_desc_en', e.target.value, data, setData)}
                            placeholder="Subtitle text..."
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نص زر الإجراء (بالعربية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.banner_btn_text_ar || ''}
                            onChange={e => updateSection(idx, 'banner_btn_text_ar', e.target.value, data, setData)}
                            placeholder="تواصل معنا"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">نص زر الإجراء (بالإنكليزية)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.banner_btn_text_en || ''}
                            onChange={e => updateSection(idx, 'banner_btn_text_en', e.target.value, data, setData)}
                            placeholder="Contact Us"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">رابط زر الإجراء (داخلي أو خارجي)</Form.Label>
                          <Form.Control
                            type="text"
                            value={sec.banner_btn_link || ''}
                            onChange={e => updateSection(idx, 'banner_btn_link', e.target.value, data, setData)}
                            placeholder="/contact"
                            style={{ direction: 'ltr' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-2">
                          <Form.Label className="fw-bold small">لون خلفية البنر</Form.Label>
                          <Form.Select
                            value={sec.banner_bg || 'blue'}
                            onChange={e => updateSection(idx, 'banner_bg', e.target.value, data, setData)}
                          >
                            <option value="blue">أزرق داكن متدرج (كلاسيكي)</option>
                            <option value="gradient">تدرج براند الهيئة (أزرق سماوي)</option>
                            <option value="dark">زجاجي أسود داكن (مودرن)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {sec.type === 'stats_grid' && (
                    <div>
                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">عنوان قسم الإحصائيات (بالعربية - اختياري)</Form.Label>
                            <Form.Control
                              type="text"
                              value={sec.title_ar || ''}
                              onChange={e => updateSection(idx, 'title_ar', e.target.value, data, setData)}
                              placeholder="إحصائيات الإقليم"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">عنوان قسم الإحصائيات (بالإنكليزية - اختياري)</Form.Label>
                            <Form.Control
                              type="text"
                              value={sec.title_en || ''}
                              onChange={e => updateSection(idx, 'title_en', e.target.value, data, setData)}
                              placeholder="Region Statistics"
                              style={{ direction: 'ltr' }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="p-3 bg-light rounded-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-bold small text-danger">📊 الإحصائيات والأرقام ({(sec.items || []).length})</span>
                          <Button variant="danger" size="sm" className="rounded-pill" onClick={() => addSectionItem(idx, 'stats_grid', data, setData)}>
                            <FaPlus className="ms-1" /> إضافة رقم إحصائي
                          </Button>
                        </div>

                        <div className="d-flex flex-column gap-3">
                          {(sec.items || []).map((item, itemIdx) => (
                            <div key={itemIdx} className="bg-white p-3 rounded-3 border d-flex gap-3 position-relative">
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                style={{ position: 'absolute', top: 10, left: 10 }}
                                onClick={() => removeSectionItem(idx, itemIdx, data, setData)}
                              >
                                <FaTrash size={10} />
                              </Button>
                              <div style={{ width: 80 }}>
                                <Form.Label className="small fw-bold mb-1">الأيقونة</Form.Label>
                                <Form.Select
                                  value={item.icon || 'FaCheckCircle'}
                                  onChange={e => updateSectionItem(idx, itemIdx, 'icon', e.target.value, data, setData)}
                                  style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                                >
                                  {FA_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                                </Form.Select>
                                <div className="text-center mt-2 text-danger" style={{ fontSize: '1.4rem' }}>
                                  {getDynamicIcon(item.icon)}
                                </div>
                              </div>
                              <div className="flex-grow-1 row g-2">
                                <Col md={4}>
                                  <Form.Label className="small fw-bold mb-0">القيمة / الرقم</Form.Label>
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    value={item.value || ''}
                                    onChange={e => updateSectionItem(idx, itemIdx, 'value', e.target.value, data, setData)}
                                    placeholder="مثال: 50K+ أو 94%"
                                  />
                                </Col>
                                <Col md={4}>
                                  <Form.Label className="small fw-bold mb-0">الوصف بالعربية</Form.Label>
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    value={item.label_ar || ''}
                                    onChange={e => updateSectionItem(idx, itemIdx, 'label_ar', e.target.value, data, setData)}
                                    placeholder="مثال: نسمة"
                                  />
                                </Col>
                                <Col md={4}>
                                  <Form.Label className="small fw-bold mb-0">الوصف بالإنكليزية</Form.Label>
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    value={item.label_en || ''}
                                    onChange={e => updateSectionItem(idx, itemIdx, 'label_en', e.target.value, data, setData)}
                                    placeholder="Example: Population"
                                    style={{ direction: 'ltr' }}
                                  />
                                </Col>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))
          )}
        </div>
      </>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ direction: 'rtl' }}>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 className="fw-bold m-0 text-primary d-flex align-items-center gap-2">
          {selectedPageId ? (
            <span className="d-flex align-items-center gap-2">
              <Button variant="link" className="p-0 text-primary" onClick={() => setSelectedPageId(null)}>
                <FaArrowRight />
              </Button>
              <FaFileAlt className="ms-1" />
              <span style={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pageData?.title_ar || selectedPageId}
              </span>
            </span>
          ) : (
            <span><FaFileAlt className="ms-2" /> إدارة محتوى الصفحات ({pagesList.length})</span>
          )}
        </h3>

        {/* Global Action Buttons */}
        <div className="d-flex gap-2 align-items-center">
          {selectedPageId && pageData && (
            <>
              {/* Display page toggle / delete based on activeTab (main vs subpage) */}
              {activeTab.startsWith('subpage_') && subPageData ? (
                <>
                  <Button
                    variant={subPageData.is_visible ? 'outline-secondary' : 'outline-success'}
                    className="rounded-pill px-3"
                    onClick={() => handleToggleVisibility(subPageData.id, subPageData.is_visible, true)}
                  >
                    {subPageData.is_visible ? <><FaEyeSlash className="ms-1" /> إخفاء الفرعية</> : <><FaEye className="ms-1" /> إظهار الفرعية</>}
                  </Button>
                  <Button
                    variant="outline-danger"
                    className="rounded-pill px-3"
                    onClick={() => setShowDeleteSubModal(true)}
                  >
                    <FaTrash className="ms-1" /> حذف الفرعية
                  </Button>
                  <a href={`/page/${subPageData.id}`} target="_blank" rel="noreferrer">
                    <Button variant="outline-primary" className="rounded-pill px-3">
                      <FaExternalLinkAlt className="ms-1" /> معاينة الفرعية
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <Button
                    variant={pageData.is_visible ? 'outline-secondary' : 'outline-success'}
                    className="rounded-pill px-3"
                    onClick={() => handleToggleVisibility(pageData.id, pageData.is_visible, false)}
                  >
                    {pageData.is_visible ? <><FaEyeSlash className="ms-1" /> إخفاء</> : <><FaEye className="ms-1" /> إظهار</>}
                  </Button>
                  <Button
                    variant="outline-danger"
                    className="rounded-pill px-3"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <FaTrash className="ms-1" /> حذف الرئيسية
                  </Button>
                  <a href={`/page/${selectedPageId}`} target="_blank" rel="noreferrer">
                    <Button variant="outline-primary" className="rounded-pill px-3">
                      <FaExternalLinkAlt className="ms-1" /> معاينة
                    </Button>
                  </a>
                </>
              )}

              <PrimaryButton onClick={handleSave} icon={<FaSave />} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </PrimaryButton>
            </>
          )}

          {!selectedPageId && (
            <PrimaryButton onClick={() => setShowAddMainModal(true)} icon={<FaPlus />}>
              إضافة صفحة رئيسية
            </PrimaryButton>
          )}
        </div>
      </div>

      <Row className="g-4">
        {/* Sidebar List Box */}
        <Col md={4} lg={3}>
          <Card className="border-0 shadow-sm rounded-4" style={{ position: 'sticky', top: 80 }}>
            <Card.Header className="bg-white border-bottom rounded-top-4 p-3">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <FaSearch size={13} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="بحث في الصفحات الرئيسية..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="border-0 bg-light"
                  style={{ fontSize: '0.88rem' }}
                />
                {searchTerm && (
                  <Button variant="link" className="p-2" onClick={() => setSearchTerm('')}>
                    <FaTimes size={12} className="text-muted" />
                  </Button>
                )}
              </InputGroup>
            </Card.Header>
            <Card.Body className="p-0" style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
              {filteredMainPages.length === 0 ? (
                <div className="text-center p-4 text-muted small">لا توجد نتائج</div>
              ) : (
                filteredMainPages.map((page) => {
                  const isSelected = selectedPageId === page.id;
                  const title = getPageTitle(page);
                  const isVisible = page.is_visible !== 0;
                  
                  // Count children
                  const childrenCount = pagesList.filter(c => c.parent_id === page.id).length;

                  return (
                    <div
                      key={page.id}
                      onClick={() => setSelectedPageId(page.id)}
                      style={{
                        padding: '14px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text)',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                      className={!isSelected ? 'page-list-item-hover' : ''}
                    >
                      <div className="d-flex flex-column min-w-0 flex-grow-1">
                        <span
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: isSelected ? 700 : 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={title}
                        >
                          {title}
                        </span>
                        <span style={{ fontSize: '0.72rem', opacity: isSelected ? 0.8 : 0.5, marginTop: 2 }}>
                          {childrenCount > 0 ? `📂 ${childrenCount} صفحات فرعية` : '📄 صفحة رئيسية منفردة'}
                        </span>
                      </div>
                      
                      <div className="d-flex align-items-center gap-1">
                        {!isVisible && (
                          <FaEyeSlash size={11} style={{ opacity: 0.6 }} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Dynamic Editor Panel */}
        <Col md={8} lg={9}>
          <AnimatePresence mode="wait">
            {selectedPageId ? (
              loadingPage ? (
                <Card className="border-0 shadow-sm rounded-4 p-5 text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted small">جاري تحميل بيانات الصفحة الرئيسية...</p>
                </Card>
              ) : pageData ? (
                <motion.div key={selectedPageId} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  
                  {/* Top tabs containing Main Content, Sections and Sub-Pages */}
                  <Tabs activeKey={activeTab} onSelect={k => {
                    if (k === 'add_sub_page') {
                      setShowAddSubModal(true);
                    } else {
                      setActiveTab(k);
                    }
                  }} className="mb-4 dashboard-custom-tabs" style={{ direction: 'rtl' }}>
                    
                    {/* Tab 1: Main Content */}
                    <Tab eventKey="content" title="📄 المحتوى الرئيسي">
                      <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Header className="bg-white border-bottom p-4">
                          <Row className="g-3">
                            <Col md={8}>
                              <Form.Label className="fw-bold small text-muted mb-1">عنوان الصفحة (بالعربية)</Form.Label>
                              <Form.Control
                                type="text"
                                value={pageData.title_ar || ''}
                                onChange={e => setPageData({ ...pageData, title_ar: e.target.value })}
                                style={{ borderRadius: 10, fontWeight: 600, fontSize: '1.05rem' }}
                                placeholder="أدخل عنوان الصفحة..."
                              />
                            </Col>
                            <Col md={4}>
                              <Form.Label className="fw-bold small text-muted mb-1">حالة الظهور للعموم</Form.Label>
                              <div className="d-flex align-items-center gap-3 mt-1 p-3 rounded-3 bg-light">
                                <Form.Check
                                  type="switch"
                                  id="main-page-visibility"
                                  checked={!!pageData.is_visible}
                                  onChange={e => setPageData({ ...pageData, is_visible: e.target.checked })}
                                />
                                <span className="fw-bold small">
                                  {pageData.is_visible ? '🟢 ظاهر للعموم' : '🔴 مخفي'}
                                </span>
                              </div>
                            </Col>
                            <Col md={12}>
                              <Form.Label className="fw-bold small text-muted mb-1">رابط الصفحة العام</Form.Label>
                              <code className="p-2 rounded bg-light d-block" style={{ fontSize: '0.85rem', direction: 'ltr' }}>
                                /page/{pageData.id}
                              </code>
                            </Col>
                          </Row>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">محتوى الصفحة التوضيحي (بالعربية)</Form.Label>
                            <RichTextEditor
                              value={pageData.content_ar || ''}
                              onChange={val => setPageData({ ...pageData, content_ar: val })}
                            />
                          </Form.Group>
                        </Card.Body>
                      </Card>
                    </Tab>

                    {/* Tab 2: Sections Builder */}
                    <Tab eventKey="sections" title={`🧩 أقسام وقوالب الصفحة (${(pageData.sections || []).length})`}>
                      {renderSectionsTab(pageData, setPageData)}
                    </Tab>

                    {/* Tab 3: Live Preview */}
                    <Tab eventKey="preview" title={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FaDesktop size={13} /> معاينة الصفحة
                      </span>
                    }>
                      <Card className="border-0 shadow-sm rounded-4 mb-4">
                        <Card.Header className="bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                          <span style={{ fontWeight: 700, color: '#003087', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FaDesktop /> معاينة الصفحة كما تظهر للزوار
                          </span>
                          <a href={`/page/${selectedPageId}`} target="_blank" rel="noreferrer">
                            <Button variant="outline-primary" size="sm" className="rounded-pill px-3">
                              <FaExternalLinkAlt className="ms-1" size={11} /> فتح في صفحة مستقلة
                            </Button>
                          </a>
                        </Card.Header>
                        <Card.Body className="p-4" style={{ background: 'var(--bg)' }}>
                          {renderPagePreview(pageData)}
                        </Card.Body>
                      </Card>
                    </Tab>

                    {/* Dynamic Sub-Pages Tabs */}
                    {currentSubPages.map(sub => (
                      <Tab key={sub.id} eventKey={`subpage_${sub.id}`} title={`📂 ${sub.title_ar || sub.id}`}>
                        {loadingSubPage ? (
                          <Card className="border-0 shadow-sm rounded-4 p-5 text-center">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted small">جاري تحميل بيانات الصفحة الفرعية...</p>
                          </Card>
                        ) : subPageData ? (
                          <div className="sub-page-editor-container">
                            <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded-4 shadow-sm border border-light">
                              <div>
                                <span className="text-muted small">تعديل الصفحة الفرعية:</span>
                                <h5 className="fw-bold m-0 text-primary">{subPageData.title_ar}</h5>
                              </div>
                              <code className="p-2 rounded bg-light text-muted small" style={{ direction: 'ltr' }}>
                                /page/{subPageData.id}
                              </code>
                            </div>

                            {/* Subpage Sub Tabs */}
                            <Tabs defaultActiveKey="sub_content" id={`subtabs_${sub.id}`} className="mb-3 sub-tabs-bar">
                              
                              {/* Subpage main content */}
                              <Tab eventKey="sub_content" title="📄 المحتوى الأساسي">
                                <Card className="border-0 shadow-sm rounded-4 mb-4">
                                  <Card.Body className="p-4">
                                    <Row className="g-3 mb-4">
                                      <Col md={8}>
                                        <Form.Label className="fw-bold small text-muted mb-1">عنوان الصفحة الفرعية (بالعربية)</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={subPageData.title_ar || ''}
                                          onChange={e => setSubPageData({ ...subPageData, title_ar: e.target.value })}
                                          style={{ borderRadius: 10, fontWeight: 600 }}
                                        />
                                      </Col>
                                      <Col md={4}>
                                        <Form.Label className="fw-bold small text-muted mb-1">حالة ظهور الفرعية</Form.Label>
                                        <div className="d-flex align-items-center gap-3 mt-1 p-2 rounded-3 bg-light">
                                          <Form.Check
                                            type="switch"
                                            id={`sub-visibility-${sub.id}`}
                                            checked={!!subPageData.is_visible}
                                            onChange={e => setSubPageData({ ...subPageData, is_visible: e.target.checked })}
                                          />
                                          <span className="fw-bold small">
                                            {subPageData.is_visible ? '🟢 ظاهر' : '🔴 مخفي'}
                                          </span>
                                        </div>
                                      </Col>
                                    </Row>
                                    <Form.Group className="mb-4">
                                      <Form.Label className="fw-bold">محتوى الصفحة التوضيحي (بالعربية)</Form.Label>
                                      <RichTextEditor
                                        value={subPageData.content_ar || ''}
                                        onChange={val => setSubPageData({ ...subPageData, content_ar: val })}
                                      />
                                    </Form.Group>
                                  </Card.Body>
                                </Card>
                              </Tab>

                              {/* Subpage sections */}
                              <Tab eventKey="sub_sections" title={`🧩 أقسام وقوالب الفرعية (${(subPageData.sections || []).length})`}>
                                {renderSectionsTab(subPageData, setSubPageData)}
                              </Tab>

                              {/* Subpage Live Preview */}
                              <Tab eventKey="sub_preview" title={
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <FaDesktop size={12} /> معاينة الفرعية
                                </span>
                              }>
                                <Card className="border-0 shadow-sm rounded-4 mb-4">
                                  <Card.Header className="bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                                    <span style={{ fontWeight: 700, color: '#003087', display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <FaDesktop /> معاينة الصفحة الفرعية كما تظهر للزوار
                                    </span>
                                    <a href={`/page/${subPageData.id}`} target="_blank" rel="noreferrer">
                                      <Button variant="outline-primary" size="sm" className="rounded-pill px-3">
                                        <FaExternalLinkAlt className="ms-1" size={11} /> فتح في صفحة مستقلة
                                      </Button>
                                    </a>
                                  </Card.Header>
                                  <Card.Body className="p-4" style={{ background: 'var(--bg)' }}>
                                    {renderPagePreview(subPageData)}
                                  </Card.Body>
                                </Card>
                              </Tab>
                            </Tabs>
                          </div>
                        ) : null}
                      </Tab>
                    ))}

                    {/* Add Sub-page Tab Button */}
                    <Tab eventKey="add_sub_page" title="➕ إضافة صفحة فرعية" />
                  </Tabs>

                  {/* Save button floating footer */}
                  <div className="d-flex justify-content-end gap-2 mb-4 bg-white p-3 rounded-4 shadow-sm border border-light">
                    <Button variant="light" className="rounded-pill px-4" onClick={() => setSelectedPageId(null)}>
                      رجوع للقائمة الرئيسية
                    </Button>
                    <PrimaryButton onClick={handleSave} icon={<FaSave />} disabled={saving}>
                      {saving ? 'جاري الحفظ...' : 'حفظ جميع التعديلات'}
                    </PrimaryButton>
                  </div>

                </motion.div>
              ) : null
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-0 shadow-sm rounded-4 p-5 h-100 d-flex justify-content-center align-items-center text-center">
                  <Card.Body className="py-5">
                    <FaFileAlt size={64} className="text-muted mb-4 opacity-25" />
                    <h5 className="text-muted fw-bold mb-2">اختر صفحة رئيسية من القائمة الجانبية</h5>
                    <p className="text-muted small mb-0">
                      تظهر هنا الصفحات الرئيسية فقط، ويمكنك التعديل عليها وإضافة صفحات فرعية تابعة لها كعلامات تبويب.
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </Col>
      </Row>

      {/* Modal: Create New Main Page */}
      <ModernModal show={showAddMainModal} onClose={() => setShowAddMainModal(false)} title="إنشاء صفحة رئيسية جديدة" size="sm">
        <Form onSubmit={handleCreateMainPage}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">عنوان الصفحة الرئيسية</Form.Label>
            <Form.Control
              type="text"
              placeholder="مثال: فروع الهيئة"
              value={newPageTitle}
              onChange={e => setNewPageTitle(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">رابط الصفحة (Slug)</Form.Label>
            <Form.Control
              type="text"
              placeholder="مثال: authority-branches"
              value={newPageId}
              onChange={e => setNewPageId(e.target.value)}
              required
              style={{ direction: 'ltr' }}
            />
            <Form.Text className="text-muted">
              سيكون الرابط العام للموقع: <code>/page/{newPageId || 'authority-branches'}</code>
            </Form.Text>
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="light" className="rounded-pill px-4" onClick={() => setShowAddMainModal(false)}>إلغاء</Button>
            <PrimaryButton type="submit">إنشاء والبدء بالتعديل</PrimaryButton>
          </div>
        </Form>
      </ModernModal>

      {/* Modal: Create New Sub-page */}
      <ModernModal show={showAddSubModal} onClose={() => setShowAddSubModal(false)} title="إضافة صفحة فرعية جديدة" size="sm">
        <Form onSubmit={handleCreateSubPage}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-muted small">الصفحة الرئيسية الأب:</Form.Label>
            <h6 className="fw-bold text-primary mb-3">📂 {pageData?.title_ar || selectedPageId}</h6>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">عنوان الصفحة الفرعية</Form.Label>
            <Form.Control
              type="text"
              placeholder="مثال: إقليم الخمس الفرعي"
              value={newSubPageTitle}
              onChange={e => setNewSubPageTitle(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">رابط الصفحة الفرعية (Slug)</Form.Label>
            <Form.Control
              type="text"
              placeholder="مثال: khums-sub-region"
              value={newSubPageId}
              onChange={e => setNewSubPageId(e.target.value)}
              required
              style={{ direction: 'ltr' }}
            />
            <Form.Text className="text-muted">
              سيكون الرابط العام للموقع: <code>/page/{newSubPageId || 'khums-sub-region'}</code>
            </Form.Text>
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="light" className="rounded-pill px-4" onClick={() => setShowAddSubModal(false)}>إلغاء</Button>
            <PrimaryButton type="submit">إنشاء والبدء بالتعديل</PrimaryButton>
          </div>
        </Form>
      </ModernModal>

      {/* Modal: Delete Main Page Confirmation */}
      <ModernModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="تأكيد حذف الصفحة الرئيسية" type="danger" size="sm">
        <div className="text-center">
          <p className="fw-bold mb-3">هل أنت متأكد من حذف هذه الصفحة الرئيسية نهائياً؟</p>
          <p className="text-danger fw-bold mb-3">"{pageData?.title_ar || pageData?.id}"</p>
          <p className="text-muted small mb-4">تحذير: سيؤدي ذلك أيضاً إلى إبقاء الصفحات الفرعية التابعة بدون أب أو حذف روابطها.</p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowDeleteModal(false)}>إلغاء</Button>
            <Button variant="danger" className="rounded-pill px-4" onClick={handleDeleteMain}>تأكيد الحذف</Button>
          </div>
        </div>
      </ModernModal>

      {/* Modal: Delete Sub Page Confirmation */}
      <ModernModal show={showDeleteSubModal} onClose={() => setShowDeleteSubModal(false)} title="تأكيد حذف الصفحة الفرعية" type="danger" size="sm">
        <div className="text-center">
          <p className="fw-bold mb-3">هل أنت متأكد من حذف هذه الصفحة الفرعية نهائياً؟</p>
          <p className="text-danger fw-bold mb-4">"{subPageData?.title_ar || subPageData?.id}"</p>
          <p className="text-muted small mb-4">لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowDeleteSubModal(false)}>إلغاء</Button>
            <Button variant="danger" className="rounded-pill px-4" onClick={handleDeleteSub}>تأكيد الحذف الفرعي</Button>
          </div>
        </div>
      </ModernModal>

      <style>{`
        .page-list-item-hover:hover {
          background: rgba(0,48,135,0.06) !important;
          color: var(--primary) !important;
        }
        
        /* Custom Styling for Tabs */
        .dashboard-custom-tabs .nav-link {
          font-family: 'Cairo', sans-serif;
          font-weight: 700;
          color: var(--text-muted);
          border: none;
          background: transparent;
          padding: 10px 18px;
          border-radius: 12px;
          transition: all 0.2s ease;
          margin-left: 6px;
          font-size: 0.9rem;
        }
        
        .dashboard-custom-tabs .nav-link:hover {
          background: rgba(0, 48, 135, 0.04);
          color: var(--primary);
        }
        
        .dashboard-custom-tabs .nav-link.active {
          background: var(--primary) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(0, 48, 135, 0.15);
        }
        
        /* Sub-tabs styling */
        .sub-tabs-bar .nav-link {
          font-size: 0.82rem;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 600;
        }
        
        .sub-tabs-bar .nav-link.active {
          background: #4b6b94 !important;
          color: #fff !important;
        }

        .wp-content-preview img { max-width: 100%; border-radius: 8px; }
        .wp-content-preview iframe { width: 100%; height: 250px; border-radius: 8px; border: 0; margin: 8px 0; }
        .wp-content-preview video { width: 100%; max-height: 250px; border-radius: 8px; margin: 8px 0; background: #000; }
        .wp-content-preview table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .wp-content-preview th, .wp-content-preview td { padding: 6px 10px; border: 1px solid var(--border); }
        .wp-content-preview th { background: var(--primary); color: white; }
      `}</style>
    </motion.div>
  );
};

export default ManagePages;
