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

export const RecordingModal: React.FC<RecordingModalProps> = ({ visible, onClose, userId }) => {
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
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (step !== 'recording' || isProcessing) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

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

    loop.start();

    return () => {
      loop.stop();
      pulse.setValue(1);
    };
  }, [isProcessing, pulse, step]);

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
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}>
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
          style={{
            height: SHEET_HEIGHT,
            backgroundColor: theme.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: 'hidden',
          }}>
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

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}>
            <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              {step === 'recording' ? 'Record Expense' : 'Add Expense'}
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

          {step === 'recording' ? (
            <>
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 18,
                    lineHeight: 28,
                    textAlign: 'center',
                    marginBottom: 28,
                    maxWidth: 320,
                  }}>
                  {`Tap, say:\n"Lunch 15 dollars food"`}
                </Text>

                {isRecording && (
                  <View style={{ marginBottom: 16 }}>
                    <ListeningIndicator />
                  </View>
                )}

                <Animated.View
                  style={{
                    transform: [{ scale: pulse }],
                  }}>
                  <TouchableOpacity
                    onPress={isRecording ? handleStopAndTranscribe : handleStartRecording}
                    disabled={isProcessing}
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: 56,
                      alignItems: 'center',
                      justifyContent: 'center',
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
                    style={{
                      marginTop: 18,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#F87171',
                      backgroundColor: isDarkMode ? '#7F1D1D33' : '#FEE2E2',
                      padding: 12,
                    }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 13 }}>{error}</Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  paddingHorizontal: 24,
                  paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  backgroundColor: theme.bg,
                }}>
                <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>
                  After stop, review inputs will open automatically.
                </Text>
              </View>
            </>
          ) : (
            <>
              <ScrollView
                style={{ flex: 1, paddingHorizontal: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 13,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}>
                  Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Lunch at Café"
                  placeholderTextColor={theme.textTertiary}
                  style={[inputStyle, { marginBottom: 20 }]}
                />

                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 13,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}>
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

                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 13,
                    fontWeight: '600',
                    marginBottom: 12,
                  }}>
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

                <View style={{ height: 100 }} />
              </ScrollView>

              <View
                style={{
                  paddingHorizontal: 24,
                  paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  backgroundColor: theme.bg,
                  gap: 10,
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
                      Save Expense
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep('recording')}
                  disabled={saving}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '600' }}>
                    Back to Recording
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
