import React, { useState, useEffect, createContext, useContext } from 'react';
import Login from './elements/Login.jsx';
import CliDashboard from './elements/CliDashboard.jsx';
import CleDashboard from './elements/CleDashboard.jsx';
import SessionExpiredNotification from './elements/SessionExpiredNotification.jsx';

// API Configuration
export const API_BASE = 'http://localhost:5001/api';

// Context for authentication
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API utility functions
export const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          // Always handle 401 as session expiration
          window.dispatchEvent(new CustomEvent('tokenExpired'));
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  // Auth endpoints
  loginClient: (credentials) => api.request('/clients/login', { method: 'POST', body: credentials }),
  loginCleaner: (credentials) => api.request('/cleaners/login', { method: 'POST', body: credentials }),
  registerClient: (data) => api.request('/clients', { method: 'POST', body: data }),
  registerCleaner: (data) => api.request('/cleaners', { method: 'POST', body: data }),

  // Cleaner endpoints
  getAllCleaners: (page = 0, sortBy = 'rating') => api.request(`/cleaners?page=${page}&sort=${sortBy}`),
  getCleanerById: (id) => api.request(`/cleaners/${id}`),
  filterCleaners: (filters) => api.request('/cleaners/filter', { method: 'POST', body: filters }),
  getCompletedJobs: (cleanerId) => api.request(`/jobs/cleaner/${cleanerId}/completed`),

  // Request endpoints
  createRequest: (data) => api.request('/requests', { method: 'POST', body: data }),
  getRequestsForCleaner: (cleanerId) => api.request(`/requests/cleaner/${cleanerId}`),
  getGeneralRequests: () => api.request('/requests/general'),
  updateRequestStatus: (requestId, status) => api.request(`/requests/${requestId}`, { method: 'PUT', body: { status } }),
  applyToOffer: (requestId) => api.request(`/requests/general/${requestId}/apply`, { method: 'POST' }),
  getPendingOffers: () => api.request('/offers/pending'),
  getPendingRequests: () => api.request('/requests/client/pending'),
  selectCleanerForOffer: (requestId, applicationId) => api.request(`/offers/${requestId}/select/${applicationId}`, { method: 'POST' }),
  rateRequest: (requestId, rating, review) => api.request(`/requests/${requestId}/rate`, { method: 'PUT', body: { rating, review } }),
  getCompletedJobsForClient: (clientId) => api.request(`/jobs/client/${clientId}/completed`),

  // Profile endpoints
  getMyProfile: (userType) => api.request(`/profile/${userType}`),
  updateMyProfile: (userType, data) => api.request(`/profile/${userType}`, { method: 'PUT', body: data }),
};

// Simple Toast Component
export const Toast = ({ message, type = 'error', onClose }) => (
  <div className={`fixed top-4 right-4 p-3 rounded border ${
    type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'
  }`}>
    <div className="flex items-center gap-2">
      <span>{message}</span>
      <button onClick={onClose} className="text-gray-500">×</button>
    </div>
  </div>
);

// Loading Component
export const Loading = () => (
  <div className="p-4 text-center">Loading...</div>
);

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials, userType) => {
    try {
      const response = userType === 'client' 
        ? await api.loginClient(credentials)
        : await api.loginCleaner(credentials);
      
      // Fix: Properly extract user data based on response structure
      const userData = userType === 'client' ? response.client : response.cleaner;
      const userWithType = { ...userData, userType };
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userWithType));
      setUser(userWithType);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (data, userType) => {
    try {
      const response = userType === 'client' 
        ? await api.registerClient(data)
        : await api.registerCleaner(data);
      return response;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App Component
const App = () => {
  const { user, loading } = useAuth();
  const [toast, setToast] = useState(null);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    const handleTokenExpired = () => {
      setShowSessionExpired(true);
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    return () => window.removeEventListener('tokenExpired', handleTokenExpired);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {!user ? (
        <Login />
      ) : user.userType === 'client' ? (
        <CliDashboard />
      ) : (
        <CleDashboard />
      )}
      
      {showSessionExpired && (
        <SessionExpiredNotification 
          onClose={() => {
            setShowSessionExpired(false);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }} 
        />
      )}
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Root Component with Auth Provider
export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}