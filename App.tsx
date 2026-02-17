import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import './global.css';
import { BudgetScreen } from './screens/BudgetScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { styles } from './styles';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, isDarkMode } = useTheme();
  // Set default to 'Budget' since that's what we tested/implemented as requested, 
  // or 'Overview' if we want to show existing first. 
  // User asked for Budget page build, might want to see it immediately.
  const [activeTab, setActiveTab] = useState('Budget'); 

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Screen Content */}
      <View className="flex-1">
        {activeTab === 'Overview' && <OverviewScreen />}
        {activeTab === 'Budget' && <BudgetScreen />}
        {activeTab === 'Setting' && (
          <View className="flex-1 items-center justify-center">
            <Text style={{ color: theme.textPrimary }}>Settings (Placeholder)</Text>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View
        className="absolute bottom-0 left-0 right-0"
        style={[
          { backgroundColor: theme.cardBg, borderTopWidth: 1, borderTopColor: theme.border },
          !isDarkMode && styles.navShadow,
        ]}>
        <View className="flex-row items-center justify-around px-6 py-4 pb-8">
          {[
            { name: 'Overview', icon: 'stats-chart' },
            { name: 'Budget', icon: 'pie-chart' }, // Changed icon to match typical budget icon, or keep calendar? Original was 'calendar'. Screenshot shows a pie chart icon for 'Budget'.
            { name: 'Setting', icon: 'settings' },
          ].map((tab) => {
            const isActive = tab.name === activeTab;
            // The screenshot shows 'Budget' with a chart/pie icon. 
            // 'stats-chart' is used for Overview. 
            // Let's use 'pie-chart' for Budget if available, or 'wallet', 'cash'. Ionicons has 'pie-chart'.

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => setActiveTab(tab.name)}
                className="flex-1 items-center justify-center">
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: isActive ? theme.purple : 'transparent',
                  }}>
                  <Ionicons
                    name={tab.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={isActive ? '#FFFFFF' : theme.textTertiary}
                  />
                </View>
                <Text
                  className="mt-1 text-xs font-medium"
                  style={{
                    color: isActive ? theme.purple : theme.textTertiary,
                  }}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
