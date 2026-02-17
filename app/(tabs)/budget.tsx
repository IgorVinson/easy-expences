import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { BudgetCategory, BudgetCategoryCard } from '../../components/BudgetCategoryCard';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';

export default function BudgetScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const categories: BudgetCategory[] = [
    {
      id: '1',
      name: 'Food & Dining',
      icon: 'fast-food',
      budgeted: 500,
      spent: 420,
      colorLight: '#FED7AA',
      colorDark: '#FB923C',
    },
    {
      id: '2',
      name: 'Transportation',
      icon: 'car',
      budgeted: 300,
      spent: 150,
      colorLight: '#BFDBFE',
      colorDark: '#3B82F6',
    },
    {
      id: '3',
      name: 'Utilities',
      icon: 'flash',
      budgeted: 200,
      spent: 180,
      colorLight: '#FEF08A',
      colorDark: '#FACC15',
    },
    {
      id: '4',
      name: 'Entertainment',
      icon: 'film',
      budgeted: 150,
      spent: 90,
      colorLight: '#FBCFE8',
      colorDark: '#EC4899',
    },
  ];

  const totalBudget = categories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const spentPercent = Math.min((totalSpent / totalBudget) * 100, 100);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Theme Toggle */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            Monthly Budget
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Summary Card — same style as overview purple card */}
        <View className="mb-6 px-6">
          <View className="rounded-3xl p-6" style={{ backgroundColor: theme.purpleCard }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Total Budget
              </Text>
              <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                October 2024 ▼
              </Text>
            </View>
            <Text className="mb-4 text-5xl font-bold text-white">
              ${totalBudget.toLocaleString()}
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
                  <Text className="text-2xl font-bold text-white">${totalRemaining}</Text>
                </View>
                <View className="items-end">
                  <Text className="mb-1 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Total spent
                  </Text>
                  <Text className="text-2xl font-bold text-white">${totalSpent}</Text>
                </View>
              </View>
              <View
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${spentPercent}%`, backgroundColor: '#C084FC' }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Categories Header */}
        <View className="mb-2 flex-row items-center justify-between px-6">
          <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
            Categories
          </Text>
          <TouchableOpacity>
            <Text className="text-sm font-semibold" style={{ color: theme.purple }}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Cards */}
        <View className="mb-32 px-6">
          {categories.map((category) => (
            <BudgetCategoryCard key={category.id} category={category} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
