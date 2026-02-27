import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { currencies } from '../config/currencies';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserProfile, createUserProfile, getUserProfile, updateUserProfile } from '../hooks/useUserProfile';
import { styles } from '../styles';

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [editBudgetLimit, setEditBudgetLimit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        let p = await getUserProfile(user.uid);
        if (!p) {
           p = await createUserProfile(user.uid, user.email, user.displayName);
        }
        setProfile(p);
        setEditName(p.displayName || '');
        setEditCurrency(p.currency);
        setEditBudgetLimit(p.monthlyBudgetLimit.toString());
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: editName,
        currency: editCurrency,
        monthlyBudgetLimit: parseFloat(editBudgetLimit) || 0,
      });
      setProfile((prev) => prev ? { ...prev, displayName: editName, currency: editCurrency, monthlyBudgetLimit: parseFloat(editBudgetLimit) || 0 } : null);
      setIsEditModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = async () => {
    if (!user || !profile) return;
    const newValue = !profile.notificationsEnabled;
    try {
      await updateUserProfile(user.uid, { notificationsEnabled: newValue });
      setProfile({ ...profile, notificationsEnabled: newValue });
    } catch (error: any) {
        Alert.alert('Error', 'Failed to update notifications');
    }
  };

  const handleSubscribe = async () => {
     Alert.alert('Coming Soon', 'Stripe checkout will be available soon once backend is deployed.');
  };

  if (loading) {
     return (
       <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bg }}>
          <ActivityIndicator size="large" color={theme.purple} />
       </View>
     );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
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
        <TouchableOpacity 
          className="mb-6 px-6"
          onPress={() => setIsEditModalVisible(true)}
        >
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
                {profile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                {profile?.displayName || 'User'}
              </Text>
              <Text className="mt-0.5 text-sm" style={{ color: theme.textSecondary }}>
                {user?.email}
              </Text>
            </View>
            <Ionicons name="pencil" size={20} color={theme.textTertiary} />
          </View>
        </TouchableOpacity>

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
                <Ionicons name={profile?.plan === 'pro' ? "checkmark-circle" : "star-outline"} size={24} color="#3B82F6" />
              </View>
              <View className="ml-3">
                <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                  {profile?.plan === 'pro' ? 'Pro Plan - $4.99/mo' : 'Free Plan'}
                </Text>
                {profile?.plan === 'pro' && profile.planExpiresAt && (
                   <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                     Renews on {new Date(profile.planExpiresAt).toLocaleDateString()}
                   </Text>
                )}
                 {profile?.plan === 'free' && (
                   <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                     Limited categories and features
                   </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={handleSubscribe}
              className="w-full items-center justify-center rounded-xl py-3"
              style={{ 
                borderWidth: 1, 
                borderColor: profile?.plan === 'free' ? theme.purple : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
                backgroundColor: profile?.plan === 'free' ? theme.purple : (isDarkMode ? 'rgba(255,255,255,0.03)' : '#F9FAFB')
              }}
            >
              <Text className="text-sm font-medium" style={{ color: profile?.plan === 'free' ? 'white' : theme.textSecondary }}>
                {profile?.plan === 'free' ? 'Upgrade to Pro' : 'Manage Subscription'}
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
            className="p-4 overflow-hidden rounded-2xl"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow
            ]}
          >
            {/* Notifications */}
            <TouchableOpacity
              onPress={toggleNotifications}
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }}
                >
                  <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  Notifications
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-sm" style={{ color: theme.textSecondary }}>
                  {profile?.notificationsEnabled ? 'On' : 'Off'}
                </Text>
                <Ionicons name={profile?.notificationsEnabled ? "toggle" : "toggle-outline"} size={30} color={profile?.notificationsEnabled ? theme.purple : theme.textTertiary} />
              </View>
            </TouchableOpacity>

            {/* Currency */}
            <TouchableOpacity
              onPress={() => setIsEditModalVisible(true)}
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }}
                >
                  <Ionicons name="globe-outline" size={20} color="#10B981" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  Currency
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-1 text-sm" style={{ color: theme.textSecondary }}>({profile?.currency})</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>

            {/* Budget Limit */}
            <TouchableOpacity
              onPress={() => setIsEditModalVisible(true)}
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : '#EDE9FE' }}
                >
                  <Ionicons name="wallet-outline" size={20} color="#8B5CF6" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  Monthly Budget
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-1 text-sm" style={{ color: theme.textSecondary }}>{profile?.monthlyBudgetLimit}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>


            {/* Help & Support */}
            <TouchableOpacity
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' }}
                >
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
              className="flex-row items-center justify-between py-4"
            >
              <View className="flex-row items-center">
                <View 
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2' }}
                >
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

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="rounded-t-3xl p-6" style={{ backgroundColor: theme.bg }}>
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text className="mb-2 text-sm font-medium" style={{ color: theme.textSecondary }}>Display Name</Text>
            <TextInput
              className="mb-4 rounded-xl px-4 py-3"
              style={{ backgroundColor: theme.cardBg, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border }}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={theme.textTertiary}
            />

            <Text className="mb-2 text-sm font-medium" style={{ color: theme.textSecondary }}>Monthly Budget Limit</Text>
            <TextInput
              className="mb-4 rounded-xl px-4 py-3"
              style={{ backgroundColor: theme.cardBg, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border }}
              value={editBudgetLimit}
              onChangeText={setEditBudgetLimit}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={theme.textTertiary}
            />

            <Text className="mb-2 text-sm font-medium" style={{ color: theme.textSecondary }}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
               {currencies.map((c) => (
                 <TouchableOpacity
                   key={c.code}
                   onPress={() => setEditCurrency(c.code)}
                   className="mr-3 rounded-xl px-4 py-2"
                   style={{
                     backgroundColor: editCurrency === c.code ? theme.purple : theme.cardBg,
                     borderWidth: 1,
                     borderColor: editCurrency === c.code ? theme.purple : theme.border
                   }}
                 >
                   <Text style={{ color: editCurrency === c.code ? 'white' : theme.textPrimary, fontWeight: 'bold' }}>{c.code}</Text>
                 </TouchableOpacity>
               ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              className="items-center justify-center rounded-xl py-4"
              style={{ backgroundColor: theme.purple, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}