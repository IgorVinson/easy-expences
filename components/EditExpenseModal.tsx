import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBudget } from '../hooks/useBudget';
import { BudgetCategory, Expense } from '../types';
import { ExpenseAmountInput, resolveCalculatedAmount } from './ExpenseAmountInput';

interface EditExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expense: Expense | null;
  userId: string;
  onSave: (
    id: string,
    changes: {
      title: string;
      amount: number;
      category: string;
      categoryId?: string;
      icon: any;
      colorLight: string;
      colorDark: string;
      budgetLeft: number;
    }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  visible,
  onClose,
  expense,
  userId,
  onSave,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { currency } = useCurrency();
  const { categories } = useBudget(userId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [calculatorExpression, setCalculatorExpression] = useState('');
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (expense) {
      const nextAmount = String(expense.amount);
      setTitle(expense.title);
      setAmount(nextAmount);
      setCalculatorExpression(nextAmount);
      const matched = expense.categoryId
        ? categories.find((c) => c.id === expense.categoryId)
        : categories.find((c) => c.name === expense.category);
      setSelectedCategory(matched ?? null);
    } else {
      resetForm();
    }
  }, [expense, visible, categories]);

  function resetForm() {
    setTitle('');
    setAmount('');
    setCalculatorExpression('');
    setIsCalculatorVisible(false);
    setSelectedCategory(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function hideCalculator() {
    setIsCalculatorVisible(false);
  }

  async function handleSave() {
    if (!expense) return;

    if (!title.trim()) {
      Alert.alert(t('addExpense.missingTitle'), t('addExpense.enterTitle'));
      return;
    }

    const resolvedAmount = resolveCalculatedAmount(calculatorExpression, amount);

    if (resolvedAmount === null) {
      Alert.alert(t('addExpense.invalidAmount'), t('addExpense.enterAmount'));
      return;
    }

    const parsedAmount = parseFloat(resolvedAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('addExpense.invalidAmount'), t('addExpense.enterAmount'));
      return;
    }

    if (resolvedAmount !== amount || resolvedAmount !== calculatorExpression) {
      setAmount(resolvedAmount);
      setCalculatorExpression(resolvedAmount);
    }

    if (!selectedCategory) {
      Alert.alert(t('addExpense.noCategory'), t('addExpense.selectCategory'));
      return;
    }

    try {
      setSaving(true);
      await onSave(expense.id, {
        title: title.trim(),
        amount: parsedAmount,
        category: selectedCategory.name,
        categoryId: selectedCategory.id,
        icon: selectedCategory.icon,
        colorLight: selectedCategory.colorLight,
        colorDark: selectedCategory.colorDark,
        budgetLeft: selectedCategory.budget - selectedCategory.spent - parsedAmount,
      });
      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('addExpense.failedSave'));
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePress() {
    if (!expense) return;
    Alert.alert(
      t('overview.deleteTitle'),
      t('editExpense.deleteConfirmSpecific', { title: expense.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await onDelete(expense.id);
              resetForm();
              onClose();
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message ?? 'Failed to delete expense.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  const inputStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
    color: theme.textPrimary,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  };

  const labelStyle = {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-1 justify-end">
          <TouchableWithoutFeedback onPress={handleClose}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.55)',
              }}
            />
          </TouchableWithoutFeedback>

          <View
            className="overflow-hidden rounded-t-3xl"
            style={{
              flexShrink: 1,
              height: Dimensions.get('window').height * 0.85,
              backgroundColor: theme.bg,
            }}>
            <View className="items-center pb-1 pt-3">
              <View className="h-1 w-10 rounded-full" style={{ backgroundColor: theme.border }} />
            </View>

            <View className="flex-row items-center justify-between px-6 py-3">
              <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                {t('editExpense.title')}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.iconBg }}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="w-full shrink px-6"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={labelStyle}>{t('addExpense.nameLabel')}</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                onFocus={hideCalculator}
                placeholder={t('addExpense.namePlaceholder')}
                placeholderTextColor={theme.textTertiary}
                style={[inputStyle, { marginBottom: 20 }]}
              />

              <ExpenseAmountInput
                value={amount}
                expression={calculatorExpression}
                onValueChange={setAmount}
                onExpressionChange={setCalculatorExpression}
                onShowCalculator={() => setIsCalculatorVisible(true)}
                label={t('addExpense.amountLabel', { currency })}
                placeholder={t('addExpense.amountPlaceholder')}
                isCalculatorVisible={isCalculatorVisible}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />

              <Text className="mb-3 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                {t('addExpense.categoryLabel')}
              </Text>
              {categories.length === 0 ? (
                <Text style={{ color: theme.textTertiary, fontSize: 14, marginBottom: 20 }}>
                  {t('addExpense.noCategories')}
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          hideCalculator();
                          setSelectedCategory(cat);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 16,
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? cat.colorDark + '33'
                              : cat.colorLight
                            : theme.cardBg,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected ? cat.colorDark : theme.border,
                        }}>
                        <Ionicons
                          name={cat.icon as any}
                          size={15}
                          color={isSelected ? cat.colorDark : theme.textTertiary}
                        />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 13,
                            fontWeight: '500',
                            color: isSelected ? cat.colorDark : theme.textSecondary,
                          }}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                onPress={handleDeletePress}
                disabled={saving || deleting}
                className="mb-4 mt-6 flex-row items-center justify-center gap-1.5 self-center rounded-xl border px-4 py-2"
                style={{
                  borderColor: '#F87171',
                  opacity: saving || deleting ? 0.5 : 1,
                }}>
                {deleting ? (
                  <ActivityIndicator color="#F87171" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={15} color="#F87171" />
                    <Text className="text-sm font-semibold" style={{ color: '#F87171' }}>
                      {t('editExpense.delete')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>

            <View
              className="px-6 pt-3"
              style={{
                paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                borderTopWidth: 1,
                borderTopColor: theme.border,
                backgroundColor: theme.bg,
              }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || deleting}
                className="items-center rounded-2xl py-4"
                style={{
                  backgroundColor: theme.purple,
                  opacity: saving || deleting ? 0.7 : 1,
                }}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-bold text-white">{t('editExpense.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
