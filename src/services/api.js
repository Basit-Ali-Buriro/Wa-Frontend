import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      data: response.data,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    // Don't redirect to login for these endpoints
    const isAuthCheck = error.config?.url?.includes('/api/auth/me');
    const isProfileUpdate = error.config?.url?.includes('/api/users/profile');
    
    if (error.response?.status === 401 && !isAuthCheck && !isProfileUpdate) {
      console.error('🔒 Unauthorized - redirecting to login');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
};

// User APIs
export const userAPI = {
  searchUsers: (query) => {
    const searchQuery = query && typeof query === 'string' ? query.trim() : '';
    if (searchQuery) {
      return api.get(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);
    }
    return api.get('/api/users/search');
  },
  
  getAllUsers: () => api.get('/api/users/search'),
  getUserProfile: (userId) => api.get(`/api/users/${userId}`),
  updateProfile: (data) => api.put('/api/users/profile', data),
  updateAvatar: (formData) => api.put('/api/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Conversation APIs
export const conversationAPI = {
  getAll: () => api.get('/api/conversations'),
  create: (data) => api.post('/api/conversations', data),
  createGroup: (data) => api.post('/api/conversations/group', data),
  delete: (id) => api.delete(`/api/conversations/${id}`),
  
  // ✅ FIXED: Match your backend routes exactly
  addParticipants: (id, data) => {
    console.log('➕ Adding participants to group:', id, data);
    return api.post(`/api/conversations/group/${id}/add`, data);
  },
  
  removeParticipants: (id, data) => {
    console.log('➖ Removing participants from group:', id, data);
    return api.post(`/api/conversations/group/${id}/remove`, data);
  },
  
  changeAdmin: (id, data) => {
    console.log('👑 Changing group admin:', id, data);
    return api.put(`/api/conversations/group/${id}/change-admin`, data);
  },
  
  renameGroup: (id, data) => {
    console.log('✏️ Renaming group:', id, data);
    return api.put(`/api/conversations/group/${id}/rename`, data);
  },
  
  updateGroupAvatar: (id, formData) => {
    console.log('🖼️ Updating group avatar:', id);
    return api.put(`/api/conversations/group/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Message APIs
export const messageAPI = {
  send: (data) => api.post('/api/messages', data),
  sendMedia: (formData) => api.post('/api/messages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMessages: (conversationId) => api.get(`/api/messages/${conversationId}`),
  editMessage: (id, data) => api.put(`/api/messages/${id}/edit`, data),
  deleteForMe: (id) => api.delete(`/api/messages/${id}/deleteForMe`),
  deleteForEveryone: (id) => api.delete(`/api/messages/${id}/deleteForEveryone`),
  reply: (data) => api.post('/api/messages/reply', data),
  forward: (id, data) => api.post(`/api/messages/forward/${id}`, data),
  react: (data) => api.post('/api/messages/react', data),
};

// AI APIs
export const aiAPI = {
  chat: (data) => api.post('/api/ai/chat', data),
  getAutoReplySettings: () => api.get('/api/ai/auto-reply'),
  updateAutoReply: (data) => api.put('/api/ai/auto-reply', data),
  getSuggestions: (conversationId) => api.get(`/api/ai/suggestions/${conversationId}`),
};

// Call APIs
export const callAPI = {
  getHistory: () => api.get('/api/calls/history'),
  getStats: () => api.get('/api/calls/stats'),
  deleteCall: (callId) => api.delete(`/api/calls/${callId}`),
};

export default api;