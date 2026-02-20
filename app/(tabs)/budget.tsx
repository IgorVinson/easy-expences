import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { BudgetCategoryItem } from '../../components/BudgetCategoryItem';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';

export default function BudgetScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { categories, totalBudget, totalSpent, loading } = useBudget(user?.uid);

  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
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

        {/* Summary Card */}
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
              ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    ${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={theme.purple} />
              <Text className="mt-3 text-sm" style={{ color: theme.textTertiary }}>
                Loading categories…
              </Text>
            </View>
          ) : (
            categories.map((category) => (
              <BudgetCategoryItem key={category.id} category={category} />
            ))
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
