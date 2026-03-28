import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
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
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { useVoiceExpense } from '../hooks/useVoiceExpense';
import { BudgetCategory, GoalWithProgress } from '../types';
import { findBestNameMatch } from '../utils/voiceMatch';
import { ExpenseAmountInput, resolveCalculatedAmount } from './ExpenseAmountInput';
import ListeningIndicator from './ListeningIndicator';

type Tab = 'expense' | 'income';

const INCOME_GREEN = '#10B981';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  categories: BudgetCategory[];
  initialCategory?: BudgetCategory | null;
  goals?: GoalWithProgress[];
  defaultTab?: Tab;
  onVoiceSaved?: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  userId,
  categories,
  initialCategory,
  goals = [],
  defaultTab = 'expense',
  onVoiceSaved,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { currency } = useCurrency();
  const { addTransaction } = useTransactions(userId);
  const {
    isRecording,
    isProcessing,
    error: voiceError,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording,
  } = useVoiceExpense();

  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [calculatorExpression, setCalculatorExpression] = useState('');
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(null);
  const [saving, setSaving] = useState(false);
  const [usedVoice, setUsedVoice] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setActiveTab(defaultTab);
      if (initialCategory) setSelectedCategory(initialCategory);
    }
  }, [visible, initialCategory, defaultTab]);

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => { loop.stop(); pulse.setValue(0); };
  }, [pulse]);

  function resetFields() {
    setTitle('');
    setAmount('');
    setCalculatorExpression('');
    setIsCalculatorVisible(false);
    setSelectedCategory(null);
    setSelectedGoal(null);
    setUsedVoice(false);
  }

  function resetForm() {
    resetFields();
    setActiveTab(defaultTab);
  }

  async function handleClose() {
    await cancelRecording();
    resetForm();
    onClose();
  }

  function hideCalculator() {
    setIsCalculatorVisible(false);
  }

  async function handleStartRecording() {
    await startRecording(handleStopAndTranscribe);
  }

  async function handleStopAndTranscribe() {
    const hints =
      activeTab === 'expense' ? categories.map((c) => c.name) : goals.map((g) => g.name);
    const result = await stopRecordingAndProcess(hints);
    if (!result) {
      Alert.alert(t('recording.transcriptionFailed'), voiceError ?? t('recording.couldNotTranscribe'));
      return;
    }
    setTitle(result.title);
    const nextAmount = result.amount > 0 ? result.amount.toString() : '';
    setAmount(nextAmount);
    setCalculatorExpression(nextAmount);
    if (activeTab === 'expense') {
      setSelectedCategory(findBestNameMatch(categories, result.category));
    } else {
      setSelectedGoal(findBestNameMatch(goals, result.category));
    }
    setUsedVoice(true);
  }

  async function handleSave() {
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

    try {
      setSaving(true);
      if (activeTab === 'expense') {
        if (!selectedCategory) {
          Alert.alert(t('addExpense.noCategory'), t('addExpense.selectCategory'));
          return;
        }
        await addTransaction({
          type: 'expense',
          title: title.trim(),
          amount: parsedAmount,
          budgetLeft: selectedCategory.budget - selectedCategory.spent - parsedAmount,
          category: selectedCategory.name,
          categoryId: selectedCategory.id,
          icon: selectedCategory.icon,
          colorLight: selectedCategory.colorLight,
          colorDark: selectedCategory.colorDark,
          date: new Date().toISOString(),
        });
      } else {
        if (!selectedGoal) {
          Alert.alert(t('addTransaction.noGoalTitle'), t('addTransaction.selectGoal'));
          return;
        }
        await addTransaction({
          type: 'income',
          title: title.trim(),
          amount: parsedAmount,
          goalId: selectedGoal.id,
          icon: 'cash',
          colorLight: '#D1FAE5',
          colorDark: '#10B981',
          date: new Date().toISOString(),
        });
      }
      resetForm();
      onClose();
      if (usedVoice) onVoiceSaved?.();
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

  const amountLabelStyle = {
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          </TouchableWithoutFeedback>

          <View style={{ maxHeight: Dimensions.get('window').height * 0.9, backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
                {activeTab === 'expense' ? t('addExpense.title') : t('addTransaction.addIncomeTitle')}
              </Text>
              <TouchableOpacity onPress={handleClose} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.iconBg }}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Tab switcher */}
            <View style={{ flexDirection: 'row', marginHorizontal: 24, marginBottom: 16, borderRadius: 12, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
              {(['expense', 'income'] as Tab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => { setActiveTab(tab); resetFields(); }}
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: activeTab === tab ? (tab === 'income' ? INCOME_GREEN : theme.purple) : 'transparent' }}>
                  <Text style={{ color: activeTab === tab ? '#fff' : theme.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {tab === 'expense' ? t('addTransaction.expenseTab') : t('addTransaction.incomeTab')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ width: '100%', paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                  {/* Title */}
                  <Text style={amountLabelStyle}>{t('addExpense.nameLabel')}</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    onFocus={hideCalculator}
                    placeholder={activeTab === 'expense' ? t('addExpense.namePlaceholder') : t('addTransaction.incomeNamePlaceholder')}
                    placeholderTextColor={theme.textTertiary}
                    style={[inputStyle, { marginBottom: 20 }]}
                  />

                  {/* Amount */}
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
                    labelStyle={amountLabelStyle}
                    accentColor={activeTab === 'income' ? INCOME_GREEN : theme.purple}
                  />

                  {/* Expense: category selector */}
                  {activeTab === 'expense' && (
                    <>
                      <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
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
                                onPress={() => { hideCalculator(); setSelectedCategory(cat); }}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: isSelected ? (isDarkMode ? cat.colorDark + '33' : cat.colorLight) : theme.cardBg, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? cat.colorDark : theme.border }}>
                                <Ionicons name={cat.icon as any} size={15} color={isSelected ? cat.colorDark : theme.textTertiary} />
                                <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '500', color: isSelected ? cat.colorDark : theme.textSecondary }}>
                                  {cat.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}

                  {/* Income: required goal selector */}
                  {activeTab === 'income' && (
                    <>
                      <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
                        {t('addTransaction.assignToGoal')}
                      </Text>
                      {goals.length === 0 ? (
                        <Text style={{ color: theme.textTertiary, fontSize: 14, marginBottom: 20 }}>
                          {t('addTransaction.noGoalsYet')}
                        </Text>
                      ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                          {goals.map((goal) => {
                            const isSelected = selectedGoal?.id === goal.id;
                            return (
                              <TouchableOpacity
                                key={goal.id}
                                onPress={() => setSelectedGoal(goal)}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: isSelected ? (isDarkMode ? INCOME_GREEN + '33' : '#D1FAE5') : theme.cardBg, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? INCOME_GREEN : theme.border }}>
                                <Ionicons name={goal.icon as any} size={15} color={isSelected ? INCOME_GREEN : theme.textTertiary} />
                                <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '500', color: isSelected ? INCOME_GREEN : theme.textSecondary }}>
                                  {goal.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>

                {/* Footer */}
                <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
                  {/* Listening indicator */}
                  {isRecording && (
                    <View style={{ alignItems: 'center', marginBottom: 12 }}>
                      <ListeningIndicator />
                    </View>
                  )}
                  {/* Error */}
                  {Boolean(voiceError) && (
                    <View style={{ marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 10, borderColor: '#F87171', backgroundColor: isDarkMode ? '#7F1D1D33' : '#FEE2E2' }}>
                      <Text style={{ fontSize: 12, color: theme.textPrimary }}>{voiceError}</Text>
                    </View>
                  )}
                  {/* Mic button */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
                      <Animated.View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          width: 72, height: 72, borderRadius: 36,
                          backgroundColor: isRecording ? '#EF4444' : theme.purple,
                          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: isDarkMode ? [0.22, 0] : [0.32, 0] }),
                          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
                        }}
                      />
                      <TouchableOpacity
                        onPress={isRecording ? handleStopAndTranscribe : handleStartRecording}
                        disabled={isProcessing}
                        style={{
                          width: 72, height: 72, borderRadius: 36,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isRecording ? '#EF4444' : theme.purple,
                          opacity: isProcessing ? 0.7 : 1,
                        }}>
                        {isProcessing
                          ? <ActivityIndicator size="large" color="#fff" />
                          : <Ionicons name={isRecording ? 'stop' : 'mic'} size={30} color="#fff" />}
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Save button */}
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{ backgroundColor: activeTab === 'income' ? INCOME_GREEN : theme.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <ActivityIndicator color="#fff" /> : (
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                        {activeTab === 'expense' ? t('addExpense.save') : t('addTransaction.saveIncome')}
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
