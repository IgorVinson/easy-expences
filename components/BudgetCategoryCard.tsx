import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';

export type BudgetCategory = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  budgeted: number;
  spent: number;
  colorLight: string;
  colorDark: string;
};

export const BudgetCategoryCard = ({ category }: { category: BudgetCategory }) => {
  const { theme } = useTheme();
  const remaining = category.budgeted - category.spent;
  const percent = Math.min((category.spent / category.budgeted) * 100, 100);
  const isOverBudget = category.spent > category.budgeted;

  return (
    <View
      style={[
        styles.expenseItem,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        !theme.isDark && styles.expenseItemShadow,
      ]}>
      <View className="flex-1">
        {/* Top row: icon + name + budget amount */}
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: theme.expenseIconBg(category.colorLight, category.colorDark),
              }}>
              <Ionicons
                name={category.icon}
                size={24}
                color={theme.expenseIconColor(category.colorDark)}
              />
            </View>
            <Text className="ml-3 text-base font-semibold" style={{ color: theme.textPrimary }}>
              {category.name}
            </Text>
          </View>
          <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
            ${category.budgeted.toFixed(0)}
          </Text>
        </View>

        {/* Progress bar */}
        <View
          className="mb-2 h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${percent}%`,
              backgroundColor: isOverBudget ? '#EF4444' : category.colorDark,
            }}
          />
        </View>

        {/* Bottom row: spent / remaining */}
        <View className="flex-row justify-between">
          <Text className="text-sm" style={{ color: theme.textTertiary }}>
            ${category.spent.toFixed(0)} spent
          </Text>
          <Text
            className="text-sm font-medium"
            style={{ color: isOverBudget ? '#EF4444' : theme.textSecondary }}>
            {isOverBudget
              ? `-$${Math.abs(remaining).toFixed(0)} over`
              : `$${remaining.toFixed(0)} left`}
          </Text>
        </View>
      </View>
    </View>
  );
};
