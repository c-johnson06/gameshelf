// Create a debug version of your api.ts file to test connectivity
import axios from 'axios';

// Check what your VITE_API_URL is set to
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
console.log('Using API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout for debugging
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(config => {
    console.log('Making API request to:', config.baseURL + config.url);
    console.log('Request config:', config);
    
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added auth token to request');
    }
    return config;
}, error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
});

// Add response interceptor for debugging
apiClient.interceptors.response.use(
    response => {
        console.log('API response received:', response.status, response.data);
        return response;
    },
    error => {
        console.error('API error occurred:', error.message);
        console.error('Error details:', error.response || error);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('Backend server is not running or not accessible!');
        }
        
        if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
            console.error('Request timed out - backend might be slow or not responding');
        }
        
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const registerUser = (userData: any) => {
  console.log('Attempting to register user:', userData.username);
  return apiClient.post('/register', userData);
};

export const loginUser = (credentials: any) => {
  console.log('Attempting to login user:', credentials.username);
  return apiClient.post('/login', credentials);
};

export const searchGames = (query: string) => {
  console.log('Searching for games with query:', query);
  return apiClient.get('/search', { params: { query } });
};

// Test function you can call from browser console
(window as any).testAPI = async () => {
  console.log('Testing API connectivity...');
  try {
    const response = await fetch(API_BASE_URL.replace('/api', '') + '/api/search?query=test');
    console.log('Direct fetch response status:', response.status);
    const data = await response.text();
    console.log('Direct fetch response:', data);
  } catch (error) {
    console.error('Direct fetch failed:', error);
  }
};

// All other exports remain the same...
export const verifyToken = () => apiClient.get('/verify');
export const getUserGames = (userId: number, token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return apiClient.get(`/users/${userId}/games`, config);
};
export const addUserGame = (userId: number, gameData: any, playStatus: string, token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return apiClient.post(`/users/${userId}/games`, { ...gameData, playStatus }, config);
};
export const getGameDetails = (gameId: number, token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return apiClient.get(`/games/${gameId}`, config);
};
export const updateUserGameReview = (userId: number, gameId: number, token: string, data: any) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    return apiClient.patch(`/users/${userId}/games/${gameId}`, data, config);
};
export const updateUserGame = (userId: number, gameId: number, data: any, token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return apiClient.patch(`/users/${userId}/games/${gameId}`, data, config);
};
export const removeUserGame = (userId: number, gameId: number, token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return apiClient.delete(`/users/${userId}/games/${gameId}`, config);
};
export const getUserProfile = (userId: number) => apiClient.get(`/users/${userId}/profile`);
export const getRelatedGames = (gameId: number) => apiClient.get(`/games/${gameId}/related`);
export const deleteUserReview = (userId: number, gameId: number, token?: string) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return apiClient.delete(`/users/${userId}/games/${gameId}/review`, config);
};
export const verifyEmail = (token: string) => apiClient.get(`/verify-email/${token}`);
export const resendVerificationEmail = (email: string) => apiClient.post('/resend-verification', { email });