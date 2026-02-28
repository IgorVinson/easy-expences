import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoginScreen() {
  const { theme, isDarkMode } = useTheme();
  const { login, googleSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Success is handled by the root layout's redirect logic
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await googleSignIn();
      // Success is handled by the root layout's redirect logic
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message);
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
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Header Gradient */}
          <LinearGradient
             colors={isDarkMode ? ['#4C1D95', theme.bg] : ['#EDE9FE', theme.bg]}
             style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250 }}
          />

          <View className="flex-1 justify-center px-6 pt-20">
            {/* Logo/Icon */}
            <View className="mb-6 items-center">
              <View className="items-center justify-center rounded-3xl h-20 w-20" style={{ backgroundColor: theme.purple, shadowColor: theme.purple, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 }}>
                 <Ionicons name="wallet" size={40} color="white" />
              </View>
            </View>

            {/* Welcome Text */}
            <Text className="text-center text-4xl font-bold" style={{ color: theme.textPrimary }}>
              Welcome Back
            </Text>
            <Text className="mb-10 mt-2 text-center text-base" style={{ color: theme.textSecondary }}>
              Sign in to manage your budget
            </Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>Email Address</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}>
                <Ionicons name="mail-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 text-base"
                  style={{ color: theme.textPrimary, paddingVertical: 14, paddingLeft: 12 }}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-2">
              <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>Password</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 text-base"
                  style={{ color: theme.textPrimary, paddingVertical: 14, paddingLeft: 12 }}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <View className="mb-8 items-end">
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} className="p-2">
                <Text className="text-sm font-medium" style={{ color: theme.purple }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="mb-6 overflow-hidden rounded-2xl">
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="items-center justify-center py-4"
              >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-lg font-bold text-white">Sign In</Text>
              )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View className="mb-6 flex-row items-center">
              <View className="h-px flex-1" style={{ backgroundColor: theme.border }} />
              <Text className="px-4 text-sm font-medium" style={{ color: theme.textSecondary }}>
                OR
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              className="mb-8 flex-row items-center justify-center rounded-2xl py-4"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
              <View className="mr-3">
                <Text className="text-xl font-bold">G</Text>
              </View>
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="mb-8 flex-row items-center justify-center">
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text className="text-base font-bold" style={{ color: theme.purple }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}