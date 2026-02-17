import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { BudgetCategoryItem } from '../components/BudgetCategoryItem';
import { useTheme } from '../contexts/ThemeContext';

export const BudgetScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const categories = [
    {
      id: '1',
      title: 'Food & Dining',
      limit: 500.0,
      spent: 420.0,
      icon: 'restaurant' as const,
      colorLight: '#FED7AA',
      colorDark: '#FB923C',
    },
    {
      id: '2',
      title: 'Transportation',
      limit: 300.0,
      spent: 180.0,
      icon: 'car' as const,
      colorLight: '#E2E8F0',
      colorDark: '#94A3B8',
    },
    {
      id: '3',
      title: 'Utilities',
      limit: 250.0,
      spent: 200.0,
      icon: 'bulb' as const,
      colorLight: '#FEF08A',
      colorDark: '#FACC15',
    },
    {
      id: '4',
      title: 'Entertainment',
      limit: 200.0,
      spent: 150.0,
      icon: 'ticket' as const,
      colorLight: '#FECACA',
      colorDark: '#F87171',
    },
    // Add dummy items to see scroll
    {
      id: '5',
      title: 'Shopping',
      limit: 400.0,
      spent: 350.0,
      icon: 'cart' as const,
      colorLight: '#BFDBFE',
      colorDark: '#60A5FA',
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Theme Toggle */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
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

        {/* Categories List */}
        <View className="mb-32 px-6">
          {categories.map((item) => (
            <View key={item.id} className="mb-4">
              <BudgetCategoryItem
                title={item.title}
                limit={item.limit}
                spent={item.spent}
                icon={item.icon}
                colorLight={item.colorLight}
                colorDark={item.colorDark}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
