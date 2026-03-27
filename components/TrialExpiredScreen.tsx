import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASIC_VOICE_LIMIT, useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';

export const TrialExpiredScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { subscribe, restorePurchases, redeemPromoCode, offerings } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium'>('premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  const basicMonthlyPkg = offerings?.current?.availablePackages.find(
    (p) => p.identifier === 'basic_monthly'
  ) ?? null;
  const basicAnnualPkg = offerings?.current?.availablePackages.find(
    (p) => p.identifier === 'basic_annual'
  ) ?? null;
  const premiumMonthlyPkg = offerings?.current?.availablePackages.find(
    (p) => p.identifier === 'premium_monthly'
  ) ?? offerings?.current?.monthly ?? null;
  const premiumAnnualPkg = offerings?.current?.availablePackages.find(
    (p) => p.identifier === 'premium_annual'
  ) ?? offerings?.current?.annual ?? null;

  const basicMonthlyPrice = basicMonthlyPkg?.product.priceString ?? '$2.99';
  const basicAnnualPrice = basicAnnualPkg?.product.priceString ?? '$28.70';
  const premiumMonthlyPrice = premiumMonthlyPkg?.product.priceString ?? '$6.99';
  const premiumAnnualPrice = premiumAnnualPkg?.product.priceString ?? '$67.10';

  const FEATURES = [
    {
      icon: 'mic' as const,
      title: t('paywall.features.voice'),
      basic: `${BASIC_VOICE_LIMIT}/${t('common.month') || 'mo'}`,
      premium: t('paywall.features.unlimited') || 'Unlim',
    },
    {
      icon: 'create-outline' as const,
      title: t('paywall.features.manualExpenses'),
      basic: '✓',
      premium: '✓',
    },
    {
      icon: 'folder-outline' as const,
      title: t('paywall.features.categories'),
      basic: '✓',
      premium: '✓',
    },
    {
      icon: 'analytics-outline' as const,
      title: t('paywall.features.analytics'),
      basic: '—',
      premium: '✓',
    },
    {
      icon: 'cloud-upload-outline' as const,
      title: t('paywall.features.backup'),
      basic: '—',
      premium: '✓',
    },
    {
      icon: 'download-outline' as const,
      title: t('paywall.features.export'),
      basic: '—',
      premium: '✓',
    },
  ];

  const getSelectedPkg = () => {
    if (selectedTier === 'basic') {
      return billingCycle === 'annual' ? basicAnnualPkg : basicMonthlyPkg;
    }
    return billingCycle === 'annual' ? premiumAnnualPkg : premiumMonthlyPkg;
  };

  const getSelectedPrice = () => {
    if (selectedTier === 'basic') {
      return billingCycle === 'annual' ? basicAnnualPrice : basicMonthlyPrice;
    }
    return billingCycle === 'annual' ? premiumAnnualPrice : premiumMonthlyPrice;
  };

  const handlePurchase = async () => {
    const pkg = getSelectedPkg();
    if (!pkg) {
      Alert.alert(t('common.error'), t('common.tryAgain') || 'Offerings not loaded yet.');
      return;
    }
    setPurchasing(true);
    try {
      await subscribe(pkg);
    } catch (err: any) {
      Alert.alert(
        t('paywall.purchaseFailed'),
        err.message || t('common.tryAgain') || 'Please try again.'
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
    } catch {
      Alert.alert(t('common.error'), t('paywall.restoreError') || 'Could not restore purchases.');
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      await redeemPromoCode(promoCode.trim().toUpperCase());
    } catch {
      setPromoError(t('paywall.promo.invalid'));
    } finally {
      setPromoLoading(false);
    }
  };

  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 44) + 16 : 60;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding, paddingBottom: 40, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-2 items-center">
          <View
            className="mb-4 h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : '#EDE9FE' }}>
            <Ionicons name="time-outline" size={32} color="#8B5CF6" />
          </View>
          <Text className="text-2xl font-bold text-center" style={{ color: theme.textPrimary }}>
            {t('paywall.expiredTitle')}
          </Text>
          <Text className="mt-2 text-sm text-center" style={{ color: theme.textSecondary }}>
            {t('paywall.expiredSubtitle')}
          </Text>
        </View>

        {/* Feature Comparison */}
        <View
          className="mb-5 mt-5 rounded-2xl p-4"
          style={{
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
            borderWidth: 1,
            borderColor: theme.border,
          }}>
          <View
            className="mb-3 flex-row items-center border-b pb-3"
            style={{ borderBottomColor: theme.border }}>
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase" style={{ color: theme.textTertiary }}>
                {t('common.feature')}
              </Text>
            </View>
            <View className="w-16 items-center">
              <Text className="text-xs font-semibold uppercase" style={{ color: theme.textTertiary }}>
                {t('common.basic')}
              </Text>
            </View>
            <View className="w-16 items-center">
              <Text className="text-xs font-bold uppercase" style={{ color: '#8B5CF6' }}>
                {t('common.premium')}
              </Text>
            </View>
          </View>

          {FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              className={`flex-row items-center py-2.5 ${index < FEATURES.length - 1 ? 'border-b' : ''}`}
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-1 flex-row items-center">
                <Ionicons
                  name={feature.icon}
                  size={16}
                  color={theme.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <Text className="text-sm" style={{ color: theme.textPrimary }}>
                  {feature.title}
                </Text>
              </View>
              <View className="w-16 items-center">
                <Text className="text-xs" style={{ color: theme.textTertiary }}>
                  {feature.basic}
                </Text>
              </View>
              <View className="w-16 items-center">
                <Text className="text-xs font-semibold" style={{ color: '#8B5CF6' }}>
                  {feature.premium}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan Selection */}
        <View className="mb-3" style={{ gap: 10 }}>
          {/* Premium */}
          <TouchableOpacity
            onPress={() => setSelectedTier('premium')}
            className="flex-row items-center rounded-2xl p-4"
            style={{
              backgroundColor:
                selectedTier === 'premium'
                  ? isDarkMode ? 'rgba(139,92,246,0.12)' : '#F3E8FF'
                  : isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
              borderWidth: selectedTier === 'premium' ? 2 : 1,
              borderColor: selectedTier === 'premium' ? '#8B5CF6' : theme.border,
            }}>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                  {t('paywall.plans.premium')}
                </Text>
                <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: '#8B5CF6' }}>
                  <Text className="text-[10px] font-bold text-white">
                    {t('paywall.plans.recommended')}
                  </Text>
                </View>
              </View>
              <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                {billingCycle === 'annual'
                  ? t('paywall.plans.annualDetail', { monthly: premiumAnnualPrice, annual: premiumAnnualPrice })
                  : t('paywall.plans.monthlyDetail', { price: premiumMonthlyPrice })}
              </Text>
            </View>
            <View
              className="h-6 w-6 items-center justify-center rounded-full"
              style={{
                borderWidth: 2,
                borderColor: selectedTier === 'premium' ? '#8B5CF6' : theme.border,
                backgroundColor: selectedTier === 'premium' ? '#8B5CF6' : 'transparent',
              }}>
              {selectedTier === 'premium' && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>

          {/* Basic */}
          <TouchableOpacity
            onPress={() => setSelectedTier('basic')}
            className="flex-row items-center rounded-2xl p-4"
            style={{
              backgroundColor:
                selectedTier === 'basic'
                  ? isDarkMode ? 'rgba(139,92,246,0.12)' : '#F3E8FF'
                  : isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
              borderWidth: selectedTier === 'basic' ? 2 : 1,
              borderColor: selectedTier === 'basic' ? '#8B5CF6' : theme.border,
            }}>
            <View className="flex-1">
              <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                {t('paywall.plans.basic')}
              </Text>
              <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                {billingCycle === 'annual'
                  ? t('paywall.plans.annualDetail', { monthly: basicAnnualPrice, annual: basicAnnualPrice })
                  : t('paywall.plans.monthlyDetail', { price: basicMonthlyPrice })}
              </Text>
            </View>
            <View
              className="h-6 w-6 items-center justify-center rounded-full"
              style={{
                borderWidth: 2,
                borderColor: selectedTier === 'basic' ? '#8B5CF6' : theme.border,
                backgroundColor: selectedTier === 'basic' ? '#8B5CF6' : 'transparent',
              }}>
              {selectedTier === 'basic' && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Billing toggle */}
        <View className="mb-5 flex-row items-center justify-center" style={{ gap: 12 }}>
          <TouchableOpacity onPress={() => setBillingCycle('monthly')}>
            <Text
              className="text-sm font-semibold"
              style={{ color: billingCycle === 'monthly' ? '#8B5CF6' : theme.textTertiary }}>
              {t('paywall.plans.monthly')}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: theme.textTertiary }}>|</Text>
          <TouchableOpacity onPress={() => setBillingCycle('annual')}>
            <Text
              className="text-sm font-semibold"
              style={{ color: billingCycle === 'annual' ? '#8B5CF6' : theme.textTertiary }}>
              {t('paywall.plans.annual')} ({t('paywall.plans.savePercent', { percent: 20 })})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subscribe */}
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={purchasing}
          className="items-center justify-center rounded-2xl py-4"
          style={{ backgroundColor: '#8B5CF6', opacity: purchasing ? 0.7 : 1 }}>
          {purchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-white">
              {t('paywall.subscribe', {
                tier: selectedTier === 'premium' ? t('common.premium') : t('common.basic'),
                price: getSelectedPrice(),
              })}
            </Text>
          )}
        </TouchableOpacity>

        {/* Promo */}
        <TouchableOpacity
          onPress={() => setShowPromo(!showPromo)}
          className="mt-4 flex-row items-center justify-center">
          <Text className="text-xs" style={{ color: theme.textTertiary }}>
            {t('paywall.promo.haveCode')}
          </Text>
          <Ionicons
            name={showPromo ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={theme.textTertiary}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {showPromo && (
          <View className="mt-2 flex-row items-center" style={{ gap: 8 }}>
            <TextInput
              placeholder={t('paywall.promo.placeholder')}
              placeholderTextColor={theme.textTertiary}
              value={promoCode}
              onChangeText={(text) => { setPromoCode(text); setPromoError(''); }}
              autoCapitalize="characters"
              className="flex-1 rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                color: theme.textPrimary,
                borderWidth: promoError ? 1 : 0,
                borderColor: '#EF4444',
              }}
            />
            <TouchableOpacity
              onPress={handleRedeemPromo}
              disabled={promoLoading}
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: '#8B5CF6' }}>
              {promoLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-white">{t('paywall.promo.redeem')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {promoError ? (
          <Text className="mt-1 text-center text-xs" style={{ color: '#EF4444' }}>
            {promoError}
          </Text>
        ) : null}

        {/* Restore */}
        <View className="mt-4 items-center">
          <TouchableOpacity onPress={handleRestore}>
            <Text className="text-xs" style={{ color: theme.textTertiary }}>
              {t('paywall.restore')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
