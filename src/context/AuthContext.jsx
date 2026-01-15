import { createContext, useState, useEffect , useContext} from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);


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
    console.log('Cookies:', document.cookie);
    
    const hasToken = document.cookie.includes('token=');
    console.log('Has token cookie:', hasToken);

    if (!hasToken) {
      console.log('❌ No token cookie found - User NOT authenticated');
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      console.log('✅ Token cookie exists - Fetching user data...');
      const response = await authAPI.getMe();
      
      if (response.data && response.data.user) {
        console.log('✅ User data fetched successfully:', response.data.user);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        console.log('❌ No user data in response');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error);
      setIsAuthenticated(false);
      setUser(null);
      
      // Clear invalid cookie
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
      
      console.log('✅ isAuthenticated set to TRUE');
      console.log('✅ This should trigger ChatContext to fetch conversations');
      
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
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setIsAuthenticated(false);
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