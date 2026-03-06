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

export default function SignUpScreen() {
  const { theme, isDarkMode } = useTheme();
  const { signup, googleSignIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
       Alert.alert('Error', 'Passwords do not match');
       return;
    }

    setLoading(true);
    try {
      await signup(email, password, name);
      // Success is handled by the root layout's redirect logic
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await googleSignIn();
      // Success is handled by the root layout's redirect logic
    } catch (error: any) {
      Alert.alert('Google Sign Up Failed', error.message);
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
          
           {/* Header Gradient */}
           <LinearGradient
             colors={isDarkMode ? ['#4C1D95', theme.bg] : ['#EDE9FE', theme.bg]}
             style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250 }}
          />

          {/* Header */}
          <View className="flex-row items-center px-6 pb-2 pt-16">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1 px-6 pt-4">
            <Text
              className="text-4xl font-bold"
              style={{ color: theme.textPrimary }}>
              Create Account
            </Text>
            <Text className="mb-8 mt-2 text-base" style={{ color: theme.textSecondary }}>
              Start tracking your expenses today
            </Text>

            {/* Name Input */}
            <View className="mb-4">
              <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>Full Name</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="person-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
                  placeholder="John Doe"
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="mb-4">
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>Email Address</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="mail-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
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
            <View className="mb-4">
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>Password</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
                  placeholder="Create a password"
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

             {/* Confirm Password Input */}
             <View className="mb-8">
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>Confirm Password</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
                  placeholder="Repeat your password"
                  placeholderTextColor={theme.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
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
                <Text className="text-lg font-bold text-white">Create Account</Text>
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
              onPress={handleGoogleSignUp}
              className="mb-6 flex-row items-center justify-center rounded-2xl py-4"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
              <Text className="mr-3 text-xl font-bold" style={{ color: theme.textPrimary }}>
                G
              </Text>
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="mb-8 mt-2 flex-row items-center justify-center">
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-base font-bold" style={{ color: theme.purple }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}