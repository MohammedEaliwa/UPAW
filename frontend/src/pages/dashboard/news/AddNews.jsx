import React, { useState } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import RichTextEditor from '../../../components/RichTextEditor';
import { FaSave, FaImage, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { api } from '../../../services/api';

const AddNews = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [content, setContent] = useState('<p>اكتب تفاصيل الخبر هنا...</p>');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('أخبار الهيئة');
  const [targetAudience, setTargetAudience] = useState('العامة');
  const [images, setImages] = useState([]);
  const [kmlData, setKmlData] = useState(null);

  const { user } = useAuth();
  const loggedInUser = user || { id: 2 };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !content) {
      showToast('يرجى ملء جميع الحقول المطلوبة!', 'danger');
      return;
    }

    // Strip HTML for excerpt
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    const excerpt = plainText.length > 150 ? plainText.substring(0, 150) + "..." : plainText;

    const newPost = {
      title_ar: title,
      title_en: title,
      category,
      target_audience: category === 'أخبار داخلية' ? 'الموظفين' : targetAudience,
      image: images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      images: JSON.stringify(images),
      kml_data: category === 'مشاريع' ? kmlData : null,
      excerpt_ar: excerpt,
      content_ar: content,
      is_visible: true,
      author_id: loggedInUser.id || 2,
      date: new Date().toISOString().split('T')[0]
    };

    api.createNews(newPost)
      .then(() => {
        showToast('تم نشر الخبر بنجاح! ✨', 'success');
        setTimeout(() => navigate('/dashboard/manage-news'), 1500);
      })
      .catch(err => {
        console.error("Error saving post:", err);
        showToast(err.message || 'حدث خطأ أثناء حفظ الخبر', 'danger');
      });
  };

  const categories = ['أخبار الهيئة', 'مشاريع', 'تصنيف حضري', 'اجتماعات', 'إعلانات', 'أخبار داخلية'];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target.result);
        reader.onerror = ev => reject(ev);
        reader.readAsDataURL(file);
      });
    })).then(base64Images => {
      setImages(prev => [...prev, ...base64Images]);
    });
  };

  const handleKmlUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setKmlData(ev.target.result);
      reader.readAsText(file);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h3 className="fw-bold m-0 text-primary">
          <Button variant="link" className="text-decoration-none text-primary p-0 ms-2" onClick={() => navigate('/dashboard/manage-news')}>
            <FaChevronRight size={18} />
          </Button>
          إضافة خبر أو تنويه جديد
        </h3>
        <PrimaryButton onClick={handleSubmit} icon={<FaSave />}>
          نشر المنشور
        </PrimaryButton>
      </div>

      <Card className="border-0 shadow-sm card-custom rounded-4 p-4">
        <Card.Body className="p-0">
          <Form onSubmit={handleSubmit}>
            <Row className="gy-4">
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="fw-bold">عنوان الخبر الرئيسي *</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="أدخل عنوان الخبر البارز" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required 
                    className="py-2.5"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">تصنيف الخبر</Form.Label>
                  <Form.Select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="py-2.5"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">الجمهور المستهدف</Form.Label>
                  <Form.Select 
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    disabled={category === 'أخبار داخلية'}
                    className="py-2.5"
                  >
                    <option value="العامة">العامة (الزوار والموقع الخارجي)</option>
                    <option value="الموظفين">الموظفين فقط (لوحة التحكم الداخلية)</option>
                  </Form.Select>
                  {category === 'أخبار داخلية' && (
                    <Form.Text className="text-danger small">
                      تلقائياً مستهدف للموظفين لأن التصنيف أخبار داخلية
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">صور المعرض للمشروع / التقرير</Form.Label>
                  <Form.Control 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="py-2.5"
                  />
                  {images.length > 0 && (
                    <div className="d-flex gap-2 flex-wrap mt-3">
                      {images.map((img, i) => (
                        <div key={i} className="position-relative" style={{ width: 100, height: 100 }}>
                          <img src={img} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 lh-1"
                            onClick={() => removeImage(i)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </Col>

              {category === 'مشاريع' && (
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-success">إرفاق ملف الخريطة (KML) - خاص بالمشاريع</Form.Label>
                    <Form.Control 
                      type="file" 
                      accept=".kml"
                      onChange={handleKmlUpload}
                      className="py-2.5 border-success"
                    />
                    {kmlData && <Form.Text className="text-success fw-bold mt-2 d-block">تم قراءة الملف جاهز للإرفاق والمخطط المكاني.</Form.Text>}
                  </Form.Group>
                </Col>
              )}

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">تفاصيل ومحتوى الخبر *</Form.Label>
                  <RichTextEditor value={content} onChange={setContent} />
                </Form.Group>
              </Col>

              <Col md={12} className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                <Button variant="secondary" className="rounded-pill px-4" onClick={() => navigate('/dashboard/manage-news')}>إلغاء</Button>
                <PrimaryButton type="submit">حفظ ونشر الخبر</PrimaryButton>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default AddNews;
