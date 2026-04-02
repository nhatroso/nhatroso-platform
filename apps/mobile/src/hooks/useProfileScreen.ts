import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';

export function useProfileScreen() {
  const { logout, user } = useAuth();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);

  const handleLogout = () => setIsLogoutModalVisible(true);

  const confirmLogout = async () => {
    setIsLogoutModalVisible(false);
    await logout();
  };

  const handleLanguageToggle = () => setIsLangModalVisible(true);

  return {
    user,
    isLogoutModalVisible,
    setIsLogoutModalVisible,
    isLangModalVisible,
    setIsLangModalVisible,
    handleLogout,
    confirmLogout,
    handleLanguageToggle,
  };
}
