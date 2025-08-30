import axios from 'axios';
import type { Game } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const registerUser = (userData: any) => {
  return apiClient.post('/register', userData);
};

export const loginUser = (credentials: any) => {
  return apiClient.post('/login', credentials);
};

export const searchGames = (query: string) => {
  return apiClient.get('/search', { params: { query } });
};

export const getUserGames = (userId: number) => {
  return apiClient.get(`/users/${userId}/games`);
};

export const addUserGame = (userId: number, gameData: Game, playStatus: 'plan-to-play' | 'completed') => {
  return apiClient.post(`/users/${userId}/games`, { ...gameData, playStatus });
};

export const getGameDetails = (gameId: number) => {
  return apiClient.get(`/games/${gameId}`);
};

export const updateUserGameReview = (userId: number, gameId: number, data: { personalRating?: number | null, review?: string }) => {
    return apiClient.patch(`/users/${userId}/games/${gameId}`, data);
};

export const updateUserGame = (userId: number, gameId: number, data: { playStatus?: string, personalRating?: number | null }) => {
  return apiClient.patch(`/users/${userId}/games/${gameId}`, data);
};

export const deleteUserGame = (userId: number, gameId: number) => {
  return apiClient.delete(`/users/${userId}/games/${gameId}`);
};

export const getUserProfile = (userId: number) => {
  return apiClient.get(`/users/${userId}/profile`);
};

export const getRelatedGames = (gameId: number) => {
  return apiClient.get(`/games/${gameId}/related`);
};