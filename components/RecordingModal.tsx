import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { useExpenses } from '../hooks/useExpenses';
import { useVoiceExpense } from '../hooks/useVoiceExpense';
import { BudgetCategory } from '../types';
import ListeningIndicator from './ListeningIndicator';

interface RecordingModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onExpenseSaved?: () => void;
}

type VoiceStep = 'recording' | 'review';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.85;

function normalizeCategoryName(value: string): string {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

function findBestCategoryMatch(categories: BudgetCategory[], rawCategory: string): BudgetCategory | null {
  if (!rawCategory.trim()) return null;

  const normalizedTarget = normalizeCategoryName(rawCategory);

  const exact = categories.find(
    (cat) => normalizeCategoryName(cat.name) === normalizedTarget
  );
  if (exact) return exact;

  const partial = categories.find((cat) => {
    const normalizedCategory = normalizeCategoryName(cat.name);
    return (
      normalizedCategory.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedCategory)
    );
  });

  return partial ?? null;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({ visible, onClose, userId, onExpenseSaved }) => {
  const { theme, isDarkMode } = useTheme();
  const { addExpense } = useExpenses(userId);
  const { categories, updateCategorySpent } = useBudget(userId);
  const { isRecording, isProcessing, error, startRecording, stopRecordingAndProcess, cancelRecording } =
    useVoiceExpense();

  const [step, setStep] = useState<VoiceStep>('recording');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [animationSession, setAnimationSession] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      setAnimationSession((prev) => prev + 1);
    }
  }, [visible]);

  useEffect(() => {
    const shouldAnimate = visible && step === 'recording' && !isProcessing;

    const stopPulse = () => {
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
      pulse.stopAnimation();
      pulse.setValue(1);
    };

    if (!shouldAnimate) {
      stopPulse();
      return;
    }

    pulse.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();

    return () => {
      stopPulse();
    };
  }, [animationSession, isProcessing, pulse, step, visible]);

  function resetForm() {
    setStep('recording');
    setTitle('');
    setAmount('');
    setSelectedCategory(null);
    setSaving(false);
  }

  async function handleClose() {
    await cancelRecording();
    resetForm();
    onClose();
  }

  async function handleStartRecording() {
    await startRecording();
  }

  async function handleStopAndTranscribe() {
    const result = await stopRecordingAndProcess();
    if (!result) {
      Alert.alert('Transcription failed', error ?? 'Could not transcribe your recording. Please try again.');
      return;
    }

    setTitle(result.title);
    setAmount(result.amount > 0 ? result.amount.toString() : '');

    const matchedCategory = findBestCategoryMatch(categories, result.category);
    setSelectedCategory(matchedCategory);
    setStep('review');
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
      onExpenseSaved?.();
      await handleClose();
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View className="flex-1 justify-end">
        <TouchableWithoutFeedback onPress={handleClose}>
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          />
        </TouchableWithoutFeedback>

        <View
          className="overflow-hidden rounded-t-3xl"
          style={{ flexShrink: 1, height: Dimensions.get('window').height * 0.85, backgroundColor: theme.bg }}>
          <View className="items-center pb-1 pt-3">
            <View
              className="h-1 w-10 rounded-full"
              style={{
                backgroundColor: theme.border,
              }}
            />
          </View>

          <View className="flex-row items-center justify-between px-6 py-3">
            <Text className="text-[22px] font-bold" style={{ color: theme.textPrimary }}>
              {step === 'recording' ? 'Record Expense' : 'Add Expense'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor: theme.iconBg,
              }}>
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {step === 'recording' ? (
            <>
              <View className="flex-1 items-center justify-center px-6">
                <Text
                  className="mb-7 max-w-[320px] text-center text-lg leading-7"
                  style={{
                    color: theme.textSecondary,
                  }}>
                  {`Tap, say:\n"Lunch 15 dollars food"`}
                </Text>

                {isRecording && (
                  <View className="mb-4" key={`indicator-${animationSession}`}>
                    <ListeningIndicator />
                  </View>
                )}

                <Animated.View
                  key={`pulse-${animationSession}`}
                  style={{
                    transform: [{ scale: pulse }],
                  }}>
                  <TouchableOpacity
                    onPress={isRecording ? handleStopAndTranscribe : handleStartRecording}
                    disabled={isProcessing}
                    className="h-28 w-28 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isRecording ? '#EF4444' : theme.purple,
                      opacity: isProcessing ? 0.7 : 1,
                    }}>
                    {isProcessing ? (
                      <ActivityIndicator size="large" color="#fff" />
                    ) : (
                      <Ionicons name={isRecording ? 'stop' : 'mic'} size={38} color="#fff" />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {Boolean(error) && (
                  <View
                    className="mt-[18px] rounded-xl border p-3"
                    style={{
                      borderColor: '#F87171',
                      backgroundColor: isDarkMode ? '#7F1D1D33' : '#FEE2E2',
                    }}>
                    <Text className="text-[13px]" style={{ color: theme.textPrimary }}>
                      {error}
                    </Text>
                  </View>
                )}
              </View>

              <View
                className="border-t px-6 pt-3"
                style={{
                  paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                  borderTopColor: theme.border,
                  backgroundColor: theme.bg,
                }}>
                <Text className="text-center text-[13px]" style={{ color: theme.textSecondary }}>
                  After stop, review inputs will open automatically.
                </Text>
              </View>
            </>
          ) : (
            <>
              <ScrollView
                className="shrink w-full px-6"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}>
                <Text
                  className="mb-2 text-[13px] font-semibold"
                  style={{
                    color: theme.textSecondary,
                  }}>
                  Title
                </Text>
                <TextInput
                  className="mb-5 rounded-2xl border px-4 py-3.5 text-base"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Lunch at Café"
                  placeholderTextColor={theme.textTertiary}
                  style={inputStyle}
                />

                <Text
                  className="mb-2 text-[13px] font-semibold"
                  style={{
                    color: theme.textSecondary,
                  }}>
                  Amount ($)
                </Text>
                <TextInput
                  className="mb-5 rounded-2xl border px-4 py-3.5 text-base"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />

                <Text
                  className="mb-3 text-[13px] font-semibold"
                  style={{
                    color: theme.textSecondary,
                  }}>
                  Category
                </Text>
                {categories.length === 0 ? (
                  <Text className="mb-5 text-sm" style={{ color: theme.textTertiary }}>
                    No categories yet. Check the Budget tab.
                  </Text>
                ) : (
                  <View className="mb-6 flex-row flex-wrap gap-2">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory?.id === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => setSelectedCategory(cat)}
                          className="flex-row items-center rounded-2xl px-3.5 py-2.5"
                          style={{
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
                            className="ml-1.5 text-[13px] font-medium"
                            style={{
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

              <View
                className="gap-2.5 border-t px-6 pt-3"
                style={{
                  paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                  borderTopColor: theme.border,
                  backgroundColor: theme.bg,
                }}>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="items-center rounded-2xl py-4"
                  style={{
                    backgroundColor: theme.purple,
                    opacity: saving ? 0.7 : 1,
                  }}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-base font-bold text-white">
                      Save Expense
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep('recording')}
                  disabled={saving}
                  className="items-center rounded-2xl border py-3.5"
                  style={{
                    borderColor: theme.border,
                  }}>
                  <Text className="text-sm font-semibold" style={{ color: theme.textSecondary }}>
                    Back to Recording
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
          </KeyboardAvoidingView>
    </Modal>
  );
};
