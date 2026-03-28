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

  const [budgetsExpanded, setBudgetsExpanded] = useState(true);
  const [goalsExpanded, setGoalsExpanded] = useState(true);

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [detailGoal, setDetailGoal] = useState<GoalWithProgress | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overBudgetAmount = Math.max(0, totalSpent - totalBudget);
  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = totalSpent > totalBudget;
  const now = new Date();
  const monthLabel = now.toLocaleString(i18n.language, { month: 'long', year: 'numeric' });

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

  const budgetBarColor = isOverBudget ? '#EF4444' : theme.purple;
  const remainingColor = isOverBudget ? '#EF4444' : '#10B981';

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
        <View className="px-6 pb-4 pt-16">
          <View className="flex-row items-start justify-between">
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: theme.textTertiary,
                  marginBottom: 4,
                }}>
                {t('goals.title')}
              </Text>
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                  color: theme.textPrimary,
                }}>
                {monthLabel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.iconBg,
                marginTop: 8,
              }}>
              <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Budget Summary Card ─────────────────────────────────────────── */}
        <View className="mb-6 px-6">
          <View
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderWidth: 1,
              borderColor: theme.border,
            }}>
            {/* Top accent strip */}
            <View style={{ height: 4, backgroundColor: budgetBarColor, opacity: 0.8 }} />

            <View style={{ padding: 24 }}>
              {/* Central stat */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textTertiary, marginBottom: 6, letterSpacing: 0.5 }}>
                  {t('budget.totalSpent')}
                </Text>
                <Text
                  style={{
                    fontSize: 44,
                    fontWeight: '900',
                    letterSpacing: -2,
                    color: theme.textPrimary,
                    lineHeight: 48,
                  }}>
                  {formatCurrencyAmount(totalSpent, currency, i18n.language)}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    height: 10,
                    borderRadius: 10,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 10,
                      width: `${overallPercentage}%`,
                      backgroundColor: budgetBarColor,
                    }}
                  />
                </View>
                <Text
                  style={{
                    marginTop: 6,
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: '600',
                    color: theme.textTertiary,
                    letterSpacing: 0.3,
                  }}>
                  {t('budget.budgetUsed', { percent: Math.round(overallPercentage) })}
                </Text>
              </View>

              {/* Stats grid */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    padding: 14,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    alignItems: 'center',
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textTertiary, letterSpacing: 0.5, marginBottom: 4 }}>
                    {t('budget.totalBudget').toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5 }}>
                    {formatCurrencyAmount(totalBudget, currency, i18n.language, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    padding: 14,
                    backgroundColor: isOverBudget
                      ? 'rgba(239,68,68,0.08)'
                      : isDarkMode ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                    alignItems: 'center',
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: remainingColor, letterSpacing: 0.5, marginBottom: 4, opacity: 0.8 }}>
                    {(isOverBudget ? t('budget.overBudget') : t('budget.remaining')).toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: remainingColor, letterSpacing: -0.5 }}>
                    {formatCurrencyAmount(isOverBudget ? overBudgetAmount : totalRemaining, currency, i18n.language, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Budgets Section ─────────────────────────────────────────────── */}
        <View style={{ marginBottom: 8, paddingHorizontal: 24 }}>
          {/* Section header */}
          <TouchableOpacity
            onPress={() => setBudgetsExpanded((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            {/* Left accent */}
            <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: theme.purple, marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.3, color: theme.textPrimary }}>
              {t('goals.budgetsSection')}
            </Text>
            {categories.length > 0 && (
              <View
                style={{
                  backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)',
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginRight: 8,
                }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.purple }}>
                  {categories.length}
                </Text>
              </View>
            )}
            <Ionicons
              name={budgetsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.textTertiary}
            />
          </TouchableOpacity>

          {budgetsExpanded && (
            budgetLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="large" color={theme.purple} />
              </View>
            ) : categories.length === 0 ? (
              <TouchableOpacity
                onPress={openAddBudget}
                style={{
                  alignItems: 'center',
                  paddingVertical: 28,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: theme.border,
                }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: isDarkMode ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                  <Ionicons name="wallet-outline" size={26} color={theme.purple} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>
                  {t('budget.noCategories')}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textTertiary, marginTop: 4 }}>
                  Tap to add your first budget
                </Text>
              </TouchableOpacity>
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

        {/* ─── Divider ─────────────────────────────────────────────────────── */}
        <View
          style={{
            height: 1,
            marginHorizontal: 24,
            marginVertical: 16,
            backgroundColor: theme.border,
          }}
        />

        {/* ─── Goals Section ───────────────────────────────────────────────── */}
        <View style={{ marginBottom: 32, paddingHorizontal: 24 }}>
          {/* Section header */}
          <TouchableOpacity
            onPress={() => setGoalsExpanded((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            {/* Left accent */}
            <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: '#10B981', marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.3, color: theme.textPrimary }}>
              {t('goals.goalsSection')}
            </Text>
            {goals.length > 0 && (
              <View
                style={{
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginRight: 8,
                }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>
                  {goals.length}
                </Text>
              </View>
            )}
            <Ionicons
              name={goalsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.textTertiary}
            />
          </TouchableOpacity>

          {goalsExpanded && (
            goalsLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : goals.length === 0 ? (
              <TouchableOpacity
                onPress={openAddGoal}
                style={{
                  alignItems: 'center',
                  paddingVertical: 28,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: theme.border,
                }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                  <Ionicons name="flag-outline" size={26} color="#10B981" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>
                  {t('goals.noGoals')}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textTertiary, marginTop: 4 }}>
                  {t('goals.tapAddGoal')}
                </Text>
              </TouchableOpacity>
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

        <View style={{ height: 100 }} />
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

      {/* FAB backdrop */}
      {fabExpanded && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFabExpanded(false)}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
        />
      )}

      {/* FAB sub-actions */}
      {fabExpanded && (
        <View style={{ position: 'absolute', bottom: 96, right: 24, alignItems: 'flex-end', gap: 10 }}>
          <TouchableOpacity
            onPress={() => { setFabExpanded(false); openAddBudget(); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: 22,
              paddingHorizontal: 18,
              paddingVertical: 13,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <Text style={{ color: theme.purple, fontWeight: '800', fontSize: 15 }}>Budget</Text>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.purple, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="wallet-outline" size={18} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setFabExpanded(false); openAddGoal(); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: 22,
              paddingHorizontal: 18,
              paddingVertical: 13,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 15 }}>Goal</Text>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flag-outline" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB main button */}
      <TouchableOpacity
        onPress={() => setFabExpanded((v) => !v)}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#10B981',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.28 : 0.35,
          shadowRadius: 10,
          elevation: 8,
        }}>
        <Ionicons name={fabExpanded ? 'close' : 'add'} size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
