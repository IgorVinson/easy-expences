import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { useExpenses } from '../hooks/useExpenses';
import { BudgetCategory } from '../types';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialCategory?: BudgetCategory | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  userId,
  initialCategory,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { currency } = useCurrency();
  const { addExpense } = useExpenses(userId);
  const { categories, updateCategorySpent } = useBudget(userId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Set initial category when modal becomes visible
  React.useEffect(() => {
    if (visible && initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [visible, initialCategory]);

  function resetForm() {
    setTitle('');
    setAmount('');
    setSelectedCategory(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert(t('addExpense.missingTitle'), t('addExpense.enterTitle'));
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('addExpense.invalidAmount'), t('addExpense.enterAmount'));
      return;
    }
    if (!selectedCategory) {
      Alert.alert(t('addExpense.noCategory'), t('addExpense.selectCategory'));
      return;
    }

    try {
      setSaving(true);
      await addExpense({
        title: title.trim(),
        amount: parsedAmount,
        budgetLeft: selectedCategory.budget - selectedCategory.spent - parsedAmount,
        category: selectedCategory.name,
        icon: selectedCategory.icon,
        colorLight: selectedCategory.colorLight,
        colorDark: selectedCategory.colorDark,
        date: new Date().toISOString(),
      });
      await updateCategorySpent(selectedCategory.name, parsedAmount);
      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('addExpense.failedSave'));
    } finally {
      setSaving(false);
    }
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
        {/* Backdrop wrapper */}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Absolute touch area for backdrop */}
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

          {/* Sheet */}
          <View
            style={{
              flexShrink: 1,
              height: Dimensions.get('window').height * 0.85,
              backgroundColor: theme.bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: 'hidden',
            }}>
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.border,
                }}
              />
            </View>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}>
              <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
                {t('addExpense.title')}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 20,
                  backgroundColor: theme.iconBg,
                }}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            {/* Scrollable form */}
            <ScrollView
              style={{ flexShrink: 1, width: '100%', paddingHorizontal: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Title */}
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 8,
                }}>
                {t('addExpense.nameLabel')}
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t('addExpense.namePlaceholder')}
                placeholderTextColor={theme.textTertiary}
                style={[inputStyle, { marginBottom: 20 }]}
              />

              {/* Amount */}
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 8,
                }}>
                {t('addExpense.amountLabel', { currency })}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder={t('addExpense.amountPlaceholder')}
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
                style={[inputStyle, { marginBottom: 20 }]}
              />

              {/* Category */}
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 12,
                }}>
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
                        onPress={() => setSelectedCategory(cat)}
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
            </ScrollView>

            {/* Save button — pinned to bottom */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme.border,
                backgroundColor: theme.bg,
              }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: theme.purple,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: saving ? 0.7 : 1,
                }}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                    {t('addExpense.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
