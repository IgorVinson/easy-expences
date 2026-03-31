import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';
import { Expense } from '../types';

type ExpenseItemProps = {
  expense: Expense;
  onPress?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
  showDate?: boolean;
  budgetLeftOverride?: number | null;
  amountMetaText?: string | null;
  flat?: boolean;
  isLast?: boolean;
};

export const ExpenseItem = ({
  expense,
  onPress,
  onDelete,
  onEdit,
  showDate,
  budgetLeftOverride,
  amountMetaText,
  flat = false,
  isLast = false,
}: ExpenseItemProps) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const swipeableRef = useRef<Swipeable>(null);
  const isIncome = expense.type === 'income';
  const budgetLeftToShow = budgetLeftOverride ?? expense.budgetLeft ?? 0;

  const formattedDate = showDate
    ? new Date(expense.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;
  const formattedAmount = formatCurrencyAmount(Math.abs(expense.amount), currency, i18n.language);
  const displayAmount = isIncome ? `+${formattedAmount}` : formattedAmount;
  const formattedBudgetLeft = formatCurrencyAmount(
    Math.abs(budgetLeftToShow),
    currency,
    i18n.language
  );

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!onEdit) return null;

    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
    });

    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onEdit?.(expense);
        }}
        className="mb-3 ml-2 flex-row items-center justify-end rounded-2xl px-6"
        style={{ backgroundColor: theme.purple }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="create-outline" size={22} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!onDelete) return null;

    const trans = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [-80, 0],
    });

    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onDelete?.(expense.id);
        }}
        className="mb-3 mr-2 flex-row items-center justify-start rounded-2xl px-6"
        style={{ backgroundColor: theme.error }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="trash-outline" size={22} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableRightOpen={() => {
        onEdit?.(expense);
        setTimeout(() => swipeableRef.current?.close(), 100);
      }}
      onSwipeableLeftOpen={() => {
        onDelete?.(expense.id);
        setTimeout(() => swipeableRef.current?.close(), 100);
      }}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(expense)}
        style={flat ? {
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: theme.border,
        } : [
          styles.expenseItem,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
          !theme.isDark && styles.expenseItemShadow,
        ]}>
        <View className="flex-1 flex-row items-center">
          <View
            className="items-center justify-center rounded-xl"
            style={{
              width: flat ? 40 : 48,
              height: flat ? 40 : 48,
              backgroundColor: theme.isDark ? expense.colorDark + '33' : expense.colorLight,
            }}>
            <Ionicons
              name={expense.icon}
              size={20}
              color={theme.isDark ? expense.colorDark : expense.colorDark.replace('33', '')}
            />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-medium" style={{ color: theme.textPrimary }}>
              {expense.title}
            </Text>
            <Text className="text-sm" style={{ color: theme.textTertiary }}>
              {expense.category}
            </Text>
            {showDate && (
              <Text className="mt-0.5 text-xs" style={{ color: theme.textTertiary }}>
                {formattedDate}
              </Text>
            )}
          </View>
        </View>
        <View className="ml-3 flex-col items-end">
          <Text
            className="text-base font-semibold"
            style={{ color: isIncome ? theme.success : theme.textPrimary }}>
            {displayAmount}
          </Text>
          {amountMetaText ? (
            <Text className="mt-0.5 text-xs" style={{ color: theme.textTertiary }}>
              {amountMetaText}
            </Text>
          ) : budgetLeftToShow !== null && budgetLeftToShow !== undefined ? (
            <Text className="mt-0.5 text-xs" style={{ color: theme.textTertiary }}>
              {t('expenseItem.left', { amount: formattedBudgetLeft })}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};
