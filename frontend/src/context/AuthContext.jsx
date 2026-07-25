import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext(null);

const USER_KEY = 'upaw_logged_user';

const getStoredUser = () => {
  try {
    // Clear legacy persistent session from localStorage
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');

    const sessionStored = sessionStorage.getItem(USER_KEY);
    if (sessionStored) return JSON.parse(sessionStored);
    return null;
  } catch {
    return null;
  }
};

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes idle timeout

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    const loggedUser = data.user;
    
    // Store strictly in sessionStorage so closing tab/browser forces login on next visit
    sessionStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
    sessionStorage.removeItem('upaw_logout_reason');
    
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const logout = useCallback((reason = null) => {
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
    if (reason === 'idle') {
      sessionStorage.setItem('upaw_logout_reason', 'idle');
    }
    setUser(null);

    // Replace history entry so clicking browser 'Back' button forces login
    window.history.pushState(null, '', '/login');
  }, []);

  const updateUser = useCallback((updated) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
    setUser(updated);
  }, []);

  // ─── Auto logout after 10 minutes of inactivity ───────────────────
  useEffect(() => {
    if (!user) return;

    let timerId = null;

    const resetTimer = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        logout('idle');
      }, IDLE_TIMEOUT_MS);
    };

    let lastActivityTime = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      // Throttle timer resets to at most once per second
      if (now - lastActivityTime > 1000) {
        lastActivityTime = now;
        resetTimer();
      }
    };

    // Initial timer setup
    resetTimer();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown'];
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      if (timerId) clearTimeout(timerId);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
