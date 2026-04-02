import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthResponse } from '@nhatroso/shared';
import { setLogoutHandler } from '../api/client';

interface AuthContextType {
  user: AuthResponse | null;
  isLoading: boolean;
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load stored auth data on mount
    const loadStorageData = async () => {
      try {
        let authData: string | null = null;
        if (Platform.OS === 'web') {
          authData = localStorage.getItem('auth_data');
        } else {
          authData = await SecureStore.getItemAsync('auth_data');
        }

        if (authData) {
          setUser(JSON.parse(authData));
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = useCallback(async (data: AuthResponse) => {
    setUser(data);
    const authDataString = JSON.stringify(data);
    if (Platform.OS === 'web') {
      localStorage.setItem('auth_data', authDataString);
    } else {
      await SecureStore.setItemAsync('auth_data', authDataString);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    if (Platform.OS === 'web') {
      localStorage.removeItem('auth_data');
    } else {
      await SecureStore.deleteItemAsync('auth_data');
    }
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
    return () => setLogoutHandler(() => {});
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
