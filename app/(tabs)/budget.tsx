import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AddEditCategoryModal } from '../../components/AddEditCategoryModal';
import { BudgetCategoryItem } from '../../components/BudgetCategoryItem';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';
import { BudgetCategory, NewBudgetCategory } from '../../types';

export default function BudgetScreen() {
  const { t } = useTranslation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { categories, totalBudget, totalSpent, loading, addCategory, updateCategory, deleteCategory } =
    useBudget(user?.uid);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Data is real-time via onSnapshot, so we just simulate a refresh for UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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
    Alert.alert(t('budget.deleteTitle'), t('budget.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(id);
        },
      },
    ]);
  }


  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.purple}
            colors={[theme.purple]}
          />
        }>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            {t('budget.title')}
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
                  {t('budget.totalSpent')}
                </Text>
                <Text className="text-4xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
                  ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View className="items-end pb-1">
                <Text className="mb-1 text-xs font-medium" style={{ color: theme.textTertiary }}>
                  {t('budget.totalBudget')}
                </Text>
                <Text className="text-lg font-bold" style={{ color: theme.textSecondary }}>
                  ${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            {/* Progress Section */}
            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: totalRemaining > 0 ? '#10B981' : '#EF4444' }}>
                  {totalRemaining > 0 ? t('budget.remaining') : t('budget.overBudget')}
                </Text>
                <Text className="text-sm font-bold" style={{ color: totalRemaining > 0 ? '#10B981' : '#EF4444' }}>
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
                    backgroundColor: overallPercentage > 100 ? '#EF4444' : theme.purple 
                  }}
                />
              </View>
              
              <Text className="mt-2 text-right text-[10px] font-medium" style={{ color: theme.textTertiary }}>
                {t('budget.budgetUsed', { percent: Math.round(overallPercentage) })}
              </Text>
            </View>

          </View>
        </View>

        {/* Budget Categories */}
        <View className="mb-8 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('budget.categories')}
            </Text>
          </View>

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={theme.purple} />
              <Text className="mt-3 text-sm" style={{ color: theme.textTertiary }}>
                {t('budget.loading')}
              </Text>
            </View>
          ) : categories.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="wallet-outline" size={48} color={theme.textTertiary} />
              <Text className="mt-4 text-base font-semibold" style={{ color: theme.textSecondary }}>
                {t('budget.noCategories')}
              </Text>
              <Text className="mt-1 text-sm text-center" style={{ color: theme.textTertiary }}>
                {t('budget.tapAdd')}
              </Text>
            </View>
          ) : (
            categories.map((category) => (
              <BudgetCategoryItem
                key={category.id}
                category={category}
                onPress={openEdit}
                onDelete={handleDelete}
                onEdit={openEdit}
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
