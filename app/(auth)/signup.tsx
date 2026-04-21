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
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { height, width } = useWindowDimensions();
  const isCompact = height < 780 || width < 380;
  const titleSize = isCompact ? 30 : 36;
  const subtitleSize = isCompact ? 15 : 16;
  const sectionGap = isCompact ? 10 : 16;
  const inputVerticalPadding = isCompact ? 10 : 14;
  const actionVerticalPadding = isCompact ? 14 : 16;
  const gradientHeight = isCompact ? 180 : 250;
  const backButtonSize = isCompact ? 20 : 24;

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
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <LinearGradient
            colors={isDarkMode ? ['#4C1D95', theme.bg] : ['#EDE9FE', theme.bg]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: gradientHeight }}
          />

          <View
            className="flex-row items-center px-6"
            style={{ paddingTop: isCompact ? 8 : 16, paddingBottom: isCompact ? 4 : 8 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              className="-ml-2 rounded-full p-2"
              style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
              <Ionicons name="arrow-back" size={backButtonSize} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View
            className="flex-1 px-6"
            style={{ paddingTop: isCompact ? 4 : 12, paddingBottom: isCompact ? 8 : 16 }}>
            <Text
              className="font-bold"
              style={{ color: theme.textPrimary, fontSize: titleSize, lineHeight: titleSize + 4 }}>
              {t('auth.createAccount')}
            </Text>
            <Text
              className="mt-2"
              style={{
                color: theme.textSecondary,
                fontSize: subtitleSize,
                lineHeight: subtitleSize + 6,
                marginBottom: isCompact ? 16 : 28,
              }}>
              {t('auth.startJourney')}
            </Text>

            <View style={{ marginBottom: sectionGap }}>
              <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.fullName')}</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="person-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 pl-3 text-base"
                  style={{ color: theme.textPrimary, paddingVertical: inputVerticalPadding }}
                  placeholder="John Doe"
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={{ marginBottom: sectionGap }}>
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.email')}</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="mail-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 pl-3 text-base"
                  style={{ color: theme.textPrimary, paddingVertical: inputVerticalPadding }}
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

            <View style={{ marginBottom: sectionGap }}>
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.password')}</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 pl-3 text-base"
                  style={{ color: theme.textPrimary, paddingVertical: inputVerticalPadding }}
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

             <View style={{ marginBottom: isCompact ? 16 : 24 }}>
               <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.confirmPassword')}</Text>
              <View
                className="flex-row items-center rounded-2xl px-4 py-1"
                style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  className="flex-1 pl-3 text-base"
                  style={{ color: theme.textPrimary, paddingVertical: inputVerticalPadding }}
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
              className="overflow-hidden rounded-2xl"
              style={{ marginBottom: isCompact ? 16 : 24 }}>
               <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: actionVerticalPadding }}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                <Text className="text-lg font-bold text-white">{t('auth.signUp')}</Text>
              )}
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row items-center" style={{ marginBottom: isCompact ? 16 : 24 }}>
              <View className="h-px flex-1" style={{ backgroundColor: theme.border }} />
              <Text className="px-4 text-sm font-medium" style={{ color: theme.textSecondary }}>
                {t('auth.or')}
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: theme.border }} />
            </View>

            <TouchableOpacity
              onPress={handleGoogleSignUp}
              className="flex-row items-center justify-center rounded-2xl"
              style={{
                marginBottom: isCompact ? 20 : 28,
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
                paddingVertical: actionVerticalPadding,
              }}>
              <Ionicons name="logo-google" size={20} color={theme.textPrimary} style={{ marginRight: 10 }} />
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                {t('auth.google')}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-center">
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
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
