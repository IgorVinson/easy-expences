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

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDarkMode, toggleTheme, themePreference, setThemePreference } = useTheme();
  const { logout, deleteAccount, user } = useAuth();
  const { currency, currencies, loading: currencyLoading, setCurrency } = useCurrency();
  const { tier, customerInfo, voiceRecordingsLeft, trialDaysLeft, presentCustomerCenter } = useSubscription();
  const entitlementInfo = customerInfo?.entitlements.active['SaySpend Premium']
    ?? customerInfo?.entitlements.active['SaySpend Pro'];
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = React.useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = React.useState(false);
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
          : error?.message ?? t('common.tryAgain');
      Alert.alert(t('common.error'), message);
    } finally {
      setDeleteAccountLoading(false);
    }
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
                  backgroundColor: (tier === 'premium' || tier === 'trial')
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
                  name={tier === 'premium' || tier === 'trial' ? 'diamond' : tier === 'basic' ? 'star-outline' : 'person-outline'}
                  size={24}
                  color={tier === 'premium' || tier === 'trial' ? '#8B5CF6' : tier === 'basic' ? '#10B981' : '#6B7280'}
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
                <Text className="text-sm font-bold text-white">{t('profile.upgradeToPremium')}</Text>
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
                  <Text className="text-base font-medium" style={{ color: '#DC2626' }}>
                    {t('profile.deleteAccount')}
                  </Text>
                  <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
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
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </View>
                <Text className="ml-4 text-base font-medium" style={{ color: '#EF4444' }}>
                  {t('profile.logout')}
                </Text>
              </View>
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

        {/* Bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>

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
            <Text className="mt-4 text-xs font-semibold uppercase tracking-widest" style={{ color: theme.textSecondary }}>
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
                  backgroundColor: !isDeletePhraseValid || deleteAccountLoading ? '#FCA5A5' : '#DC2626',
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
