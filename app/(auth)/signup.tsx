import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { styles } from '../../styles';

export default function SignUpScreen() {
  const { theme, isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = () => {
    console.log('Sign up:', name, email, password);
  };

  const handleGoogleSignUp = () => {
    console.log('Google sign up');
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
              Sign Up
            </Text>
            <View className="w-10" />
          </View>

          {/* Content */}
          <View className="flex-1 px-6">
            <Text
              className="mb-8 text-center text-4xl font-bold"
              style={{ color: theme.textPrimary }}>
              Create Account
            </Text>

            {/* Name Input */}
            <View className="mb-4">
              <View
                className="flex-row items-center rounded-2xl px-4"
                style={[
                  { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                  !isDarkMode && styles.cardShadow,
                ]}>
                <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
                  placeholder="Full Name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <View
                className="flex-row items-center rounded-2xl px-4"
                style={[
                  { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                  !isDarkMode && styles.cardShadow,
                ]}>
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

            {/* Password Input */}
            <View className="mb-6">
              <View
                className="flex-row items-center rounded-2xl px-4"
                style={[
                  { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                  !isDarkMode && styles.cardShadow,
                ]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
                  placeholder="Password"
                  placeholderTextColor={theme.textSecondary}
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
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              className="mb-6 items-center justify-center rounded-2xl py-4"
              style={[{ backgroundColor: theme.purple }, !isDarkMode && styles.cardShadow]}>
              <Text className="text-base font-bold text-white">Sign Up</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="mb-6 flex-row items-center">
              <View className="h-px flex-1" style={{ backgroundColor: theme.border }} />
              <Text className="px-4 text-sm" style={{ color: theme.textSecondary }}>
                or continue with
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleSignUp}
              className="mb-6 flex-row items-center justify-center rounded-2xl py-4"
              style={[
                { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                !isDarkMode && styles.cardShadow,
              ]}>
              <Text className="mr-2 text-xl font-bold" style={{ color: theme.textPrimary }}>
                G
              </Text>
              <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
                Google
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="mb-8 flex-row items-center justify-center">
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-base font-semibold" style={{ color: theme.purple }}>
                  Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
