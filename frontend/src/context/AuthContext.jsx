import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('researchlens_token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authApi.login({ email, password });
      localStorage.setItem('researchlens_token', res.token);
      localStorage.setItem('researchlens_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to log in. Please check your credentials.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const res = await authApi.register({ name, email, password });
      localStorage.setItem('researchlens_token', res.token);
      localStorage.setItem('researchlens_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register account.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('researchlens_token');
    localStorage.removeItem('researchlens_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

