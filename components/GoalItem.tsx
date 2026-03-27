import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';
import { GoalWithProgress } from '../types';

type GoalItemProps = {
  goal: GoalWithProgress;
  onPress?: (goal: GoalWithProgress) => void;
  onDelete?: (id: string) => void;
  onEdit?: (goal: GoalWithProgress) => void;
};

export const GoalItem = ({ goal, onPress, onDelete, onEdit }: GoalItemProps) => {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const swipeableRef = useRef<Swipeable>(null);

  const formattedSaved = formatCurrencyAmount(goal.savedAmount, currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedTarget = formatCurrencyAmount(goal.targetAmount, currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({ inputRange: [-80, 0], outputRange: [0, 80] });
    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onEdit?.(goal);
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
    const trans = dragX.interpolate({ inputRange: [0, 80], outputRange: [-80, 0] });
    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onDelete?.(goal.id);
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
        onEdit?.(goal);
        setTimeout(() => swipeableRef.current?.close(), 100);
      }}
      onSwipeableLeftOpen={() => {
        onDelete?.(goal.id);
        setTimeout(() => swipeableRef.current?.close(), 100);
      }}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(goal)}
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
                backgroundColor: theme.isDark ? goal.colorDark + '33' : goal.colorLight,
              }}>
              <Ionicons name={goal.icon} size={24} color={goal.colorDark} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
                {goal.name}
              </Text>
              <Text className="mt-0.5 text-xs" style={{ color: theme.textTertiary }}>
                {formattedSaved} / {formattedTarget}
              </Text>
            </View>
          </View>
          <Text className="text-sm font-semibold" style={{ color: goal.colorDark }}>
            {Math.round(goal.progressPercent)}%
          </Text>
        </View>

        {/* Progress bar */}
        <View
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${goal.progressPercent}%`,
              backgroundColor: goal.colorDark,
            }}
          />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};
