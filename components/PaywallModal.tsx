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
import { formatCurrencyAmount } from '../config/currencies';
import { FREE_VOICE_LIMIT, PLANS, useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { subscribe, restorePurchases } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'pro_monthly' | 'pro_annual'>('pro_annual');
  const [purchasing, setPurchasing] = useState(false);

  const FEATURES = [
    {
      icon: 'mic' as const,
      title: t('paywall.features.voice'),
      free: `${FREE_VOICE_LIMIT}/${t('common.month') || 'mo'}`,
      pro: t('paywall.features.unlimited') || 'Unlim',
    },
    {
      icon: 'analytics-outline' as const,
      title: t('paywall.features.analytics'),
      free: t('common.basic') || 'Basic',
      pro: t('common.full') || 'Full',
    },
    {
      icon: 'cloud-upload-outline' as const,
      title: t('paywall.features.backup'),
      free: '—',
      pro: '✓',
    },
    {
      icon: 'download-outline' as const,
      title: t('paywall.features.export'),
      free: '—',
      pro: '✓',
    },
  ];

  const monthlyPrice = PLANS.pro_monthly.price;
  const annualPrice = PLANS.pro_annual.price;
  const annualMonthly = formatCurrencyAmount(annualPrice / 12, 'USD', i18n.language);
  const annualPriceLabel = formatCurrencyAmount(annualPrice, 'USD', i18n.language);
  const monthlyPriceLabel = formatCurrencyAmount(monthlyPrice, 'USD', i18n.language);
  const savingsPercent = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await subscribe(selectedPlan);
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
            <View>
              <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                {t('paywall.title')}
              </Text>
              <Text className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
                {t('paywall.subtitle')}
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
            {/* Header row */}
            <View
              className="mb-3 flex-row items-center border-b pb-3"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-1">
                <Text
                  className="text-xs font-semibold uppercase"
                  style={{ color: theme.textTertiary }}>
                  {t('common.feature')}
                </Text>
              </View>
              <View className="w-16 items-center">
                <Text
                  className="text-xs font-semibold uppercase"
                  style={{ color: theme.textTertiary }}>
                  {t('common.free')}
                </Text>
              </View>
              <View className="w-16 items-center">
                <Text className="text-xs font-bold uppercase" style={{ color: '#8B5CF6' }}>
                  {t('common.pro')}
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
                    {feature.free}
                  </Text>
                </View>
                <View className="w-16 items-center">
                  <Text className="text-xs font-semibold" style={{ color: '#8B5CF6' }}>
                    {feature.pro}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Plan Selection */}
          <View className="mb-5" style={{ gap: 10 }}>
            {/* Annual Plan */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('pro_annual')}
              className="flex-row items-center rounded-2xl p-4"
              style={{
                backgroundColor:
                  selectedPlan === 'pro_annual'
                    ? isDarkMode
                      ? 'rgba(139,92,246,0.12)'
                      : '#F3E8FF'
                    : isDarkMode
                      ? 'rgba(255,255,255,0.03)'
                      : '#F8FAFC',
                borderWidth: selectedPlan === 'pro_annual' ? 2 : 1,
                borderColor: selectedPlan === 'pro_annual' ? '#8B5CF6' : theme.border,
              }}>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                    {t('paywall.plans.annual')}
                  </Text>
                  <View
                    className="ml-2 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: '#8B5CF6' }}>
                    <Text className="text-[10px] font-bold text-white">
                      {t('paywall.plans.savePercent', { percent: savingsPercent })}
                    </Text>
                  </View>
                </View>
                <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                  {t('paywall.plans.annualDetail', {
                    monthly: annualMonthly,
                    annual: annualPriceLabel,
                  })}
                </Text>
              </View>
              <View
                className="h-6 w-6 items-center justify-center rounded-full"
                style={{
                  borderWidth: 2,
                  borderColor: selectedPlan === 'pro_annual' ? '#8B5CF6' : theme.border,
                  backgroundColor: selectedPlan === 'pro_annual' ? '#8B5CF6' : 'transparent',
                }}>
                {selectedPlan === 'pro_annual' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('pro_monthly')}
              className="flex-row items-center rounded-2xl p-4"
              style={{
                backgroundColor:
                  selectedPlan === 'pro_monthly'
                    ? isDarkMode
                      ? 'rgba(139,92,246,0.12)'
                      : '#F3E8FF'
                    : isDarkMode
                      ? 'rgba(255,255,255,0.03)'
                      : '#F8FAFC',
                borderWidth: selectedPlan === 'pro_monthly' ? 2 : 1,
                borderColor: selectedPlan === 'pro_monthly' ? '#8B5CF6' : theme.border,
              }}>
              <View className="flex-1">
                <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                  {t('paywall.plans.monthly')}
                </Text>
                <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                  {t('paywall.plans.monthlyDetail', { price: monthlyPriceLabel })}
                </Text>
              </View>
              <View
                className="h-6 w-6 items-center justify-center rounded-full"
                style={{
                  borderWidth: 2,
                  borderColor: selectedPlan === 'pro_monthly' ? '#8B5CF6' : theme.border,
                  backgroundColor: selectedPlan === 'pro_monthly' ? '#8B5CF6' : 'transparent',
                }}>
                {selectedPlan === 'pro_monthly' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing}
            className="items-center justify-center rounded-2xl py-4"
            style={{
              backgroundColor: '#8B5CF6',
              opacity: purchasing ? 0.7 : 1,
            }}>
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-white">
                {t('paywall.subscribe', {
                  price: selectedPlan === 'pro_annual' ? annualPriceLabel : monthlyPriceLabel,
                })}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore + Terms */}
          <View
            className="mt-3 items-center"
            style={{ paddingBottom: Platform.OS === 'ios' ? 10 : 0 }}>
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
