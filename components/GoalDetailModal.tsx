import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { GoalWithProgress, Transaction } from '../types';

type GoalDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  goal: GoalWithProgress | null;
  contributions: Transaction[]; // income transactions with goalId === goal.id
};

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  visible,
  onClose,
  goal,
  contributions,
}) => {
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const { i18n } = useTranslation();

  if (!goal) return null;

  const formattedSaved = formatCurrencyAmount(goal.savedAmount, currency, i18n.language);
  const formattedTarget = formatCurrencyAmount(goal.targetAmount, currency, i18n.language);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '80%',
          }}>
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? goal.colorDark + '33' : goal.colorLight }}>
                <Ionicons name={goal.icon} size={22} color={goal.colorDark} />
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                {goal.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: theme.iconBg }}>
              <Ionicons name="close" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Progress */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: theme.textTertiary, fontSize: 13 }}>
                {formattedSaved} saved
              </Text>
              <Text style={{ color: theme.textTertiary, fontSize: 13 }}>
                {formattedTarget} target
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <View style={{ height: '100%', borderRadius: 4, width: `${goal.progressPercent}%`, backgroundColor: goal.colorDark }} />
            </View>
            <Text style={{ color: goal.colorDark, fontSize: 13, fontWeight: '600', marginTop: 6, textAlign: 'right' }}>
              {Math.round(goal.progressPercent)}%
            </Text>
          </View>

          {/* Contributions list */}
          <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {contributions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="cash-outline" size={40} color={theme.textTertiary} />
                <Text style={{ color: theme.textTertiary, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                  No contributions yet.{'\n'}Add income and assign it to this goal.
                </Text>
              </View>
            ) : (
              contributions.map((txn) => (
                <View
                  key={txn.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}>
                  <View>
                    <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '500' }}>
                      {txn.title}
                    </Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}>
                      {new Date(txn.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={{ color: theme.success, fontSize: 16, fontWeight: '700' }}>
                    +{formatCurrencyAmount(txn.amount, currency, i18n.language)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
