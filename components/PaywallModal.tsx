import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { subscribe, restorePurchases, offerings, trialDaysLeft, tier } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [purchasing, setPurchasing] = useState(false);

  // RevenueCat packages — only premium plans are sold now.
  const premiumMonthlyPkg = offerings?.current?.availablePackages.find(
    (p) => p.identifier === 'premium_monthly'
  ) ?? offerings?.current?.monthly ?? null;
  const premiumAnnualPkg = offerings?.current?.availablePackages.find(
    (p) => p.identifier === 'premium_annual'
  ) ?? offerings?.current?.annual ?? null;

  const premiumMonthlyPrice = premiumMonthlyPkg?.product.priceString ?? '$6.99';
  const premiumAnnualPrice = premiumAnnualPkg?.product.priceString ?? '$67.10';
  // Real per-month equivalent of the annual plan (annual price ÷ 12), correctly
  // currency-formatted by RevenueCat. Kept subordinate to the billed amount per Apple 3.1.2(c).
  const premiumAnnualPerMonth =
    premiumAnnualPkg?.product.pricePerMonthString ??
    (premiumAnnualPkg
      ? new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: premiumAnnualPkg.product.currencyCode,
          maximumFractionDigits: 2,
        }).format(premiumAnnualPkg.product.price / 12)
      : '$5.59');

  const FEATURES = [
    {
      icon: 'mic' as const,
      title: t('paywall.features.voice'),
      detail: t('paywall.features.unlimited') || 'Unlim',
    },
    {
      icon: 'create-outline' as const,
      title: t('paywall.features.manualExpenses'),
      detail: '✓',
    },
    {
      icon: 'folder-outline' as const,
      title: t('paywall.features.categories'),
      detail: '✓',
    },
    {
      icon: 'analytics-outline' as const,
      title: t('paywall.features.analytics'),
      detail: '✓',
    },
    {
      icon: 'cloud-upload-outline' as const,
      title: t('paywall.features.backup'),
      detail: '✓',
    },
    {
      icon: 'download-outline' as const,
      title: t('paywall.features.export'),
      detail: '✓',
    },
  ];

  const getSelectedPkg = () => {
    return billingCycle === 'annual' ? premiumAnnualPkg : premiumMonthlyPkg;
  };

  const getSelectedPrice = () => {
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
      Alert.alert(t('paywall.welcome'), t('paywall.welcomeDetail'), [
        { text: t('paywall.awesome'), onPress: onClose },
      ]);
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
      Alert.alert(t('paywall.restored'), t('paywall.restoredDetail'));
    } catch {
      Alert.alert(t('common.error'), t('paywall.restoreError') || 'Could not restore purchases.');
    }
  };

  const headerTitle = tier === 'trial'
    ? t('paywall.trialTitle', { days: trialDaysLeft })
    : tier === 'none'
      ? t('paywall.expiredTitle')
      : t('paywall.title');

  const headerSubtitle = tier === 'trial'
    ? t('paywall.trialSubtitle')
    : tier === 'none'
      ? t('paywall.expiredSubtitle')
      : t('paywall.subtitle');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="rounded-t-3xl px-6 pb-10 pt-5"
          style={{ backgroundColor: theme.cardBg, maxHeight: '92%' }}>
          {/* Handle bar */}
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full" style={{ backgroundColor: theme.border }} />
          </View>

          {/* Header */}
          <View className="mb-1 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                {headerTitle}
              </Text>
              <Text className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
                {headerSubtitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.iconBg }}>
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Feature Comparison */}
          <View
            className="mb-5 mt-5 rounded-2xl p-4"
            style={{
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
              borderWidth: 1,
              borderColor: theme.border,
            }}>
            <Text className="mb-3 text-xs font-bold uppercase" style={{ color: theme.purple }}>
              {t('common.premium')}
            </Text>

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
                <Text className="text-xs font-semibold" style={{ color: theme.purple }}>
                  {feature.detail}
                </Text>
              </View>
            ))}
          </View>

          {/* Plan Selection */}
          <View className="mb-3" style={{ gap: 10 }}>
            <View
              className="flex-row items-center rounded-2xl p-4"
              style={{
                backgroundColor: isDarkMode ? 'rgba(139,92,246,0.12)' : '#F3E8FF',
                borderWidth: 2,
                borderColor: theme.purple,
              }}>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                    {t('paywall.plans.premium')}
                  </Text>
                  <View
                    className="ml-2 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: theme.purple }}>
                    <Text className="text-[10px] font-bold text-white">
                      {t('paywall.plans.recommended')}
                    </Text>
                  </View>
                </View>
                <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                  {billingCycle === 'annual'
                    ? t('paywall.plans.annualDetail', { monthly: premiumAnnualPerMonth, annual: premiumAnnualPrice })
                    : t('paywall.plans.monthlyDetail', { price: premiumMonthlyPrice })}
                </Text>
              </View>
              <View
                className="h-6 w-6 items-center justify-center rounded-full"
                style={{
                  borderWidth: 2,
                  borderColor: theme.purple,
                  backgroundColor: theme.purple,
                }}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Billing cycle toggle */}
          <View className="mb-5 flex-row items-center justify-center" style={{ gap: 12 }}>
            <TouchableOpacity onPress={() => setBillingCycle('monthly')}>
              <Text
                className="text-sm font-semibold"
                style={{ color: billingCycle === 'monthly' ? theme.purple : theme.textTertiary }}>
                {t('paywall.plans.monthly')}
              </Text>
            </TouchableOpacity>
            <Text style={{ color: theme.textTertiary }}>|</Text>
            <TouchableOpacity onPress={() => setBillingCycle('annual')}>
              <Text
                className="text-sm font-semibold"
                style={{ color: billingCycle === 'annual' ? theme.purple : theme.textTertiary }}>
                {t('paywall.plans.annual')} ({t('paywall.plans.savePercent', { percent: 20 })})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing}
            className="items-center justify-center rounded-2xl py-4"
            style={{
              backgroundColor: theme.purple,
              opacity: purchasing ? 0.7 : 1,
            }}>
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-white">
                {t('paywall.subscribe', {
                  tier: t('common.premium'),
                  price: getSelectedPrice(),
                })}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore + Terms */}
          <View
            className="mt-3 items-center"
            style={{ paddingBottom: Platform.OS === 'ios' ? 10 : insets.bottom }}>
            <TouchableOpacity onPress={handleRestore}>
              <Text className="text-xs" style={{ color: theme.textTertiary }}>
                {t('paywall.restore')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
