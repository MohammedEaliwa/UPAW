import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RouteChangeHandler = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const isPreviewOrManaged =
      location.pathname.startsWith('/page/') ||
      location.pathname === '/about' ||
      location.pathname === '/contact' ||
      location.pathname === '/news' ||
      location.pathname === '/interactive-map' ||
      location.pathname === '/complaints';

    if (!location.pathname.startsWith('/dashboard') && !isPreviewOrManaged) {
      if (user) {
        logout();
      }
    }
  }, [location.pathname]);

  return null;
};

export default RouteChangeHandler;
