import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StatusBar, Text, View } from 'react-native';
import { BudgetCategoryItem, BudgetCategory } from '../../components/BudgetCategoryItem';
import { useTheme } from '../../contexts/ThemeContext';

export default function BudgetScreen() {
  const { theme, isDarkMode } = useTheme();

  // Sample budget categories matching the reference design
  const budgetCategories: BudgetCategory[] = [
    {
      id: '1',
      name: 'Food & Dining',
      budget: 500.0,
      spent: 420.0,
      icon: 'restaurant',
      colorLight: '#FED7AA',
      colorDark: '#FB923C',
    },
    {
      id: '2',
      name: 'Transportation',
      budget: 300.0,
      spent: 180.0,
      icon: 'car',
      colorLight: '#CBD5E1',
      colorDark: '#64748B',
    },
    {
      id: '3',
      name: 'Utilities',
      budget: 250.0,
      spent: 200.0,
      icon: 'bulb',
      colorLight: '#FEF08A',
      colorDark: '#EAB308',
    },
    {
      id: '4',
      name: 'Entertainment',
      budget: 200.0,
      spent: 150.0,
      icon: 'film',
      colorLight: '#FECACA',
      colorDark: '#EF4444',
    },
  ];

  const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = Math.min((totalSpent / totalBudget) * 100, 100);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pb-4 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            Monthly Budget
          </Text>
        </View>

        {/* Summary Card */}
        <View className="mb-6 px-6">
          <View
            className="rounded-3xl p-6"
            style={{ backgroundColor: theme.purpleCard }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                This Month
              </Text>
              <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                February 2026 ▼
              </Text>
            </View>

            <Text className="mb-4 text-5xl font-bold text-white">
              ${totalSpent.toFixed(0)}
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
                  <Text className="text-2xl font-bold text-white">${totalRemaining.toFixed(0)}</Text>
                </View>
                <View className="items-end">
                  <Text className="mb-1 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Monthly budget
                  </Text>
                  <Text className="text-2xl font-bold text-white">${totalBudget.toFixed(0)}</Text>
                </View>
              </View>

              <View
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${overallPercentage}%`, backgroundColor: '#C084FC' }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Budget Categories */}
        <View className="mb-8 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              Categories
            </Text>
          </View>

          {budgetCategories.map((category) => (
            <BudgetCategoryItem key={category.id} category={category} />
          ))}
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
