import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  spent: string;
  total: string;
  color: string;
  percent: number;
}

export default function BudgetScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const categories: Category[] = [
    {
      id: '1',
      name: 'Food & Dining',
      icon: 'fast-food',
      spent: '$450.00',
      total: '$600.00',
      color: '#FB923C', // Orange
      percent: 75,
    },
    {
      id: '2',
      name: 'Transportation',
      icon: 'car',
      spent: '$200.50',
      total: '$350.00',
      color: '#3B82F6', // Blue
      percent: 60,
    },
    {
      id: '3',
      name: 'Utilities',
      icon: 'flash',
      spent: '$150.00',
      total: '$200.00',
      color: '#FACC15', // Yellow
      percent: 75,
    },
    {
      id: '4',
      name: 'Entertainment',
      icon: 'film',
      spent: '$449.90',
      total: '$650.00',
      color: '#EC4899', // Pink
      percent: 70,
    },
  ];

  const totalSpent = 1250.40;
  const spentPercentage = 68;
  const leftToSpend = 549.60;

  return (
    <View 
      className="flex-1 bg-gray-50 dark:bg-slate-950" 
      style={{ paddingTop: insets.top }}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header Section */}
      <View className="px-6 pt-2 pb-6">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700">
            <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>
          
          <View className="flex-row items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm">
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              October
            </Text>
            <Ionicons name="chevron-down" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          </View>

          {/* Theme Toggler */}
          <TouchableOpacity 
            onPress={toggleTheme}
            className="w-10 h-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700"
          >
            <Ionicons 
              name={isDarkMode ? 'sunny' : 'moon'} 
              size={20} 
              color={isDarkMode ? '#FDE047' : '#475569'} 
            />
          </TouchableOpacity>
        </View>

        <Text className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
          Monthly Budget
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          You&apos;ve spent {spentPercentage}% of your total budget.
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Main Budget Card */}
        <View className="p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-8">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
                Total Spent
              </Text>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
                Left to Spend
              </Text>
              <Text className="text-2xl font-bold text-emerald-500">
                ${leftToSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <View 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${spentPercentage}%` }} 
            />
          </View>
        </View>

        {/* Categories Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-semibold text-lg text-slate-900 dark:text-white">
            Categories
          </Text>
          <TouchableOpacity>
            <Text className="text-emerald-500 text-sm font-medium">Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Categories List */}
        <View className="gap-4">
          {categories.map((category) => (
            <View
              key={category.id}
              className="flex-row items-center rounded-2xl p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm"
            >
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: isDarkMode ? category.color + '20' : category.color + '15' }}
              >
                <Ionicons name={category.icon} size={24} color={category.color} />
              </View>

              <View className="ml-4 flex-1">
                <View className="mb-2 flex-row justify-between items-center">
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {category.name}
                  </Text>
                  <Text className="font-medium text-slate-900 dark:text-white">
                    {category.spent} 
                    <Text className="text-slate-400 dark:text-slate-500 text-xs"> / {category.total}</Text>
                  </Text>
                </View>
                
                <View className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ 
                      width: `${category.percent}%`, 
                      backgroundColor: category.color 
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
