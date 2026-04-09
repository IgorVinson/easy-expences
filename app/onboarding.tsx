import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const ONBOARDING_KEY = 'onboarding_completed';
const TOTAL_STEPS = 3; // Will grow to 8 as screens are added

// ─────────────────────────────────────────────
// Screen 1 — Emotional Welcome
// ─────────────────────────────────────────────
function Screen1({
  theme,
  t,
  onNext,
  onSkip,
}: {
  theme: ReturnType<typeof useTheme>['theme'];
  t: (key: string) => string;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Background blobs */}
      <View
        style={[styles.blobTopRight, { backgroundColor: theme.purple + '18' }]}
        pointerEvents="none"
      />
      <View
        style={[styles.blobBottomLeft, { backgroundColor: theme.successBg }]}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={[styles.logoBox, { backgroundColor: theme.purple + '22' }]}>
            <Ionicons name="wallet" size={18} color={theme.purple} />
          </View>
          <Text style={[styles.logoText, { color: theme.purple }]}>Keelio</Text>
        </View>
        <Pressable onPress={onSkip} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.screen1Content}
        showsVerticalScrollIndicator={false}>
        {/* Decorative card cluster */}
        <View style={styles.decorativeCluster}>
          <View
            style={[
              styles.decorCardBg,
              { backgroundColor: theme.purple + '33', transform: [{ rotate: '3deg' }] },
            ]}
          />
          <View
            style={[
              styles.decorCard,
              { backgroundColor: theme.cardBg, transform: [{ rotate: '-2deg' }] },
            ]}>
            <View style={[styles.decorIconBox, { backgroundColor: theme.purple + '22' }]}>
              <Ionicons name="heart" size={22} color={theme.purple} />
            </View>
            <View style={styles.decorLines}>
              <View style={[styles.decorLine, { width: '75%', backgroundColor: theme.border }]} />
              <View style={[styles.decorLine, { width: '50%', backgroundColor: theme.iconBg }]} />
              <View style={[styles.decorLine, { width: '65%', backgroundColor: theme.iconBg }]} />
            </View>
            <View style={styles.decorCardFooter}>
              <View style={[styles.decorBadge, { backgroundColor: theme.successBg }]}>
                <Ionicons name="checkmark-done" size={16} color={theme.success} />
              </View>
            </View>
          </View>
          <View
            style={[
              styles.floatingBadge,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}>
            <View style={[styles.floatingBadgeIcon, { backgroundColor: theme.success }]}>
              <Ionicons name="leaf" size={14} color="#fff" />
            </View>
            <View>
              <Text style={[styles.floatingBadgeLabel, { color: theme.textSecondary }]}>
                Inner Wealth
              </Text>
              <Text style={[styles.floatingBadgeValue, { color: theme.textPrimary }]}>
                +12% Clarity
              </Text>
            </View>
          </View>
        </View>

        {/* Headline */}
        <View style={styles.screen1Text}>
          <Text style={[styles.headline, { color: theme.textPrimary }]}>
            {"Money shouldn't "}
            <Text style={{ color: theme.purple, fontStyle: 'italic' }}>
              {t('onboarding.s1.titleAccent')}
            </Text>
            {'.'}
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {t('onboarding.s1.subtitle')}
          </Text>
          <View style={styles.taglineRow}>
            <View style={[styles.taglineLine, { backgroundColor: theme.success }]} />
            <Text style={[styles.taglineText, { color: theme.success }]}>
              {t('onboarding.s1.tagline').toUpperCase()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <Pressable onPress={onNext} style={styles.ctaButtonWrapper}>
          <LinearGradient colors={[theme.purple, theme.purpleCard]} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>{t('onboarding.s1.cta')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
        <Text style={[styles.footerHint, { color: theme.textTertiary }]}>
          Tap to begin your journey to financial serenity.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 2 — Question Cards
// ─────────────────────────────────────────────
const OPTION_ICONS: Array<'pause-circle' | 'help-circle' | 'sad'> = [
  'pause-circle',
  'help-circle',
  'sad',
];

function Screen2({
  theme,
  t,
  onNext,
  onBack,
  onSkip,
}: {
  theme: ReturnType<typeof useTheme>['theme'];
  t: (key: string) => string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const options = [
    t('onboarding.s2.option1'),
    t('onboarding.s2.option2'),
    t('onboarding.s2.option3'),
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={theme.textSecondary} />
          </Pressable>
          <Text style={[styles.logoText, { color: theme.purple }]}>Keelio</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.purple, width: `${(2 / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
        <Pressable onPress={onSkip} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.screen2Content}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.headline, { color: theme.textPrimary, marginBottom: 8 }]}>
          {t('onboarding.s2.title')}
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary, marginBottom: 28 }]}>
          {t('onboarding.s2.subtitle')}
        </Text>

        {options.map((option, i) => {
          const isSelected = selected === i;
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: isSelected ? theme.purple : theme.border,
                  borderWidth: isSelected ? 1.5 : 1,
                  marginBottom: 12,
                },
              ]}>
              <View
                style={[
                  styles.optionIconBox,
                  { backgroundColor: isSelected ? theme.purple + '22' : theme.iconBg },
                ]}>
                <Ionicons
                  name={OPTION_ICONS[i]}
                  size={26}
                  color={isSelected ? theme.purple : theme.textSecondary}
                />
              </View>
              <Text style={[styles.optionText, { color: theme.textPrimary, flex: 1 }]}>
                {option}
              </Text>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.purple} />}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <Pressable onPress={onNext} style={styles.ctaButtonWrapper}>
          <LinearGradient colors={[theme.purple, theme.purpleCard]} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>{t('onboarding.s2.cta')}</Text>
          </LinearGradient>
        </Pressable>
        <Text style={[styles.footerHint, { color: theme.textTertiary }]}>
          {t('onboarding.s2.hint')}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 3 — Emotional Insight
// ─────────────────────────────────────────────
function Screen3({
  theme,
  t,
  onNext,
  onBack,
  onSkip,
}: {
  theme: ReturnType<typeof useTheme>['theme'];
  t: (key: string) => string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={theme.textSecondary} />
          </Pressable>
          <Text style={[styles.logoText, { color: theme.purple }]}>Keelio</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.purple, width: `${(3 / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
        <Pressable onPress={onSkip} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.screen3Content}
        showsVerticalScrollIndicator={false}>
        {/* Abstract illustration */}
        <View style={styles.screen3Illustration}>
          <View style={[styles.glowCircle, { backgroundColor: theme.purple + '18' }]} />
          <View
            style={[
              styles.fragmentCard,
              styles.fragmentTopLeft,
              { backgroundColor: theme.iconBg, transform: [{ rotate: '-6deg' }] },
            ]}>
            <Ionicons name="help-circle-outline" size={28} color={theme.border} />
          </View>
          <View
            style={[
              styles.fragmentCard,
              styles.fragmentTopRight,
              { backgroundColor: theme.border, transform: [{ rotate: '4deg' }] },
            ]}>
            <View
              style={[
                styles.decorLine,
                { width: '70%', backgroundColor: theme.textTertiary + '44' },
              ]}
            />
            <View
              style={[
                styles.decorLine,
                { width: '50%', backgroundColor: theme.textTertiary + '44', marginTop: 6 },
              ]}
            />
          </View>
          <View style={[styles.gemCenter, { backgroundColor: theme.purple }]}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </View>
          <View
            style={[
              styles.resolvedCard,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}>
            <View style={styles.resolvedCardRow}>
              <View
                style={[styles.resolvedLine, { width: '55%', backgroundColor: theme.successBg }]}
              />
              <Ionicons name="checkmark-circle" size={18} color={theme.success} />
            </View>
            <View
              style={[
                styles.resolvedLine,
                { width: '100%', backgroundColor: theme.iconBg, marginTop: 8 },
              ]}
            />
            <View
              style={[
                styles.resolvedLine,
                { width: '75%', backgroundColor: theme.iconBg, marginTop: 4 },
              ]}
            />
          </View>
        </View>

        {/* Text block */}
        <View style={styles.screen3TextBlock}>
          <Text style={[styles.headline, { color: theme.textPrimary, textAlign: 'center' }]}>
            {t('onboarding.s3.title')}
          </Text>
          <Text
            style={[
              styles.bodyText,
              { color: theme.textSecondary, textAlign: 'center', marginTop: 8 },
            ]}>
            {"It's about not knowing what's "}
            <Text style={{ color: theme.success, fontWeight: '700' }}>
              {t('onboarding.s3.subtitleAccent')}
            </Text>
          </Text>
        </View>

        {/* Insight card */}
        <View
          style={[
            styles.insightCard,
            { backgroundColor: theme.iconBg, borderColor: theme.border },
          ]}>
          <View style={[styles.insightIconBox, { backgroundColor: theme.cardBg }]}>
            <Ionicons name="bulb-outline" size={20} color={theme.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightTitle, { color: theme.textPrimary }]}>
              {t('onboarding.s3.insightTitle')}
            </Text>
            <Text style={[styles.insightBody, { color: theme.textSecondary }]}>
              {t('onboarding.s3.insightBody')}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <Pressable onPress={onNext} style={styles.ctaButtonWrapper}>
          <LinearGradient colors={[theme.purple, theme.purpleCard]} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>{t('onboarding.s3.cta')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Root Onboarding Component
// ─────────────────────────────────────────────
export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)/overview');
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      completeOnboarding();
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const sharedProps = { theme, t, onNext: next, onSkip: completeOnboarding };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg, paddingTop: topPadding }]}>
      {step === 0 && <Screen1 {...sharedProps} />}
      {step === 1 && <Screen2 {...sharedProps} onBack={back} />}
      {step === 2 && <Screen3 {...sharedProps} onBack={back} />}
    </SafeAreaView>
  );
}

export { ONBOARDING_KEY };

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  screenContainer: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  progressTrack: { flex: 1, height: 4, borderRadius: 4, marginHorizontal: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // Screen 1
  screen1Content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140 },
  decorativeCluster: { width: '100%', height: 270, position: 'relative', marginBottom: 32 },
  decorCard: {
    position: 'absolute',
    top: 16,
    left: '8%',
    right: '8%',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    zIndex: 2,
  },
  decorCardBg: {
    position: 'absolute',
    top: 20,
    left: '6%',
    right: '6%',
    height: 200,
    borderRadius: 24,
    zIndex: 0,
  },
  decorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  decorLines: { gap: 8 },
  decorLine: { height: 8, borderRadius: 8 },
  decorCardFooter: { marginTop: 20, alignItems: 'flex-end' },
  decorBadge: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  floatingBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadgeLabel: { fontSize: 11, fontWeight: '500' },
  floatingBadgeValue: { fontSize: 15, fontWeight: '700' },
  screen1Text: { gap: 12 },
  headline: { fontSize: 30, fontWeight: '800', lineHeight: 38, letterSpacing: -0.5 },
  bodyText: { fontSize: 16, lineHeight: 24 },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  taglineLine: { width: 40, height: 3, borderRadius: 4 },
  taglineText: { fontSize: 12, fontWeight: '600', letterSpacing: 1.5 },

  // Screen 2
  screen2Content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { fontSize: 16, fontWeight: '600', lineHeight: 22 },

  // Screen 3
  screen3Content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 140 },
  screen3Illustration: {
    width: '100%',
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  fragmentCard: {
    position: 'absolute',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 70,
  },
  fragmentTopLeft: { top: 20, left: 20 },
  fragmentTopRight: { top: 20, right: 20, padding: 14 },
  gemCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 2,
  },
  resolvedCard: {
    position: 'absolute',
    bottom: 8,
    left: '12%',
    right: '12%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  resolvedCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resolvedLine: { height: 8, borderRadius: 8 },
  screen3TextBlock: { alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
  insightCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  insightIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  insightBody: { fontSize: 13, lineHeight: 20, fontWeight: '500' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  ctaButtonWrapper: { width: '100%', maxWidth: 440 },
  ctaButton: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  footerHint: { marginTop: 12, fontSize: 12, textAlign: 'center' },

  // Bg decorations (Screen 1)
  blobTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    zIndex: -1,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    zIndex: -1,
  },
});
