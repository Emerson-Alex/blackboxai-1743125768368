import { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// Tipos
interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  exp: number;
}

// Constantes
const API_URL = 'https://api.eshop.com';
const TOKEN_KEY = 'eshop_token';

// Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          setUser({
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
          });
          
          // Se o token estiver próximo de expirar (menos de 5 minutos)
          if (decoded.exp - currentTime < 300) {
            refreshToken();
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const setToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    const decoded = jwtDecode<JwtPayload>(token);
    setUser({
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
    });
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      const response = await axios.post(`${API_URL}/auth/refresh`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToken(response.data.token);
    } catch (error) {
      console.error('Erro ao renovar o token:', error);
    }
  };

  const login = async (email: string, password: string, remember?: boolean) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        remember
      });

      setToken(response.data.token);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password
      });

      setToken(response.data.token);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar conta');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao solicitar recuperação de senha');
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        password
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao redefinir senha');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}