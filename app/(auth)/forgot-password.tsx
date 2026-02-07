import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { auth } from '../../firebaseConfig';

export default function ForgotPasswordScreen() {
  const { theme, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text className="text-base font-medium" style={{ color: theme.textSecondary }}>
              Forgot Password
            </Text>
            <View className="w-10" />
          </View>

          {/* Content */}
          <View className="flex-1 px-6">
            <Text
              className="mb-4 text-center text-3xl font-bold"
              style={{ color: theme.textPrimary }}>
              Reset Password
            </Text>
            <Text
                className="mb-8 text-center text-sm"
                style={{ color: theme.textSecondary }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
            </Text>

            {/* Email Input */}
            <View className="mb-6">
              <View
                className="flex-row items-center rounded-2xl px-4"
                style={{
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}>
                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading}
              className="mb-6 items-center justify-center rounded-2xl py-4"
              style={{ backgroundColor: theme.purple, opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-bold text-white">Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
