import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Logout Failed', error.message);
            }
          }
        }
      ]
    );
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
              !isDarkMode && styles.expenseItemShadow
            ]}
          >
            <View 
              className="items-center justify-center rounded-full"
              style={{ 
                width: 56, 
                height: 56, 
                backgroundColor: isDarkMode ? 'rgba(139,92,246,0.25)' : '#EDE9FE',
              }}
            >
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
              !isDarkMode && styles.cardShadow
            ]}
          >
            <View className="mb-4 flex-row items-center">
              <View 
                className="h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#DBEAFE' }}
              >
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
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F9FAFB'
              }}
            >
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
            className="overflow-hidden rounded-2xl"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow
            ]}
          >
            {/* Notifications */}
            <TouchableOpacity
              className="flex-row items-center justify-between border-b px-4 py-4"
              style={{ borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }}
                >
                  <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
                </View>
                <Text className="ml-3 text-base font-medium" style={{ color: theme.textPrimary }}>
                  Notifications
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Currency */}
            <TouchableOpacity
              className="flex-row items-center justify-between border-b px-4 py-4"
              style={{ borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }}
                >
                  <Ionicons name="globe-outline" size={20} color="#10B981" />
                </View>
                <Text className="ml-3 text-base font-medium" style={{ color: theme.textPrimary }}>
                  Currency
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-1 text-sm" style={{ color: theme.textSecondary }}>(USD)</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>

            {/* Help & Support */}
            <TouchableOpacity
              className="flex-row items-center justify-between border-b px-4 py-4"
              style={{ borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' }}
                >
                  <Ionicons name="help-circle-outline" size={20} color="#F59E0B" />
                </View>
                <Text className="ml-3 text-base font-medium" style={{ color: theme.textPrimary }}>
                  Help & Support
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2' }}
                >
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </View>
                <Text className="ml-3 text-base font-medium" style={{ color: '#EF4444' }}>
                  Log Out
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Bottom padding for tab bar */}
        <View className="h-24" />

      </ScrollView>
    </View>
  );
}
