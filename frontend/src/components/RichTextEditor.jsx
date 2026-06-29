import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Node } from '@tiptap/core';
import { 
  FaBold, FaItalic, FaStrikethrough, FaHeading, FaListUl, 
  FaListOl, FaQuoteRight, FaUndo, FaRedo, 
  FaImage, FaVideo, FaMapMarkerAlt, FaUpload 
} from 'react-icons/fa';
import { Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import ModernModal from './ModernModal';
import { api } from '../services/api';

// Define custom Iframe Node for YouTube embeds & OpenStreetMap
const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '350px',
      },
      style: {
        default: 'border:0; border-radius: 12px; width: 100%; height: 350px;',
      },
      allowfullscreen: {
        default: 'true',
      },
      frameborder: {
        default: '0',
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', HTMLAttributes];
  },
});

// Define custom Video Node for direct MP4/WebM uploads or URLs
const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: 'true',
      },
      width: {
        default: '100%',
      },
      height: {
        default: 'auto',
      },
      style: {
        default: 'border-radius: 12px; max-width: 100%; height: auto; display: block; margin: 12px 0;',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', HTMLAttributes];
  },
});

const MenuBar = ({ editor, onOpenImage, onOpenVideo, onOpenMap }) => {
  if (!editor) {
    return null;
  }

  const btnClass = "btn btn-sm btn-outline-secondary me-1 mb-1 d-inline-flex align-items-center gap-1";
  const activeClass = "btn btn-sm btn-secondary me-1 mb-1 text-white d-inline-flex align-items-center gap-1";

  return (
    <div className="border border-bottom-0 p-2 bg-light rounded-top d-flex flex-wrap gap-1 align-items-center">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? activeClass : btnClass} title="عريض">
        <FaBold />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? activeClass : btnClass} title="مائل">
        <FaItalic />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? activeClass : btnClass} title="شطب">
        <FaStrikethrough />
      </button>
      
      <div className="mx-2 border-end" style={{ height: 20 }}></div>
      
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? activeClass : btnClass} title="عنوان رئيسي 2">
        <FaHeading />2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? activeClass : btnClass} title="عنوان رئيسي 3">
        <FaHeading />3
      </button>
      
      <div className="mx-2 border-end" style={{ height: 20 }}></div>
      
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? activeClass : btnClass} title="قائمة نقطية">
        <FaListUl />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? activeClass : btnClass} title="قائمة رقمية">
        <FaListOl />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? activeClass : btnClass} title="اقتباس">
        <FaQuoteRight />
      </button>
      
      <div className="mx-2 border-end" style={{ height: 20 }}></div>

      {/* Media Insertion Buttons */}
      <button type="button" onClick={onOpenImage} className="btn btn-sm btn-outline-primary me-1 mb-1 d-inline-flex align-items-center gap-1" title="إدراج صورة">
        <FaImage /> صورة
      </button>
      <button type="button" onClick={onOpenVideo} className="btn btn-sm btn-outline-primary me-1 mb-1 d-inline-flex align-items-center gap-1" title="إدراج فيديو">
        <FaVideo /> فيديو
      </button>
      <button type="button" onClick={onOpenMap} className="btn btn-sm btn-outline-primary me-1 mb-1 d-inline-flex align-items-center gap-1" title="إدراج خريطة">
        <FaMapMarkerAlt /> خريطة
      </button>
      
      <div className="mx-2 border-end" style={{ height: 20 }}></div>
      
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass} disabled={!editor.can().undo()} title="تراجع">
        <FaUndo />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass} disabled={!editor.can().redo()} title="إعادة">
        <FaRedo />
      </button>
    </div>
  );
};

const RichTextEditor = ({ value, onChange }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Image insertion state
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Video insertion state
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);

  // Map insertion state
  const [mapLat, setMapLat] = useState('32.8872'); // Tripoli Lat
  const [mapLng, setMapLng] = useState('13.1913'); // Tripoli Lng
  const [mapZoom, setMapZoom] = useState('13');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Iframe,
      VideoNode,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'form-control border-top-0 rounded-0 rounded-bottom p-3',
        style: 'min-height: 300px; outline: none;'
      },
    },
  });

  // Image Handlers
  const handleInsertImageUrl = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setShowImageModal(false);
      setImageUrl('');
    }
  };

  const handleUploadImageFile = async () => {
    if (!imageFile || !editor) return;
    setImageUploading(true);
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const data = await api.uploadFile(imageFile);
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
        setShowImageModal(false);
        setImageFile(null);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('حدث خطأ أثناء رفع الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setImageUploading(false);
    }
  };

  // Video Handlers
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleInsertVideoUrl = () => {
    if (!videoUrl || !editor) return;
    const ytId = getYouTubeId(videoUrl);

    if (ytId) {
      // Insert YouTube iframe
      editor.chain().focus().insertContent({
        type: 'iframe',
        attrs: {
          src: `https://www.youtube.com/embed/${ytId}`,
        }
      }).run();
    } else {
      // Insert direct native video
      editor.chain().focus().insertContent({
        type: 'video',
        attrs: {
          src: videoUrl,
        }
      }).run();
    }

    setShowVideoModal(false);
    setVideoUrl('');
  };

  const handleUploadVideoFile = async () => {
    if (!videoFile || !editor) return;
    setVideoUploading(true);
    const formData = new FormData();
    formData.append('file', videoFile);

    try {
      const data = await api.uploadFile(videoFile);
      if (data.url) {
        editor.chain().focus().insertContent({
          type: 'video',
          attrs: {
            src: data.url,
          }
        }).run();
        setShowVideoModal(false);
        setVideoFile(null);
      }
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('حدث خطأ أثناء رفع الفيديو، يرجى المحاولة مرة أخرى.');
    } finally {
      setVideoUploading(false);
    }
  };

  // Map Handlers
  const handleInsertMap = () => {
    if (!editor) return;
    const latVal = parseFloat(mapLat);
    const lngVal = parseFloat(mapLng);
    const zoomVal = parseInt(mapZoom) || 13;

    if (isNaN(latVal) || isNaN(lngVal)) {
      alert('الرجاء إدخال إحداثيات صحيحة');
      return;
    }

    // Rough bounding box estimation based on zoom
    const delta = 180 / Math.pow(2, zoomVal);
    const minLon = lngVal - delta;
    const minLat = latVal - delta;
    const maxLon = lngVal + delta;
    const maxLat = latVal + delta;

    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${latVal}%2C${lngVal}`;

    editor.chain().focus().insertContent({
      type: 'iframe',
      attrs: {
        src: embedUrl,
      }
    }).run();

    setShowMapModal(false);
  };

  return (
    <div className="rich-text-editor position-relative" style={{ direction: 'rtl' }}>
      <MenuBar 
        editor={editor} 
        onOpenImage={() => setShowImageModal(true)}
        onOpenVideo={() => setShowVideoModal(true)}
        onOpenMap={() => setShowMapModal(true)}
      />
      <EditorContent editor={editor} />

      {/* Image Modal */}
      <ModernModal 
        show={showImageModal} 
        onClose={() => setShowImageModal(false)} 
        title="إدراج صورة" 
        size="md"
      >
        <div style={{ direction: 'rtl' }}>
          <div className="mb-4">
            <h6 className="fw-bold mb-2 text-primary">الخيار الأول: رفع ملف صورة من جهازك</h6>
            <Form.Group className="d-flex gap-2">
              <Form.Control 
                type="file" 
                accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
              />
              <Button 
                variant="primary" 
                onClick={handleUploadImageFile}
                disabled={!imageFile || imageUploading}
                className="d-flex align-items-center gap-2"
              >
                {imageUploading ? <Spinner size="sm" /> : <FaUpload />}
                <span>رفع</span>
              </Button>
            </Form.Group>
          </div>

          <hr className="my-4 text-muted" />

          <div>
            <h6 className="fw-bold mb-2 text-primary">الخيار الثاني: إدخال رابط الصورة المباشر</h6>
            <Form.Group className="mb-3">
              <Form.Control 
                type="text" 
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                style={{ direction: 'ltr' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" className="rounded-pill px-4" onClick={() => setShowImageModal(false)}>إلغاء</Button>
              <Button variant="primary" className="rounded-pill px-4" onClick={handleInsertImageUrl} disabled={!imageUrl}>إدراج</Button>
            </div>
          </div>
        </div>
      </ModernModal>

      {/* Video Modal */}
      <ModernModal 
        show={showVideoModal} 
        onClose={() => setShowVideoModal(false)} 
        title="إدراج فيديو" 
        size="md"
      >
        <div style={{ direction: 'rtl' }}>
          <div className="mb-4">
            <h6 className="fw-bold mb-2 text-primary">الخيار الأول: رفع ملف فيديو (MP4/WebM)</h6>
            <Form.Group className="d-flex gap-2">
              <Form.Control 
                type="file" 
                accept="video/*"
                onChange={e => setVideoFile(e.target.files[0])}
              />
              <Button 
                variant="primary" 
                onClick={handleUploadVideoFile}
                disabled={!videoFile || videoUploading}
                className="d-flex align-items-center gap-2"
              >
                {videoUploading ? <Spinner size="sm" /> : <FaUpload />}
                <span>رفع</span>
              </Button>
            </Form.Group>
          </div>

          <hr className="my-4 text-muted" />

          <div>
            <h6 className="fw-bold mb-2 text-primary">الخيار الثاني: رابط فيديو (يوتيوب أو رابط مباشر)</h6>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted">يدعم روابط يوتيوب ومقاطع الفيديو المباشرة</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                style={{ direction: 'ltr' }}
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" className="rounded-pill px-4" onClick={() => setShowVideoModal(false)}>إلغاء</Button>
              <Button variant="primary" className="rounded-pill px-4" onClick={handleInsertVideoUrl} disabled={!videoUrl}>إدراج</Button>
            </div>
          </div>
        </div>
      </ModernModal>

      {/* Map Modal */}
      <ModernModal 
        show={showMapModal} 
        onClose={() => setShowMapModal(false)} 
        title="إدراج خريطة تفاعلية" 
        size="md"
      >
        <div style={{ direction: 'rtl' }}>
          <p className="small text-muted mb-4">أدخل إحداثيات الموقع لتوليد خريطة تفاعلية عبر OpenStreetMap مجاناً ودون حاجة لمفاتيح API.</p>
          
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small">خط العرض (Latitude)</Form.Label>
                <Form.Control 
                  type="text" 
                  value={mapLat} 
                  onChange={e => setMapLat(e.target.value)}
                  placeholder="مثال: 32.8872"
                  style={{ direction: 'ltr' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold small">خط الطول (Longitude)</Form.Label>
                <Form.Control 
                  type="text" 
                  value={mapLng} 
                  onChange={e => setMapLng(e.target.value)}
                  placeholder="مثال: 13.1913"
                  style={{ direction: 'ltr' }}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold small">مستوى التقريب (Zoom Level)</Form.Label>
                <Form.Select value={mapZoom} onChange={e => setMapZoom(e.target.value)}>
                  <option value="10">10 - رؤية المدينة</option>
                  <option value="13">13 - رؤية عامة للمنطقة</option>
                  <option value="15">15 - رؤية تفصيلية للحي</option>
                  <option value="17">17 - رؤية الشوارع الدقيقة</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="light" className="rounded-pill px-4" onClick={() => setShowMapModal(false)}>إلغاء</Button>
            <Button variant="primary" className="rounded-pill px-4" onClick={handleInsertMap}>إدراج الخريطة</Button>
          </div>
        </div>
      </ModernModal>

      <style>{`
        .ProseMirror iframe {
          width: 100%;
          height: 350px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          margin: 12px 0;
        }
        .ProseMirror video {
          width: 100%;
          max-height: 400px;
          border-radius: 12px;
          margin: 12px 0;
          background: #000;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 12px 0;
        }
        .ProseMirror {
          min-height: 300px;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
