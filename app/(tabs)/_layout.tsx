import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';

export default function TabsLayout() {
  const { theme, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          {
            backgroundColor: theme.cardBg,
            borderTopWidth: 0,
            elevation: 0,
            height: 90,
            paddingTop: 0,
            alignItems: 'center',
          },
          !isDarkMode && styles.navShadow,
        ],
        tabBarActiveTintColor: theme.purple,
        tabBarInactiveTintColor: theme.textTertiary,
      }}>
      <Tabs.Screen
        name="overview"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? theme.purple + '15' : 'transparent',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
              }}>
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? theme.purple + '15' : 'transparent',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
              }}>
              <Ionicons
                name={focused ? 'pie-chart' : 'pie-chart-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? theme.purple + '15' : 'transparent',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
              }}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
