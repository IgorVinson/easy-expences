import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetCategoryCard } from '../../components/budget/BudgetCategoryCard';

// Sample data matching the reference image
const budgetCategories = [
  {
    id: '1',
    icon: '🍴',
    iconBgColor: '#FEF3C7', // amber-100
    name: 'Food & Dining',
    budgetAmount: 500,
    spentAmount: 420,
  },
  {
    id: '2',
    icon: '🚗',
    iconBgColor: '#DBEAFE', // blue-100
    name: 'Transportation',
    budgetAmount: 300,
    spentAmount: 150,
  },
  {
    id: '3',
    icon: '💡',
    iconBgColor: '#FEF9C3', // yellow-100
    name: 'Utilities',
    budgetAmount: 250,
    spentAmount: 200,
  },
  {
    id: '4',
    icon: '🎬',
    iconBgColor: '#FEE2E2', // red-100
    name: 'Entertainment',
    budgetAmount: 200,
    spentAmount: 150,
  },
];

export const BudgetScreen = () => {
  const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spentAmount, 0);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-5">
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-3xl font-bold text-slate-800">Monthly Budget</Text>
          
          {/* Summary Card */}
          <View className="mt-6 rounded-2xl bg-indigo-600 p-6 shadow-lg">
            <View className="flex-row justify-between">
              <View>
                <Text className="text-sm text-indigo-200">Total Budget</Text>
                <Text className="mt-1 text-2xl font-bold text-white">
                  ${totalBudget.toFixed(2)}
                </Text>
              </View>
              <View>
                <Text className="text-right text-sm text-indigo-200">Spent</Text>
                <Text className="mt-1 text-2xl font-bold text-white">
                  ${totalSpent.toFixed(2)}
                </Text>
              </View>
            </View>
            
            {/* Overall Progress */}
            <View className="mt-4">
              <View className="h-3 w-full rounded-full bg-indigo-800/30">
                <View
                  className="h-3 rounded-full bg-white"
                  style={{ width: `${(totalSpent / totalBudget) * 100}%` }}
                />
              </View>
            </View>
            
            <Text className="mt-2 text-center text-sm text-indigo-200">
              ${(totalBudget - totalSpent).toFixed(2)} remaining this month
            </Text>
          </View>
        </View>

        {/* Category Cards */}
        <View className="pb-8">
          {budgetCategories.map((category) => (
            <BudgetCategoryCard
              key={category.id}
              icon={category.icon}
              iconBgColor={category.iconBgColor}
              name={category.name}
              budgetAmount={category.budgetAmount}
              spentAmount={category.spentAmount}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
