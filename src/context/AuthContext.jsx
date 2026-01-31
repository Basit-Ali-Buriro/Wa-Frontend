import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    console.log('========================================');
    console.log('🔐 AUTH CONTEXT - INITIAL CHECK');
    console.log('========================================');
    checkAuth();
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('========================================');
    console.log('🔐 AUTH STATE CHANGED');
    console.log('========================================');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('loading:', loading);
    console.log('========================================');
  }, [isAuthenticated, user, loading]);

  const checkAuth = async () => {
    console.log('🔍 Checking authentication status...');

    // Check localStorage for quick restore (prevents flash of login page)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('📦 Restoring user from localStorage:', parsedUser.name);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.log('⚠️ Invalid stored user data');
        localStorage.removeItem('user');
      }
    }

    try {
      // Always call API to verify auth - cookies are HttpOnly so we can't check them in JS
      console.log('🔐 Verifying auth with server...');
      const response = await authAPI.getMe();

      if (response.data && response.data.user) {
        console.log('✅ User authenticated:', response.data.user);
        setUser(response.data.user);
        setIsAuthenticated(true);
        // Store in localStorage for quick restore on refresh
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        console.log('❌ No user data in response');
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      const response = await authAPI.register(userData);

      console.log('✅ Registration successful');
      console.log('User data:', response.data.user);
      console.log('Cookies after register:', document.cookie);

      setUser(response.data.user);
      setIsAuthenticated(true);
      // Store in localStorage for quick restore on refresh
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      const message = error.response?.data?.msg || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login...');
      console.log('Email:', credentials.email);

      const response = await authAPI.login(credentials);

      console.log('✅ Login successful');
      console.log('User data:', response.data.user);
      console.log('Cookies after login:', document.cookie);

      setUser(response.data.user);
      setIsAuthenticated(true);
      // Store in localStorage for quick restore on refresh
      localStorage.setItem('user', JSON.stringify(response.data.user));

      console.log('✅ isAuthenticated set to TRUE');
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      const message = error.response?.data?.msg || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  // Update user without making API call (for profile updates)
  const updateUser = (userData) => {
    console.log('🔄 Updating user state:', userData);
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
        checkAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};