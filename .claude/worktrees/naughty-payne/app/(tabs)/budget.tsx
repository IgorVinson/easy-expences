import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AddEditCategoryModal } from '../../components/AddEditCategoryModal';
import { BudgetCategoryItem } from '../../components/BudgetCategoryItem';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';
import { BudgetCategory, NewBudgetCategory } from '../../types';

export default function BudgetScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { categories, totalBudget, totalSpent, loading, addCategory, updateCategory, deleteCategory } =
    useBudget(user?.uid);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  function openAdd() {
    setEditingCategory(null);
    setModalVisible(true);
  }

  function openEdit(category: BudgetCategory) {
    setEditingCategory(category);
    setModalVisible(true);
  }

  function handleClose() {
    setModalVisible(false);
    setEditingCategory(null);
  }

  async function handleSave(data: NewBudgetCategory, resetSpent?: boolean) {
    if (editingCategory) {
      await updateCategory(editingCategory.id, resetSpent ? { ...data, spent: 0 } : data);
    } else {
      await addCategory(data);
    }
  }

  async function handleDelete(id: string) {
    await deleteCategory(id);
  }


  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
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

        {/* Summary Card - Modern Redesign */}
        <View className="mb-6 px-6">
          <View 
            className="rounded-[32px] p-6 shadow-sm" 
            style={{ 
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.border,
            }}>
            
            {/* Header & Date */}
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: theme.iconBg }}>
                <Ionicons name="calendar-clear" size={14} color={theme.purple} />
                <Text className="text-xs font-semibold" style={{ color: theme.purple }}>
                  {monthLabel}
                </Text>
              </View>
              <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: theme.purple + '15' }}>
                <Ionicons name="pie-chart" size={16} color={theme.purple} />
              </View>
            </View>

            {/* Main Stats Row */}
            <View className="mb-6 flex-row items-end justify-between">
              <View>
                <Text className="mb-1 text-sm font-medium" style={{ color: theme.textTertiary }}>
                  Total Spent
                </Text>
                <Text className="text-4xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
                  ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View className="items-end pb-1">
                <Text className="mb-1 text-xs font-medium" style={{ color: theme.textTertiary }}>
                  Total Budget
                </Text>
                <Text className="text-lg font-bold" style={{ color: theme.textSecondary }}>
                  ${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            {/* Progress Section */}
            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: totalRemaining > 0 ? theme.green : theme.red }}>
                  {totalRemaining > 0 ? 'Remaining' : 'Over Budget'}
                </Text>
                <Text className="text-sm font-bold" style={{ color: totalRemaining > 0 ? theme.green : theme.red }}>
                  ${Math.abs(totalBudget - totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              
              <View
                className="h-3 overflow-hidden rounded-full"
                style={{ backgroundColor: theme.border }}>
                <View
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.min(overallPercentage, 100)}%`, 
                    backgroundColor: overallPercentage > 100 ? theme.red : theme.purple 
                  }}
                />
              </View>
              
              <Text className="mt-2 text-right text-[10px] font-medium" style={{ color: theme.textTertiary }}>
                {Math.round(overallPercentage)}% of budget used
              </Text>
            </View>

          </View>
        </View>

        {/* Budget Categories */}
        <View className="mb-8 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              Categories
            </Text>
          </View>

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={theme.purple} />
              <Text className="mt-3 text-sm" style={{ color: theme.textTertiary }}>
                Loading categories…
              </Text>
            </View>
          ) : categories.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="wallet-outline" size={48} color={theme.textTertiary} />
              <Text className="mt-4 text-base font-semibold" style={{ color: theme.textSecondary }}>
                No categories yet
              </Text>
              <Text className="mt-1 text-sm text-center" style={{ color: theme.textTertiary }}>
                {'Tap "Add" to create your first budget category.'}
              </Text>
            </View>
          ) : (
            categories.map((category) => (
              <BudgetCategoryItem
                key={category.id}
                category={category}
                onPress={openEdit}
              />
            ))
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>

      {/* Quick Add Button */}
      <TouchableOpacity
        onPress={openAdd}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full shadow-lg"
        style={{
          backgroundColor: theme.purple,
          shadowColor: isDarkMode ? '#000' : theme.purple,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.26 : 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add / Edit modal */}
      <AddEditCategoryModal
        visible={modalVisible}
        onClose={handleClose}
        category={editingCategory}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </View>
  );
}
