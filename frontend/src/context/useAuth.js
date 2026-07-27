import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * useAuth — Access the current auth state.
 * Separated from AuthContext.jsx so Vite HMR can fast-refresh both
 * the AuthProvider component and this hook independently.
 */
export const useAuth = () => useContext(AuthContext);
