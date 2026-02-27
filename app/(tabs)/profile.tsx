import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme, themePreference, setThemePreference } = useTheme();
  const { logout, user } = useAuth();
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [supportMessage, setSupportMessage] = React.useState('');
  const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;

  const handleLogout = () => {
    console.log('Logout button pressed');

    const doLogout = async () => {
      console.log('Logout confirmed, calling logout()...');
      try {
        await logout();
        console.log('Logout successful');
      } catch (error: any) {
        console.error('Logout failed:', error);
        Alert.alert('Logout Failed', error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        doLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const handleSendSupport = async () => {
    const message = supportMessage.trim();
    if (!message) {
      Alert.alert('Message Required', 'Please enter a message before sending.');
      return;
    }
    if (!supportEmail) {
      Alert.alert(
        'Support Email Missing',
        'Set EXPO_PUBLIC_SUPPORT_EMAIL in your environment to enable support emails.'
      );
      return;
    }

    const subject = encodeURIComponent('Easy Expenses Support');
    const body = encodeURIComponent(message);
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (!canOpen) {
      Alert.alert('Unable to Send', 'No email client is available on this device.');
      return;
    }

    await Linking.openURL(mailtoUrl);
    setSupportMessage('');
    setIsSupportModalOpen(false);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Theme Toggle */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            My Profile
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info Card */}
        <View className="mb-6 px-6">
          <View
            style={[
              styles.expenseItem,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                marginBottom: 0,
              },
              !isDarkMode && styles.expenseItemShadow,
            ]}>
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 56,
                height: 56,
                backgroundColor: isDarkMode ? 'rgba(139,92,246,0.25)' : '#EDE9FE',
              }}>
              <Text className="text-xl font-bold" style={{ color: theme.purple }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                {user?.displayName || 'John Doe'}
              </Text>
              <Text className="mt-0.5 text-sm" style={{ color: theme.textSecondary }}>
                {user?.email || 'john.doe@example.com'}
              </Text>
            </View>
          </View>
        </View>

        {/* My Plan Section */}
        <View className="mb-6 px-6">
          <Text className="mb-4 text-xl font-bold" style={{ color: theme.textPrimary }}>
            My Plan
          </Text>
          <View
            className="rounded-2xl p-4"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <View className="mb-4 flex-row items-center">
              <View
                className="h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#DBEAFE' }}>
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              </View>
              <View className="ml-3">
                <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                  Pro Plan - $4.99/mo
                </Text>
                <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                  Renews on May 26, 2023
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="w-full items-center justify-center rounded-xl py-3"
              style={{
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
              }}>
              <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                Manage Subscription
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Group */}
        <View className="mb-8 px-6">
          <Text className="mb-4 text-xl font-bold" style={{ color: theme.textPrimary }}>
            Settings
          </Text>
          <View
            className="overflow-hidden rounded-2xl p-4"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            {/* Theme Preference */}
            <View
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(14,165,233,0.15)' : '#E0F2FE' }}>
                  <Ionicons name="color-palette-outline" size={20} color="#0EA5E9" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  Theme
                </Text>
              </View>
              <View className="flex-row items-center">
                {(['auto', 'dark', 'light'] as const).map((option) => {
                  const isSelected = themePreference === option;
                  const iconName =
                    option === 'auto'
                      ? 'phone-portrait-outline'
                      : option === 'dark'
                        ? 'moon'
                        : 'sunny';
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setThemePreference(option)}
                      className="ml-2 h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isSelected
                          ? theme.purple
                          : isDarkMode
                            ? 'rgba(255,255,255,0.06)'
                            : '#F1F5F9',
                      }}>
                      <Ionicons
                        name={iconName}
                        size={16}
                        color={isSelected ? '#FFFFFF' : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Help & Support */}
            <TouchableOpacity
              onPress={() => setIsSupportModalOpen(true)}
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' }}>
                  <Ionicons name="help-circle-outline" size={20} color="#F59E0B" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  Help & Support
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2' }}>
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: '#EF4444' }}>
                  Log Out
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isSupportModalOpen}
        onRequestClose={() => setIsSupportModalOpen(false)}>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              Help & Support
            </Text>
            <Text className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              Tell us what you need and we will send it to support.
            </Text>

            <TextInput
              value={supportMessage}
              onChangeText={setSupportMessage}
              placeholder="Describe your issue..."
              placeholderTextColor={theme.textTertiary}
              multiline
              className="mt-4 h-28 rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
            />

            <View className="mt-4 flex-row items-center justify-end">
              <TouchableOpacity
                onPress={() => setIsSupportModalOpen(false)}
                className="mr-3 rounded-full px-4 py-2"
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                <Text className="text-sm font-semibold" style={{ color: theme.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendSupport}
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: theme.purple }}>
                <Text className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
