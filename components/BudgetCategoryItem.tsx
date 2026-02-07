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
  const remaining = category.budget - category.spent;

  return (
    <View
      style={[
        styles.expenseItem,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        !theme.isDark && styles.expenseItemShadow,
      ]}>
      {/* Header: Icon, Name, Budget Amount */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          {/* Icon */}
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: theme.isDark ? category.colorDark + '33' : category.colorLight,
            }}>
            <Ionicons
              name={category.icon}
              size={24}
              color={theme.isDark ? category.colorDark : category.colorDark.replace('33', '')}
            />
          </View>
          {/* Category Name */}
          <Text
            className="ml-3 text-base font-semibold flex-1"
            style={{ color: theme.textPrimary }}>
            {category.name}
          </Text>
        </View>
        {/* Budget Amount */}
        <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
          - ${category.budget.toFixed(2)}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="mb-2">
        <View
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: theme.isDark ? '#1E293B' : '#E2E8F0' }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: theme.isDark ? category.colorDark : category.colorDark.replace('33', ''),
            }}
          />
        </View>
      </View>

      {/* Spent Amount */}
      <View className="flex-row justify-end">
        <Text className="text-sm" style={{ color: theme.textTertiary }}>
          ${category.spent.toFixed(0)} spent
        </Text>
      </View>
    </View>
  );
};
