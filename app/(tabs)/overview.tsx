import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
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
import { AddExpenseModal } from '../../components/AddExpenseModal';
import { EditExpenseModal } from '../../components/EditExpenseModal';
import { ExpenseItem } from '../../components/ExpenseItem';
import { PaywallModal } from '../../components/PaywallModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';
import { useGoals } from '../../hooks/useGoals';
import { useTransactions } from '../../hooks/useTransactions';

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isYesterday(dateStr: string) {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

export default function OverviewScreen() {
  const { t } = useTranslation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { tier, trialDaysLeft } = useSubscription();
  const {
    expenses,
    income,
    allTransactions,
    loading: expensesLoading,
    updateExpense,
    deleteExpense,
  } = useTransactions(user?.uid);
  const { categories, loading: budgetLoading } = useBudget(user?.uid);
  const { goals } = useGoals(user?.uid, income);

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<import('../../types').Expense | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fabShadowColor = isDarkMode ? '#FFFFFF' : '#000000';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Data is real-time via onSnapshot, so we just simulate a refresh for UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const loading = expensesLoading || budgetLoading;

  const goalNameById = useMemo(
    () => Object.fromEntries(goals.map((goal) => [goal.id, goal.name])),
    [goals]
  );

  const todayTransactions = useMemo(
    () => allTransactions.filter((transaction) => isToday(transaction.date)),
    [allTransactions]
  );
  const yesterdayTransactions = useMemo(
    () => allTransactions.filter((transaction) => isYesterday(transaction.date)),
    [allTransactions]
  );
  const olderTransactions = useMemo(
    () =>
      allTransactions.filter(
        (transaction) => !isToday(transaction.date) && !isYesterday(transaction.date)
      ),
    [allTransactions]
  );

  const derivedBudgetLeftByExpenseId = useMemo(() => {
    const remainingByExpenseId: Record<string, number> = {};

    categories.forEach((category) => {
      const periodStartTime = new Date(category.periodStart ?? 0).getTime();
      const categoryExpenses = expenses
        .filter((expense) => {
          const matchesCategory =
            expense.categoryId === category.id ||
            (!expense.categoryId &&
              (expense.category ?? '').trim().toLowerCase() === category.name.trim().toLowerCase());

          return matchesCategory && new Date(expense.date).getTime() >= periodStartTime;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let runningSpent = 0;
      categoryExpenses.forEach((expense) => {
        runningSpent += expense.amount;
        remainingByExpenseId[expense.id] = category.budget - runningSpent;
      });
    });

    return remainingByExpenseId;
  }, [categories, expenses]);

  function openEditExpense(expense: import('../../types').Expense) {
    setEditingExpense(expense);
    setEditModalVisible(true);
  }

  function closeEditExpense() {
    setEditModalVisible(false);
    setEditingExpense(null);
  }

  async function handleUpdateExpense(id: string, changes: any) {
    await updateExpense(id, changes);
  }

  async function handleDeleteExpense(id: string) {
    Alert.alert(t('overview.deleteTitle'), t('overview.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(id);
        },
      },
    ]);
  }

  function getTransactionForDisplay(transaction: import('../../types').Expense) {
    if (transaction.type === 'income') {
      return {
        ...transaction,
        category: transaction.goalId
          ? goalNameById[transaction.goalId] ?? t('addTransaction.incomeTab')
          : t('addTransaction.incomeTab'),
        budgetLeft: undefined,
      };
    }

    return transaction;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.purple}
            colors={[theme.purple]}
          />
        }>
        {/* Trial Banner */}
        {tier === 'trial' && (
          <TouchableOpacity
            onPress={() => setPaywallVisible(true)}
            className="mx-6 mb-2 flex-row items-center justify-center rounded-xl px-4 py-2.5"
            style={{ backgroundColor: isDarkMode ? 'rgba(139,92,246,0.15)' : '#EDE9FE' }}>
            <Ionicons name="diamond-outline" size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
            <Text className="text-xs font-semibold" style={{ color: '#8B5CF6' }}>
              {t('overview.trialBanner', { days: trialDaysLeft })}
            </Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            {t('overview.title')}
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {loading && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color={theme.purple} />
            <Text className="mt-3 text-sm" style={{ color: theme.textTertiary }}>
              {t('overview.loading')}
            </Text>
          </View>
        )}

        {/* Today Section */}
        {!loading && (
          <View className="mb-4 px-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                {t('overview.today')}
              </Text>
            </View>
            {todayTransactions.length === 0 ? (
              <View
                className="rounded-2xl px-6 py-6"
                style={[
                  { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                  !isDarkMode && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
                ]}>
                <Text className="text-center text-sm" style={{ color: theme.textTertiary }}>
                  {t('overview.noExpensesToday')}
                </Text>
              </View>
            ) : (
              <View
                className="overflow-hidden rounded-2xl"
                style={[
                  { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                  !isDarkMode && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
                ]}>
                {todayTransactions.map((expense, index) => (
                  <ExpenseItem
                    key={expense.id}
                    expense={getTransactionForDisplay(expense)}
                    flat
                    isLast={index === todayTransactions.length - 1}
                    budgetLeftOverride={expense.type === 'expense' ? derivedBudgetLeftByExpenseId[expense.id] ?? null : null}
                    onPress={expense.type === 'expense' ? openEditExpense : undefined}
                    onDelete={handleDeleteExpense}
                    onEdit={expense.type === 'expense' ? openEditExpense : undefined}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Yesterday Section */}
        {!loading && yesterdayTransactions.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-4 text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('overview.yesterday')}
            </Text>
            <View
              className="overflow-hidden rounded-2xl"
              style={[
                { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                !isDarkMode && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
              ]}>
              {yesterdayTransactions.map((expense, index) => (
                <ExpenseItem
                  key={expense.id}
                  expense={getTransactionForDisplay(expense)}
                  flat
                  isLast={index === yesterdayTransactions.length - 1}
                  budgetLeftOverride={expense.type === 'expense' ? derivedBudgetLeftByExpenseId[expense.id] ?? null : null}
                  onPress={expense.type === 'expense' ? openEditExpense : undefined}
                  onDelete={handleDeleteExpense}
                  onEdit={expense.type === 'expense' ? openEditExpense : undefined}
                />
              ))}
            </View>
          </View>
        )}

        {/* Past Section */}
        {!loading && olderTransactions.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-4 text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('overview.past')}
            </Text>
            <View
              className="overflow-hidden rounded-2xl"
              style={[
                { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
                !isDarkMode && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
              ]}>
              {olderTransactions.map((expense, index) => (
                <ExpenseItem
                  key={expense.id}
                  expense={getTransactionForDisplay(expense)}
                  flat
                  isLast={index === olderTransactions.length - 1}
                  budgetLeftOverride={expense.type === 'expense' ? derivedBudgetLeftByExpenseId[expense.id] ?? null : null}
                  onPress={expense.type === 'expense' ? openEditExpense : undefined}
                  onDelete={handleDeleteExpense}
                  onEdit={expense.type === 'expense' ? openEditExpense : undefined}
                  showDate
                />
              ))}
            </View>
          </View>
        )}

        {/* Bottom Padding for floating buttons */}
        {!loading && <View className="h-32" />}
      </ScrollView>

      {/* Quick Add Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full shadow-lg"
        style={{
          backgroundColor: theme.purple,
          shadowColor: fabShadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.26 : 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      {user && (
        <AddExpenseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          userId={user.uid}
          categories={categories}
          goals={goals}
        />
      )}

      {user && (
        <EditExpenseModal
          visible={editModalVisible}
          onClose={closeEditExpense}
          expense={editingExpense}
          userId={user.uid}
          onSave={handleUpdateExpense}
          onDelete={handleDeleteExpense}
        />
      )}

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
