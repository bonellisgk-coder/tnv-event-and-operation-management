import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL, safeParseJson } from '../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'DEPARTMENT_ADMIN' | 'VOLUNTEER';
  departmentId: string | null;
  departmentName?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restore session
    const storedToken = localStorage.getItem('tnv_token');
    const storedRefreshToken = localStorage.getItem('tnv_refresh_token');
    const storedUser = localStorage.getItem('tnv_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('tnv_token', accessToken);
    localStorage.setItem('tnv_refresh_token', refreshToken);
    localStorage.setItem('tnv_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tnv_token');
    localStorage.removeItem('tnv_refresh_token');
    localStorage.removeItem('tnv_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('tnv_user', JSON.stringify(userData));
    setUser(userData);
  };

  // Helper function for API calls with auto-authentication header and handling token refresh
  const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Inject headers
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const mergedOptions = { ...options, headers };
    let response = await fetch(url, mergedOptions);

    // If 403 or 401, try to refresh token
    if ((response.status === 401 || response.status === 403) && token) {
      const storedRefreshToken = localStorage.getItem('tnv_refresh_token');
      if (storedRefreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            
            // Update token in state and storage
            localStorage.setItem('tnv_token', data.accessToken);
            if (data.refreshToken) {
              localStorage.setItem('tnv_refresh_token', data.refreshToken);
            }
            setToken(data.accessToken);

            // Re-try original request with the new token
            headers.set('Authorization', `Bearer ${data.accessToken}`);
            response = await fetch(url, { ...options, headers });
          } else {
            // Refresh token expired too, logout
            logout();
          }
        } catch (err) {
          logout();
        }
      } else {
        logout();
      }
    }

    const data = await safeParseJson(response);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
