import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  const displayName = user?.displayName || 'User';
  const email = user?.email || 'Not logged in';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error: any) {
            Alert.alert('Logout Failed', error.message);
          }
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    title,
    color,
    colorLight,
    onPress,
    isLast = false,
    isDestructive = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    color: string;
    colorLight: string;
    onPress?: () => void;
    isLast?: boolean;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.border,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            marginRight: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? color + '33' : colorLight,
          }}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: isDestructive ? '#EF4444' : theme.textPrimary,
          }}>
          {title}
        </Text>
      </View>
      {!isDestructive && (
        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
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

        {/* Profile Card with Avatar */}
        <View className="mb-6 px-6">
          <View
            className="items-center rounded-3xl p-6"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            {/* Avatar */}
            <View style={{ width: 96, height: 96, marginBottom: 16 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: theme.purple,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' }}>
                  {initial}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.purpleCard,
                  borderWidth: 2,
                  borderColor: theme.cardBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: theme.textPrimary,
                marginBottom: 4,
              }}>
              {displayName}
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>{email}</Text>
          </View>
        </View>

        {/* My Plan */}
        <View className="mb-6 px-6">
          <Text
            className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: theme.textSecondary }}>
            My Plan
          </Text>
          <View
            className="overflow-hidden rounded-3xl"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <View style={{ padding: 20 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: isDarkMode ? theme.purple + '33' : '#EDE9FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name="diamond" size={22} color={theme.purple} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary }}>
                    Premium Plan
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                    Unlimited budgets & exports
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  marginBottom: 16,
                }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.textPrimary }}>
                  $9.99
                </Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary, marginLeft: 4 }}>
                  /month
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: theme.purple,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  Change plan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View className="mb-6 px-6">
          <Text
            className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: theme.textSecondary }}>
            Preferences
          </Text>
          <View
            className="overflow-hidden rounded-3xl"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              color="#3B82F6"
              colorLight="#DBEAFE"
            />
            <MenuItem
              icon="wallet-outline"
              title="Currency"
              color="#10B981"
              colorLight="#D1FAE5"
            />
            <MenuItem
              icon="lock-closed-outline"
              title="Security"
              color="#F59E0B"
              colorLight="#FEF3C7"
            />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Privacy"
              color="#8B5CF6"
              colorLight="#EDE9FE"
              isLast
            />
          </View>
        </View>

        {/* Account Actions */}
        <View className="mb-32 px-6">
          <Text
            className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: theme.textSecondary }}>
            Account
          </Text>
          <View
            className="overflow-hidden rounded-3xl"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <MenuItem
              icon="help-circle-outline"
              title="Help & Support"
              color="#6366F1"
              colorLight="#E0E7FF"
            />
            <MenuItem
              icon="log-out-outline"
              title="Logout"
              color="#EF4444"
              colorLight="#FEE2E2"
              onPress={handleLogout}
              isDestructive
              isLast
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
