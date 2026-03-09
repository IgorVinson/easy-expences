import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';
import { BudgetCategory } from '../types';

type BudgetCategoryItemProps = {
  category: BudgetCategory;
  onPress?: (category: BudgetCategory) => void;
  onDelete?: (id: string) => void;
  onEdit?: (category: BudgetCategory) => void;
};

export const BudgetCategoryItem = ({
  category,
  onPress,
  onDelete,
  onEdit,
}: BudgetCategoryItemProps) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const swipeableRef = useRef<Swipeable>(null);

  const percentage = Math.min((category.spent / category.budget) * 100, 100);
  const remaining = category.budget - category.spent;
  const isOverBudget = remaining < 0;
  const formattedBudget = formatCurrencyAmount(category.budget, currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedRemaining = formatCurrencyAmount(Math.abs(remaining), currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
    });

    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onEdit?.(category);
        }}
        className="mb-3 ml-2 flex-row items-center justify-end rounded-2xl px-6"
        style={{ backgroundColor: theme.purple }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="create-outline" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [-80, 0],
    });

    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onDelete?.(category.id);
        }}
        className="mb-3 mr-2 flex-row items-center justify-start rounded-2xl px-6"
        style={{ backgroundColor: '#EF4444' }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="trash-outline" size={24} color="white" />
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
        onEdit?.(category);
        setTimeout(() => swipeableRef.current?.close(), 100);
      }}
      onSwipeableLeftOpen={() => {
        onDelete?.(category.id);
        setTimeout(() => swipeableRef.current?.close(), 100);
      }}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}>
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
              {formattedBudget}
            </Text>
            <Text
              className="mt-0.5 text-xs"
              style={{ color: isOverBudget ? '#F87171' : theme.textTertiary }}>
              {isOverBudget
                ? t('budgetCategoryItem.over', { amount: formattedRemaining })
                : t('budgetCategoryItem.left', { amount: formattedRemaining })}
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
    </Swipeable>
  );
};
