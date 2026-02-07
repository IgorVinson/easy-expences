import { Ionicons } from '@expo/vector-icons';
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

export default function LoginScreen() {
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
    <View className="flex-1" style={{ backgroundColor: '#F5F5F5' }}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="items-center px-6 pb-6 pt-16">
            <Text className="text-base font-semibold" style={{ color: '#000000' }}>
              Login
            </Text>
          </View>

          {/* Content */}
          <View className="flex-1 justify-center px-6">
            {/* Welcome Text */}
            <Text className="mb-10 text-center text-3xl font-bold" style={{ color: '#000000' }}>
              Welcome Back
            </Text>

            {/* Email Input */}
            <View className="mb-4">
              <View
                className="flex-row items-center rounded-2xl px-4"
                style={{
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-base"
                  style={{ color: '#000000', paddingVertical: 16, paddingLeft: 12 }}
                  placeholder="  Email"
                  placeholderTextColor="#9CA3AF"
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
              <View
                className="flex-row items-center rounded-2xl px-4"
                style={{
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-base"
                  style={{ color: '#000000', paddingVertical: 16, paddingLeft: 12 }}
                  placeholder="  Password"
                  placeholderTextColor="#9CA3AF"
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
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <View className="mb-6 items-end">
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="text-sm" style={{ color: '#9CA3AF' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="mb-6 items-center justify-center rounded-2xl py-4"
              style={{ backgroundColor: '#3B82F6', opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Login</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="mb-6 flex-row items-center">
              <View className="h-px flex-1" style={{ backgroundColor: '#D1D5DB' }} />
              <Text className="px-4 text-sm" style={{ color: '#6B7280' }}>
                or continue with
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: '#D1D5DB' }} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              className="mb-6 flex-row items-center justify-center rounded-2xl py-4"
              style={{
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
              <View className="mr-2">
                <Text className="text-xl font-bold">🇬</Text>
              </View>
              <Text className="text-base font-semibold" style={{ color: '#000000' }}>
                Google
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="mb-8 flex-row items-center justify-center">
              <Text className="text-base" style={{ color: '#6B7280' }}>
                Don&apos;t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text className="text-base font-semibold" style={{ color: '#3B82F6' }}>
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
