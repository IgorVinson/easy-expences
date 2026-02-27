import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BudgetCategory } from '../types';

interface MonthlyReviewModalProps {
  visible: boolean;
  categories: BudgetCategory[];
  onSave: (newBudgets: Record<string, number>) => Promise<void>;
}

export function MonthlyReviewModal({ visible, categories, onSave }: MonthlyReviewModalProps) {
  const { theme, isDarkMode } = useTheme();
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // When categories load or change, pre-fill inputs with current budgets
  useEffect(() => {
    if (visible && categories.length > 0) {
      const initial: Record<string, string> = {};
      categories.forEach((c) => {
        initial[c.id] = String(c.budget);
      });
      setBudgets(initial);
    }
  }, [categories, visible]);

  async function handleSave() {
    const finalBudgets: Record<string, number> = {};
    for (const cat of categories) {
      const val = parseFloat(budgets[cat.id]);
      if (isNaN(val) || val <= 0) {
        Alert.alert('Invalid amount', `Please enter a valid positive number for ${cat.name}.`);
        return;
      }
      finalBudgets[cat.id] = val;
    }

    try {
      setSaving(true);
      await onSave(finalBudgets);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to complete monthly review.');
    } finally {
      setSaving(false);
    }
  }

  // Helper to update state for a specific input
  function handleChange(id: string, text: string) {
    setBudgets((prev) => ({ ...prev, [id]: text }));
  }

  const now = new Date();
  const nextMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            className="rounded-t-3xl pt-2 shadow-2xl"
            style={{
              backgroundColor: theme.bg,
              height: Dimensions.get('window').height * 0.8,
            }}>
            {/* Handle */}
            <View className="items-center py-2">
              <View
                className="h-1.5 w-12 rounded-full"
                style={{ backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }}
              />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between border-b px-6 pb-4" style={{ borderColor: theme.border }}>
              <View>
                <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                  New Month Review
                </Text>
                <Text className="mt-1 text-sm font-medium" style={{ color: theme.textTertiary }}>
                  Review your budget for {nextMonth}. This will reset all current spending to $0.
                </Text>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
              
              {categories.map((cat) => (
                <View key={cat.id} className="mb-4">
                  <View className="mb-2 flex-row items-center gap-2">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: isDarkMode ? cat.colorDark : cat.colorLight }}>
                      <Ionicons
                        name={cat.icon}
                        size={16}
                        color={isDarkMode ? '#FFFFFF' : cat.colorDark}
                      />
                    </View>
                    <Text className="text-base font-semibold" style={{ color: theme.textSecondary }}>
                      {cat.name}
                    </Text>
                  </View>

                  <TextInput
                    value={budgets[cat.id] || ''}
                    onChangeText={(val) => handleChange(cat.id, val)}
                    placeholder="0.00"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="decimal-pad"
                    className="rounded-2xl px-4 py-3 text-base"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      borderWidth: 1,
                      color: theme.textPrimary,
                    }}
                  />
                </View>
              ))}
            </ScrollView>

            {/* Save Button Overlay */}
            <View
              className="absolute bottom-0 left-0 right-0 border-t px-6 pb-10 pt-4"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: isDarkMode ? 0.3 : 0.05,
                shadowRadius: 10,
                elevation: 10,
              }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || categories.length === 0}
                className="items-center rounded-2xl py-4"
                style={{
                  backgroundColor: saving ? theme.textTertiary : theme.purple,
                  opacity: saving ? 0.7 : 1,
                }}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-bold text-white">Save & Start {nextMonth}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
