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
import { setLogoutHandler } from '@/services/api';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations, i18nConfig } from '@nhatroso/translations';

// Initialize i18n
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translations.en },
    vi: { translation: translations.vi },
  },
  lng: i18nConfig.defaultLocale,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

interface AppContextType {
  // Auth
  user: AuthResponse | null;
  isLoading: boolean;
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;

  // Localization
  language: string;
  changeLanguage: (lng: 'vi' | 'en') => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [language, setLanguage] = useState<string>(i18n.language || 'vi');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        // Load Auth
        let authData: string | null = null;
        if (Platform.OS === 'web') {
          authData = localStorage.getItem('auth_data');
        } else {
          authData = await SecureStore.getItemAsync('auth_data');
        }

        if (authData) {
          setUser(JSON.parse(authData));
        }

        // Load Language
        let storedLang: string | null = null;
        if (Platform.OS === 'web') {
          storedLang = localStorage.getItem('user_lang');
        } else {
          storedLang = await SecureStore.getItemAsync('user_lang');
        }

        if (storedLang) {
          setLanguage(storedLang);
          // eslint-disable-next-line import/no-named-as-default-member
          await i18n.changeLanguage(storedLang);
        }
      } catch (e) {
        console.error('Failed to load init data', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitData();
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

  const changeLanguage = useCallback(async (lng: 'vi' | 'en') => {
    setLanguage(lng);
    // eslint-disable-next-line import/no-named-as-default-member
    await i18n.changeLanguage(lng);
    if (Platform.OS === 'web') {
      localStorage.setItem('user_lang', lng);
    } else {
      await SecureStore.setItemAsync('user_lang', lng);
    }
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
    return () => setLogoutHandler(() => {});
  }, [logout]);

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        language,
        changeLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Alias for backward compatibility during transition
export const useAuth = () => {
  const { user, isLoading, login, logout } = useApp();
  return { user, isLoading, login, logout };
};

export { i18n };
export default i18n;
