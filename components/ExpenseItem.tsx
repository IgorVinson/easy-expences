import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';
import { Expense } from '../types';

type ExpenseItemProps = {
  expense: Expense;
  onPress?: (expense: Expense) => void;
};

export const ExpenseItem = ({ expense, onPress }: ExpenseItemProps) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(expense)}
      style={[
        styles.expenseItem,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        !theme.isDark && styles.expenseItemShadow,
      ]}>
      <View className="flex-1 flex-row items-center">
        <View
          className="h-12 w-12 items-center justify-center rounded-xl"
          style={{
            backgroundColor: theme.isDark ? expense.colorDark + '33' : expense.colorLight,
          }}>
          <Ionicons
            name={expense.icon}
            size={24}
            color={theme.isDark ? expense.colorDark : expense.colorDark.replace('33', '')}
          />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
            {expense.title}
          </Text>
          <Text className="text-sm" style={{ color: theme.textTertiary }}>
            {expense.category}
          </Text>
        </View>
      </View>
      <View className="flex-col items-center">
        <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
          ${Math.abs(expense.amount).toFixed(2)}
        </Text>
        {expense.budgetLeft && (
          <Text className="mt-0.5 text-xs" style={{ color: theme.textTertiary }}>
            ${expense.budgetLeft} left
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};