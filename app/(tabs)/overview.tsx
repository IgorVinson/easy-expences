import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { RecordingModal } from '../../components/RecordingModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';
import { useExpenses } from '../../hooks/useExpenses';

export default function OverviewScreen() {
  const { t } = useTranslation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { canUseVoice, voiceRecordingsLeft, tier, trialDaysLeft, incrementVoiceUsage } = useSubscription();
  const {
    expenses,
    todayExpenses,
    yesterdayExpenses,
    olderExpenses,
    loading: expensesLoading,
    updateExpense,
    deleteExpense,
  } = useExpenses(user?.uid);
  const { categories, loading: budgetLoading } = useBudget(user?.uid);

  const [modalVisible, setModalVisible] = useState(false);
  const [recModalVisible, setRecModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<import('../../types').Expense | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const micPulse = useRef(new Animated.Value(0)).current;
  const fabShadowColor = isDarkMode ? '#FFFFFF' : '#000000';
  const micPulseColor = isDarkMode ? '#FFFFFF' : theme.purple;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Data is real-time via onSnapshot, so we just simulate a refresh for UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
      micPulse.setValue(0);
    };
  }, [micPulse]);

  const loading = expensesLoading || budgetLoading;

  const derivedBudgetLeftByExpenseId = useMemo(() => {
    const remainingByExpenseId: Record<string, number> = {};

    categories.forEach((category) => {
      const periodStartTime = new Date(category.periodStart ?? 0).getTime();
      const categoryExpenses = expenses
        .filter((expense) => {
          const matchesCategory =
            expense.categoryId === category.id ||
            (!expense.categoryId &&
              expense.category.trim().toLowerCase() === category.name.trim().toLowerCase());

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
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                {t('overview.today')}
              </Text>
            </View>
            {todayExpenses.length === 0 ? (
              <Text className="py-4 text-center text-sm" style={{ color: theme.textTertiary }}>
                {t('overview.noExpensesToday')}
              </Text>
            ) : (
              todayExpenses.map((expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  budgetLeftOverride={derivedBudgetLeftByExpenseId[expense.id] ?? null}
                  onPress={openEditExpense}
                  onDelete={handleDeleteExpense}
                  onEdit={openEditExpense}
                />
              ))
            )}
          </View>
        )}

        {/* Yesterday Section */}
        {!loading && yesterdayExpenses.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-3 text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('overview.yesterday')}
            </Text>
            {yesterdayExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                budgetLeftOverride={derivedBudgetLeftByExpenseId[expense.id] ?? null}
                onPress={openEditExpense}
                onDelete={handleDeleteExpense}
                onEdit={openEditExpense}
              />
            ))}
          </View>
        )}

        {/* Past Section */}
        {!loading && olderExpenses.length > 0 && (
          <View className="mb-4 px-6">
            <Text className="mb-3 text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('overview.past')}
            </Text>
            {olderExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                budgetLeftOverride={derivedBudgetLeftByExpenseId[expense.id] ?? null}
                onPress={openEditExpense}
                onDelete={handleDeleteExpense}
                onEdit={openEditExpense}
                showDate
              />
            ))}
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

      {/* Quick Mic Button */}
      <Animated.View className="absolute bottom-24 right-6 h-16 w-16 items-center justify-center">
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: micPulseColor,
            opacity: micPulse.interpolate({
              inputRange: [0, 1],
              outputRange: isDarkMode ? [0.22, 0] : [0.32, 0],
            }),
            transform: [
              {
                scale: micPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.38],
                }),
              },
            ],
          }}
        />
        <TouchableOpacity
          onPress={() => {
            if (!canUseVoice) {
              setPaywallVisible(true);
              return;
            }
            setRecModalVisible(true);
          }}
          className="h-16 w-16 items-center justify-center rounded-full shadow-lg"
          style={{
            backgroundColor: theme.purple,
            shadowColor: fabShadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkMode ? 0.26 : 0.3,
            shadowRadius: 4.65,
            elevation: 8,
          }}>
          <Ionicons name="mic" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        {/* Voice recordings badge */}
        {tier === 'basic' && (
          <View
            className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full px-1"
            style={{
              backgroundColor: voiceRecordingsLeft > 0 ? '#8B5CF6' : '#EF4444',
            }}>
            <Text className="text-[10px] font-bold text-white">{voiceRecordingsLeft}</Text>
          </View>
        )}
        {tier === 'none' && (
          <View
            className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full px-1"
            style={{ backgroundColor: '#EF4444' }}>
            <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>

      {/* Add Expense Modal */}
      {user && (
        <AddExpenseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          userId={user.uid}
        />
      )}

      {user && (
        <RecordingModal
          visible={recModalVisible}
          onClose={() => setRecModalVisible(false)}
          userId={user.uid}
          onExpenseSaved={incrementVoiceUsage}
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
