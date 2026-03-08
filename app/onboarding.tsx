import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GestureResponderEvent,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const ONBOARDING_KEY = 'onboarding_completed';

const slides = [
  {
    icon: 'wallet-outline' as const,
    secondaryIcons: ['receipt-outline', 'card-outline', 'cash-outline'] as const,
    gradientColors: ['#8B5CF6', '#6D28D9'] as [string, string],
    titleKey: 'onboarding.expenses.title',
    descriptionKey: 'onboarding.expenses.description',
  },
  {
    icon: 'mic-outline' as const,
    secondaryIcons: ['chatbubble-outline', 'sparkles-outline', 'volume-high-outline'] as const,
    gradientColors: ['#EC4899', '#BE185D'] as [string, string],
    titleKey: 'onboarding.voice.title',
    descriptionKey: 'onboarding.voice.description',
  },
  {
    icon: 'pie-chart-outline' as const,
    secondaryIcons: ['trending-up-outline', 'bar-chart-outline', 'analytics-outline'] as const,
    gradientColors: ['#10B981', '#047857'] as [string, string],
    titleKey: 'onboarding.budget.title',
    descriptionKey: 'onboarding.budget.description',
  },
  {
    icon: 'rocket-outline' as const,
    secondaryIcons: ['star-outline', 'checkmark-circle-outline', 'heart-outline'] as const,
    gradientColors: ['#F59E0B', '#D97706'] as [string, string],
    titleKey: 'onboarding.ready.title',
    descriptionKey: 'onboarding.ready.description',
  },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex];
  const isLast = activeIndex === slides.length - 1;
  const touchStartX = useRef<number>(0);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)/overview');
  };

  const onTouchStart = (e: GestureResponderEvent) => {
    touchStartX.current = e.nativeEvent.pageX;
  };

  const onTouchEnd = (e: GestureResponderEvent) => {
    const diff = touchStartX.current - e.nativeEvent.pageX;
    if (Math.abs(diff) < 40) return; // ignore taps
    if (diff > 0 && activeIndex < slides.length - 1) {
      // swipe left → next
      setActiveIndex((prev) => prev + 1);
    } else if (diff < 0 && activeIndex > 0) {
      // swipe right → prev
      setActiveIndex((prev) => prev - 1);
    }
  };

  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 44) + 8 : 60;

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.bg, paddingTop: topPadding }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}>
      {/* ═══ TOP: Skip button ═══ */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: 24,
          height: 44,
          alignItems: 'center',
        }}>
        <TouchableOpacity onPress={completeOnboarding} activeOpacity={0.6}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textTertiary }}>
            {t('onboarding.skip')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══ MIDDLE: Slide content ═══ */}
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <LinearGradient
          colors={slide.gradientColors}
          style={{
            width: 130,
            height: 130,
            borderRadius: 36,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}>
          <Ionicons name={slide.icon} size={60} color="#FFFFFF" />
        </LinearGradient>

        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 28 }}>
          {slide.secondaryIcons.map((iconName, i) => (
            <View
              key={i}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: theme.iconBg,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Ionicons name={iconName} size={20} color={slide.gradientColors[0]} />
            </View>
          ))}
        </View>

        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: 10,
          }}>
          {t(slide.titleKey)}
        </Text>

        <Text
          style={{
            fontSize: 15,
            lineHeight: 23,
            color: theme.textSecondary,
            textAlign: 'center',
            paddingHorizontal: 8,
          }}>
          {t(slide.descriptionKey)}
        </Text>
      </View>

      {/* ═══ BOTTOM: Dots + Get Started (last screen only) ═══ */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 40, alignItems: 'center' }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                backgroundColor: i === activeIndex ? theme.purple : theme.border,
              }}
            />
          ))}
        </View>

        {/* Get Started button — only on last slide */}
        {isLast && (
          <TouchableOpacity
            onPress={completeOnboarding}
            activeOpacity={0.8}
            style={{
              width: '100%',
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: theme.purple,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>
              {t('onboarding.getStarted')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };
