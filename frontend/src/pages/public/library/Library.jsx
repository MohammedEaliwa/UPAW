import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { motion } from 'framer-motion';
import { FaBookOpen, FaSpinner } from 'react-icons/fa';
import { api } from '../../../services/api';
import DataTable from '../../../components/DataTable';
import './library.css';

const Library = () => {
  const { isDarkMode } = useTheme();
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const isRtl = !isEn;

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'serial_number', dir: 'asc' });

  useEffect(() => {
    let active = true;
    const fetchBooks = async () => {
      try {
        const data = await api.getBooks();
        if (active) {
          setBooks(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error fetching books:', e);
        if (active) {
          setBooks([]);
          setLoading(false);
        }
      }
    };
    fetchBooks();
    return () => {
      active = false;
    };
  }, []);

  // Filter and sort books whenever dependencies change using useMemo for high performance and pure render
  const displayed = useMemo(() => {
    let result = [...books];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.serial_number || '').toLowerCase().includes(q)
      );
    }

    // Sort
    const { key, dir } = sortConfig;
    if (key) {
      result.sort((a, b) => {
        let valA = a[key] || '';
        let valB = b[key] || '';

        if (key === 'serial_number') {
          // Numeric sort for serial numbers
          const numA = parseInt(valA, 10) || 0;
          const numB = parseInt(valB, 10) || 0;
          return dir === 'asc' ? numA - numB : numB - numA;
        } else {
          // String sort for title
          valA = valA.toString().toLowerCase();
          valB = valB.toString().toLowerCase();
          if (valA < valB) return dir === 'asc' ? -1 : 1;
          if (valA > valB) return dir === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }

    return result;
  }, [books, search, sortConfig]);

  // Sliced data for the current page
  const pageData = displayed.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(displayed.length / limit) || 1;

  const handleSortChange = ({ key, dir }) => {
    setSortConfig({ key, dir });
    setPage(1);
  };

  const handleExport = () => {
    const csvContent = [
      [isRtl ? 'الرقم التسلسلي' : 'Serial Number', isRtl ? 'اسم الملف / الكتاب' : 'File Name / Book'].join(','),
      ...displayed.map((b) => [
        b.serial_number || '',
        `"${(b.title || '').replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isRtl ? 'المكتبة_الإلكترونية.csv' : 'electronic_library.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'serial_number',
      label: isRtl ? 'الرقم التسلسلي' : 'Serial No.',
      sortable: true,
      style: { width: '150px', textAlign: 'center' },
      render: (val) => (
        <span className="serial-badge">
          {val}
        </span>
      ),
    },
    {
      key: 'title',
      label: isRtl ? 'اسم الملف / الكتاب' : 'File / Book Name',
      sortable: true,
      style: { textAlign: isRtl ? 'right' : 'left' },
      render: (val) => <span className="book-title-cell">{val}</span>,
    },
  ];

  const bg = isDarkMode
    ? 'linear-gradient(135deg, #070d1f 0%, #0a1230 50%, #080f20 100%)'
    : 'linear-gradient(135deg, #001d5a 0%, #003087 50%, #0066cc 100%)';

  return (
    <div
      className="library-page"
      style={{
        minHeight: '100vh',
        background: bg,
        paddingTop: 110,
        paddingBottom: 80,
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: 'Cairo, Tajawal, sans-serif',
      }}
    >
      <div className="container" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 20px' }}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="library-header text-center"
          style={{ marginBottom: 50, textAlign: 'center' }}
        >
          <div className="library-badge-wrapper">
            <FaBookOpen className="badge-icon" />
            <span className="badge-text">
              {isRtl ? 'الهيئة الوطنية للتخطيط العمراني' : 'National Urban Planning Authority'}
            </span>
          </div>
          <h1 className="library-main-title">
            {isRtl ? 'المكتبة الإلكترونية' : 'Electronic Library'}
          </h1>
          <p className="library-subtitle">
            {isRtl
              ? 'تصفح وابحث في دليل وثائق ومراجع الهيئة الوطنية للتخطيط العمراني'
              : 'Browse and search the directory of documents and references for the Urban Planning Authority'}
          </p>
        </motion.div>

        {/* DataTable Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="library-table-container"
        >
          {loading ? (
            <div className="library-loading">
              <FaSpinner className="spinner-icon spinning" />
              <span>{isRtl ? 'جاري تحميل الكتب والوثائق...' : 'Loading documents and books...'}</span>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={pageData}
              total={displayed.length}
              page={page}
              limit={limit}
              totalPages={totalPages}
              loading={loading}
              rtl={isRtl}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              onSearch={(s) => {
                setSearch(s);
                setPage(1);
              }}
              onSortChange={handleSortChange}
              searchPlaceholder={isRtl ? 'بحث برقم الملف أو الاسم...' : 'Search by serial or name...'}
              emptyIcon={<FaBookOpen />}
              emptyText={isRtl ? 'لا توجد كتب أو مراجع مطابقة لنتائج البحث' : 'No books or references matching search results'}
              onExport={handleExport}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Library;
