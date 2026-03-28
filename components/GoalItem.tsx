import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { GoalWithProgress } from '../types';

type GoalItemProps = {
  goal: GoalWithProgress;
  onPress?: (goal: GoalWithProgress) => void;
  onDelete?: (id: string) => void;
  onEdit?: (goal: GoalWithProgress) => void;
  flat?: boolean;
  isLast?: boolean;
};

export const GoalItem = ({ goal, onPress, onDelete, onEdit, flat = false, isLast = false }: GoalItemProps) => {
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

  const pct = Math.round(goal.progressPercent);
  const isComplete = pct >= 100;

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({ inputRange: [-80, 0], outputRange: [0, 80] });
    return (
      <TouchableOpacity
        onPress={() => { swipeableRef.current?.close(); onEdit?.(goal); }}
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
        onPress={() => { swipeableRef.current?.close(); onDelete?.(goal.id); }}
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
      onSwipeableRightOpen={() => { onEdit?.(goal); setTimeout(() => swipeableRef.current?.close(), 100); }}
      onSwipeableLeftOpen={() => { onDelete?.(goal.id); setTimeout(() => swipeableRef.current?.close(), 100); }}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onPress?.(goal)}
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

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: flat ? 40 : 46,
              height: flat ? 40 : 46,
              borderRadius: flat ? 12 : 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.isDark ? goal.colorDark + '22' : goal.colorLight,
              marginRight: flat ? 16 : 12,
            }}>
            <Ionicons name={goal.icon} size={flat ? 20 : 22} color={goal.colorDark} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: theme.textPrimary, marginBottom: 2 }}>
              {goal.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: goal.colorDark }}>
                {formattedSaved}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textTertiary }}>
                / {formattedTarget}
              </Text>
            </View>

            <View
              style={{
                height: 6,
                borderRadius: 999,
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}>
              <View
                style={{
                  height: '100%',
                  borderRadius: 999,
                  width: `${Math.min(goal.progressPercent, 100)}%`,
                  backgroundColor: isComplete ? '#10B981' : goal.colorDark,
                }}
              />
            </View>
          </View>

          <View
            style={{
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: isComplete
                ? 'rgba(16,185,129,0.12)'
                : (theme.isDark ? goal.colorDark + '22' : goal.colorLight),
              marginLeft: 12,
            }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: isComplete ? '#10B981' : goal.colorDark,
              }}>
              {isComplete ? '✓' : `${pct}%`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};
