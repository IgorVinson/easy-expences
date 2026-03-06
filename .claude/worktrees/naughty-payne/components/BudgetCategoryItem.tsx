import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';
import { BudgetCategory } from '../types';

type BudgetCategoryItemProps = {
  category: BudgetCategory;
  onPress?: (category: BudgetCategory) => void;
};

export const BudgetCategoryItem = ({ category, onPress }: BudgetCategoryItemProps) => {
  const { theme } = useTheme();

  const percentage = Math.min((category.spent / category.budget) * 100, 100);
  const remaining = category.budget - category.spent;
  const isOverBudget = remaining < 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(category)}
      style={[
        styles.expenseItem,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
          flexDirection: 'column',
          alignItems: 'stretch',
        },
        !theme.isDark && styles.expenseItemShadow,
      ]}>
      {/* Top row */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View
            className="h-12 w-12 items-center justify-center rounded-xl"
            style={{
              backgroundColor: theme.isDark ? category.colorDark + '33' : category.colorLight,
            }}>
            <Ionicons name={category.icon} size={24} color={category.colorDark} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
              {category.name}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
            ${category.budget.toLocaleString()}
          </Text>
          <Text
            className="mt-0.5 text-xs"
            style={{ color: isOverBudget ? '#F87171' : theme.textTertiary }}>
            {isOverBudget
              ? `$${Math.abs(remaining).toLocaleString()} over`
              : `$${remaining.toLocaleString()} left`}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOverBudget ? '#F87171' : category.colorDark,
          }}
        />
      </View>
    </TouchableOpacity>
  );
};
