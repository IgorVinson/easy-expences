import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PaywallModal } from '../../components/PaywallModal';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { BASIC_VOICE_LIMIT, useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';
import { LEGACY_ONBOARDING_KEY, getOnboardingStorageKey } from '../../utils/onboarding';

type PolicyItem = {
  title: string;
  body?: string[];
  bullets?: string[];
  links?: Array<{ label: string; url: string }>;
};

const POLICY_EFFECTIVE_DATE = 'March 21, 2026';

const PRIVACY_POLICY_SECTIONS: PolicyItem[] = [
  {
    title: '1. Who we are',
    body: [
      'Keelio ("we", "us", "our") is a personal expense tracking app available on Android and iOS. This policy explains what data we collect, how we use it, and your rights over that data.',
    ],
    links: [{ label: 'igorvinson@gmail.com', url: 'mailto:igorvinson@gmail.com' }],
  },
  {
    title: '2. Data we collect',
    body: [
      'Account data: when you sign in, we receive your email address, display name, profile photo URL if available, and a unique user ID from Google Sign-In and Firebase Authentication.',
      'Expense data: the information you enter or record, including expense title, amount, category, date, and any budget limits you set per category.',
      "Voice recordings: when you use the voice feature, your audio is recorded on-device and sent to Google's Gemini API for transcription and parsing. We do not store the raw audio after processing. The parsed result may be stored as your expense data.",
      'Usage data: Firebase Analytics may collect anonymous app usage events, such as which screens you visit and whether a purchase was completed. This data is used in aggregated form and not for advertising.',
      'We do not sell your data, serve ads, or share your data with data brokers.',
    ],
  },
  {
    title: '3. How we use your data',
    bullets: [
      'To create and manage your account',
      'To store and display your expense history and budgets',
      'To process voice recordings into structured expense entries',
      'To enforce free tier limits and subscription status',
      'To detect abuse and protect service integrity',
      'To improve the app through aggregated analytics',
    ],
  },
  {
    title: '4. Third-party services',
    body: ['Keelio uses the following third-party services, each with their own privacy terms:'],
    links: [
      {
        label: 'Google Firebase (Auth, Firestore, Analytics, Cloud Functions)',
        url: 'https://firebase.google.com/support/privacy',
      },
      {
        label: 'Google Gemini API',
        url: 'https://ai.google.dev/gemini-api/terms',
      },
      {
        label: 'RevenueCat',
        url: 'https://www.revenuecat.com/privacy',
      },
    ],
  },
  {
    title: '5. Data storage and security',
    body: [
      'Your account and expense data is stored in Google Firestore in the United States. Firebase applies encryption in transit and at rest.',
      'We restrict database access with authentication and security rules so only your account can access your data.',
      'Voice audio is transmitted over HTTPS and is not retained by us after processing.',
    ],
  },
  {
    title: '6. Data retention',
    body: [
      'We retain your account and expense data for as long as your account is active.',
      'If you delete your account, your data is deleted from Firestore within 30 days, except where a shorter or longer retention period is required by law.',
      'Aggregated and anonymized analytics data may be retained longer.',
    ],
  },
  {
    title: '7. Your rights',
    bullets: [
      'Access: request a copy of your data',
      'Correction: update or correct inaccurate data',
      'Deletion: request deletion of your account and associated data',
      'Portability: request your expense data in a structured format',
      'Objection: opt out of analytics data collection where available',
    ],
    body: ['To exercise these rights, contact us at:'],
    links: [{ label: 'igorvinson@gmail.com', url: 'mailto:igorvinson@gmail.com' }],
  },
  {
    title: '8. Children',
    body: [
      'Keelio is not directed to children under 13, or under 16 where local law requires a higher age threshold. We do not knowingly collect personal information from children.',
      'If you believe a child has provided personal data, contact us and we will review and delete it where appropriate.',
    ],
  },
  {
    title: '9. International users',
    body: [
      'If you are located in the European Economic Area, the United Kingdom, or Switzerland, you may have rights under GDPR or similar laws.',
    ],
    bullets: [
      'Contract: to provide the service you signed up for',
      'Legitimate interests: to maintain security and improve the app',
      'Consent: for optional analytics where applicable',
    ],
  },
  {
    title: '10. Changes to this policy',
    body: [
      'We may update this policy as the app evolves. For material changes, we may notify you by in-app notice or email.',
      'Continued use of the app after an updated policy takes effect means you accept the revised policy to the extent permitted by law.',
    ],
  },
  {
    title: '11. Contact',
    body: ['Questions or concerns about privacy or terms can be sent to:'],
    links: [{ label: 'igorvinson@gmail.com', url: 'mailto:igorvinson@gmail.com' }],
  },
];

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDarkMode, toggleTheme, themePreference, setThemePreference } = useTheme();
  const { logout, deleteAccount, user } = useAuth();
  const { currency, currencies, loading: currencyLoading, setCurrency } = useCurrency();
  const { tier, customerInfo, voiceRecordingsLeft, trialDaysLeft, presentCustomerCenter } =
    useSubscription();
  const entitlementInfo =
    customerInfo?.entitlements.active['SaySpend Premium'] ??
    customerInfo?.entitlements.active['SaySpend Pro'];
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = React.useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = React.useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = React.useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = React.useState(false);
  const [supportMessage, setSupportMessage] = React.useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = React.useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = React.useState(false);
  const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
  const isDeletePhraseValid = deleteConfirmationText === 'DELETE';

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (error: any) {
        Alert.alert(t('common.error'), error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('profile.logoutConfirm'))) {
        doLogout();
      }
    } else {
      Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.logout'), style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const handleChangeLanguage = () => {
    Alert.alert(t('profile.language'), '', [
      { text: t('profile.english'), onPress: () => i18n.changeLanguage('en') },
      { text: t('profile.ukrainian'), onPress: () => i18n.changeLanguage('ua') },
      { text: t('profile.spanish'), onPress: () => i18n.changeLanguage('es') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleChangeCurrency = () => {
    setIsCurrencyModalOpen(true);
  };

  const handleSelectCurrency = async (nextCurrency: (typeof currencies)[number]['code']) => {
    try {
      await setCurrency(nextCurrency);
      setIsCurrencyModalOpen(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('common.tryAgain'));
    }
  };

  const handleSendSupport = async () => {
    const message = supportMessage.trim();
    if (!message) {
      Alert.alert(t('profile.messageRequired'), t('profile.enterMessage'));
      return;
    }
    if (!supportEmail) {
      Alert.alert(t('profile.supportEmailMissing'), t('profile.supportEmailError'));
      return;
    }

    const subject = encodeURIComponent('Easy Expenses Support');
    const body = encodeURIComponent(message);
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (!canOpen) {
      Alert.alert(t('profile.unableToSend'), t('profile.noEmailClient'));
      return;
    }

    await Linking.openURL(mailtoUrl);
    setSupportMessage('');
    setIsSupportModalOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!isDeletePhraseValid) {
      Alert.alert(t('profile.deleteAccountTitle'), t('profile.deleteAccountTypedRequired'));
      return;
    }

    setDeleteAccountLoading(true);

    try {
      await deleteAccount();
      setIsDeleteAccountModalOpen(false);
      setDeleteConfirmationText('');
    } catch (error: any) {
      const errorCode = error?.code as string | undefined;
      const message =
        errorCode === 'auth/requires-recent-login'
          ? t('profile.deleteAccountReauthRequired')
          : (error?.message ?? t('common.tryAgain'));
      Alert.alert(t('common.error'), message);
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const handleOpenExternalLink = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(t('common.error'), t('common.tryAgain'));
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Theme Toggle */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            {t('profile.title')}
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info Card */}
        <View className="mb-6 px-6">
          <View
            style={[
              styles.expenseItem,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                marginBottom: 0,
              },
              !isDarkMode && styles.expenseItemShadow,
            ]}>
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 56,
                height: 56,
                backgroundColor: isDarkMode ? 'rgba(139,92,246,0.25)' : '#EDE9FE',
              }}>
              <Text className="text-xl font-bold" style={{ color: theme.purple }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                {user?.displayName || 'User'}
              </Text>
              <Text className="mt-0.5 text-sm" style={{ color: theme.textSecondary }}>
                {user?.email || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* My Plan Section */}
        <View className="mb-6 px-6">
          <Text className="mb-4 text-xl font-bold" style={{ color: theme.textPrimary }}>
            {t('profile.myPlan')}
          </Text>
          <View
            className="rounded-2xl p-4"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <View className="mb-4 flex-row items-center">
              <View
                className="h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor:
                    tier === 'premium' || tier === 'trial'
                      ? isDarkMode
                        ? 'rgba(139,92,246,0.15)'
                        : '#EDE9FE'
                      : tier === 'basic'
                        ? isDarkMode
                          ? 'rgba(16,185,129,0.15)'
                          : '#D1FAE5'
                        : isDarkMode
                          ? 'rgba(107,114,128,0.15)'
                          : '#F3F4F6',
                }}>
                <Ionicons
                  name={
                    tier === 'premium' || tier === 'trial'
                      ? 'diamond'
                      : tier === 'basic'
                        ? 'star-outline'
                        : 'person-outline'
                  }
                  size={24}
                  color={
                    tier === 'premium' || tier === 'trial'
                      ? '#8B5CF6'
                      : tier === 'basic'
                        ? '#10B981'
                        : '#6B7280'
                  }
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                  {tier === 'trial'
                    ? t('profile.trialPlan', { days: trialDaysLeft })
                    : tier === 'premium'
                      ? t('profile.premiumPlan', {
                          name: entitlementInfo?.productIdentifier?.includes('annual')
                            ? t('paywall.plans.annual')
                            : t('paywall.plans.monthly'),
                        })
                      : tier === 'basic'
                        ? t('profile.basicPlan', {
                            name: entitlementInfo?.productIdentifier?.includes('annual')
                              ? t('paywall.plans.annual')
                              : t('paywall.plans.monthly'),
                          })
                        : t('profile.noPlan')}
                </Text>
                {tier === 'premium' && entitlementInfo?.expirationDate ? (
                  <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                    {t('profile.renewsOn', {
                      date: new Date(entitlementInfo.expirationDate).toLocaleDateString(
                        i18n.language === 'en'
                          ? 'en-US'
                          : i18n.language === 'ua'
                            ? 'uk-UA'
                            : 'es-ES',
                        {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      ),
                    })}
                  </Text>
                ) : tier === 'basic' ? (
                  <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                    {t('profile.recordingsLeft', {
                      count: voiceRecordingsLeft,
                      total: BASIC_VOICE_LIMIT,
                    })}
                  </Text>
                ) : tier === 'trial' ? (
                  <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                    {t('profile.unlimitedVoice')}
                  </Text>
                ) : null}
              </View>
            </View>

            {tier === 'premium' ? (
              <TouchableOpacity
                onPress={presentCustomerCenter}
                className="w-full items-center justify-center rounded-xl py-3"
                style={{
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                }}>
                <Text className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                  {t('profile.manageSubscription')}
                </Text>
              </TouchableOpacity>
            ) : tier === 'basic' ? (
              <TouchableOpacity
                onPress={() => setIsPaywallOpen(true)}
                className="w-full items-center justify-center rounded-xl py-3"
                style={{ backgroundColor: theme.purple }}>
                <Text className="text-sm font-bold text-white">
                  {t('profile.upgradeToPremium')}
                </Text>
              </TouchableOpacity>
            ) : tier === 'trial' ? (
              <TouchableOpacity
                onPress={() => setIsPaywallOpen(true)}
                className="w-full items-center justify-center rounded-xl py-3"
                style={{ backgroundColor: theme.purple }}>
                <Text className="text-sm font-bold text-white">{t('profile.choosePlan')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setIsPaywallOpen(true)}
                className="w-full items-center justify-center rounded-xl py-3"
                style={{ backgroundColor: theme.purple }}>
                <Text className="text-sm font-bold text-white">{t('profile.subscribe')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings Group */}
        <View className="mb-8 px-6">
          <Text className="mb-4 text-xl font-bold" style={{ color: theme.textPrimary }}>
            {t('profile.settings')}
          </Text>
          <View
            className="overflow-hidden rounded-2xl p-4"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            {/* Theme Preference */}
            <View
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(14,165,233,0.15)' : '#E0F2FE' }}>
                  <Ionicons name="color-palette-outline" size={20} color="#0EA5E9" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  {t('profile.theme')}
                </Text>
              </View>
              <View className="flex-row items-center">
                {(['auto', 'dark', 'light'] as const).map((option) => {
                  const isSelected = themePreference === option;
                  const iconName =
                    option === 'auto'
                      ? 'phone-portrait-outline'
                      : option === 'dark'
                        ? 'moon'
                        : 'sunny';
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setThemePreference(option)}
                      className="ml-2 h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isSelected
                          ? theme.purple
                          : isDarkMode
                            ? 'rgba(255,255,255,0.06)'
                            : '#F1F5F9',
                      }}>
                      <Ionicons
                        name={iconName}
                        size={16}
                        color={isSelected ? '#FFFFFF' : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Language Switcher */}
            <TouchableOpacity
              onPress={handleChangeLanguage}
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#D1FAE5' }}>
                  <Ionicons name="language-outline" size={20} color="#10B981" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  {t('profile.language')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-sm font-medium" style={{ color: theme.textSecondary }}>
                  {i18n.language.toUpperCase()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleChangeCurrency}
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : '#EDE9FE' }}>
                  <Ionicons name="cash-outline" size={20} color={theme.purple} />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  {t('profile.currency')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-sm font-medium" style={{ color: theme.textSecondary }}>
                  {currencyLoading ? '...' : currency}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>

            {/* Help & Support */}
            <TouchableOpacity
              onPress={() => setIsSupportModalOpen(true)}
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FFFBEB' }}>
                  <Ionicons name="help-circle-outline" size={20} color="#F59E0B" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  {t('profile.helpSupport')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              onPress={() => setIsDeleteAccountModalOpen(true)}
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(220,38,38,0.16)' : '#FEE2E2' }}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </View>
                <View className="ml-4">
                  <Text className="text-base font-medium" style={{ color: theme.textPrimary }}>
                    {t('profile.deleteAccount')}
                  </Text>
                  <Text className="mt-0.5 text-xs" style={{ color: theme.textPrimary }}>
                    {t('profile.deleteAccountHint')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#FEF2F2' }}>
                  <Ionicons name="log-out-outline" size={20} color={theme.textPrimary} />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                  {t('profile.logout')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsPrivacyModalOpen(true)}
              className="items-center border-t pt-4"
              style={{ borderTopColor: theme.border }}
              accessibilityRole="button"
              accessibilityLabel="Terms and Privacy Policy">
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                Terms & Privacy Policy
              </Text>
            </TouchableOpacity>

            {/* Reset Onboarding (dev only) */}
            {__DEV__ && (
              <TouchableOpacity
                onPress={async () => {
                  if (user) {
                    await AsyncStorage.removeItem(getOnboardingStorageKey(user.uid));
                  }
                  await AsyncStorage.removeItem(LEGACY_ONBOARDING_KEY);
                  Alert.alert('Onboarding Reset', 'Restart the app to see onboarding again.');
                }}
                className="flex-row items-center justify-between py-4">
                <View className="flex-row items-center">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isDarkMode ? 'rgba(168,85,247,0.15)' : '#F3E8FF' }}>
                    <Ionicons name="refresh-outline" size={20} color="#A855F7" />
                  </View>
                  <Text className="ml-4 text-base font-medium" style={{ color: '#A855F7' }}>
                    Reset Onboarding
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isPrivacyModalOpen}
        onRequestClose={() => setIsPrivacyModalOpen(false)}>
        <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View
            className="mt-16 flex-1 rounded-t-3xl px-6 pb-8 pt-6"
            style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
            <View className="flex-row items-start justify-between">
              <View className="mr-4 flex-1">
                <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                  Terms & Privacy Policy
                </Text>
                <Text className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
                  Keelio · Effective date: {POLICY_EFFECTIVE_DATE} · Last updated:{' '}
                  {POLICY_EFFECTIVE_DATE}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPrivacyModalOpen(false)}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-5 flex-1" showsVerticalScrollIndicator={false}>
              {PRIVACY_POLICY_SECTIONS.map((section) => (
                <View key={section.title} className="mb-5">
                  <Text className="text-sm font-bold" style={{ color: theme.textPrimary }}>
                    {section.title}
                  </Text>

                  {section.body?.map((paragraph) => (
                    <Text
                      key={paragraph}
                      className="mt-2 text-sm leading-6"
                      style={{ color: theme.textSecondary }}>
                      {paragraph}
                    </Text>
                  ))}

                  {section.bullets?.map((bullet) => (
                    <Text
                      key={bullet}
                      className="mt-2 text-sm leading-6"
                      style={{ color: theme.textSecondary }}>
                      • {bullet}
                    </Text>
                  ))}

                  {section.links?.map((link) => (
                    <TouchableOpacity
                      key={link.url}
                      onPress={() => handleOpenExternalLink(link.url)}
                      className="mt-2">
                      <Text className="text-sm leading-6" style={{ color: theme.purple }}>
                        {link.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isCurrencyModalOpen}
        onRequestClose={() => setIsCurrencyModalOpen(false)}>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('profile.currency')}
            </Text>

            <View className="mt-4" style={{ gap: 10 }}>
              {currencies.map((option) => {
                const isSelected = option.code === currency;
                return (
                  <TouchableOpacity
                    key={option.code}
                    onPress={() => handleSelectCurrency(option.code)}
                    className="flex-row items-center justify-between rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? 'rgba(139,92,246,0.15)'
                          : '#F3E8FF'
                        : theme.bg,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.purple : theme.border,
                    }}>
                    <View>
                      <Text
                        className="text-base font-semibold"
                        style={{ color: theme.textPrimary }}>
                        {option.code}
                      </Text>
                      <Text className="mt-0.5 text-sm" style={{ color: theme.textSecondary }}>
                        {option.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.purple} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-4 flex-row items-center justify-end">
              <TouchableOpacity
                onPress={() => setIsCurrencyModalOpen(false)}
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                <Text className="text-sm font-semibold" style={{ color: theme.textSecondary }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isSupportModalOpen}
        onRequestClose={() => setIsSupportModalOpen(false)}>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('profile.helpSupport')}
            </Text>
            <Text className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {t('profile.supportHelpText')}
            </Text>

            <TextInput
              value={supportMessage}
              onChangeText={setSupportMessage}
              placeholder={t('profile.describeIssue')}
              placeholderTextColor={theme.textTertiary}
              multiline
              className="mt-4 h-28 rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
            />

            <View className="mt-4 flex-row items-center justify-end">
              <TouchableOpacity
                onPress={() => setIsSupportModalOpen(false)}
                className="mr-3 rounded-full px-4 py-2"
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                <Text className="text-sm font-semibold" style={{ color: theme.textSecondary }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendSupport}
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: theme.purple }}>
                <Text className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                  {t('profile.send')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isDeleteAccountModalOpen}
        onRequestClose={() => {
          if (!deleteAccountLoading) {
            setIsDeleteAccountModalOpen(false);
            setDeleteConfirmationText('');
          }
        }}>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View
            className="w-full rounded-2xl p-6"
            style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: isDarkMode ? 'rgba(220,38,38,0.16)' : '#FEE2E2' }}>
              <Ionicons name="warning-outline" size={24} color="#DC2626" />
            </View>

            <Text className="mt-4 text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('profile.deleteAccountTitle')}
            </Text>
            <Text className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {t('profile.deleteAccountDescription')}
            </Text>
            <Text
              className="mt-4 text-xs font-semibold uppercase tracking-widest"
              style={{ color: theme.textSecondary }}>
              {t('profile.deleteAccountTypeLabel')}
            </Text>

            <TextInput
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              placeholder={t('profile.deleteAccountPlaceholder')}
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deleteAccountLoading}
              className="mt-3 rounded-xl px-4 py-3 text-base"
              style={{
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: isDeletePhraseValid ? '#DC2626' : theme.border,
                color: theme.textPrimary,
              }}
            />

            <Text className="mt-3 text-xs" style={{ color: theme.textSecondary }}>
              {t('profile.deleteAccountInstruction')}
            </Text>

            <View className="mt-5 flex-row items-center justify-end">
              <TouchableOpacity
                onPress={() => {
                  setIsDeleteAccountModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                disabled={deleteAccountLoading}
                className="mr-3 rounded-full px-4 py-2"
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }}>
                <Text className="text-sm font-semibold" style={{ color: theme.textSecondary }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={!isDeletePhraseValid || deleteAccountLoading}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor:
                    !isDeletePhraseValid || deleteAccountLoading ? '#FCA5A5' : '#DC2626',
                }}>
                {deleteAccountLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                    {t('profile.deleteAccountConfirm')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PaywallModal visible={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />
    </View>
  );
}
