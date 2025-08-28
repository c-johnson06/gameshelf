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
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiLogin(credentials);
      
      // Extract data from response - backend should return token, userId, username
      const { token: authToken, userId, username } = response.data;

      if (!authToken || !userId || !username) {
        throw new Error('Invalid response from server');
      }

      const userPayload: User = { id: userId, username };

      // Store in localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userPayload));

      // Update state
      setToken(authToken);
      setUser(userPayload);

      // Navigate to profile
      navigate(`/profile/${userId}`);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      await apiRegister(userData);
      // After successful registration, navigate to the login page
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different error types
      if (error.response?.status === 409) {
        throw new Error(error.response.data.message || 'Username or email already exists');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid input data');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error('Registration failed');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
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