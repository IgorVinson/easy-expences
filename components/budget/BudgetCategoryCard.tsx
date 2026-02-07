import React from 'react';
import { Text, View } from 'react-native';

interface BudgetCategoryCardProps {
  icon: string;
  iconBgColor: string;
  name: string;
  budgetAmount: number;
  spentAmount: number;
}

export const BudgetCategoryCard = ({
  icon,
  iconBgColor,
  name,
  budgetAmount,
  spentAmount,
}: BudgetCategoryCardProps) => {
  const progress = Math.min((spentAmount / budgetAmount) * 100, 100);
  const remaining = budgetAmount - spentAmount;

  return (
    <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
      {/* Header Row: Icon + Name + Budget Amount */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {/* Icon */}
          <View
            className="h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: iconBgColor }}
          >
            <Text className="text-2xl">{icon}</Text>
          </View>
          
          {/* Category Name */}
          <Text className="ml-4 text-lg font-semibold text-slate-800">{name}</Text>
        </View>

        {/* Budget Amount */}
        <Text className="text-lg font-bold text-slate-800">
          - ${budgetAmount.toFixed(2)}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="mt-4">
        <View className="h-2.5 w-full rounded-full bg-slate-100">
          <View
            className="h-2.5 rounded-full bg-indigo-500"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Spent Text */}
      <Text className="mt-2 text-right text-sm text-slate-400">
        ${spentAmount.toFixed(0)} spent
        {remaining > 0 && (
          <Text className="text-slate-400"> · ${remaining.toFixed(0)} left</Text>
        )}
      </Text>
    </View>
  );
};
