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
import { GoalDetailModal } from '../../components/GoalDetailModal';
import { GoalItem } from '../../components/GoalItem';
import { formatCurrencyAmount } from '../../config/currencies';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';
import { useGoals } from '../../hooks/useGoals';
import { useTransactions } from '../../hooks/useTransactions';
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

  // ─── Collapsible state ────────────────────────────────────────────────────
  const [budgetsExpanded, setBudgetsExpanded] = useState(true);
  const [goalsExpanded, setGoalsExpanded] = useState(true);

  // ─── Budget modal state ───────────────────────────────────────────────────
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  // ─── Goal modal state ─────────────────────────────────────────────────────
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [detailGoal, setDetailGoal] = useState<GoalWithProgress | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // ─── Budget handlers ──────────────────────────────────────────────────────
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

  // ─── Goal handlers ────────────────────────────────────────────────────────
  function openAddGoal() {
    setEditingGoal(null);
    setGoalModalVisible(true);
  }

  function openEditGoal(goal: GoalWithProgress) {
    setEditingGoal(goal);
    setGoalModalVisible(true);
  }

  function openGoalDetail(goal: GoalWithProgress) {
    setDetailGoal(goal);
    setDetailModalVisible(true);
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

  // ─── Derived ──────────────────────────────────────────────────────────────
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const categoryTransactions = editingCategory
    ? expenses.filter(
        (e) =>
          e.categoryId === editingCategory.id ||
          (!e.categoryId && e.category?.trim().toLowerCase() === editingCategory.name.trim().toLowerCase())
      )
    : [];

  const detailContributions = detailGoal
    ? income.filter((txn) => txn.goalId === detailGoal.id)
    : [];

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purple} colors={[theme.purple]} />
        }>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            {t('goals.title')}
          </Text>
          <TouchableOpacity onPress={toggleTheme} className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Budget Summary Card */}
        <View className="mb-6 px-6">
          <View className="rounded-[32px] p-6" style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: theme.iconBg }}>
                <Ionicons name="calendar-clear" size={14} color={theme.purple} />
                <Text className="text-xs font-semibold" style={{ color: theme.purple }}>{monthLabel}</Text>
              </View>
            </View>
            <View className="mb-6 flex-row items-end justify-between">
              <View>
                <Text className="mb-1 text-sm font-medium" style={{ color: theme.textTertiary }}>{t('budget.totalSpent')}</Text>
                <Text className="text-4xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
                  {formatCurrencyAmount(totalSpent, currency, i18n.language)}
                </Text>
              </View>
              <View className="items-end pb-1">
                <Text className="mb-1 text-xs font-medium" style={{ color: theme.textTertiary }}>{t('budget.totalBudget')}</Text>
                <Text className="text-lg font-bold" style={{ color: theme.textSecondary }}>
                  {formatCurrencyAmount(totalBudget, currency, i18n.language, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: totalRemaining > 0 ? '#10B981' : '#EF4444' }}>
                  {totalRemaining > 0 ? t('budget.remaining') : t('budget.overBudget')}
                </Text>
                <Text className="text-sm font-bold" style={{ color: totalRemaining > 0 ? '#10B981' : '#EF4444' }}>
                  {formatCurrencyAmount(Math.abs(totalBudget - totalSpent), currency, i18n.language)}
                </Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full" style={{ backgroundColor: theme.border }}>
                <View className="h-full rounded-full" style={{ width: `${Math.min(overallPercentage, 100)}%`, backgroundColor: overallPercentage > 100 ? '#EF4444' : theme.purple }} />
              </View>
              <Text className="mt-2 text-right text-[10px] font-medium" style={{ color: theme.textTertiary }}>
                {t('budget.budgetUsed', { percent: Math.round(overallPercentage) })}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Budgets Section ─────────────────────────────────────────────── */}
        <View className="mb-4 px-6">
          <TouchableOpacity
            onPress={() => setBudgetsExpanded((v) => !v)}
            className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('goals.budgetsSection')}
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={openAddBudget} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.purple }}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <Ionicons name={budgetsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textTertiary} />
            </View>
          </TouchableOpacity>

          {budgetsExpanded && (
            budgetLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={theme.purple} />
              </View>
            ) : categories.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="wallet-outline" size={40} color={theme.textTertiary} />
                <Text className="mt-3 text-sm font-semibold" style={{ color: theme.textSecondary }}>{t('budget.noCategories')}</Text>
              </View>
            ) : (
              categories.map((cat) => (
                <BudgetCategoryItem
                  key={cat.id}
                  category={cat}
                  onPress={openEditBudget}
                  onDelete={handleDeleteBudget}
                  onEdit={openEditBudget}
                />
              ))
            )
          )}
        </View>

        {/* ─── Goals Section ───────────────────────────────────────────────── */}
        <View className="mb-8 px-6">
          <TouchableOpacity
            onPress={() => setGoalsExpanded((v) => !v)}
            className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('goals.goalsSection')}
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={openAddGoal} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.purple }}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <Ionicons name={goalsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textTertiary} />
            </View>
          </TouchableOpacity>

          {goalsExpanded && (
            goalsLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={theme.purple} />
              </View>
            ) : goals.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="flag-outline" size={40} color={theme.textTertiary} />
                <Text className="mt-3 text-sm font-semibold" style={{ color: theme.textSecondary }}>{t('goals.noGoals')}</Text>
                <Text className="mt-1 text-center text-sm" style={{ color: theme.textTertiary }}>{t('goals.tapAddGoal')}</Text>
              </View>
            ) : (
              goals.map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onPress={openGoalDetail}
                  onDelete={handleDeleteGoal}
                  onEdit={openEditGoal}
                />
              ))
            )
          )}
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
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
      />

      <GoalDetailModal
        visible={detailModalVisible}
        onClose={() => { setDetailModalVisible(false); setDetailGoal(null); }}
        goal={detailGoal}
        contributions={detailContributions}
      />
    </View>
  );
}
