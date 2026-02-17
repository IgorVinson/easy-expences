import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';

type BudgetCategoryItemProps = {
  title: string;
  limit: number;
  spent: number;
  colorLight: string;
  colorDark: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const BudgetCategoryItem = ({
  title,
  limit,
  spent,
  colorLight,
  colorDark,
  icon,
}: BudgetCategoryItemProps) => {
  const { theme, isDarkMode } = useTheme();
  const progress = Math.min(spent / limit, 1);
  const remaining = limit - spent;

  return (
    <View
      style={[
        styles.expenseItem,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        !isDarkMode && styles.expenseItemShadow,
        { flexDirection: 'column', alignItems: 'stretch' },
      ]}>
      {/* Header: Icon, Title, Limit */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View
            className="h-10 w-10 items-center justify-center rounded-xl mr-3"
            style={{
              backgroundColor: isDarkMode ? colorDark + '33' : colorLight,
            }}>
            <Ionicons
              name={icon}
              size={20}
              color={isDarkMode ? colorDark : colorDark.replace('33', '')}
            />
          </View>
          <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
            {title}
          </Text>
        </View>
        <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
          - ${limit.toFixed(2)}
        </Text>
      </View>

      {/* Progress Bar */}
      <View
        className="h-2 overflow-hidden rounded-full mb-2"
        style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
        <View
          className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: isDarkMode ? '#64748B' : '#475569', // Dark slate color for progress
          }}
        />
      </View>

      {/* Footer: Spent Amount */}
      <View className="flex-row justify-end">
        <Text className="text-xs" style={{ color: theme.textTertiary }}>
          ${spent.toFixed(0)} spent
        </Text>
      </View>
    </View>
  );
};
