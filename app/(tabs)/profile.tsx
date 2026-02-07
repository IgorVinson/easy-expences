import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile, updateUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(userProfile?.displayName || '');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({ displayName: name.trim() });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
              My Profile
            </Text>
            <TouchableOpacity
              onPress={() => (editing ? handleSave() : setEditing(true))}
              disabled={loading}
              className="p-2"
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.purple} />
              ) : (
                <Ionicons
                  name={editing ? 'checkmark' : 'create-outline'}
                  size={24}
                  color={theme.purple}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View className="mb-8 items-center px-6">
            <View
              className="mb-4 h-28 w-28 items-center justify-center rounded-full"
              style={{
                backgroundColor: theme.purple,
                shadowColor: theme.purple,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {userProfile?.photoURL ? (
                <Image
                  source={{ uri: userProfile.photoURL }}
                  className="h-28 w-28 rounded-full"
                />
              ) : (
                <Text className="text-4xl font-bold text-white">{getInitials()}</Text>
              )}
            </View>

            {editing ? (
              <View className="w-full max-w-xs">
                <Text className="mb-2 text-sm" style={{ color: theme.textSecondary }}>
                  Display Name
                </Text>
                <TextInput
                  className="rounded-xl px-4 py-3 text-base"
                  style={{
                    backgroundColor: theme.cardBg,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                />
              </View>
            ) : (
              <>
                <Text className="mb-1 text-2xl font-bold" style={{ color: theme.textPrimary }}>
                  {userProfile?.displayName || 'My Account'}
                </Text>
                <Text className="text-base" style={{ color: theme.textSecondary }}>
                  {user?.email}
                </Text>
              </>
            )}
          </View>

          {/* Profile Info Section */}
          <View className="px-6">
            <Text
              className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest"
              style={{ color: theme.textSecondary }}
            >
              Account Information
            </Text>

            <View
              className="overflow-hidden rounded-3xl"
              style={[
                { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                !isDarkMode && styles.cardShadow,
              ]}
            >
              {/* Member Since */}
              <View className="flex-row items-center justify-between border-b p-4" style={{ borderBottomColor: theme.border }}>
                <View className="flex-row items-center">
                  <View
                    className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                  </View>
                  <Text className="text-base font-medium" style={{ color: theme.textPrimary }}>
                    Member Since
                  </Text>
                </View>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  {userProfile?.createdAt
                    ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>

              {/* Currency */}
              <View className="flex-row items-center justify-between border-b p-4" style={{ borderBottomColor: theme.border }}>
                <View className="flex-row items-center">
                  <View
                    className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  >
                    <Ionicons name="cash-outline" size={20} color="#10B981" />
                  </View>
                  <Text className="text-base font-medium" style={{ color: theme.textPrimary }}>
                    Default Currency
                  </Text>
                </View>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  {userProfile?.settings?.currency || 'USD'}
                </Text>
              </View>

              {/* Notifications */}
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center">
                  <View
                    className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  >
                    <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                  </View>
                  <Text className="text-base font-medium" style={{ color: theme.textPrimary }}>
                    Notifications
                  </Text>
                </View>
                <View
                  className={`h-6 w-11 rounded-full p-1 ${
                    userProfile?.settings?.notifications ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <View
                    className={`h-4 w-4 rounded-full bg-white shadow-sm ${
                      userProfile?.settings?.notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Account Stats */}
          <View className="mt-6 px-6">
            <Text
              className="mb-3 ml-2 text-xs font-bold uppercase tracking-widest"
              style={{ color: theme.textSecondary }}
            >
              Account Stats
            </Text>

            <View className="flex-row gap-4">
              <View
                className="flex-1 rounded-2xl p-4"
                style={[
                  { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                  !isDarkMode && styles.cardShadow,
                ]}
              >
                <Text className="mb-1 text-2xl font-bold" style={{ color: theme.purple }}>
                  0
                </Text>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  Expenses
                </Text>
              </View>

              <View
                className="flex-1 rounded-2xl p-4"
                style={[
                  { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                  !isDarkMode && styles.cardShadow,
                ]}
              >
                <Text className="mb-1 text-2xl font-bold" style={{ color: theme.purple }}>
                  0
                </Text>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  Budgets
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
