import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useBudget } from '../hooks/useBudget';
import { useExpenses } from '../hooks/useExpenses';
import { BudgetCategory } from '../types';
import ListeningIndicator from './ListeningIndicator';

interface RecordingModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

const SHEET_HEIGHT = Dimensions.get('window').height * 0.85;

export const RecordingModal: React.FC<RecordingModalProps> = ({ visible, onClose, userId }) => {
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
      Alert.alert('Error', e.message ?? 'Failed to save expense.');
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
      {/* Backdrop wrapper */}
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}>
        {/* Absolute touch area for backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <View
          style={{
            height: SHEET_HEIGHT,
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
                  Add Expense
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
                  <ListeningIndicator />
              {/* Scrollable form */}

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
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Save Expense</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
        </View>
    </Modal>
  );
};
