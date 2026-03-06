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
import { useBudget } from '../hooks/useBudget';
import { BudgetCategory, Expense } from '../types';

interface EditExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expense: Expense | null;
  userId: string;
  onSave: (id: string, changes: { title: string; amount: number; category: string; icon: any; colorLight: string; colorDark: string; budgetLeft: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const SHEET_HEIGHT = Dimensions.get('window').height * 0.88;

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  visible,
  onClose,
  expense,
  userId,
  onSave,
  onDelete,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { categories } = useBudget(userId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Populate form when expense changes
  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(String(expense.amount));
      // Match category by name
      const matched = categories.find((c) => c.name === expense.category);
      setSelectedCategory(matched ?? null);
    } else {
      resetForm();
    }
  }, [expense, visible, categories]);

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
    if (!expense) return;

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
      await onSave(expense.id, {
        title: title.trim(),
        amount: parsedAmount,
        category: selectedCategory.name,
        icon: selectedCategory.icon,
        colorLight: selectedCategory.colorLight,
        colorDark: selectedCategory.colorDark,
        budgetLeft: selectedCategory.budget - selectedCategory.spent - parsedAmount,
      });
      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePress() {
    if (!expense) return;
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await onDelete(expense.id);
              resetForm();
              onClose();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete expense.');
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Backdrop wrapper */}
      <View className="flex-1 justify-end">
        {/* Absolute touch area for backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <View
          className="overflow-hidden rounded-t-3xl"
          style={{ flexShrink: 1, height: Dimensions.get('window').height * 0.85, backgroundColor: theme.bg }}>

          {/* Drag handle */}
          <View className="items-center pb-1 pt-3">
            <View
              className="h-1 w-10 rounded-full"
              style={{ backgroundColor: theme.border }}
            />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-3">
            <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
              Edit Expense
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.iconBg }}>
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable form */}
          <ScrollView
            className="shrink w-full px-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}>

            {/* Title */}
            <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Lunch at Café"
              placeholderTextColor={theme.textTertiary}
              style={[inputStyle, { marginBottom: 20 }]}
            />

            {/* Amount */}
            <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
              Amount ($)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
              style={[inputStyle, { marginBottom: 20 }]}
            />

            {/* Category */}
            <Text className="mb-3 text-xs font-semibold" style={{ color: theme.textSecondary }}>
              Category
            </Text>
            {categories.length === 0 ? (
              <Text style={{ color: theme.textTertiary, fontSize: 14, marginBottom: 20 }}>
                No categories yet. Check the Budget tab.
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
                          ? isDarkMode ? cat.colorDark + '33' : cat.colorLight
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

            {/* Delete button — inside scroll body */}
            <TouchableOpacity
              onPress={handleDeletePress}
              disabled={saving || deleting}
              className="mt-6 mb-4 flex-row items-center justify-center self-center gap-1.5 rounded-xl border px-4 py-2"
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
                    Delete Expense
                  </Text>
                </>
              )}
            </TouchableOpacity>

          </ScrollView>

          {/* Pinned footer — Save button */}
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
                <Text className="text-base font-bold text-white">
                  Save Changes
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
// hot reload test
