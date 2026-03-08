import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  runOnJS 
} from 'react-native-reanimated';
import { MonthlyReviewProvider } from '../../components/MonthlyReviewProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from '../../styles';

const TabArrow = ({ direction, theme }: { direction: 'left' | 'right', theme: any }) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(direction === 'left' ? 4 : -4, { duration: 800 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.2, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ paddingHorizontal: 4 }, animatedStyle]}>
      <Ionicons 
        name={direction === 'left' ? 'chevron-forward' : 'chevron-back'} 
        size={16} 
        color={theme.textTertiary} 
      />
    </Animated.View>
  );
};

function CustomTabBar({ state, descriptors, navigation, theme, isDarkMode }: any) {
  const currentIndex = state.index;
  const totalTabs = state.routes.length;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: theme.cardBg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
          alignItems: 'center',
          paddingHorizontal: 12,
        },
        !isDarkMode && styles.navShadow,
      ]}
    >
      {/* Left Edge Arrow */}
      <View style={{ width: 24, alignItems: 'center' }}>
        {currentIndex > 0 && <TabArrow direction="right" theme={theme} />}
      </View>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
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
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.7}
            >
              {options.tabBarIcon && options.tabBarIcon({ 
                color: isFocused ? theme.purple : theme.textTertiary,
                focused: isFocused,
                size: 32 
              })}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right Edge Arrow */}
      <View style={{ width: 24, alignItems: 'center' }}>
        {currentIndex < totalTabs - 1 && <TabArrow direction="left" theme={theme} />}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();

  const currentTab = segments[segments.length - 1];
  const tabOrder = ['overview', 'budget', 'profile'];
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
              <CustomTabBar 
                {...props} 
                theme={theme} 
                isDarkMode={isDarkMode} 
              />
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
                tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={32} color={color} />,
              }}
            />
            <Tabs.Screen
              name="budget"
              options={{
                title: t('tabs.budget'),
                tabBarIcon: ({ color }) => <Ionicons name="calendar" size={32} color={color} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: t('tabs.profile'),
                tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={32} color={color} />,
              }}
            />
          </Tabs>
        </View>
      </GestureDetector>
    </MonthlyReviewProvider>
  );
}
