import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { MonthlyReviewProvider } from '../../components/MonthlyReviewProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';

function CustomTabBar({ state, descriptors, navigation, theme, isDarkMode }: any) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.cardBg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 10,
          paddingHorizontal: 12,
          height: Platform.OS === 'ios' ? 88 : 68,
          alignItems: 'flex-start',
        },
        !isDarkMode && styles.navShadow,
      ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 7,
              paddingHorizontal: 10,
              borderRadius: 16,
              marginHorizontal: 4,
              backgroundColor: isFocused
                ? isDarkMode
                  ? 'rgba(139,92,246,0.14)'
                  : 'rgba(139,92,246,0.08)'
                : 'transparent',
            }}
            activeOpacity={0.7}>
            {options.tabBarIcon?.({
              color: isFocused ? theme.purple : theme.textTertiary,
              focused: isFocused,
              size: 24,
            })}
            {isFocused && (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: theme.purple,
                  marginTop: 3,
                  letterSpacing: 0.2,
                }}>
                {options.title}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();

  const currentTab = segments[segments.length - 1];
  const tabOrder = ['overview', 'goals', 'profile'];
  const currentIndex = tabOrder.indexOf(currentTab);

  const navigateToTab = (direction: 'left' | 'right') => {
    let nextIndex = currentIndex;
    if (direction === 'left' && currentIndex < tabOrder.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }
    if (nextIndex !== currentIndex) {
      router.replace(`/(tabs)/${tabOrder[nextIndex]}`);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.velocityX < -500 || e.translationX < -100) {
        runOnJS(navigateToTab)('left');
      } else if (e.velocityX > 500 || e.translationX > 100) {
        runOnJS(navigateToTab)('right');
      }
    });

  return (
    <MonthlyReviewProvider>
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          <Tabs
            tabBar={(props) => (
              <CustomTabBar {...props} theme={theme} isDarkMode={isDarkMode} />
            )}
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: theme.purple,
              tabBarInactiveTintColor: theme.textTertiary,
              tabBarShowLabel: false,
            }}>
            <Tabs.Screen
              name="overview"
              options={{
                title: t('tabs.overview'),
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="goals"
              options={{
                title: t('tabs.goals'),
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'flag' : 'flag-outline'} size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: t('tabs.profile'),
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </GestureDetector>
    </MonthlyReviewProvider>
  );
}
