import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';

export default function SettingsScreen() {
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

  const SettingItem = ({ icon, title, value, onPress, color, isLast = false }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b' : ''}`}
      style={{ borderBottomColor: theme.border }}
    >
      <div className="flex-row items-center">
        <View 
          className="h-10 w-10 items-center justify-center rounded-xl mr-4"
          style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
        >
          <Ionicons name={icon} size={22} color={color || theme.textPrimary} />
        </View>
        <Text className="text-base font-medium" style={{ color: theme.textPrimary }}>{title}</Text>
      </div>
      <View className="flex-row items-center">
        {value && (
          <Text className="mr-2 text-sm" style={{ color: theme.textSecondary }}>{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            Settings
          </Text>
        </View>

        {/* Profile Card */}
        <View className="mb-6 px-6">
          <View 
            className="rounded-3xl p-6 flex-row items-center" 
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow
            ]}
          >
            <View className="h-16 w-16 items-center justify-center rounded-full bg-purple-500 mr-4">
              <Text className="text-2xl font-bold text-white">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
                My Account
              </Text>
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {user?.email || 'Not logged in'}
              </Text>
            </View>
          </View>
        </View>

        {/* Appearance Group */}
        <View className="mb-6 px-6">
          <Text className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}>
            Appearance
          </Text>
          <View 
            className="overflow-hidden rounded-3xl" 
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow
            ]}
          >
            <TouchableOpacity
              onPress={toggleTheme}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl mr-4"
                  style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                >
                  <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={22} color="#A855F7" />
                </View>
                <Text className="text-base font-medium" style={{ color: theme.textPrimary }}>Dark Mode</Text>
              </View>
              <View 
                className={`h-6 w-11 rounded-full p-1 ${isDarkMode ? 'bg-purple-500' : 'bg-gray-300'}`}
              >
                <View 
                  className={`h-4 w-4 rounded-full bg-white shadow-sm ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Group */}
        <View className="mb-6 px-6">
          <Text className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}>
            Preferences
          </Text>
          <View 
            className="overflow-hidden rounded-3xl" 
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow
            ]}
          >
            <SettingItem icon="notifications-outline" title="Notifications" color="#3B82F6" />
            <SettingItem icon="wallet-outline" title="Default Currency" value="USD ($)" color="#10B981" />
            <SettingItem icon="lock-closed-outline" title="Security" isLast color="#F59E0B" />
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-32 px-6">
          <Text className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}>
            Account Actions
          </Text>
          <View 
            className="overflow-hidden rounded-3xl" 
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow
            ]}
          >
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-50 mr-4">
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              </View>
              <Text className="text-base font-medium text-red-500">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
