import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { BudgetCategory } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ visible, onClose, userId }) => {
  const { theme, isDarkMode } = useTheme();
  const { addExpense } = useExpenses(userId);
  const { categories, updateCategorySpent } = useBudget(userId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [saving, setSaving] = useState(false);

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
      Alert.alert('Missing title', 'Please enter a title for the expense.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid positive amount.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('No category', 'Please select a category.');
      return;
    }

    try {
      setSaving(true);
      await addExpense({
        title: title.trim(),
        amount: parsedAmount,
        category: selectedCategory.name,
        icon: selectedCategory.icon,
        colorLight: selectedCategory.colorLight,
        colorDark: selectedCategory.colorDark,
        date: new Date().toISOString(),
      });
      // Keep budget spent in sync
      await updateCategorySpent(selectedCategory.name, parsedAmount);
      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
    color: theme.textPrimary,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      {/* Dimmed backdrop — tap to dismiss */}
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '92%',
          }}>
        {/* Handle bar */}
        <View className="items-center py-3">
          <View className="h-1 w-10 rounded-full" style={{ backgroundColor: theme.border }} />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-4 pt-2">
          <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
            Add Expense
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name="close" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Text className="mb-2 text-sm font-semibold" style={{ color: theme.textSecondary }}>
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Lunch at Café"
            placeholderTextColor={theme.textTertiary}
            className="mb-5 rounded-2xl px-4 py-4 text-base"
            style={[inputStyle, { borderWidth: 1 }]}
          />

          {/* Amount */}
          <Text className="mb-2 text-sm font-semibold" style={{ color: theme.textSecondary }}>
            Amount ($)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={theme.textTertiary}
            keyboardType="decimal-pad"
            className="mb-5 rounded-2xl px-4 py-4 text-base"
            style={[inputStyle, { borderWidth: 1 }]}
          />

          {/* Category */}
          <Text className="mb-3 text-sm font-semibold" style={{ color: theme.textSecondary }}>
            Category
          </Text>
          {categories.length === 0 ? (
            <Text className="mb-5 text-sm" style={{ color: theme.textTertiary }}>
              No categories yet. Add one in the Budget tab.
            </Text>
          ) : (
            <View className="mb-6 flex-row flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat)}
                    className="flex-row items-center rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: isSelected
                        ? (isDarkMode ? cat.colorDark + '33' : cat.colorLight)
                        : theme.cardBg,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? cat.colorDark : theme.border,
                    }}>
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? cat.colorDark : theme.textTertiary}
                    />
                    <Text
                      className="ml-2 text-sm font-medium"
                      style={{ color: isSelected ? cat.colorDark : theme.textSecondary }}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Save button */}
        <View className="px-6 pb-10 pt-4">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="items-center rounded-2xl py-4"
            style={{ backgroundColor: theme.purple, opacity: saving ? 0.7 : 1 }}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">Save Expense</Text>
            )}
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
