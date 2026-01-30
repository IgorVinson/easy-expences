import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: theme.bg }}>
      <Text className="mb-4 text-2xl font-bold" style={{ color: theme.textPrimary }}>
        Settings
      </Text>
      
      {user && (
        <Text className="mb-8 text-base" style={{ color: theme.textSecondary }}>
          Logged in as: {user.email}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleLogout}
        className="w-full items-center justify-center rounded-2xl py-4"
        style={{ backgroundColor: '#EF4444' }}>
        <Text className="text-base font-semibold text-white">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
