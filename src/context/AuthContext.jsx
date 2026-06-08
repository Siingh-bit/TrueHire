import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.getMe();
      if (response.success) {
        setUser(response.data.user);
        setProfile(response.data.profile);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      api.removeToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const sendOtp = async (email, type, password) => {
    try {
      return await api.sendOtp(email, type, password);
    } catch (err) {
      throw err;
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        setProfile(response.data.profile);
        return response.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await api.register(userData);
      if (response.success) {
        setUser(response.data.user);
        setProfile(response.data.profile);
        return response.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const response = await api.getMe();
      if (response.success) {
        setUser(response.data.user);
        setProfile(response.data.profile);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isCandidate: user?.role === 'candidate',
    isEmployer: user?.role === 'employer',
    isAdmin: user?.role === 'admin',
    login,
    register,
    sendOtp,
    logout,
    refreshProfile,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
