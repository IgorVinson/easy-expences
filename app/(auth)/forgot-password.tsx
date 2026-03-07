import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
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
    View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { auth } from '../../firebaseConfig';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.email') || 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSuccess(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
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
              {t('auth.resetPassword')}
            </Text>
            <Text
                className="mb-10 mt-2 text-base"
                style={{ color: theme.textSecondary }}>
                {t('auth.resetInstructions')}
            </Text>

            {isSuccess ? (
               <View className="items-center justify-center py-10">
                 <View className="mb-6 h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: isDarkMode ? 'rgba(16,185,129,0.2)' : '#D1FAE5' }}>
                    <Ionicons name="mail-open" size={48} color="#10B981" />
                 </View>
                 <Text className="mb-2 text-center text-2xl font-bold" style={{ color: theme.textPrimary }}>{t('auth.checkEmail')}</Text>
                 <Text className="mb-8 text-center text-base" style={{ color: theme.textSecondary }}>{t('auth.resetEmailSent')}</Text>
                 <TouchableOpacity
                    onPress={() => router.replace('/(auth)/login')}
                    className="w-full overflow-hidden rounded-2xl">
                    <LinearGradient
                      colors={['#8B5CF6', '#6D28D9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="items-center justify-center py-4"
                    >
                      <Text className="text-lg font-bold text-white">{t('auth.backToLogin')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
               </View>
            ) : (
              <>
              <View className="mb-8">
                 <Text className="mb-2 ml-1 text-sm font-medium" style={{ color: theme.textSecondary }}>{t('auth.email')}</Text>
                <View
                  className="flex-row items-center rounded-2xl px-4 py-1"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}>
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

              <TouchableOpacity
                onPress={handleResetPassword}
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
                  <Text className="text-lg font-bold text-white">{t('auth.sendInstructions')}</Text>
                )}
                </LinearGradient>
              </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
