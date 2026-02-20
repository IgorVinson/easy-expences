import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BudgetCategoryItem } from '../components/BudgetCategoryItem';
import { useTheme } from '../contexts/ThemeContext';
import { useBudget } from '../hooks/useBudget';
import { styles } from '../styles';

type Props = {
  userId: string | null;
};

export const BudgetScreen = ({ userId }: Props) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { categories, totalBudget, totalSpent, loading, error } = useBudget(userId);

  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const remaining = totalBudget - totalSpent;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header with Theme Toggle */}
        <View className="flex-row items-center justify-between px-6 pb-4 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            Monthly Budget
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Overall Summary Card */}
        <View className="mb-6 px-6">
          <View
            className="rounded-3xl p-5"
            style={[
              { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border },
              !isDarkMode && styles.cardShadow,
            ]}>
            <View className="mb-3 flex-row justify-between">
              <View>
                <Text className="mb-1 text-xs" style={{ color: theme.textTertiary }}>
                  Total Spent
                </Text>
                {loading ? (
                  <ActivityIndicator color={theme.purple} />
                ) : (
                  <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                    ${totalSpent.toFixed(2)}
                  </Text>
                )}
              </View>
              <View className="items-end">
                <Text className="mb-1 text-xs" style={{ color: theme.textTertiary }}>
                  Total Budget
                </Text>
                {loading ? (
                  <ActivityIndicator color={theme.purple} />
                ) : (
                  <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                    ${totalBudget.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>

            {/* Overall Progress Bar */}
            <View
              className="h-3 overflow-hidden rounded-full"
              style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              <View
                className="h-full rounded-full"
                style={{
                  width: `${overallPercentage}%`,
                  backgroundColor:
                    overallPercentage > 90 ? '#F87171' : overallPercentage > 70 ? '#FACC15' : theme.purple,
                }}
              />
            </View>

            <Text className="mt-2 text-xs" style={{ color: theme.textTertiary }}>
              ${remaining.toFixed(2)} remaining ({(100 - overallPercentage).toFixed(0)}%)
            </Text>
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View className="mb-4 px-6">
            <Text style={{ color: '#F87171', textAlign: 'center' }}>
              ⚠ Could not load budget: {error}
            </Text>
          </View>
        )}

        {/* Categories List */}
        <View className="mb-32 px-6">
          {loading ? (
            <ActivityIndicator size="large" color={theme.purple} style={{ marginTop: 32 }} />
          ) : categories.length === 0 ? (
            <Text style={{ color: theme.textTertiary, textAlign: 'center', paddingVertical: 24 }}>
              No budget categories yet
            </Text>
          ) : (
            categories.map((item) => (
              <View key={item.id} className="mb-4">
                <BudgetCategoryItem category={item} />
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
};
