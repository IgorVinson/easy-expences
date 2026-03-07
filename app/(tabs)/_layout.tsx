import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';
import { MonthlyReviewProvider } from '../../components/MonthlyReviewProvider';
import { useTranslation } from 'react-i18next';

import { Platform } from 'react-native';

export default function TabsLayout() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <MonthlyReviewProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            {
              backgroundColor: theme.cardBg,
              borderTopWidth: 1,
              borderTopColor: theme.border,
              paddingBottom: Platform.OS === 'ios' ? 20 : 10, 
              paddingTop: Platform.OS === 'ios' ? 10 : 10,
              height: Platform.OS === 'ios' ? 90 : 70, 
              elevation: 0, // Removes default Android shadow to let custom styles work
            },
            !isDarkMode && styles.navShadow,
          ],
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarActiveTintColor: theme.purple,
          tabBarInactiveTintColor: theme.textTertiary,
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="overview"
          options={{
            title: t('tabs.overview'),
            tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={38} color={color} />,
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: t('tabs.budget'),
            tabBarIcon: ({ color }) => <Ionicons name="calendar" size={38} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={38} color={color} />,
          }}
        />
      </Tabs>
    </MonthlyReviewProvider>
  );
}
