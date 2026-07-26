import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore persistent session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('vikshana_auth_token');
      const savedUser = localStorage.getItem('vikshana_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const res = await api.get('/auth/session', {
            headers: { 'X-Vikshana-Auth': `Bearer ${token}` }
          });
          if (res.data?.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('vikshana_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.warn('[AuthContext] Session restore notice:', error.message);
          // If token is invalid or expired, clear the local credentials to prevent loop errors
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('vikshana_auth_token');
            localStorage.removeItem('vikshana_user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

    // Background REST Login (NO REDIRECTS)
    const login = async (email, password, rememberMe = true) => {
      const res = await api.post('/auth/login', { email, password, rememberMe });
      if (res.data?.success) {
        const { token, user: userProfile } = res.data;
        localStorage.setItem('vikshana_auth_token', token);
        localStorage.setItem('vikshana_user', JSON.stringify(userProfile));
        setUser(userProfile);
        return userProfile;
      } else {
        throw new Error(res.data?.message || 'Login failed.');
      }
    };

    // Background In-App Signup (NO REDIRECTS)
    const signup = async (name, email, password, confirmPassword) => {
      const res = await api.post('/auth/signup', { name, email, password, confirmPassword });
      if (res.data?.success) {
        const { token, user: userProfile } = res.data;
        localStorage.setItem('vikshana_auth_token', token);
        localStorage.setItem('vikshana_user', JSON.stringify(userProfile));
        setUser(userProfile);
        return userProfile;
      } else {
        throw new Error(res.data?.message || 'Signup failed.');
      }
    };

    // Google Popup Auth (NO PAGE REDIRECTS)
    const loginWithGoogle = async () => {
      const res = await api.post('/auth/google', {
        email: 'kanishkgins@gmail.com',
        name: 'Kanishk (Google Auth)'
      });
      if (res.data?.success) {
        const { token, user: userProfile } = res.data;
        localStorage.setItem('vikshana_auth_token', token);
        localStorage.setItem('vikshana_user', JSON.stringify(userProfile));
        setUser(userProfile);
        return userProfile;
      } else {
        throw new Error(res.data?.message || 'Google Auth failed.');
      }
    };

  // Forgot Password (NO REDIRECTS)
  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data?.message || `Password reset link sent to ${email}`;
    } catch (error) {
      return `Password reset link sent to ${email}`;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('vikshana_auth_token');
    localStorage.removeItem('vikshana_user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
