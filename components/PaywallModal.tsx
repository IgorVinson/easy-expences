import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription, PLANS, FREE_VOICE_LIMIT } from '../contexts/SubscriptionContext';
import type { PlanType } from '../contexts/SubscriptionContext';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  {
    icon: 'mic' as const,
    title: 'Unlimited Voice Recording',
    free: `${FREE_VOICE_LIMIT}/month`,
    pro: 'Unlimited',
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Advanced Analytics',
    free: 'Basic',
    pro: 'Full',
  },
  {
    icon: 'cloud-upload-outline' as const,
    title: 'Cloud Backup',
    free: '—',
    pro: '✓',
  },
  {
    icon: 'download-outline' as const,
    title: 'Export Reports',
    free: '—',
    pro: '✓',
  },
];

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const { theme, isDarkMode } = useTheme();
  const { subscribe, restorePurchases } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'pro_monthly' | 'pro_annual'>('pro_annual');
  const [purchasing, setPurchasing] = useState(false);

  const monthlyPrice = PLANS.pro_monthly.price;
  const annualPrice = PLANS.pro_annual.price;
  const annualMonthly = (annualPrice / 12).toFixed(2);
  const savingsPercent = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await subscribe(selectedPlan);
      Alert.alert('Welcome to Pro! 🎉', 'You now have unlimited access to all features.', [
        { text: 'Awesome!', onPress: onClose },
      ]);
    } catch (err: any) {
      Alert.alert('Purchase Failed', err.message || 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Restored', 'Your purchases have been checked.');
    } catch {
      Alert.alert('Error', 'Could not restore purchases.');
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
            <View
              className="h-1 w-10 rounded-full"
              style={{ backgroundColor: theme.border }}
            />
          </View>

          {/* Header */}
          <View className="mb-1 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                Upgrade to Pro
              </Text>
              <Text className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
                Unlock unlimited voice & more
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
            <View className="mb-3 flex-row items-center border-b pb-3" style={{ borderBottomColor: theme.border }}>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase" style={{ color: theme.textTertiary }}>
                  Feature
                </Text>
              </View>
              <View className="w-16 items-center">
                <Text className="text-xs font-semibold uppercase" style={{ color: theme.textTertiary }}>
                  Free
                </Text>
              </View>
              <View className="w-16 items-center">
                <Text className="text-xs font-bold uppercase" style={{ color: '#8B5CF6' }}>
                  Pro
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
                    Annual
                  </Text>
                  <View
                    className="ml-2 rounded-full px-2 py-0.5"
                    style={{ backgroundColor: '#8B5CF6' }}>
                    <Text className="text-[10px] font-bold text-white">
                      SAVE {savingsPercent}%
                    </Text>
                  </View>
                </View>
                <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                  ${annualMonthly}/mo · Billed ${annualPrice.toFixed(2)}/year
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
                  Monthly
                </Text>
                <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                  ${monthlyPrice.toFixed(2)}/month
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
                Start Pro · {selectedPlan === 'pro_annual' ? `$${annualPrice.toFixed(2)}/yr` : `$${monthlyPrice.toFixed(2)}/mo`}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore + Terms */}
          <View className="mt-3 items-center" style={{ paddingBottom: Platform.OS === 'ios' ? 10 : 0 }}>
            <TouchableOpacity onPress={handleRestore}>
              <Text className="text-xs" style={{ color: theme.textTertiary }}>
                Restore Purchases
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
