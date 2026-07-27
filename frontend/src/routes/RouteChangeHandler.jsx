import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RouteChangeHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  useEffect(() => {
    // If user is already logged in and attempts to go to /login or /register, redirect to dashboard
    if (user && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, user, navigate]);

  return null;
};

export default RouteChangeHandler;
