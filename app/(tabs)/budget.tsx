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

  async function handleSave(data: NewBudgetCategory) {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
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

        {/* Summary Card */}
        <View className="mb-6 px-6">
          <View className="rounded-3xl p-6" style={{ backgroundColor: theme.purpleCard }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                This Month
              </Text>
              <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {monthLabel} ▼
              </Text>
            </View>

            <Text className="mb-4 text-5xl font-bold text-white">
              ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>

            <View
              className="rounded-2xl p-4"
              style={{
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              }}>
              <View className="mb-3 flex-row justify-between">
                <View>
                  <Text className="mb-1 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Left to spend
                  </Text>
                  <Text className="text-2xl font-bold text-white">
                    ${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="mb-1 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Monthly budget
                  </Text>
                  <Text className="text-2xl font-bold text-white">
                    ${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <View
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${overallPercentage}%`, backgroundColor: '#C084FC' }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Budget Categories */}
        <View className="mb-8 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              Categories
            </Text>
            {/* Add category button */}
            <TouchableOpacity
              onPress={openAdd}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: theme.purple,
                gap: 6,
              }}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Add</Text>
            </TouchableOpacity>
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
