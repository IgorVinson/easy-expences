import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
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

const SwipeHint = ({ direction, theme }: { direction: 'left' | 'right', theme: any }) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(direction === 'left' ? -10 : 10, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.2, { duration: 1000 })
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
    <Animated.View 
      style={[
        {
          position: 'absolute',
          top: '50%',
          [direction]: 8,
          zIndex: 10,
          pointerEvents: 'none',
        },
        animatedStyle
      ]}
    >
      <Ionicons 
        name={direction === 'left' ? 'chevron-forward' : 'chevron-back'} 
        size={24} 
        color={theme.textTertiary} 
      />
    </Animated.View>
  );
};

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

  // Swipe gesture detection
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Require 20px movement to start
    .failOffsetY([-20, 20])   // Fail if moving vertically (helps ScrollView)
    .onEnd((e) => {
      if (e.velocityX < -500 || e.translationX < -100) {
        // Swiped left -> Go to next tab
        runOnJS(navigateToTab)('left');
      } else if (e.velocityX > 500 || e.translationX > 100) {
        // Swiped right -> Go to prev tab
        runOnJS(navigateToTab)('right');
      }
    });

  return (
    <MonthlyReviewProvider>
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          {currentIndex < tabOrder.length - 1 && <SwipeHint direction="left" theme={theme} />}
          {currentIndex > 0 && <SwipeHint direction="right" theme={theme} />}
          
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: [
                {
                  backgroundColor: theme.cardBg,
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                  paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                  paddingTop: 10,
                  height: Platform.OS === 'ios' ? 90 : 70,
                  elevation: 0,
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
