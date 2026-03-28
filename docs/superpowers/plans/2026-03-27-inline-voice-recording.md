# Inline Voice Recording Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move voice recording out of the standalone `RecordingModal` and embed it into `AddExpenseModal`, `AddEditGoalModal`, and `AddEditCategoryModal`, with a Record button above Save in each modal's footer.

**Architecture:** Each modal gets its own `useVoiceExpense` instance, a `voiceStep: 'form' | 'recording'` toggle, and the pulse animation state from the old `RecordingModal`. The recording view (big animated mic, ListeningIndicator, error card, hint footer) replaces the scroll content while recording. On completion, fields auto-fill and the modal returns to form view. A shared `utils/voiceMatch.ts` provides the fuzzy name-matching utility used by AddExpenseModal for category and goal matching.

**Tech Stack:** React Native (Expo), TypeScript, `expo-av` (via `useVoiceExpense`), Firebase Cloud Functions, NativeWind

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `utils/voiceMatch.ts` | **Create** | Generic fuzzy match for categories/goals |
| `components/AddExpenseModal.tsx` | **Modify** | Add voice recording step + Record button |
| `components/AddEditGoalModal.tsx` | **Modify** | Add voice recording step + Record button |
| `components/AddEditCategoryModal.tsx` | **Modify** | Add voice recording step + Record button |
| `app/(tabs)/overview.tsx` | **Modify** | Mic FAB opens AddExpenseModal; remove RecordingModal |
| `components/RecordingModal.tsx` | **Delete** | Replaced by inline recording in each modal |

---

## Task 1: Create `utils/voiceMatch.ts`

**Files:**
- Create: `utils/voiceMatch.ts`

- [ ] **Step 1: Create the file**

```ts
export function normalizeMatchName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

export function findBestNameMatch<T extends { name: string }>(
  items: T[],
  rawName: string
): T | null {
  if (!rawName.trim()) return null;
  const normalizedTarget = normalizeMatchName(rawName);
  const exact = items.find((item) => normalizeMatchName(item.name) === normalizedTarget);
  if (exact) return exact;
  const partial = items.find((item) => {
    const n = normalizeMatchName(item.name);
    return n.includes(normalizedTarget) || normalizedTarget.includes(n);
  });
  return partial ?? null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `utils/voiceMatch.ts`.

- [ ] **Step 3: Commit**

```bash
git add utils/voiceMatch.ts
git commit -m "feat: add shared voiceMatch utility for fuzzy name matching"
```

---

## Task 2: Update `AddExpenseModal.tsx`

**Files:**
- Modify: `components/AddExpenseModal.tsx`

This task embeds the full recording step from `RecordingModal` into `AddExpenseModal`. The modal gains a `voiceStep` state. When `'recording'`, the scroll content is replaced by the recording UI. When `'form'`, the normal form shows with a Record button above Save.

- [ ] **Step 1: Update imports**

Replace the existing import block at the top of `components/AddExpenseModal.tsx`:

```tsx
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
```

- [ ] **Step 2: Add `onVoiceSaved` to props interface**

Replace the existing `AddExpenseModalProps` interface:

```tsx
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
```

- [ ] **Step 3: Destructure the new prop**

Replace the component signature destructuring:

```tsx
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
```

- [ ] **Step 4: Add voice hook and new state below existing state declarations**

After the line `const { addTransaction } = useTransactions(userId);`, add:

```tsx
  const {
    isRecording,
    isProcessing,
    error: voiceError,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording,
  } = useVoiceExpense();

  const [voiceStep, setVoiceStep] = useState<'form' | 'recording'>('form');
  const [animationSession, setAnimationSession] = useState(0);
  const [usedVoice, setUsedVoice] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
```

- [ ] **Step 5: Add pulse animation effect**

After the existing `React.useEffect` for `visible/initialCategory/defaultTab`, add:

```tsx
  React.useEffect(() => {
    const shouldAnimate = visible && voiceStep === 'recording' && !isProcessing;

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
        Animated.timing(pulse, { toValue: 1.08, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();

    return () => { stopPulse(); };
  }, [animationSession, isProcessing, pulse, voiceStep, visible]);
```

- [ ] **Step 6: Update `resetFields` to include voice state**

Replace the existing `resetFields` function:

```tsx
  function resetFields() {
    setTitle('');
    setAmount('');
    setCalculatorExpression('');
    setIsCalculatorVisible(false);
    setSelectedCategory(null);
    setSelectedGoal(null);
    setVoiceStep('form');
    setUsedVoice(false);
  }
```

- [ ] **Step 7: Make `handleClose` async and cancel recording**

Replace the existing `handleClose` function:

```tsx
  async function handleClose() {
    await cancelRecording();
    resetForm();
    onClose();
  }
```

- [ ] **Step 8: Add voice recording handlers**

After `handleClose`, add:

```tsx
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
    setVoiceStep('form');
  }
```

- [ ] **Step 9: Call `onVoiceSaved` in `handleSave` on success**

Inside the `try` block in `handleSave`, after `resetForm(); onClose();`, add:

```tsx
      if (usedVoice) onVoiceSaved?.();
```

So the success block reads:

```tsx
      resetForm();
      onClose();
      if (usedVoice) onVoiceSaved?.();
```

- [ ] **Step 10: Replace the ScrollView + Footer JSX**

Replace everything from `<ScrollView ...>` through the closing `</View>` of the footer (lines 213–312 in the original) with:

```tsx
            {voiceStep === 'recording' ? (
              <>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                  <Text
                    style={{ color: theme.textSecondary, fontSize: 18, lineHeight: 28, textAlign: 'center', marginBottom: 28, maxWidth: 320 }}>
                    {t('recording.instruction')}
                  </Text>

                  {isRecording && (
                    <View style={{ marginBottom: 16 }} key={`indicator-${animationSession}`}>
                      <ListeningIndicator />
                    </View>
                  )}

                  <Animated.View
                    key={`pulse-${animationSession}`}
                    style={{ transform: [{ scale: pulse }] }}>
                    <TouchableOpacity
                      onPress={isRecording ? handleStopAndTranscribe : handleStartRecording}
                      disabled={isProcessing}
                      style={{
                        width: 112, height: 112,
                        borderRadius: 56,
                        alignItems: 'center', justifyContent: 'center',
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

                  {Boolean(voiceError) && (
                    <View
                      style={{
                        marginTop: 18, borderRadius: 12, borderWidth: 1, padding: 12,
                        borderColor: '#F87171',
                        backgroundColor: isDarkMode ? '#7F1D1D33' : '#FEE2E2',
                      }}>
                      <Text style={{ fontSize: 13, color: theme.textPrimary }}>{voiceError}</Text>
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
                  <Text style={{ textAlign: 'center', fontSize: 13, color: theme.textSecondary }}>
                    {t('recording.footer')}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <ScrollView
                  style={{ width: '100%', paddingHorizontal: 24 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}>
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
                <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
                  <TouchableOpacity
                    onPress={() => { setVoiceStep('recording'); setAnimationSession((s) => s + 1); }}
                    disabled={saving}
                    style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 12, opacity: saving ? 0.7 : 1 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: '600' }}>
                      {t('recording.title')}
                    </Text>
                  </TouchableOpacity>
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
              </>
            )}
```

- [ ] **Step 11: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors in `AddExpenseModal.tsx`.

- [ ] **Step 12: Commit**

```bash
git add components/AddExpenseModal.tsx
git commit -m "feat: embed voice recording step in AddExpenseModal"
```

---

## Task 3: Update `AddEditGoalModal.tsx`

**Files:**
- Modify: `components/AddEditGoalModal.tsx`

- [ ] **Step 1: Update imports**

Replace the existing import block:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useVoiceExpense } from '../hooks/useVoiceExpense';
import { GoalWithProgress, NewGoal } from '../types';
import ListeningIndicator from './ListeningIndicator';
```

- [ ] **Step 2: Add voice state inside the component**

After the line `const [saving, setSaving] = useState(false);`, add:

```tsx
  const {
    isRecording,
    isProcessing,
    error: voiceError,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording,
  } = useVoiceExpense();

  const [voiceStep, setVoiceStep] = useState<'form' | 'recording'>('form');
  const [animationSession, setAnimationSession] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
```

- [ ] **Step 3: Add pulse animation effect**

After the existing `useEffect` (the one watching `visible` and `goal`), add:

```tsx
  useEffect(() => {
    const shouldAnimate = voiceStep === 'recording' && !isProcessing;

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
        Animated.timing(pulse, { toValue: 1.08, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();

    return () => { stopPulse(); };
  }, [animationSession, isProcessing, pulse, voiceStep]);
```

- [ ] **Step 4: Add voice handlers and update `handleClose`**

After the `handleSave` function, add:

```tsx
  async function handleClose() {
    await cancelRecording();
    setVoiceStep('form');
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
    if (result.amount > 0) setTargetAmount(result.amount.toString());
    setVoiceStep('form');
  }
```

- [ ] **Step 5: Replace `onRequestClose={onClose}` with `onRequestClose={handleClose}`**

In the `<Modal>` opening tag, change:

```tsx
      onRequestClose={handleClose}>
```

- [ ] **Step 6: Replace close button `onPress={onClose}` with `onPress={handleClose}`**

In the header close TouchableOpacity, change:

```tsx
              onPress={handleClose}
```

- [ ] **Step 7: Replace the ScrollView + Footer JSX**

Replace everything from the `<ScrollView ...>` through the closing footer `</View>` with:

```tsx
            {voiceStep === 'recording' ? (
              <>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 18, lineHeight: 28, textAlign: 'center', marginBottom: 28, maxWidth: 320 }}>
                    {t('recording.instruction')}
                  </Text>

                  {isRecording && (
                    <View style={{ marginBottom: 16 }} key={`indicator-${animationSession}`}>
                      <ListeningIndicator />
                    </View>
                  )}

                  <Animated.View key={`pulse-${animationSession}`} style={{ transform: [{ scale: pulse }] }}>
                    <TouchableOpacity
                      onPress={isRecording ? handleStopAndTranscribe : handleStartRecording}
                      disabled={isProcessing}
                      style={{
                        width: 112, height: 112, borderRadius: 56,
                        alignItems: 'center', justifyContent: 'center',
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

                  {Boolean(voiceError) && (
                    <View style={{ marginTop: 18, borderRadius: 12, borderWidth: 1, padding: 12, borderColor: '#F87171', backgroundColor: theme.isDark ? '#7F1D1D33' : '#FEE2E2' }}>
                      <Text style={{ fontSize: 13, color: theme.textPrimary }}>{voiceError}</Text>
                    </View>
                  )}
                </View>

                <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
                  <Text style={{ textAlign: 'center', fontSize: 13, color: theme.textSecondary }}>
                    {t('recording.footer')}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <ScrollView style={{ paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
                  {/* Name */}
                  <Text style={labelStyle}>{t('addGoal.nameLabel')}</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('addGoal.namePlaceholder')}
                    placeholderTextColor={theme.textTertiary}
                    style={[inputStyle, { marginBottom: 20 }]}
                  />

                  {/* Target amount */}
                  <Text style={labelStyle}>{t('addGoal.targetLabel', { currency })}</Text>
                  <TextInput
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    placeholder={t('addGoal.targetPlaceholder')}
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="decimal-pad"
                    style={[inputStyle, { marginBottom: 20 }]}
                  />

                  {/* Icon picker */}
                  <Text style={[labelStyle, { marginBottom: 12 }]}>{t('addGoal.iconLabel')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {GOAL_ICONS.map((iconName) => {
                      const isSelected = selectedIcon === iconName;
                      const color = GOAL_COLORS[selectedColorIdx];
                      return (
                        <TouchableOpacity
                          key={iconName}
                          onPress={() => setSelectedIcon(iconName)}
                          style={{
                            width: 48, height: 48, borderRadius: 14,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: isSelected ? (theme.isDark ? color.dark + '33' : color.light) : theme.cardBg,
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? color.dark : theme.border,
                          }}>
                          <Ionicons name={iconName} size={22} color={isSelected ? color.dark : theme.textTertiary} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Color picker */}
                  <Text style={[labelStyle, { marginBottom: 12 }]}>{t('addGoal.colorLabel')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                    {GOAL_COLORS.map((color, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedColorIdx(idx)}
                        style={{
                          width: 36, height: 36, borderRadius: 18,
                          backgroundColor: color.dark,
                          borderWidth: selectedColorIdx === idx ? 3 : 0,
                          borderColor: theme.textPrimary,
                        }}
                      />
                    ))}
                  </View>

                  {/* Delete (edit mode only) */}
                  {goal && onDelete && (
                    <TouchableOpacity
                      onPress={() => { handleClose(); onDelete(goal.id); }}
                      style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 16, backgroundColor: '#EF444415', marginBottom: 8 }}>
                      <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>
                        {t('goals.deleteTitle')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {/* Footer */}
                <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
                  <TouchableOpacity
                    onPress={() => { setVoiceStep('recording'); setAnimationSession((s) => s + 1); }}
                    disabled={saving}
                    style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 12, opacity: saving ? 0.7 : 1 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: '600' }}>
                      {t('recording.title')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{ backgroundColor: theme.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <ActivityIndicator color="#fff" /> : (
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{t('addGoal.save')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
```

- [ ] **Step 8: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors in `AddEditGoalModal.tsx`.

- [ ] **Step 9: Commit**

```bash
git add components/AddEditGoalModal.tsx
git commit -m "feat: embed voice recording step in AddEditGoalModal"
```

---

## Task 4: Update `AddEditCategoryModal.tsx`

**Files:**
- Modify: `components/AddEditCategoryModal.tsx`

- [ ] **Step 1: Update imports**

Add `Animated` to the react-native import list, and add `useRef` to the React import, and add the new hook/component imports:

Replace the existing import block:

```tsx
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
```

- [ ] **Step 2: Add voice state inside the component**

After the line `const [saving, setSaving] = useState(false);`, add:

```tsx
  const {
    isRecording,
    isProcessing,
    error: voiceError,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording,
  } = useVoiceExpense();

  const [voiceStep, setVoiceStep] = useState<'form' | 'recording'>('form');
  const [animationSession, setAnimationSession] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
```

- [ ] **Step 3: Add pulse animation effect**

After the existing `useEffect` (watching `category` and `visible`), add:

```tsx
  useEffect(() => {
    const shouldAnimate = voiceStep === 'recording' && !isProcessing;

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
        Animated.timing(pulse, { toValue: 1.08, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();

    return () => { stopPulse(); };
  }, [animationSession, isProcessing, pulse, voiceStep]);
```

- [ ] **Step 4: Update `handleClose` to cancel recording and reset voice state**

Replace the existing `handleClose` function:

```tsx
  async function handleClose() {
    await cancelRecording();
    setVoiceStep('form');
    resetForm();
    onClose();
  }
```

- [ ] **Step 5: Add voice handlers after `handleDeletePress`**

After `handleDeletePress`, add:

```tsx
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
    setVoiceStep('form');
  }
```

- [ ] **Step 6: Replace the ScrollView + Footer JSX**

Replace everything from `{/* Scrollable form */}` through the closing `{/* Save button — pinned footer */}` `</View>` with:

```tsx
            {voiceStep === 'recording' ? (
              <>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 18, lineHeight: 28, textAlign: 'center', marginBottom: 28, maxWidth: 320 }}>
                    {t('recording.instruction')}
                  </Text>

                  {isRecording && (
                    <View style={{ marginBottom: 16 }} key={`indicator-${animationSession}`}>
                      <ListeningIndicator />
                    </View>
                  )}

                  <Animated.View key={`pulse-${animationSession}`} style={{ transform: [{ scale: pulse }] }}>
                    <TouchableOpacity
                      onPress={isRecording ? handleStopAndTranscribe : handleStartRecording}
                      disabled={isProcessing}
                      style={{
                        width: 112, height: 112, borderRadius: 56,
                        alignItems: 'center', justifyContent: 'center',
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

                  {Boolean(voiceError) && (
                    <View style={{ marginTop: 18, borderRadius: 12, borderWidth: 1, padding: 12, borderColor: '#F87171', backgroundColor: isDarkMode ? '#7F1D1D33' : '#FEE2E2' }}>
                      <Text style={{ fontSize: 13, color: theme.textPrimary }}>{voiceError}</Text>
                    </View>
                  )}
                </View>

                <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
                  <Text style={{ textAlign: 'center', fontSize: 13, color: theme.textSecondary }}>
                    {t('recording.footer')}
                  </Text>
                </View>
              </>
            ) : (
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
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: 1, color: theme.textPrimary }}
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
                      style={{ backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: 1, color: theme.textPrimary }}
                    />

                    {isEdit && (
                      <TouchableOpacity
                        className="items-center justify-center rounded-2xl px-4 py-2"
                        style={{ backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }}
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
                        <Text className="mb-1 text-[10px] font-semibold" style={{ color: theme.textSecondary }}>
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
                            backgroundColor: isSelected ? (isDarkMode ? selectedColor.dark + '33' : selectedColor.light) : theme.cardBg,
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? selectedColor.dark : theme.border,
                          }}>
                          <Ionicons name={icon} size={22} color={isSelected ? selectedColor.dark : theme.textTertiary} />
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
                        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: theme.iconBg }}>
                          <Text className="text-[11px] font-semibold" style={{ color: theme.textTertiary }}>
                            {categoryTransactions.length}
                          </Text>
                        </View>
                      </View>

                      {categoryTransactions.length === 0 ? (
                        <View className="rounded-2xl px-4 py-4" style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                          <Text className="text-sm" style={{ color: theme.textTertiary }}>
                            {t('budget.noTransactions')}
                          </Text>
                        </View>
                      ) : (
                        <View className="overflow-hidden rounded-2xl" style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
                          {categoryTransactions.map((expense, index) => {
                            const formattedAmount = formatCurrencyAmount(Math.abs(expense.amount), currency, i18n.language);
                            const formattedDate = new Date(expense.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' });
                            return (
                              <View
                                key={expense.id}
                                className="flex-row items-center justify-between px-4 py-3"
                                style={{ borderBottomWidth: index === categoryTransactions.length - 1 ? 0 : 1, borderBottomColor: theme.border }}>
                                <View className="mr-3 flex-1">
                                  <Text numberOfLines={1} className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{expense.title}</Text>
                                  <Text className="mt-1 text-xs" style={{ color: theme.textTertiary }}>{formattedDate}</Text>
                                </View>
                                <Text className="text-sm font-bold" style={{ color: theme.textPrimary }}>{formattedAmount}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Delete button */}
                  {isEdit && onDelete && (
                    <TouchableOpacity
                      onPress={handleDeletePress}
                      disabled={saving || deleting}
                      className="mb-4 flex-row items-center justify-center gap-1.5 self-center rounded-xl border px-4 py-2"
                      style={{ borderColor: '#F87171', opacity: saving || deleting ? 0.5 : 1 }}>
                      {deleting ? (
                        <ActivityIndicator color="#F87171" size="small" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={15} color="#F87171" />
                          <Text className="text-sm font-semibold" style={{ color: '#F87171' }}>
                            {t('budget.deleteTitle')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {/* Save button — pinned footer */}
                <View
                  className="px-6 pt-3"
                  style={{ paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
                  <TouchableOpacity
                    onPress={() => { setVoiceStep('recording'); setAnimationSession((s) => s + 1); }}
                    disabled={saving || deleting}
                    className="mb-3 items-center rounded-2xl border py-3.5"
                    style={{ borderColor: theme.border, opacity: saving || deleting ? 0.7 : 1 }}>
                    <Text className="text-[15px] font-semibold" style={{ color: theme.textSecondary }}>
                      {t('recording.title')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving || deleting}
                    className="items-center rounded-2xl py-4"
                    style={{ backgroundColor: theme.purple, opacity: saving || deleting ? 0.7 : 1 }}>
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
            )}
```

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors in `AddEditCategoryModal.tsx`.

- [ ] **Step 8: Commit**

```bash
git add components/AddEditCategoryModal.tsx
git commit -m "feat: embed voice recording step in AddEditCategoryModal"
```

---

## Task 5: Update `overview.tsx` — remove RecordingModal, wire mic FAB to AddExpenseModal

**Files:**
- Modify: `app/(tabs)/overview.tsx`

The mic FAB currently opens `RecordingModal`. After this task it opens `AddExpenseModal` (same modal as the `+` FAB). `incrementVoiceUsage` is passed as `onVoiceSaved`.

- [ ] **Step 1: Remove RecordingModal import**

Remove this line:

```tsx
import { RecordingModal } from '../../components/RecordingModal';
```

- [ ] **Step 2: Remove `recModalVisible` state**

Remove this line:

```tsx
  const [recModalVisible, setRecModalVisible] = useState(false);
```

- [ ] **Step 3: Change mic FAB `onPress` to open `modalVisible`**

Replace:

```tsx
            setRecModalVisible(true);
```

with:

```tsx
            setModalVisible(true);
```

- [ ] **Step 4: Add `onVoiceSaved` prop to the existing `AddExpenseModal` usage**

Replace the existing `<AddExpenseModal .../>` block:

```tsx
      {user && (
        <AddExpenseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          userId={user.uid}
          categories={categories}
          goals={goals}
          onVoiceSaved={incrementVoiceUsage}
        />
      )}
```

- [ ] **Step 5: Remove the RecordingModal JSX block**

Remove:

```tsx
      {user && (
        <RecordingModal
          visible={recModalVisible}
          onClose={() => setRecModalVisible(false)}
          userId={user.uid}
          onExpenseSaved={incrementVoiceUsage}
        />
      )}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors in `overview.tsx`.

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/overview.tsx
git commit -m "feat: wire mic FAB to AddExpenseModal with onVoiceSaved, remove RecordingModal usage"
```

---

## Task 6: Delete `RecordingModal.tsx`

**Files:**
- Delete: `components/RecordingModal.tsx`

- [ ] **Step 1: Confirm no remaining imports**

```bash
grep -r "RecordingModal" --include="*.tsx" --include="*.ts" .
```

Expected: no results (or only the file itself).

- [ ] **Step 2: Delete the file**

```bash
rm components/RecordingModal.tsx
```

- [ ] **Step 3: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors across all files.

- [ ] **Step 4: Lint check**

```bash
npm run lint
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete RecordingModal — functionality moved inline to each modal"
```
