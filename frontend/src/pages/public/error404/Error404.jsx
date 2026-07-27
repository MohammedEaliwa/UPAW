import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FaExclamationTriangle, FaSignInAlt } from 'react-icons/fa';
import './error404.css';

const Error404 = () => {
  return (
    <div className="error404-page">
      <Container className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaExclamationTriangle size={80} color="#ffcc00" className="mb-4" />
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
          <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '1.5rem' }}>
            عذراً، لقد تم إنهاء جلستك أو لا تملك صلاحية الوصول!
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
            يبدو أنك تحاول الوصول إلى صفحة محمية أو لوحة التحكم بدون تسجيل الدخول، يرجى العودة والمصادقة على حسابك للمتابعة.
          </p>
          <Link to="/login" className="error404-btn">
            <FaSignInAlt /> الانقال لتسجيل الدخول
          </Link>
        </motion.div>
      </Container>
    </div>
  );
};

export default Error404;
