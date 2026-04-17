import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  HelpCircle,
  Globe,
} from '@/assets/icons';
import { useTranslation } from 'react-i18next';
import { useProfileScreen } from './hooks';

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const {
    user,
    isLogoutModalVisible,
    setIsLogoutModalVisible,
    isLangModalVisible,
    setIsLangModalVisible,
    handleLogout,
    confirmLogout,
    handleLanguageToggle,
    changeLanguage,
  } = useProfileScreen();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="items-center bg-background p-10 mb-6 shadow-sm border-b border-border">
        <View className="mb-4 h-28 w-28 items-center justify-center rounded-full bg-input border-4 border-background">
          <User size={64} className="text-icon" />
        </View>
        <Text className="text-3xl font-extrabold text-text tracking-tight">
          {user ? user.name : t('Dashboard.profile.guest')}
        </Text>
        <Text className="text-muted font-medium text-base mt-1">
          {user
            ? `${t('Dashboard.profile.phonePrefix')}${user.phone}`
            : '0909090909'}
        </Text>
        <Pressable className="mt-6 rounded-xl border border-border px-8 py-2.5 active:bg-input">
          <Text className="text-sm font-bold text-text">
            {t('Dashboard.profile.editProfile')}
          </Text>
        </Pressable>
      </View>

      <View className="px-6 gap-y-4">
        <Pressable className="flex-row items-center justify-between rounded-2xl bg-background p-5 shadow-sm border border-border active:bg-input">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Settings size={24} className="text-primary" />
            </View>
            <Text className="font-bold text-text text-base">
              {t('Dashboard.profile.accountSettings')}
            </Text>
          </View>
          <ChevronRight size={20} className="text-icon" />
        </Pressable>

        <Pressable
          className="flex-row items-center justify-between rounded-2xl bg-background p-5 shadow-sm border border-border active:bg-input"
          onPress={handleLanguageToggle}
        >
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <Globe size={24} className="text-orange-500" />
            </View>
            <Text className="font-bold">{t('Dashboard.profile.language')}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-muted font-medium mr-2">
              {i18n.language === 'en' ? 'English' : 'Tiếng Việt'}
            </Text>
            <ChevronRight size={20} className="text-icon" />
          </View>
        </Pressable>

        <Pressable className="flex-row items-center justify-between rounded-2xl bg-background p-5 shadow-sm border border-border active:bg-input">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <HelpCircle size={24} className="text-success" />
            </View>
            <Text className="font-bold text-text text-base">
              {t('Dashboard.profile.helpSupport')}
            </Text>
          </View>
          <ChevronRight size={20} className="text-icon" />
        </Pressable>

        <Pressable
          className="flex-row items-center justify-between rounded-2xl bg-background p-5 shadow-sm border border-border active:bg-input"
          onPress={handleLogout}
        >
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-error/10">
              <LogOut size={24} className="text-error" />
            </View>
            <Text className="font-bold text-error text-base">
              {t('Dashboard.profile.signOut')}
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="mt-12 items-center pb-12">
        <Text className="text-xs font-bold text-secondary uppercase tracking-widest">
          {t('Dashboard.profile.version')}
        </Text>
      </View>

      <ConfirmModal
        visible={isLogoutModalVisible}
        onClose={() => setIsLogoutModalVisible(false)}
        onConfirm={confirmLogout}
        title={t('Dashboard.profile.signOut')}
        description={t(
          'Dashboard.profile.signOutConfirmation',
          'Are you sure you want to sign out?',
        )}
        confirmText={t('Dashboard.profile.signOut')}
        cancelText={t('Dashboard.profile.cancel')}
        isDestructive={true}
      />
      <ConfirmModal
        visible={isLangModalVisible}
        onClose={() => setIsLangModalVisible(false)}
        title={t('Dashboard.profile.selectLanguage')}
        icon={Globe}
        customActions={
          <View className="flex-col gap-3 w-full">
            <TouchableOpacity
              onPress={() => {
                changeLanguage('vi');
                setIsLangModalVisible(false);
              }}
              className="w-full py-3.5 px-5 rounded-xl bg-orange-50 items-center justify-center border border-orange-200"
            >
              <Text className="text-orange-600 font-bold text-base">
                Tiếng Việt
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                changeLanguage('en');
                setIsLangModalVisible(false);
              }}
              className="w-full py-3.5 px-5 rounded-xl bg-blue-50 items-center justify-center border border-blue-200"
            >
              <Text className="text-blue-600 font-bold text-base">English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLangModalVisible(false)}
              className="w-full py-3.5 px-5 mt-2 rounded-xl bg-white border border-border items-center justify-center"
            >
              <Text className="text-muted font-bold text-base">
                {t('Dashboard.profile.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </ScrollView>
  );
}
