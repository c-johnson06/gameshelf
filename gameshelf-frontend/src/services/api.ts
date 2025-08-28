import axios from 'axios';
import type { Game } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = (userData: any) => {
  return apiClient.post('/register', userData);
};

export const loginUser = (credentials: any) => {
  return apiClient.post('/login', credentials);
};

export const searchGames = (query: string) => {
  return apiClient.get('/search', { params: { query } });
};

export const getUserGames = (userId: number, token: string) => {
  return apiClient.get(`/users/${userId}/games`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const addUserGame = (userId: number, gameData: Game, token: string) => {
  return apiClient.post(`/users/${userId}/games`, gameData, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const getGameDetails = (gameId: number, token: string | null) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  return apiClient.get(`/games/${gameId}`, { headers });
};

export const updateUserGameReview = (userId: number, gameId: number, token: string, data: { personalRating?: number | null, review?: string }) => {
    return apiClient.patch(`/users/${userId}/games/${gameId}`, data, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};