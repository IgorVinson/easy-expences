import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';

export type BudgetCategory = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: keyof typeof Ionicons.glyphMap;
  colorLight: string;
  colorDark: string;
};

type BudgetCategoryItemProps = {
  category: BudgetCategory;
};

export const BudgetCategoryItem = ({ category }: BudgetCategoryItemProps) => {
  const { theme } = useTheme();

  const percentage = Math.min((category.spent / category.budget) * 100, 100);

  return (
    <View
      style={[
        styles.expenseItem,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        !theme.isDark && styles.expenseItemShadow,
      ]}>
      <View className="flex-1 flex-row items-center">
        {/* Icon */}
        <View
          className="h-12 w-12 items-center justify-center rounded-xl"
          style={{
            backgroundColor: theme.isDark ? category.colorDark + '33' : category.colorLight,
          }}>
          <Ionicons
            name={category.icon}
            size={24}
            color={theme.isDark ? category.colorDark : category.colorDark.replace('33', '')}
          />
        </View>
        {/* Category Info with Progress */}
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
            {category.name}
          </Text>
          {/* Progress Bar */}
          <View className="mt-2 flex-row items-center">
            <View
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ backgroundColor: theme.isDark ? '#1E293B' : '#E2E8F0' }}>
              <View
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: theme.isDark ? category.colorDark : category.colorDark.replace('33', ''),
                }}
              />
            </View>
            <Text className="ml-2 text-xs" style={{ color: theme.textTertiary }}>
              ${category.spent.toFixed(0)} of ${category.budget.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>
      {/* Budget Amount - styled like ExpenseItem */}
      <View className="flex-col items-end">
        <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
          ${category.budget.toFixed(0)}
        </Text>
        <Text className="mt-0.5 text-xs" style={{ color: theme.textTertiary }}>
          ${(category.budget - category.spent).toFixed(0)} left
        </Text>
      </View>
    </View>
  );
};
