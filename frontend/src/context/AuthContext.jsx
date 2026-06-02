import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('kontrakanku_token');
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success) {
            setUser(res.data);
          } else {
            localStorage.removeItem('kontrakanku_token');
          }
        } catch (err) {
          console.error('Auth initialization failed:', err.message);
          localStorage.removeItem('kontrakanku_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      if (res.success) {
        localStorage.setItem('kontrakanku_token', res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.register(name, email, password, phone);
      if (res.success) {
        localStorage.setItem('kontrakanku_token', res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('kontrakanku_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.success) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err.message);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPERADMIN',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
