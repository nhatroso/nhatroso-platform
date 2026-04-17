import { useState } from 'react';
import { useApp } from '../../../context';

export function useProfileScreen() {
  const { logout, user, changeLanguage } = useApp();
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
    changeLanguage,
  };
}
