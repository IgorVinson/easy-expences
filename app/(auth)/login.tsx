import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { ACCOUNT_DELETION_FAREWELL_KEY } from '../../utils/accountDeletion';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { login, googleSignIn, appleSignIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFarewellModal, setShowFarewellModal] = useState(false);
  const { height, width } = useWindowDimensions();
  const isCompact = height < 780 || width < 380;
  const heroSize = isCompact ? 60 : 80;
  const heroIconSize = isCompact ? 30 : 40;
  const titleSize = isCompact ? 32 : 36;
  const subtitleSize = isCompact ? 15 : 16;
  const sectionGap = isCompact ? 12 : 16;
  const footerGap = isCompact ? 18 : 24;
  const inputVerticalPadding = isCompact ? 10 : 14;
  const actionVerticalPadding = isCompact ? 14 : 16;
  const gradientHeight = isCompact ? 180 : 250;
  const showAppleButton = Platform.OS !== 'android';

  useEffect(() => {
    if (typeof params.email === 'string' && params.email.length > 0) {
      setEmail(params.email);
    }
  }, [params.email]);

  useEffect(() => {
    let isMounted = true;

    const loadFarewellState = async () => {
      const shouldShowFarewell = await AsyncStorage.getItem(ACCOUNT_DELETION_FAREWELL_KEY);

      if (!isMounted || shouldShowFarewell !== 'true') {
        return;
      }

      await AsyncStorage.removeItem(ACCOUNT_DELETION_FAREWELL_KEY);
      setShowFarewellModal(true);
    };

    loadFarewellState().catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.fillFields'));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        t('auth.loginFailed'),
        'Auth invalid credentials. Please check your email and password and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await googleSignIn();
    } catch (error: any) {
      Alert.alert(t('auth.googleFailed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await appleSignIn();
    } catch (error: any) {
      Alert.alert(t('auth.appleFailed'), error.message);
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
            className="flex-1 justify-center px-6"
            style={{
              paddingTop: isCompact ? 12 : 24,
              paddingBottom: isCompact ? 10 : 18,
            }}>
            <View className="items-center" style={{ marginBottom: isCompact ? 16 : 24 }}>
              <View
                className="items-center justify-center rounded-3xl"
                style={{
                  height: heroSize,
                  width: heroSize,
                  backgroundColor: theme.purple,
                  shadowColor: theme.purple,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                }}>
                <Ionicons name="wallet" size={heroIconSize} color="white" />
              </View>
            </View>

            <Text
              className="text-center font-bold"
              style={{ color: theme.textPrimary, fontSize: titleSize, lineHeight: titleSize + 4 }}>
              {t('auth.welcome')}
            </Text>
            <Text
              className="mt-2 text-center"
              style={{
                color: theme.textSecondary,
                fontSize: subtitleSize,
                lineHeight: subtitleSize + 6,
                marginBottom: isCompact ? 18 : 28,
              }}>
              {t('auth.signToManage')}
            </Text>

            <View style={{ marginBottom: sectionGap }}>
              <Text
                className="mb-2 ml-1 text-sm font-medium"
                style={{ color: theme.textSecondary }}>
                {t('auth.email')}
              </Text>
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
                  style={{
                    color: theme.textPrimary,
                    paddingVertical: inputVerticalPadding,
                    paddingLeft: 12,
                  }}
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

            <View style={{ marginBottom: isCompact ? 4 : 8 }}>
              <Text
                className="mb-2 ml-1 text-sm font-medium"
                style={{ color: theme.textSecondary }}>
                {t('auth.password')}
              </Text>
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
                  style={{
                    color: theme.textPrimary,
                    paddingVertical: inputVerticalPadding,
                    paddingLeft: 12,
                  }}
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

            <View className="items-end" style={{ marginBottom: isCompact ? 16 : 24 }}>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                className="p-2">
                <Text className="text-sm font-medium" style={{ color: theme.purple }}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="overflow-hidden rounded-2xl"
              style={{ marginBottom: isCompact ? 16 : 24 }}>
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: actionVerticalPadding,
                }}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-bold text-white">{t('auth.signIn')}</Text>
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
              onPress={handleGoogleLogin}
              disabled={loading}
              className="flex-row items-center justify-center rounded-2xl"
              style={{
                marginBottom: showAppleButton ? 12 : footerGap,
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
                paddingVertical: actionVerticalPadding,
              }}>
              <Ionicons
                name="logo-google"
                size={20}
                color={theme.textPrimary}
                style={{ marginRight: 10 }}
              />
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                {t('auth.google')}
              </Text>
            </TouchableOpacity>

            {showAppleButton ? (
              <TouchableOpacity
                onPress={handleAppleLogin}
                disabled={loading}
                className="flex-row items-center justify-center rounded-2xl"
                style={{
                  marginBottom: footerGap,
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingVertical: actionVerticalPadding,
                }}>
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color={theme.textPrimary}
                  style={{ marginRight: 10 }}
                />
                <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                  {t('auth.apple')}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View className="flex-row items-center justify-center">
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                {t('auth.noAccount')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text className="text-base font-bold" style={{ color: theme.purple }}>
                  {t('auth.signUp')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent
        visible={showFarewellModal}
        onRequestClose={() => setShowFarewellModal(false)}>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View
            className="w-full rounded-3xl p-6"
            style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: isDarkMode ? 'rgba(139,92,246,0.18)' : '#EDE9FE' }}>
              <Ionicons name="heart-outline" size={26} color={theme.purple} />
            </View>

            <Text className="mt-4 text-2xl font-bold" style={{ color: theme.textPrimary }}>
              {t('profile.deleteAccountFarewellTitle')}
            </Text>
            <Text className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {t('profile.deleteAccountFarewellMessage')}
            </Text>

            <TouchableOpacity
              onPress={() => setShowFarewellModal(false)}
              className="mt-6 items-center justify-center rounded-2xl py-3"
              style={{ backgroundColor: theme.purple }}>
              <Text className="text-base font-bold text-white">{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
