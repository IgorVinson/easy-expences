import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { BudgetCategory } from '../types';

type BudgetCategoryItemProps = {
  category: BudgetCategory;
  onPress?: (category: BudgetCategory) => void;
  onDelete?: (id: string) => void;
  onEdit?: (category: BudgetCategory) => void;
  flat?: boolean;
  isLast?: boolean;
};

export const BudgetCategoryItem = ({
  category,
  onPress,
  onDelete,
  onEdit,
  flat = false,
  isLast = false,
}: BudgetCategoryItemProps) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const swipeableRef = useRef<Swipeable>(null);

  const percentage = Math.min((category.spent / category.budget) * 100, 100);
  const remaining = category.budget - category.spent;
  const isOverBudget = remaining < 0;

  const barColor = isOverBudget ? '#EF4444' : category.colorDark;

  const formattedSpent = formatCurrencyAmount(category.spent, currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedBudget = formatCurrencyAmount(category.budget, currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedRemaining = formatCurrencyAmount(Math.abs(remaining), currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({ inputRange: [-80, 0], outputRange: [0, 80] });
    return (
      <TouchableOpacity
        onPress={() => { swipeableRef.current?.close(); onEdit?.(category); }}
        style={{
          marginBottom: flat ? 0 : 12,
          marginLeft: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          borderRadius: flat ? 0 : 18,
          paddingHorizontal: 24,
          backgroundColor: theme.purple,
        }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="create-outline" size={22} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({ inputRange: [0, 80], outputRange: [-80, 0] });
    return (
      <TouchableOpacity
        onPress={() => { swipeableRef.current?.close(); onDelete?.(category.id); }}
        style={{
          marginBottom: flat ? 0 : 12,
          marginRight: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: flat ? 0 : 18,
          paddingHorizontal: 24,
          backgroundColor: '#EF4444',
        }}>
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
      onSwipeableRightOpen={() => { onEdit?.(category); setTimeout(() => swipeableRef.current?.close(), 100); }}
      onSwipeableLeftOpen={() => { onDelete?.(category.id); setTimeout(() => swipeableRef.current?.close(), 100); }}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onPress?.(category)}
        style={flat ? {
          padding: 16,
          backgroundColor: 'transparent',
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: theme.border,
        } : {
          marginBottom: 12,
          borderRadius: 18,
          padding: 18,
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.border,
          ...(theme.isDark ? {} : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
          }),
        }}>

        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          {/* Icon */}
          <View
            style={{
              width: flat ? 40 : 46,
              height: flat ? 40 : 46,
              borderRadius: flat ? 12 : 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.isDark ? category.colorDark + '22' : category.colorLight,
              marginRight: flat ? 16 : 12,
            }}>
            <Ionicons name={category.icon} size={flat ? 20 : 22} color={category.colorDark} />
          </View>

          {/* Name + spent/budget */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: flat ? 16 : 15, fontWeight: flat ? '500' : '700', color: theme.textPrimary, marginBottom: 2 }}>
              {category.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: isOverBudget ? '#EF4444' : category.colorDark }}>
                {formattedSpent}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textTertiary }}>
                / {formattedBudget}
              </Text>
            </View>
          </View>

          {/* Remaining badge */}
          <View
            style={{
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: isOverBudget
                ? 'rgba(239,68,68,0.1)'
                : (theme.isDark ? category.colorDark + '22' : category.colorLight),
            }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: isOverBudget ? '#EF4444' : category.colorDark,
                letterSpacing: -0.2,
              }}>
              {isOverBudget
                ? t('budgetCategoryItem.over', { amount: formattedRemaining })
                : t('budgetCategoryItem.left', { amount: formattedRemaining })}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 8,
            borderRadius: 8,
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
          <View
            style={{
              height: '100%',
              borderRadius: 8,
              width: `${percentage}%`,
              backgroundColor: barColor,
            }}
          />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};
