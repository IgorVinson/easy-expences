import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useVoiceExpense } from '../hooks/useVoiceExpense';
import { BudgetCategory, Expense, NewBudgetCategory } from '../types';
import ListeningIndicator from './ListeningIndicator';

// ─── Icon picker options ──────────────────────────────────────────────────────

const ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
  'restaurant',
  'car',
  'bulb',
  'ticket',
  'cart',
  'home',
  'medkit',
  'school',
  'airplane',
  'fitness',
  'paw',
  'game-controller',
  'musical-notes',
  'book',
  'wallet',
  'gift',
  'heart',
  'briefcase',
  'cash',
  'laptop',
];

// ─── Color options ────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { light: string; dark: string; label: string }[] = [
  { light: '#FED7AA', dark: '#FB923C', label: 'Orange' },
  { light: '#E2E8F0', dark: '#94A3B8', label: 'Slate' },
  { light: '#FEF08A', dark: '#FACC15', label: 'Yellow' },
  { light: '#FECACA', dark: '#F87171', label: 'Red' },
  { light: '#BFDBFE', dark: '#60A5FA', label: 'Blue' },
  { light: '#BBF7D0', dark: '#4ADE80', label: 'Green' },
  { light: '#E9D5FF', dark: '#A855F7', label: 'Purple' },
  { light: '#FBCFE8', dark: '#EC4899', label: 'Pink' },
  { light: '#CFFAFE', dark: '#22D3EE', label: 'Cyan' },
  { light: '#FEF3C7', dark: '#F59E0B', label: 'Amber' },
];

const MIC_BUTTON_SIZE = 72;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddEditCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  category?: BudgetCategory | null;
  categoryTransactions?: Expense[];
  onSave: (data: NewBudgetCategory, resetSpent?: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({
  visible,
  onClose,
  category,
  categoryTransactions = [],
  onSave,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { currency } = useCurrency();
  const isEdit = Boolean(category);
  const [deleting, setDeleting] = useState(false);
  const {
    isRecording,
    isProcessing,
    error: voiceError,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording,
  } = useVoiceExpense();

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('cash');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setBudget(String(category.budget));
      setSelectedIcon(category.icon);
      const matched = COLOR_OPTIONS.find((c) => c.dark === category.colorDark);
      setSelectedColor(matched ?? COLOR_OPTIONS[0]);
    } else {
      resetForm();
    }
  }, [category, visible]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => { loop.stop(); pulse.setValue(0); };
  }, [pulse]);

  function resetForm() {
    setName('');
    setBudget('');
    setSelectedIcon('cash');
    setSelectedColor(COLOR_OPTIONS[0]);
  }

  async function handleClose() {
    await cancelRecording();
    resetForm();
    onClose();
  }

  async function handleStartRecording() {
    await startRecording(handleStopAndTranscribe);
  }

  async function handleStopAndTranscribe() {
    const result = await stopRecordingAndProcess([]);
    if (!result) {
      Alert.alert(t('recording.transcriptionFailed'), voiceError ?? t('recording.couldNotTranscribe'));
      return;
    }
    if (result.title) setName(result.title);
    if (result.amount > 0) setBudget(result.amount.toString());
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(t('addCategory.missingName'), t('addCategory.enterName'));
      return;
    }
    const parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      Alert.alert(t('addExpense.invalidAmount'), t('addExpense.enterAmount'));
      return;
    }
    try {
      setSaving(true);
      await onSave({
        name: name.trim(),
        budget: parsedBudget,
        icon: selectedIcon,
        colorLight: selectedColor.light,
        colorDark: selectedColor.dark,
      });
      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePress() {
    if (!category) return;
    Alert.alert(t('budget.deleteTitle'), t('budget.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await onDelete?.(category.id);
            resetForm();
            onClose();
          } catch (e: any) {
            Alert.alert(t('common.error'), e.message ?? 'Failed to delete category.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

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
        <View className="flex-1 justify-end">
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
            className="overflow-hidden rounded-t-3xl"
            style={{
              flexShrink: 1,
              height: Dimensions.get('window').height * 0.85,
              backgroundColor: theme.bg,
            }}>
            {/* Drag handle */}
            <View className="items-center pb-1 pt-3">
              <View className="h-1 w-10 rounded-full" style={{ backgroundColor: theme.border }} />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-3">
              <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                {isEdit ? t('addCategory.editTitle') : t('addCategory.addTitle')}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.iconBg }}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <>
            {/* Scrollable form */}
            <ScrollView
              className="w-full shrink px-6"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Name */}
              <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                {t('addCategory.nameLabel')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('addCategory.namePlaceholder')}
                placeholderTextColor={theme.textTertiary}
                className="mb-5 rounded-2xl px-4 py-3.5 text-base"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                  borderWidth: 1,
                  color: theme.textPrimary,
                }}
              />

              {/* Budget input with side reset button */}
              <View className="mb-2.5 flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: theme.textSecondary }}>
                  {t('addCategory.budgetLabel', { currency })}
                </Text>
              </View>

              <View className="mb-5 flex-row items-center gap-3">
                <TextInput
                  value={budget}
                  onChangeText={setBudget}
                  placeholder={t('addCategory.budgetPlaceholder')}
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                  className="flex-1 rounded-2xl px-4 py-3.5 text-base"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    borderWidth: 1,
                    color: theme.textPrimary,
                  }}
                />

                {isEdit && (
                  <TouchableOpacity
                    className="items-center justify-center rounded-2xl px-4 py-2"
                    style={{
                      backgroundColor: isDarkMode ? '#334155' : '#F1F5F9', // subtle background
                    }}
                    onPress={() => {
                      Alert.alert(
                        t('budget.resetSpentTitle'),
                        t('budget.resetSpentConfirm', { name: category?.name }),
                        [
                          { text: t('common.cancel'), style: 'cancel' },
                          {
                            text: t('budget.resetToZero'),
                            style: 'destructive',
                            onPress: async () => {
                              if (category) {
                                try {
                                  setSaving(true);
                                  await onSave(
                                    {
                                      name: category.name,
                                      budget: category.budget,
                                      icon: category.icon,
                                      colorLight: category.colorLight,
                                      colorDark: category.colorDark,
                                    },
                                    true
                                  );
                                  onClose();
                                } catch (e: any) {
                                  Alert.alert(t('common.error'), e.message);
                                } finally {
                                  setSaving(false);
                                }
                              }
                            },
                          },
                        ]
                      );
                    }}>
                    <Text
                      className="mb-1 text-[10px] font-semibold"
                      style={{ color: theme.textSecondary }}>
                      {t('addCategory.resetSpent')}
                    </Text>
                    <Ionicons name="refresh-circle" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Icon picker */}
              <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                {t('addCategory.iconLabel')}
              </Text>
              <View className="mb-5 flex-row flex-wrap gap-2.5">
                {ICON_OPTIONS.map((icon) => {
                  const isSelected = selectedIcon === icon;
                  return (
                    <TouchableOpacity
                      key={icon}
                      onPress={() => setSelectedIcon(icon)}
                      className="h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: isSelected
                          ? isDarkMode
                            ? selectedColor.dark + '33'
                            : selectedColor.light
                          : theme.cardBg,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? selectedColor.dark : theme.border,
                      }}>
                      <Ionicons
                        name={icon}
                        size={22}
                        color={isSelected ? selectedColor.dark : theme.textTertiary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Color picker */}
              <Text className="mb-2.5 text-xs font-semibold" style={{ color: theme.textSecondary }}>
                Color
              </Text>
              <View className="mb-6 flex-row flex-wrap gap-2.5">
                {COLOR_OPTIONS.map((color) => {
                  const isSelected = selectedColor.dark === color.dark;
                  return (
                    <TouchableOpacity
                      key={color.dark}
                      onPress={() => setSelectedColor(color)}
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: color.dark,
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: theme.bg,
                        shadowColor: color.dark,
                        shadowOpacity: isSelected ? 0.6 : 0,
                        shadowRadius: isSelected ? 4 : 0,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: isSelected ? 4 : 0,
                      }}>
                      {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isEdit && (
                <View className="mb-6">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-xs font-semibold" style={{ color: theme.textSecondary }}>
                      {t('budget.transactionsTitle')}
                    </Text>
                    <View
                      className="rounded-full px-2.5 py-1"
                      style={{ backgroundColor: theme.iconBg }}>
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ color: theme.textTertiary }}>
                        {categoryTransactions.length}
                      </Text>
                    </View>
                  </View>

                  {categoryTransactions.length === 0 ? (
                    <View
                      className="rounded-2xl px-4 py-4"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}>
                      <Text className="text-sm" style={{ color: theme.textTertiary }}>
                        {t('budget.noTransactions')}
                      </Text>
                    </View>
                  ) : (
                    <View
                      className="overflow-hidden rounded-2xl"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}>
                      {categoryTransactions.map((expense, index) => {
                        const formattedAmount = formatCurrencyAmount(
                          Math.abs(expense.amount),
                          currency,
                          i18n.language
                        );
                        const formattedDate = new Date(expense.date).toLocaleDateString(
                          i18n.language,
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        );

                        return (
                          <View
                            key={expense.id}
                            className="flex-row items-center justify-between px-4 py-3"
                            style={{
                              borderBottomWidth: index === categoryTransactions.length - 1 ? 0 : 1,
                              borderBottomColor: theme.border,
                            }}>
                            <View className="mr-3 flex-1">
                              <Text
                                numberOfLines={1}
                                className="text-sm font-semibold"
                                style={{ color: theme.textPrimary }}>
                                {expense.title}
                              </Text>
                              <Text className="mt-1 text-xs" style={{ color: theme.textTertiary }}>
                                {formattedDate}
                              </Text>
                            </View>
                            <Text
                              className="text-sm font-bold"
                              style={{ color: theme.textPrimary }}>
                              {formattedAmount}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* Delete button — inside body, edit mode only */}
              {isEdit && onDelete && (
                <TouchableOpacity
                  onPress={handleDeletePress}
                  disabled={saving || deleting}
                  className="mb-4 items-center justify-center rounded-2xl py-4"
                  style={{
                    backgroundColor: '#EF444415',
                    opacity: saving || deleting ? 0.5 : 1,
                  }}>
                  {deleting ? (
                    <ActivityIndicator color="#EF4444" size="small" />
                  ) : (
                    <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>
                      {t('budget.deleteTitle')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Save button — pinned footer */}
            <View
              className="px-6"
              style={{
                paddingTop: 16,
                paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                backgroundColor: theme.bg,
              }}>
              {!isEdit && isRecording && (
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <ListeningIndicator />
                </View>
              )}
              {!isEdit && Boolean(voiceError) && (
                <View style={{ marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 10, borderColor: '#F87171', backgroundColor: isDarkMode ? '#7F1D1D33' : '#FEE2E2' }}>
                  <Text style={{ fontSize: 12, color: theme.textPrimary }}>{voiceError}</Text>
                </View>
              )}
              {!isEdit && (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: MIC_BUTTON_SIZE, height: MIC_BUTTON_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        width: MIC_BUTTON_SIZE,
                        height: MIC_BUTTON_SIZE,
                        borderRadius: MIC_BUTTON_SIZE / 2,
                        backgroundColor: isRecording ? '#EF4444' : (isDarkMode ? '#6B7280' : '#9CA3AF'),
                        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: isDarkMode ? [0.22, 0] : [0.32, 0] }),
                        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
                      }}
                    />
                    <TouchableOpacity
                      onPress={isRecording ? handleStopAndTranscribe : handleStartRecording}
                      disabled={isProcessing}
                      style={{
                        width: MIC_BUTTON_SIZE,
                        height: MIC_BUTTON_SIZE,
                        borderRadius: MIC_BUTTON_SIZE / 2,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isRecording ? '#EF4444' : theme.iconBg,
                        opacity: isProcessing ? 0.7 : 1,
                      }}>
                      {isProcessing
                        ? <ActivityIndicator size="large" color={theme.textPrimary} />
                        : <Ionicons name={isRecording ? 'stop' : 'mic'} size={30} color={isRecording ? '#fff' : theme.textPrimary} />}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
                    {isEdit ? t('common.save') : t('addCategory.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            </>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
