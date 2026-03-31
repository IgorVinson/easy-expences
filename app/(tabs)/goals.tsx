import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AddEditCategoryModal } from '../../components/AddEditCategoryModal';
import { AddEditGoalModal } from '../../components/AddEditGoalModal';
import { BudgetCategoryItem } from '../../components/BudgetCategoryItem';
import { GoalItem } from '../../components/GoalItem';
import { formatCurrencyAmount } from '../../config/currencies';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';
import { useGoals } from '../../hooks/useGoals';
import { useTransactions } from '../../hooks/useTransactions';
import { styles } from '../../styles';
import { BudgetCategory, GoalWithProgress, NewBudgetCategory, NewGoal } from '../../types';

export default function GoalsScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { currency } = useCurrency();

  const { expenses, income, updateTransaction } = useTransactions(user?.uid);
  const {
    categories,
    totalBudget,
    totalSpent,
    loading: budgetLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useBudget(user?.uid);
  const {
    goals,
    loading: goalsLoading,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoals(user?.uid, income);

  const [budgetsExpanded, setBudgetsExpanded] = useState(true);
  const [goalsExpanded, setGoalsExpanded] = useState(true);

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  function openAddBudget() {
    setEditingCategory(null);
    setBudgetModalVisible(true);
  }

  function openEditBudget(category: BudgetCategory) {
    setEditingCategory(category);
    setBudgetModalVisible(true);
  }

  async function handleSaveBudget(data: NewBudgetCategory, resetSpent?: boolean) {
    if (editingCategory) {
      const nextData = resetSpent
        ? { ...data, spent: 0, periodStart: new Date().toISOString() }
        : data;
      await updateCategory(editingCategory.id, nextData);

      const relatedExpenses = expenses.filter(
        (e) =>
          e.categoryId === editingCategory.id ||
          (!e.categoryId && e.category?.trim().toLowerCase() === editingCategory.name.trim().toLowerCase())
      );
      const requiresSync = relatedExpenses.some(
        (e) =>
          e.categoryId !== editingCategory.id ||
          e.category !== data.name ||
          e.icon !== data.icon ||
          e.colorLight !== data.colorLight ||
          e.colorDark !== data.colorDark
      );
      if (requiresSync) {
        await Promise.all(
          relatedExpenses.map((e) =>
            updateTransaction(e.id, {
              category: data.name,
              categoryId: editingCategory.id,
              icon: data.icon,
              colorLight: data.colorLight,
              colorDark: data.colorDark,
            })
          )
        );
      }
    } else {
      await addCategory(data);
    }
  }

  async function handleDeleteBudget(id: string) {
    Alert.alert(t('budget.deleteTitle'), t('budget.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCategory(id) },
    ]);
  }

  function openAddGoal() {
    setEditingGoal(null);
    setGoalModalVisible(true);
  }

  function openEditGoal(goal: GoalWithProgress) {
    setEditingGoal(goal);
    setGoalModalVisible(true);
  }

  async function handleSaveGoal(data: NewGoal) {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await addGoal(data);
    }
  }

  function handleDeleteGoal(id: string) {
    Alert.alert(t('goals.deleteTitle'), t('goals.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  }

  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overBudgetAmount = Math.max(0, totalSpent - totalBudget);
  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = totalSpent > totalBudget;

  const categoryTransactions = editingCategory
    ? expenses.filter(
        (e) =>
          e.categoryId === editingCategory.id ||
          (!e.categoryId && e.category?.trim().toLowerCase() === editingCategory.name.trim().toLowerCase())
      )
    : [];

  const goalContributions = editingGoal
    ? income.filter((txn) => txn.goalId === editingGoal.id)
    : [];

  const budgetBarColor = isOverBudget ? '#EF4444' : theme.purple;
  const remainingColor = isOverBudget ? '#EF4444' : '#10B981';
  const summaryItems = [
    {
      label: t('budget.totalBudget'),
      value: formatCurrencyAmount(totalBudget, currency, i18n.language, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      icon: 'wallet-outline' as const,
      color: theme.purple,
      bg: isDarkMode ? 'rgba(139,92,246,0.15)' : '#EDE9FE',
    },
    {
      label: t('budget.totalSpent'),
      value: formatCurrencyAmount(totalSpent, currency, i18n.language, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      icon: 'card-outline' as const,
      color: budgetBarColor,
      bg: isOverBudget
        ? 'rgba(239,68,68,0.1)'
        : isDarkMode
          ? 'rgba(14,165,233,0.15)'
          : '#E0F2FE',
    },
    {
      label: isOverBudget ? t('budget.overBudget') : t('budget.remaining'),
      value: formatCurrencyAmount(isOverBudget ? overBudgetAmount : totalRemaining, currency, i18n.language, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      icon: isOverBudget ? 'alert-circle-outline' : 'checkmark-circle-outline' as const,
      color: remainingColor,
      bg: isOverBudget
        ? 'rgba(239,68,68,0.1)'
        : isDarkMode
          ? 'rgba(16,185,129,0.15)'
          : '#D1FAE5',
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purple} colors={[theme.purple]} />
        }>

        {/* ─── Header ────────────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            {t('goals.title')}
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <View className="mb-6 px-6">
          <View
            className="rounded-2xl p-4"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                  {t('budget.budgetsOverview')}
                </Text>
                <Text className="mt-1 text-sm" style={{ color: theme.textSecondary }}>
                  {t('budget.budgetUsed', { percent: Math.round(overallPercentage) })}
                </Text>
              </View>
              <View
                className="rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: isOverBudget
                    ? 'rgba(239,68,68,0.1)'
                    : isDarkMode
                      ? 'rgba(139,92,246,0.15)'
                      : '#F3E8FF',
                }}>
                <Text className="text-xs font-semibold" style={{ color: isOverBudget ? '#EF4444' : theme.purple }}>
                  {Math.round(overallPercentage)}%
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <View
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${overallPercentage}%`, backgroundColor: budgetBarColor }}
                />
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {summaryItems.map((item) => (
                <View key={item.label} className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: item.bg }}>
                      <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={item.color} />
                    </View>
                    <Text className="ml-4 text-base font-medium" style={{ color: theme.textPrimary }}>
                      {item.label}
                    </Text>
                  </View>
                  <Text className="text-base font-semibold" style={{ color: item.color === theme.purple ? theme.textPrimary : item.color }}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="mb-6 px-6">
          <View className="mb-4 flex-row items-center">
            <Text className="flex-1 text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('goals.budgetsSection')}
            </Text>
            <TouchableOpacity onPress={() => setBudgetsExpanded((v) => !v)}>
              <Ionicons name={budgetsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          {budgetsExpanded && (budgetLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={theme.purple} />
            </View>
          ) : categories.length === 0 ? (
            <View
              className="rounded-2xl"
              style={[
                { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                !isDarkMode && styles.cardShadow,
              ]}>
              <TouchableOpacity
                onPress={openAddBudget}
                style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : '#EDE9FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                  <Ionicons name="wallet-outline" size={24} color={theme.purple} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>
                  {t('budget.noCategories')}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textTertiary, marginTop: 4 }}>
                  {t('goals.tapAddBudget')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              className="rounded-2xl"
              style={[
                { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                !isDarkMode && styles.cardShadow,
              ]}>
              {categories.map((cat, index) => (
                <BudgetCategoryItem
                  key={cat.id}
                  category={cat}
                  flat
                  isLast={index === categories.length - 1}
                  onPress={openEditBudget}
                  onDelete={handleDeleteBudget}
                  onEdit={openEditBudget}
                />
              ))}
            </View>
          ))}
        </View>

        <View className="mb-8 px-6">
          <View className="mb-4 flex-row items-center">
            <Text className="flex-1 text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('goals.goalsSection')}
            </Text>
            <TouchableOpacity onPress={() => setGoalsExpanded((v) => !v)}>
              <Ionicons name={goalsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          {goalsExpanded && (goalsLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={theme.success} />
            </View>
          ) : goals.length === 0 ? (
            <View
              className="rounded-2xl"
              style={[
                { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                !isDarkMode && styles.cardShadow,
              ]}>
              <TouchableOpacity
                onPress={openAddGoal}
                style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: theme.successBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                  <Ionicons name="flag-outline" size={24} color={theme.success} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>
                  {t('goals.noGoals')}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textTertiary, marginTop: 4 }}>
                  {t('goals.tapAddGoal')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              className="rounded-2xl"
              style={[
                { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                !isDarkMode && styles.cardShadow,
              ]}>
              {goals.map((goal, index) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  flat
                  isLast={index === goals.length - 1}
                  onPress={openEditGoal}
                  onDelete={handleDeleteGoal}
                  onEdit={openEditGoal}
                />
              ))}
            </View>
          ))}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Modals */}
      <AddEditCategoryModal
        visible={budgetModalVisible}
        onClose={() => { setBudgetModalVisible(false); setEditingCategory(null); }}
        category={editingCategory}
        categoryTransactions={categoryTransactions}
        onSave={handleSaveBudget}
        onDelete={handleDeleteBudget}
      />

      <AddEditGoalModal
        visible={goalModalVisible}
        onClose={() => { setGoalModalVisible(false); setEditingGoal(null); }}
        goal={editingGoal}
        contributions={goalContributions}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
      />

      {fabExpanded && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFabExpanded(false)}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}
        />
      )}

      {fabExpanded && (
        <View style={{ position: 'absolute', bottom: 96, right: 24, alignItems: 'flex-end', gap: 10 }}>
          <TouchableOpacity
            onPress={() => { setFabExpanded(false); openAddBudget(); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: theme.cardBg,
              borderRadius: 22,
              paddingHorizontal: 18,
              paddingVertical: 13,
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 15 }}>
              {t('goals.budgetsSection')}
            </Text>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : '#EDE9FE',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="wallet-outline" size={18} color={theme.purple} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setFabExpanded(false); openAddGoal(); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: theme.cardBg,
              borderRadius: 22,
              paddingHorizontal: 18,
              paddingVertical: 13,
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 15 }}>
              {t('goals.goalsSection')}
            </Text>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#D1FAE5',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="flag-outline" size={18} color="#10B981" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={() => setFabExpanded((v) => !v)}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.success,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: theme.success,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.22 : 0.28,
          shadowRadius: 10,
          elevation: 8,
        }}>
        <Ionicons name={fabExpanded ? 'close' : 'add'} size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
