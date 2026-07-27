import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardGuard = ({ children }) => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = () => {
      // Check if user is still logged in when back button is pressed
      const stored = sessionStorage.getItem('upaw_logged_user') || localStorage.getItem('upaw_logged_user');
      if (!stored || !auth?.user) {
        window.history.pushState(null, '', '/login');
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [auth?.user, navigate]);

  // Guard against null context or logged out state
  if (!auth || !auth.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default DashboardGuard;
