import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { ExpenseItem } from '../../components/ExpenseItem';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';
import { Expense } from '../../types';

export default function OverviewScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const todayExpenses: Expense[] = [
    {
      id: '1',
      title: 'Lunch at Cafe',
      category: 'Cafe',
      amount: -15.5,
      icon: 'restaurant',
      budgetLeft: '120$ left',
      colorLight: '#FED7AA',
      colorDark: '#FB923C',
    },
    {
      id: '2',
      title: 'Groceries',
      category: 'Food',
      amount: -85.2,
      icon: 'cart',
      colorLight: '#BBF7D0',
      colorDark: '#4ADE80',
    },
  ];

  const yesterdayExpenses: Expense[] = [
    {
      id: '3',
      title: 'Uber Ride',
      category: 'Transport',
      amount: -22.0,
      icon: 'car',
      budgetLeft: '95$ budget left',
      colorLight: '#CBD5E1',
      colorDark: '#64748B',
    },
    {
      id: '4',
      title: 'Coffee',
      category: 'Cafe',
      amount: -4.5,
      icon: 'cafe',
      colorLight: '#FDE68A',
      colorDark: '#F59E0B',
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Theme Toggle */}
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

        {/* Voice Input */}
        <View className="mb-6 px-6">
          <TouchableOpacity
            className="items-center rounded-3xl p-6"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <View className="relative">
              <View
                className="h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.purple }}>
                <Ionicons name="mic" size={36} color="#FFFFFF" />
              </View>
              <View
                className="absolute inset-0 h-20 w-20 animate-pulse rounded-full"
                style={{ backgroundColor: theme.purple + '33' }}
              />
            </View>
            <Text className="mt-4 text-base font-semibold" style={{ color: theme.textSecondary }}>
              Quick Add via Voice
            </Text>
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
                September 2024 ▼
              </Text>
            </View>
            <Text className="mb-4 text-5xl font-bold text-white">$1,812</Text>

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
                  <Text className="text-2xl font-bold text-white">$738</Text>
                </View>
                <View className="items-end">
                  <Text className="mb-1 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Monthly budget
                  </Text>
                  <Text className="text-2xl font-bold text-white">$2,550</Text>
                </View>
              </View>
              <View
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: '71%', backgroundColor: '#C084FC' }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Today Section */}
        <View className="mb-4 px-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              Today
            </Text>
          </View>
          {todayExpenses.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}
        </View>

        {/* Yesterday Section */}
        <View className="mb-32 px-6">
          <Text className="mb-3 text-xl font-bold" style={{ color: theme.textPrimary }}>
            Yesterday
          </Text>
          {yesterdayExpenses.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
