import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AddExpenseModal } from '../../components/AddExpenseModal';
import { ExpenseItem } from '../../components/ExpenseItem';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';
import { useExpenses } from '../../hooks/useExpenses';
import { styles } from '../../styles';

export default function OverviewScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { expenses, todayExpenses, yesterdayExpenses, monthlyTotal, loading: expensesLoading } =
    useExpenses(user?.uid);
  const { totalBudget, totalSpent, loading: budgetLoading } = useBudget(user?.uid);

  const [modalVisible, setModalVisible] = useState(false);

  const loading = expensesLoading || budgetLoading;
  const leftToSpend = Math.max(0, totalBudget - totalSpent);
  const spendPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            Overview
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Monthly Total Card */}
        <View className="mb-6 px-6">
          <View className="rounded-3xl p-6" style={{ backgroundColor: theme.purpleCard }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                This Month
              </Text>
              <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {monthLabel} ▼
              </Text>
            </View>
            <Text className="mb-4 text-5xl font-bold text-white">
              ${monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>

            <View
              className="rounded-2xl p-4"
              style={{
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              }}>
              <View className="mb-3 flex-row justify-between">
                <View>
                  <Text className="mb-1 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Left to spend
                  </Text>
                  <Text className="text-2xl font-bold text-white">
                    ${leftToSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="mb-1 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Monthly budget
                  </Text>
                  <Text className="text-2xl font-bold text-white">
                    ${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
              <View
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${spendPercent}%`, backgroundColor: '#C084FC' }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Add Button */}
        <View className="mb-6 px-6">
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="items-center rounded-3xl p-6"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <View className="relative">
              <View
                className="h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.purple }}>
                <Ionicons name="add" size={36} color="#FFFFFF" />
              </View>
            </View>
            <Text className="mt-4 text-base font-semibold" style={{ color: theme.textSecondary }}>
              Add New Expense
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {loading && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color={theme.purple} />
            <Text className="mt-3 text-sm" style={{ color: theme.textTertiary }}>
              Loading expenses…
            </Text>
          </View>
        )}

        {/* Today Section */}
        {!loading && (
          <View className="mb-4 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                Today
              </Text>
            </View>
            {todayExpenses.length === 0 ? (
              <Text className="py-4 text-center text-sm" style={{ color: theme.textTertiary }}>
                No expenses today yet
              </Text>
            ) : (
              todayExpenses.map((expense) => <ExpenseItem key={expense.id} expense={expense} />)
            )}
          </View>
        )}

        {/* Yesterday Section */}
        {!loading && yesterdayExpenses.length > 0 && (
          <View className="mb-32 px-6">
            <Text className="mb-3 text-xl font-bold" style={{ color: theme.textPrimary }}>
              Yesterday
            </Text>
            {yesterdayExpenses.map((expense) => <ExpenseItem key={expense.id} expense={expense} />)}
          </View>
        )}

        {/* Older expenses peek */}
        {!loading && (
          <View className="h-24" />
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      {user && (
        <AddExpenseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          userId={user.uid}
        />
      )}
    </View>
  );
}
