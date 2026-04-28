import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import api from '../utils/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const userData = await api.auth.me();
          setUser(userData);
        } catch {
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const register = async (email, password) => {
    const data = await api.auth.register(email, password, 'user');
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
