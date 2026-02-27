import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';
import { MonthlyReviewProvider } from '../../components/MonthlyReviewProvider';

export default function TabsLayout() {
  const { theme, isDarkMode } = useTheme();

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
              paddingBottom: 0,
              paddingTop: 10,
              height: 80,
            },
            !isDarkMode && styles.navShadow,
          ],
          tabBarActiveTintColor: theme.purple,
          tabBarInactiveTintColor: theme.textTertiary,
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="overview"
          options={{
            title: 'Overview',
            tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={38} color={color} />,
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'Budget',
            tabBarIcon: ({ color }) => <Ionicons name="calendar" size={38} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={38} color={color} />,
          }}
        />
      </Tabs>
    </MonthlyReviewProvider>
  );
}
