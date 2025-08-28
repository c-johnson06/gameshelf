import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { loginUser as apiLogin, registerUser as apiRegister } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Define the shape of the user object
interface User {
  id: number;
  username: string;
}

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Note: For a real app, you would verify the token with the backend here
  // and fetch user data if the token is valid.
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, [token]);

  const login = async (credentials: any) => {
    const response = await apiLogin(credentials);
    const { userId, token } = response.data; // Assuming backend returns userId and token
    
    // For now, we'll create a user object. Later, you might fetch this.
    const userPayload: User = { id: userId, username: credentials.username };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userPayload));
    setToken(token);
    setUser(userPayload);
    navigate(`/profile/${userId}`);
  };

  const register = async (userData: any) => {
    await apiRegister(userData);
    // After successful registration, navigate to the login page
    navigate('/login');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const value = { user, token, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};