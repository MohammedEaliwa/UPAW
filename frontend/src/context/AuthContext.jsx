import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext(null);

const USER_KEY = 'upaw_logged_user';

const getStoredUser = () => {
  try {
    // Check sessionStorage first for per-tab session isolation, then localStorage
    const sessionStored = sessionStorage.getItem(USER_KEY);
    if (sessionStored) return JSON.parse(sessionStored);

    const localStored = localStorage.getItem(USER_KEY);
    if (localStored) {
      // Sync into sessionStorage for current tab
      sessionStorage.setItem(USER_KEY, localStored);
      return JSON.parse(localStored);
    }
    return null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    const loggedUser = data.user;
    
    // Store in both sessionStorage (per-tab isolation) and localStorage
    sessionStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
    setUser(null);

    // Replace history entry so clicking browser 'Back' button forces login
    window.history.pushState(null, '', '/login');
  }, []);

  const updateUser = useCallback((updated) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
