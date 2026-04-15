import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { signup, googleSignIn, finishPostSignupRedirect } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.fillFields'));
      return;
    }
    
    if (password !== confirmPassword) {
       Alert.alert(t('common.error'), t('auth.passwordsNoMatch'));
       return;
    }

    setLoading(true);
    try {
      await signup(email, password, name);
      Alert.alert(
        t('auth.signupSuccessTitle'),
        t('auth.signupSuccessMessage'),
        [
          {
            text: t('auth.logIn'),
            onPress: () => {
              finishPostSignupRedirect();
              router.replace({
                pathname: '/(auth)/login',
                params: { email: email.trim() },
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert(t('auth.signupFailed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await googleSignIn();
    } catch (error: any) {
      Alert.alert(t('auth.googleFailed'), error.message);
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
          
           <LinearGradient
             colors={isDarkMode ? ['#4C1D95', theme.bg] : ['#EDE9FE', theme.bg]}
             style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250 }}
          />

          <View className="flex-row items-center px-6 pb-2 pt-16">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-6 pt-4">
            <Text
              className="text-4xl font-bold"
              style={{ color: theme.textPrimary }}>
              {t('auth.createAccount')}
            </Text>
            <Text className="mb-8 mt-2 text-base" style={{ color: theme.textSecondary }}>
              {t('auth.startJourney')}
            </Text>

            <View className="mb-4">
              <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.fullName')}</Text>
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

            <View className="mb-4">
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.email')}</Text>
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

            <View className="mb-4">
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.password')}</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
                  placeholder="********"
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

             <View className="mb-8">
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.confirmPassword')}</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 py-4 pl-3 text-base"
                  style={{ color: theme.textPrimary }}
                  placeholder="********"
                  placeholderTextColor={theme.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

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
                <Text className="text-lg font-bold text-white">{t('auth.signUp')}</Text>
              )}
              </LinearGradient>
            </TouchableOpacity>

            <View className="mb-6 flex-row items-center">
              <View className="h-px flex-1" style={{ backgroundColor: theme.border }} />
              <Text className="px-4 text-sm font-medium" style={{ color: theme.textSecondary }}>
                {t('auth.or')}
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            </View>

            <TouchableOpacity
              onPress={handleGoogleSignUp}
              className="mb-6 flex-row items-center justify-center rounded-2xl py-4"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
              <Ionicons name="logo-google" size={20} color={theme.textPrimary} style={{ marginRight: 10 }} />
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                {t('auth.google')}
              </Text>
            </TouchableOpacity>

            <View className="mb-8 mt-2 flex-row items-center justify-center">
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                {t('auth.alreadyHaveAccount')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-base font-bold" style={{ color: theme.purple }}>
                  {t('auth.signIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
