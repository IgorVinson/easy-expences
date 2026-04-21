import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { formatCurrencyAmount, normalizeCurrencyCode } from '../config/currencies';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebaseConfig';
import { getOnboardingStorageKey } from '../utils/onboarding';

const TOTAL_STEPS = 9;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useAdaptiveOnboardingLayout() {
  const { height, width } = useWindowDimensions();
  const shortEdge = Math.min(width, height);

  return {
    width,
    height,
    shortEdge,
    isShort: height < 700,
    isNarrow: width < 375,
    horizontalPadding: clampNumber(width * 0.05, 12, 28),
    headerHeight: clampNumber(height * 0.058, 40, 60),
    headerIconSize: clampNumber(shortEdge * 0.045, 16, 22),
    headerGap: clampNumber(width * 0.02, 4, 10),
    logoBoxSize: clampNumber(shortEdge * 0.07, 24, 34),
    logoBoxRadius: clampNumber(shortEdge * 0.018, 6, 10),
    logoTextSize: clampNumber(shortEdge * 0.04, 14, 21),
    progressHeight: clampNumber(height * 0.004, 3, 5),
    progressMargin: clampNumber(width * 0.03, 6, 18),
    contentTop: clampNumber(height * 0.01, 2, 20),
    contentBottom: clampNumber(height * 0.006, 2, 24),
    footerTop: clampNumber(height * 0.006, 2, 18),
    footerBottom:
      Platform.OS === 'ios'
        ? clampNumber(height * 0.018, 6, 34)
        : clampNumber(height * 0.013, 4, 24),
    footerHintSize: clampNumber(shortEdge * 0.025, 9, 12.5),
    footerHintMargin: clampNumber(height * 0.006, 4, 12),
    ctaVerticalPadding: clampNumber(height * 0.012, 8, 18),
    ctaRadius: clampNumber(shortEdge * 0.1, 16, 50),
    ctaTextSize: clampNumber(shortEdge * 0.036, 13, 18),
    ctaIconSize: clampNumber(shortEdge * 0.04, 14, 20),
    titleSize: clampNumber(shortEdge * 0.065, 20, 34),
    titleLineHeight: clampNumber(shortEdge * 0.08, 26, 42),
    bodySize: clampNumber(shortEdge * 0.035, 12, 17),
    bodyLineHeight: clampNumber(shortEdge * 0.05, 16, 26),
    eyebrowSize: clampNumber(shortEdge * 0.025, 8, 12),
    cardRadius: clampNumber(shortEdge * 0.035, 10, 24),
    screen1ClusterHeight: clampNumber(height * 0.19, 96, 240),
    screen1CardPadding: clampNumber(shortEdge * 0.04, 8, 24),
    screen1BadgePadding: clampNumber(shortEdge * 0.025, 6, 14),
    optionCardPadding: clampNumber(shortEdge * 0.035, 8, 18),
    optionIconBoxSize: clampNumber(shortEdge * 0.1, 28, 52),
    screen3IllustrationHeight: clampNumber(height * 0.18, 100, 240),
    screen3GlowSize: clampNumber(shortEdge * 0.38, 100, 220),
    fragmentWidth: clampNumber(shortEdge * 0.17, 50, 80),
    fragmentHeight: clampNumber(height * 0.05, 30, 70),
    s5GridGap: clampNumber(width * 0.02, 6, 12),
    s5TilePadding: clampNumber(shortEdge * 0.032, 8, 18),
    s5IconBoxSize: clampNumber(shortEdge * 0.08, 24, 44),
    inputPaddingY: clampNumber(height * 0.01, 8, 14),
    inputFontSize: clampNumber(shortEdge * 0.032, 12, 15),
    s7HeroIconSize: clampNumber(shortEdge * 0.1, 28, 64),
    s7TitleSize: clampNumber(shortEdge * 0.06, 18, 30),
    s7TitleLineHeight: clampNumber(shortEdge * 0.07, 24, 36),
    s7SubtitleSize: clampNumber(shortEdge * 0.032, 12, 15),
    s7CardPaddingY: clampNumber(height * 0.01, 6, 14),
    s7CardPaddingX: clampNumber(width * 0.025, 8, 16),
    s8ImageWrapperHeight: clampNumber(height * 0.18, 80, 220),
    s8HeroSize: clampNumber(shortEdge * 0.32, 70, 180),
    s8HeroRadius: clampNumber(shortEdge * 0.07, 18, 40),
    s8PlanPadding: clampNumber(shortEdge * 0.025, 8, 16),
    s9HeroIconSize: clampNumber(shortEdge * 0.1, 24, 52),
    s9HighlightMinHeight: clampNumber(height * 0.065, 44, 92),
    s9CardPaddingY: clampNumber(height * 0.01, 6, 16),
  };
}

function getCurrentMonthStartIso() {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

// ─────────────────────────────────────────────
// Category config (Screen 5)
// ─────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  {
    key: 'opt_dining',
    icon: 'restaurant' as const,
    color: '#FB923C',
    bgLight: '#FED7AA',
    bgDark: '#FB923C',
    firestoreName: 'Dining out',
    budget: 300,
  },
  {
    key: 'opt_shopping',
    icon: 'bag-handle' as const,
    color: '#60A5FA',
    bgLight: '#BFDBFE',
    bgDark: '#60A5FA',
    firestoreName: 'Shopping',
    budget: 400,
  },
  {
    key: 'opt_travel',
    icon: 'airplane' as const,
    color: '#38BDF8',
    bgLight: '#E0F2FE',
    bgDark: '#38BDF8',
    firestoreName: 'Travel',
    budget: 800,
  },
  {
    key: 'opt_entertainment',
    icon: 'film' as const,
    color: '#A78BFA',
    bgLight: '#EDE9FE',
    bgDark: '#A78BFA',
    firestoreName: 'Entertainment',
    budget: 200,
  },
];

// ─────────────────────────────────────────────
// Shared types / helpers
// ─────────────────────────────────────────────
type SharedProps = {
  theme: ReturnType<typeof useTheme>['theme'];
  t: (key: string) => string;
  language: string;
  onNext: () => void;
  onBack: () => void;
  step: number;
};

function Header({
  theme,
  onBack,
  step,
  showBack,
}: {
  theme: ReturnType<typeof useTheme>['theme'];
  onBack: () => void;
  step: number;
  showBack?: boolean;
}) {
  const layout = useAdaptiveOnboardingLayout();

  return (
    <View
      style={[
        styles.header,
        { paddingHorizontal: layout.horizontalPadding, height: layout.headerHeight },
      ]}>
      <View style={[styles.headerLeft, { gap: layout.headerGap }]}>
        {showBack ? (
          <Pressable onPress={onBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={layout.headerIconSize} color={theme.textSecondary} />
          </Pressable>
        ) : (
          <View style={[styles.logoBox2, { width: layout.logoBoxSize }]}>
            <View
              style={[
                styles.logoBox,
                {
                  width: layout.logoBoxSize,
                  height: layout.logoBoxSize,
                  borderRadius: layout.logoBoxRadius,
                  backgroundColor: theme.purple + '22',
                },
              ]}>
              <Ionicons
                name="wallet"
                size={clampNumber(layout.headerIconSize - 2, 16, 20)}
                color={theme.purple}
              />
            </View>
          </View>
        )}
        <Text style={[styles.logoText, { color: theme.purple, fontSize: layout.logoTextSize }]}>
          Keelio
        </Text>
      </View>
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: theme.border,
            height: layout.progressHeight,
            marginHorizontal: layout.progressMargin,
          },
        ]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.purple, width: `${(step / TOTAL_STEPS) * 100}%` },
          ]}
        />
      </View>
      <View style={{ width: 22 }} />
    </View>
  );
}

function CTAButton({
  label,
  onPress,
  theme,
  icon,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
}) {
  const layout = useAdaptiveOnboardingLayout();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.ctaButtonWrapper,
        { maxWidth: Math.min(440, layout.width - layout.horizontalPadding * 2) },
      ]}
      disabled={disabled || loading}>
      <LinearGradient
        colors={[theme.purple, theme.purpleCard]}
        style={[
          styles.ctaButton,
          {
            paddingVertical: layout.ctaVerticalPadding,
            borderRadius: layout.ctaRadius,
          },
          disabled || loading ? { opacity: 0.88 } : null,
        ]}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={[styles.ctaButtonText, { fontSize: layout.ctaTextSize }]}>{label}</Text>
            {icon && <Ionicons name={icon} size={layout.ctaIconSize} color="#fff" />}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function AdaptiveStepContent({
  contentContainerStyle,
  children,
}: {
  contentContainerStyle: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return <View style={contentContainerStyle}>{children}</View>;
}

// ─────────────────────────────────────────────
// Screen 1 — Emotional Welcome
// ─────────────────────────────────────────────
function Screen1({ theme, t, onNext }: Pick<SharedProps, 'theme' | 't' | 'onNext'>) {
  const layout = useAdaptiveOnboardingLayout();
  const screen1Title = t('onboarding.s1.title');
  const screen1TitleAccent = t('onboarding.s1.titleAccent');
  const screen1AccentIndex = screen1Title.indexOf(screen1TitleAccent);
  const screen1TitlePrefix =
    screen1AccentIndex >= 0 ? screen1Title.slice(0, screen1AccentIndex) : screen1Title;
  const screen1TitleSuffix =
    screen1AccentIndex >= 0
      ? screen1Title.slice(screen1AccentIndex + screen1TitleAccent.length)
      : '';

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <View
        style={[styles.blobTopRight, { backgroundColor: theme.purple + '18' }]}
        pointerEvents="none"
      />
      <View
        style={[styles.blobBottomLeft, { backgroundColor: theme.successBg }]}
        pointerEvents="none"
      />

      <View
        style={[
          styles.header,
          { paddingHorizontal: layout.horizontalPadding, height: layout.headerHeight },
        ]}>
        <View style={[styles.logoRow, { gap: layout.headerGap }]}>
          <View
            style={[
              styles.logoBox,
              {
                width: layout.logoBoxSize,
                height: layout.logoBoxSize,
                borderRadius: layout.logoBoxRadius,
                backgroundColor: theme.purple + '22',
              },
            ]}>
            <Ionicons
              name="wallet"
              size={clampNumber(layout.headerIconSize - 2, 16, 20)}
              color={theme.purple}
            />
          </View>
          <Text style={[styles.logoText, { color: theme.purple, fontSize: layout.logoTextSize }]}>
            Keelio
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: theme.border,
              height: layout.progressHeight,
              marginHorizontal: layout.progressMargin,
            },
          ]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.purple, width: `${(1 / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
        <View style={{ width: 22 }} />
      </View>

      <AdaptiveStepContent
        contentContainerStyle={[
          styles.scrollContentGrow,
          styles.screen1Content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.contentTop,
            paddingBottom: layout.contentBottom,
          },
        ]}>
        <View
          style={[
            styles.decorativeCluster,
            {
              height: layout.screen1ClusterHeight,
              marginBottom: clampNumber(layout.height * 0.05, 28, 44),
            },
          ]}>
          <View
            style={[
              styles.decorCardBg,
              {
                backgroundColor: theme.purple + '33',
                height: clampNumber(layout.screen1ClusterHeight * 0.7, 132, 184),
                borderRadius: layout.cardRadius,
                transform: [{ rotate: '3deg' }],
              },
            ]}
          />
          <View
            style={[
              styles.decorCard,
              {
                backgroundColor: theme.cardBg,
                padding: layout.screen1CardPadding,
                borderRadius: layout.cardRadius,
                transform: [{ rotate: '-2deg' }],
              },
            ]}>
            <View
              style={[
                styles.decorIconBox,
                {
                  width: layout.s5IconBoxSize,
                  height: layout.s5IconBoxSize,
                  borderRadius: clampNumber(layout.s5IconBoxSize / 3, 12, 16),
                  backgroundColor: theme.purple + '22',
                },
              ]}>
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
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                padding: layout.screen1BadgePadding,
                borderRadius: clampNumber(layout.cardRadius - 4, 14, 20),
                gap: layout.headerGap,
              },
            ]}>
            <View
              style={[
                styles.floatingBadgeIcon,
                {
                  width: clampNumber(layout.shortEdge * 0.092, 32, 36),
                  height: clampNumber(layout.shortEdge * 0.092, 32, 36),
                  borderRadius: clampNumber(layout.shortEdge * 0.046, 16, 18),
                  backgroundColor: theme.success,
                },
              ]}>
              <Ionicons name="leaf" size={14} color="#fff" />
            </View>
            <View>
              <Text
                style={[
                  styles.floatingBadgeLabel,
                  { color: theme.textSecondary, fontSize: layout.eyebrowSize },
                ]}>
                {t('onboarding.s1.badgeLabel')}
              </Text>
              <Text
                style={[
                  styles.floatingBadgeValue,
                  { color: theme.textPrimary, fontSize: clampNumber(layout.bodySize, 14, 16) },
                ]}>
                {t('onboarding.s1.badgeValue')}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.screen1Text,
            {
              gap: clampNumber(layout.height * 0.014, 10, 12),
              marginTop: clampNumber(layout.height * -0.012, -10, -4),
            },
          ]}>
          <Text
            style={[
              styles.headline,
              {
                color: theme.textPrimary,
                fontSize: layout.titleSize,
                lineHeight: layout.titleLineHeight,
              },
            ]}>
            {screen1TitlePrefix}
            {screen1AccentIndex >= 0 ? (
              <>
                <Text style={{ color: theme.purple, fontStyle: 'italic' }}>
                  {screen1TitleAccent}
                </Text>
                {screen1TitleSuffix}
              </>
            ) : null}
          </Text>
          <Text
            style={[
              styles.bodyText,
              {
                color: theme.textSecondary,
                fontSize: layout.bodySize,
                lineHeight: layout.bodyLineHeight,
              },
            ]}>
            {t('onboarding.s1.subtitle')}
          </Text>
          <View style={[styles.taglineRow, { gap: layout.headerGap }]}>
            <View
              style={[
                styles.taglineLine,
                {
                  backgroundColor: theme.success,
                  width: clampNumber(layout.shortEdge * 0.103, 32, 40),
                },
              ]}
            />
            <Text
              style={[styles.taglineText, { color: theme.success, fontSize: layout.eyebrowSize }]}>
              {t('onboarding.s1.tagline').toUpperCase()}
            </Text>
          </View>
        </View>
      </AdaptiveStepContent>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.bg,
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.footerTop,
            paddingBottom: layout.footerBottom,
          },
        ]}>
        <CTAButton
          label={t('onboarding.s1.cta')}
          onPress={onNext}
          theme={theme}
          icon="arrow-forward"
        />
        <Text
          style={[
            styles.footerHint,
            {
              color: theme.textTertiary,
              fontSize: layout.footerHintSize,
              marginTop: layout.footerHintMargin,
            },
          ]}>
          {t('onboarding.s1.hint')}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 2 — Question Cards
// ─────────────────────────────────────────────
const OPTION_ICONS: ('pause-circle' | 'help-circle' | 'sad')[] = [
  'pause-circle',
  'help-circle',
  'sad',
];

function Screen2({ theme, t, onNext, onBack, step }: SharedProps) {
  const layout = useAdaptiveOnboardingLayout();

  const [selected, setSelected] = useState<number | null>(null);
  const options = [
    t('onboarding.s2.option1'),
    t('onboarding.s2.option2'),
    t('onboarding.s2.option3'),
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <Header theme={theme} onBack={onBack} step={step} showBack />
      <AdaptiveStepContent
        contentContainerStyle={[
          styles.scrollContentGrow,
          styles.screen2Content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.contentTop,
            paddingBottom: layout.contentBottom,
          },
        ]}>
        <Text
          style={[
            styles.headline,
            {
              color: theme.textPrimary,
              marginBottom: 8,
              fontSize: layout.titleSize,
              lineHeight: layout.titleLineHeight,
            },
          ]}>
          {t('onboarding.s2.title')}
        </Text>
        <Text
          style={[
            styles.bodyText,
            {
              color: theme.textSecondary,
              marginBottom: clampNumber(layout.height * 0.032, 18, 28),
              fontSize: layout.bodySize,
              lineHeight: layout.bodyLineHeight,
            },
          ]}>
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
                  padding: layout.optionCardPadding,
                  borderRadius: layout.cardRadius,
                  gap: clampNumber(layout.shortEdge * 0.036, 10, 14),
                  marginBottom: 12,
                },
              ]}>
              <View
                style={[
                  styles.optionIconBox,
                  {
                    width: layout.optionIconBoxSize,
                    height: layout.optionIconBoxSize,
                    borderRadius: layout.optionIconBoxSize / 2,
                    backgroundColor: isSelected ? theme.purple + '22' : theme.iconBg,
                  },
                ]}>
                <Ionicons
                  name={OPTION_ICONS[i]}
                  size={26}
                  color={isSelected ? theme.purple : theme.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.optionText,
                  {
                    color: theme.textPrimary,
                    flex: 1,
                    fontSize: clampNumber(layout.bodySize + 0.5, 15, 16),
                    lineHeight: clampNumber(layout.bodyLineHeight - 2, 20, 22),
                  },
                ]}>
                {option}
              </Text>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.purple} />}
            </Pressable>
          );
        })}
      </AdaptiveStepContent>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.bg,
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.footerTop,
            paddingBottom: layout.footerBottom,
          },
        ]}>
        <CTAButton label={t('onboarding.s2.cta')} onPress={onNext} theme={theme} />
        <Text
          style={[
            styles.footerHint,
            {
              color: theme.textTertiary,
              fontSize: layout.footerHintSize,
              marginTop: layout.footerHintMargin,
            },
          ]}>
          {t('onboarding.s2.hint')}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 3 — Emotional Insight
// ─────────────────────────────────────────────
function Screen3({ theme, t, onNext, onBack, step }: SharedProps) {
  const layout = useAdaptiveOnboardingLayout();
  const screen3Subtitle = t('onboarding.s3.subtitle');
  const screen3SubtitleAccent = t('onboarding.s3.subtitleAccent');
  const screen3AccentIndex = screen3Subtitle.indexOf(screen3SubtitleAccent);
  const screen3SubtitlePrefix =
    screen3AccentIndex >= 0 ? screen3Subtitle.slice(0, screen3AccentIndex) : screen3Subtitle;
  const screen3SubtitleSuffix =
    screen3AccentIndex >= 0
      ? screen3Subtitle.slice(screen3AccentIndex + screen3SubtitleAccent.length)
      : '';

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <Header theme={theme} onBack={onBack} step={step} showBack />
      <AdaptiveStepContent
        contentContainerStyle={[
          styles.scrollContentGrow,
          styles.screen3Content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: clampNumber(layout.contentTop - 4, 6, 14),
            paddingBottom: layout.contentBottom,
          },
        ]}>
        <View
          style={[
            styles.screen3Illustration,
            {
              height: layout.screen3IllustrationHeight,
              marginBottom: clampNumber(layout.height * 0.03, 18, 28),
            },
          ]}>
          <View
            style={[
              styles.glowCircle,
              {
                backgroundColor: theme.purple + '18',
                width: layout.screen3GlowSize,
                height: layout.screen3GlowSize,
                borderRadius: layout.screen3GlowSize / 2,
              },
            ]}
          />
          <View
            style={[
              styles.fragmentCard,
              styles.fragmentTopLeft,
              {
                backgroundColor: theme.iconBg,
                width: layout.fragmentWidth,
                height: layout.fragmentHeight,
                borderRadius: layout.cardRadius - 2,
                transform: [{ rotate: '-6deg' }],
              },
            ]}>
            <Ionicons name="help-circle-outline" size={28} color={theme.border} />
          </View>
          <View
            style={[
              styles.fragmentCard,
              styles.fragmentTopRight,
              {
                backgroundColor: theme.border,
                width: layout.fragmentWidth,
                height: layout.fragmentHeight,
                borderRadius: layout.cardRadius - 2,
                transform: [{ rotate: '4deg' }],
              },
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
          <View
            style={[
              styles.gemCenter,
              {
                backgroundColor: theme.purple,
                width: clampNumber(layout.shortEdge * 0.144, 48, 56),
                height: clampNumber(layout.shortEdge * 0.144, 48, 56),
                borderRadius: clampNumber(layout.shortEdge * 0.072, 24, 28),
              },
            ]}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </View>
          <View
            style={[
              styles.resolvedCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                padding: clampNumber(layout.shortEdge * 0.041, 14, 16),
                borderRadius: layout.cardRadius,
              },
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

        <View
          style={[
            styles.screen3TextBlock,
            { marginBottom: clampNumber(layout.height * 0.028, 18, 24) },
          ]}>
          <Text
            style={[
              styles.headline,
              {
                color: theme.textPrimary,
                textAlign: 'center',
                fontSize: layout.titleSize,
                lineHeight: layout.titleLineHeight,
              },
            ]}>
            {t('onboarding.s3.title')}
          </Text>
          <Text
            style={[
              styles.bodyText,
              {
                color: theme.textSecondary,
                textAlign: 'center',
                marginTop: 8,
                fontSize: layout.bodySize,
                lineHeight: layout.bodyLineHeight,
              },
            ]}>
            {screen3SubtitlePrefix}
            {screen3AccentIndex >= 0 ? (
              <>
                <Text style={{ color: theme.success, fontWeight: '700' }}>
                  {screen3SubtitleAccent}
                </Text>
                {screen3SubtitleSuffix}
              </>
            ) : null}
          </Text>
        </View>

        <View
          style={[
            styles.insightCard,
            {
              backgroundColor: theme.iconBg,
              borderColor: theme.border,
              padding: clampNumber(layout.shortEdge * 0.051, 16, 20),
              borderRadius: layout.cardRadius,
              gap: clampNumber(layout.shortEdge * 0.036, 10, 14),
            },
          ]}>
          <View
            style={[
              styles.insightIconBox,
              {
                backgroundColor: theme.cardBg,
                width: clampNumber(layout.shortEdge * 0.103, 36, 40),
                height: clampNumber(layout.shortEdge * 0.103, 36, 40),
                borderRadius: clampNumber(layout.shortEdge * 0.051, 18, 20),
              },
            ]}>
            <Ionicons name="bulb-outline" size={20} color={theme.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.insightTitle,
                { color: theme.textPrimary, fontSize: clampNumber(layout.bodySize, 14, 15) },
              ]}>
              {t('onboarding.s3.insightTitle')}
            </Text>
            <Text
              style={[
                styles.insightBody,
                {
                  color: theme.textSecondary,
                  fontSize: clampNumber(layout.bodySize - 1, 13, 14),
                  lineHeight: clampNumber(layout.bodyLineHeight - 4, 19, 22),
                },
              ]}>
              {t('onboarding.s3.insightBody')}
            </Text>
          </View>
        </View>
      </AdaptiveStepContent>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.bg,
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.footerTop,
            paddingBottom: layout.footerBottom,
          },
        ]}>
        <CTAButton
          label={t('onboarding.s3.cta')}
          onPress={onNext}
          theme={theme}
          icon="arrow-forward"
        />
        <Text
          style={[
            styles.footerHint,
            {
              color: theme.textTertiary,
              fontSize: layout.footerHintSize,
              marginTop: layout.footerHintMargin,
            },
          ]}>
          {t('onboarding.s3.hint')}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 4 — Anti-Budgeting Value Prop
// ─────────────────────────────────────────────
function Screen4({ theme, t, language, onNext, onBack, step }: SharedProps) {
  const layout = useAdaptiveOnboardingLayout();
  const compactHeight = layout.isShort;
  const usesHryvnia = language === 'ua';
  const demoCurrency = usesHryvnia ? 'UAH' : 'USD';
  const formatDemoMoney = (amount: number, maximumFractionDigits = 0) =>
    formatCurrencyAmount(amount, demoCurrency, language, {
      minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
      maximumFractionDigits,
    });

  const demoRowData = usesHryvnia
    ? [
        { date: '10/24', desc: t('onboarding.s4.sheetRow1'), amount: -1240 },
        { date: '10/25', desc: t('onboarding.s4.sheetRow2'), amount: -18000 },
        { date: '10/25', desc: t('onboarding.s4.sheetRow3'), amount: -180 },
        { date: '10/26', desc: t('onboarding.s4.sheetRow4'), amount: -319 },
      ]
    : [
        { date: '10/24', desc: t('onboarding.s4.sheetRow1'), amount: -84.35 },
        { date: '10/25', desc: t('onboarding.s4.sheetRow2'), amount: -1450 },
        { date: '10/25', desc: t('onboarding.s4.sheetRow3'), amount: -6.75 },
        { date: '10/26', desc: t('onboarding.s4.sheetRow4'), amount: -15.99 },
      ];
  const DEMO_ROWS = demoRowData.map((row) => ({
    ...row,
    amount: formatDemoMoney(row.amount, usesHryvnia ? 0 : 2),
  }));
  const demoTotal = demoRowData.reduce((sum, row) => sum + row.amount, 0);
  const DEMO_CATS = [
    {
      icon: 'restaurant' as const,
      label: t('onboarding.s4.cat1'),
      color: '#FB923C',
      left: usesHryvnia ? formatDemoMoney(2000) : formatDemoMoney(200),
    },
    {
      icon: 'airplane' as const,
      label: t('onboarding.s4.cat2'),
      color: '#38BDF8',
      left: usesHryvnia ? formatDemoMoney(32000) : formatDemoMoney(1600),
    },
    {
      icon: 'film' as const,
      label: t('onboarding.s4.cat3'),
      color: theme.purple,
      left: usesHryvnia ? formatDemoMoney(8000) : formatDemoMoney(120),
    },
  ];
  const compressedHeight = layout.height < 780;
  const logoBoxSize = clampNumber(layout.shortEdge * (compressedHeight ? 0.16 : 0.19), 56, 72);
  const logoIconSize = clampNumber(logoBoxSize * 0.3, 18, 22);
  const badgeTop = compressedHeight ? -6 : -8;
  const titleBottom = compressedHeight ? 2 : 4;
  const subtitleBottom = compressedHeight ? 6 : compactHeight ? 8 : 16;
  const sheetWidth = compressedHeight ? '100%' : '90%';
  const sheetPadding = compressedHeight ? 6 : 8;
  const sheetRadius = compressedHeight ? 12 : 14;
  const sheetHeaderPad = compressedHeight ? 4 : 6;
  const sheetHeaderMargin = compressedHeight ? 4 : 6;
  const sheetRowMargin = compressedHeight ? 3 : 4;
  const sheetFontSize = compressedHeight ? 8 : 9;
  const sheetHeaderFontSize = compressedHeight ? 7 : 8;
  const sheetFooterPad = compressedHeight ? 4 : 6;
  const sheetFooterMargin = compressedHeight ? 3 : 4;
  const sheetRows = compressedHeight ? DEMO_ROWS.slice(0, 3) : DEMO_ROWS;
  const xBadgeSize = compressedHeight ? 22 : 26;
  const xBadgeIcon = compressedHeight ? 12 : 14;
  const arrowLineHeight = compressedHeight ? 14 : 24;
  const arrowCircleSize = compressedHeight ? 28 : 36;
  const arrowIconSize = compressedHeight ? 14 : 18;
  const catCardPadding = compressedHeight ? 10 : compactHeight ? 12 : 14;
  const catRowMargin = compressedHeight ? 8 : 10;
  const catIconSize = compressedHeight ? 32 : 38;
  const catIconRadius = compressedHeight ? 9 : 10;
  const catLabelSize = compressedHeight ? 13 : 14;
  const catLeftSize = compressedHeight ? 12 : 13;
  const catGap = compressedHeight ? 8 : 10;

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <Header theme={theme} onBack={onBack} step={step} showBack />

      <AdaptiveStepContent
        contentContainerStyle={[
          styles.scrollContentGrow,
          styles.screen4Content,
          compactHeight && styles.screen4ContentCompact,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: clampNumber(layout.contentTop - 2, 4, 18),
            paddingBottom: layout.contentBottom,
            justifyContent: 'space-between',
          },
        ]}>
        {/* Logo + badge */}
        <View style={[styles.s4LogoWrapper, compactHeight && styles.s4LogoWrapperCompact]}>
          <View
            style={[
              styles.s4LogoBox,
              {
                backgroundColor: theme.successBg,
                width: logoBoxSize,
                height: logoBoxSize,
                borderRadius: clampNumber(logoBoxSize * 0.28, 16, 20),
              },
            ]}>
            <View style={[styles.logoBox, { backgroundColor: theme.success + '33' }]}>
              <Ionicons name="wallet" size={logoIconSize} color={theme.success} />
            </View>
          </View>
          <View style={[styles.s4Badge, { backgroundColor: theme.purple, top: badgeTop }]}>
            <Text style={styles.s4BadgeText}>{t('onboarding.s4.tagBadge')}</Text>
          </View>
        </View>

        {/* Headline */}
        <Text
          style={[
            styles.headline,
            {
              color: theme.textPrimary,
              textAlign: 'center',
              marginBottom: titleBottom,
              fontSize: layout.titleSize,
              lineHeight: layout.titleLineHeight,
            },
          ]}>
          {t('onboarding.s4.title').replace(t('onboarding.s4.titleStrike'), '')}
          <Text style={{ textDecorationLine: 'line-through', color: theme.textTertiary }}>
            {t('onboarding.s4.titleStrike')}
          </Text>
        </Text>
        <Text
          style={[
            styles.bodyText,
            {
              color: theme.textSecondary,
              textAlign: 'center',
              marginBottom: subtitleBottom,
              fontSize: layout.bodySize,
              lineHeight: layout.bodyLineHeight,
            },
          ]}>
          {t('onboarding.s4.subtitle')}{' '}
          <Text style={{ color: theme.success, fontWeight: '700' }}>
            {t('onboarding.s4.subtitleAccent')}
          </Text>{' '}
          {t('onboarding.s4.subtitleEnd')}
        </Text>

        {/* Spreadsheet (crossed out) */}
        <View style={styles.s4SpreadsheetWrapper}>
          <View
            style={[
              styles.s4Spreadsheet,
              compactHeight && styles.s4SpreadsheetCompact,
              {
                backgroundColor: theme.iconBg,
                borderColor: theme.border,
                width: sheetWidth,
                padding: sheetPadding,
                borderRadius: sheetRadius,
              },
            ]}>
            <View
              style={[
                styles.s4SheetHeader,
                {
                  borderBottomColor: theme.border,
                  paddingBottom: sheetHeaderPad,
                  marginBottom: sheetHeaderMargin,
                },
              ]}>
              {[
                t('onboarding.s4.sheetHeaderDate'),
                t('onboarding.s4.sheetHeaderDescription'),
                t('onboarding.s4.sheetHeaderAmount'),
                t('onboarding.s4.sheetHeaderBalance'),
              ].map((h) => (
                <Text
                  key={h}
                  style={[
                    styles.s4SheetHeaderCell,
                    {
                      color: theme.textTertiary,
                      flex: h === t('onboarding.s4.sheetHeaderDescription') ? 2 : 1,
                      fontSize: sheetHeaderFontSize,
                    },
                  ]}>
                  {h}
                </Text>
              ))}
            </View>
            {sheetRows.map((row, i) => (
              <View key={i} style={[styles.s4SheetRow, { marginBottom: sheetRowMargin }]}>
                <Text
                  style={[
                    styles.s4SheetCell,
                    { color: theme.textSecondary, flex: 1, fontSize: sheetFontSize },
                  ]}>
                  {row.date}
                </Text>
                <Text
                  style={[
                    styles.s4SheetCell,
                    { color: theme.textSecondary, flex: 2, fontSize: sheetFontSize },
                  ]}
                  numberOfLines={1}>
                  {row.desc}
                </Text>
                <Text
                  style={[
                    styles.s4SheetCell,
                    { color: theme.error, flex: 1, textAlign: 'right', fontSize: sheetFontSize },
                  ]}>
                  {row.amount}
                </Text>
              </View>
            ))}
            <View
              style={[
                styles.s4SheetFooter,
                {
                  borderTopColor: theme.border,
                  paddingTop: sheetFooterPad,
                  marginTop: sheetFooterMargin,
                },
              ]}>
              <Text
                style={[
                  styles.s4SheetFooterLabel,
                  { color: theme.textPrimary, fontSize: sheetHeaderFontSize },
                ]}>
                {t('onboarding.s4.sheetTotal')}
              </Text>
              <Text
                style={[
                  styles.s4SheetFooterValue,
                  { color: theme.error, fontSize: sheetFontSize },
                ]}>
                {formatDemoMoney(demoTotal, usesHryvnia ? 0 : 2)}
              </Text>
            </View>
          </View>
          {/* X badge */}
          <View
            style={[
              styles.s4XBadge,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                width: xBadgeSize,
                height: xBadgeSize,
                borderRadius: xBadgeSize / 2,
              },
            ]}>
            <Ionicons name="close" size={xBadgeIcon} color={theme.error} />
          </View>
        </View>

        {/* Arrow transition */}
        <View style={[styles.s4Arrow, compactHeight && styles.s4ArrowCompact]}>
          <View
            style={[styles.s4ArrowLine, { backgroundColor: theme.border, height: arrowLineHeight }]}
          />
          <View
            style={[
              styles.s4ArrowCircle,
              {
                backgroundColor: theme.successBg,
                borderColor: theme.success + '44',
                width: arrowCircleSize,
                height: arrowCircleSize,
                borderRadius: arrowCircleSize / 2,
              },
            ]}>
            <Ionicons name="arrow-down" size={arrowIconSize} color={theme.success} />
          </View>
        </View>

        {/* Keelio categories card */}
        <View
          style={[
            styles.s4CatCard,
            compactHeight && styles.s4CatCardCompact,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.success,
              padding: catCardPadding,
            },
          ]}>
          {DEMO_CATS.map((cat, i) => (
            <View
              key={i}
              style={[styles.s4CatRow, i < DEMO_CATS.length - 1 && { marginBottom: catRowMargin }]}>
              <View style={[styles.s4CatLeft, { gap: catGap }]}>
                <View
                  style={[
                    styles.s4CatIcon,
                    {
                      backgroundColor: cat.color + '22',
                      width: catIconSize,
                      height: catIconSize,
                      borderRadius: catIconRadius,
                    },
                  ]}>
                  <Ionicons name={cat.icon} size={18} color={cat.color} />
                </View>
                <Text
                  style={[styles.s4CatLabel, { color: theme.textPrimary, fontSize: catLabelSize }]}>
                  {cat.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.s4CatLeft_left,
                  { color: theme.textPrimary, fontSize: catLeftSize },
                ]}>
                {t('onboarding.s4.leftAmount', { amount: cat.left })}
              </Text>
            </View>
          ))}
        </View>
      </AdaptiveStepContent>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.bg,
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.footerTop,
            paddingBottom: layout.footerBottom,
          },
        ]}>
        <CTAButton
          label={t('onboarding.s4.cta')}
          onPress={onNext}
          theme={theme}
          icon="arrow-forward"
        />
        <Text
          style={[
            styles.footerHint,
            {
              color: theme.textTertiary,
              fontSize: layout.footerHintSize,
              marginTop: layout.footerHintMargin,
            },
          ]}>
          {t('onboarding.s4.socialProof')}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 5 — Category Selection (affects app)
// ─────────────────────────────────────────────
function Screen5({
  theme,
  t,
  onNext,
  onBack,
  step,
  onSelectionsChange,
}: SharedProps & { onSelectionsChange: (keys: string[], custom: string) => void }) {
  const layout = useAdaptiveOnboardingLayout();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customText, setCustomText] = useState('');

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleNext = () => {
    onSelectionsChange(Array.from(selected), customText.trim());
    onNext();
  };

  const inputRef = React.useRef<TextInput>(null);

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <Header theme={theme} onBack={onBack} step={step} showBack />

      <AdaptiveStepContent
        contentContainerStyle={[
          styles.scrollContentGrow,
          styles.screen5Content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.contentTop,
            paddingBottom: layout.contentBottom,
          },
        ]}>
        <Text
          style={[
            styles.headline,
            {
              color: theme.textPrimary,
              marginBottom: 6,
              fontSize: layout.titleSize,
              lineHeight: layout.titleLineHeight,
            },
          ]}>
          {t('onboarding.s5.titlePart1')}
          <Text style={{ color: theme.info }}>{t('onboarding.s5.titleAccent')}</Text>
          <Text>
            {t('onboarding.s5.titlePart2Prefix')}
            <Text style={{ color: theme.error }}>{t('onboarding.s5.titlePart2Accent')}</Text>
            {t('onboarding.s5.titlePart2Suffix')}
          </Text>
        </Text>
        <Text
          style={[
            styles.bodyText,
            {
              color: theme.textSecondary,
              marginBottom: clampNumber(layout.height * 0.024, 14, 20),
              fontSize: layout.bodySize,
              lineHeight: layout.bodyLineHeight,
            },
          ]}>
          {t('onboarding.s5.subtitle')}
        </Text>

        {/* 2-column grid — 4 category tiles */}
        <View
          style={[
            styles.s5Grid,
            { gap: layout.s5GridGap, marginBottom: clampNumber(layout.height * 0.028, 18, 24) },
          ]}>
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = selected.has(cat.key);
            return (
              <Pressable
                key={cat.key}
                onPress={() => toggle(cat.key)}
                style={[
                  styles.s5GridItem,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: isSelected ? theme.purple : theme.border,
                    borderWidth: isSelected ? 1.5 : 1,
                    padding: layout.s5TilePadding,
                    borderRadius: layout.cardRadius,
                  },
                ]}>
                {isSelected && (
                  <View style={[styles.s5CheckBadge, { backgroundColor: theme.purple }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    styles.s5IconBox,
                    {
                      width: layout.s5IconBoxSize,
                      height: layout.s5IconBoxSize,
                      borderRadius: clampNumber(layout.s5IconBoxSize / 3, 12, 14),
                      backgroundColor: cat.bgLight + '44',
                    },
                  ]}>
                  <Ionicons name={cat.icon} size={22} color={cat.color} />
                </View>
                <Text
                  style={[
                    styles.s5ItemLabel,
                    { color: theme.textPrimary, fontSize: clampNumber(layout.bodySize, 14, 15) },
                  ]}>
                  {t(`onboarding.s5.${cat.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom expense input — always visible below the grid */}
        <Text
          style={[
            styles.s5CustomLabel,
            { color: theme.purple, fontSize: layout.eyebrowSize, marginBottom: 8 },
          ]}>
          {t('onboarding.s5.customLabel').toUpperCase()}
        </Text>
        <View
          style={[
            styles.s5InputWrapper,
            {
              backgroundColor: theme.cardBg,
              borderColor: customText ? theme.purple : theme.border,
              borderWidth: customText ? 1.5 : 1,
              paddingVertical: layout.inputPaddingY,
              borderRadius: clampNumber(layout.cardRadius - 2, 14, 20),
            },
          ]}>
          <TextInput
            ref={inputRef}
            style={[styles.s5Input, { color: theme.textPrimary, fontSize: layout.inputFontSize }]}
            placeholder={t('onboarding.s5.customPlaceholder')}
            placeholderTextColor={theme.textTertiary}
            value={customText}
            onChangeText={setCustomText}
            returnKeyType="done"
          />

          {customText.length > 0 ? (
            <Ionicons name="checkmark-circle" size={18} color={theme.purple} />
          ) : (
            <Ionicons name="create-outline" size={18} color={theme.textTertiary} />
          )}
        </View>
      </AdaptiveStepContent>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.bg,
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.footerTop,
            paddingBottom: layout.footerBottom,
          },
        ]}>
        <CTAButton
          label={t('onboarding.s5.cta')}
          onPress={handleNext}
          theme={theme}
          icon="arrow-forward"
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 6 — Goal Setting (affects app)
// ─────────────────────────────────────────────
const GOAL_OPTIONS = [
  {
    key: 'chip1',
    icon: 'airplane-outline' as const,
    color: '#38BDF8',
    bgLight: '#E0F2FE',
    budget: 1500,
  },
  {
    key: 'chip2',
    icon: 'laptop-outline' as const,
    color: '#A78BFA',
    bgLight: '#EDE9FE',
    budget: 2500,
  },
  {
    key: 'chip3',
    icon: 'shield-checkmark-outline' as const,
    color: '#10B981',
    bgLight: '#D1FAE5',
    budget: 500,
  },
  {
    key: 'chip4',
    icon: 'home-outline' as const,
    color: '#FB923C',
    bgLight: '#FED7AA',
    budget: 10000,
  },
];

function Screen6({
  theme,
  t,
  onNext,
  onBack,
  step,
  onGoalChange,
}: SharedProps & { onGoalChange: (goal: string, goalKey: string | null) => void }) {
  const layout = useAdaptiveOnboardingLayout();

  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState('');
  const inputRef = React.useRef<TextInput>(null);

  const handleNext = () => {
    const goal = customGoal.trim() || (selectedGoal ? t(`onboarding.s6.${selectedGoal}`) : '');
    onGoalChange(goal, selectedGoal);
    onNext();
  };

  const toggleGoal = (key: string) => {
    setSelectedGoal((prev) => (prev === key ? null : key));
    setCustomGoal('');
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <Header theme={theme} onBack={onBack} step={step} showBack />

      <AdaptiveStepContent
        contentContainerStyle={[
          styles.scrollContentGrow,
          styles.screen6Content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.contentTop,
            paddingBottom: layout.contentBottom,
          },
        ]}>
        <Text
          style={[
            styles.headline,
            {
              color: theme.textPrimary,
              marginBottom: 6,
              fontSize: layout.titleSize,
              lineHeight: layout.titleLineHeight,
            },
          ]}>
          {t('onboarding.s6.titlePart1')}
          <Text style={{ color: theme.success }}>{t('onboarding.s6.titleAccent')}</Text>
          {t('onboarding.s6.titlePart2')}
        </Text>
        <Text
          style={[
            styles.bodyText,
            {
              color: theme.textSecondary,
              marginBottom: clampNumber(layout.height * 0.024, 14, 20),
              fontSize: layout.bodySize,
              lineHeight: layout.bodyLineHeight,
            },
          ]}>
          {t('onboarding.s6.subtitle')}
        </Text>

        {/* 2x2 goal grid */}
        <View
          style={[
            styles.s5Grid,
            { gap: layout.s5GridGap, marginBottom: clampNumber(layout.height * 0.028, 18, 24) },
          ]}>
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = selectedGoal === goal.key;
            return (
              <Pressable
                key={goal.key}
                onPress={() => toggleGoal(goal.key)}
                style={[
                  styles.s5GridItem,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: isSelected ? theme.purple : theme.border,
                    borderWidth: isSelected ? 1.5 : 1,
                    padding: layout.s5TilePadding,
                    borderRadius: layout.cardRadius,
                  },
                ]}>
                {isSelected && (
                  <View style={[styles.s5CheckBadge, { backgroundColor: theme.purple }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    styles.s5IconBox,
                    {
                      width: layout.s5IconBoxSize,
                      height: layout.s5IconBoxSize,
                      borderRadius: clampNumber(layout.s5IconBoxSize / 3, 12, 14),
                      backgroundColor: goal.bgLight + '88',
                    },
                  ]}>
                  <Ionicons name={goal.icon} size={24} color={goal.color} />
                </View>
                <Text
                  style={[
                    styles.s5ItemLabel,
                    { color: theme.textPrimary, fontSize: clampNumber(layout.bodySize, 14, 15) },
                  ]}>
                  {t(`onboarding.s6.${goal.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom goal input */}
        <Text
          style={[
            styles.s5CustomLabel,
            { color: theme.purple, fontSize: layout.eyebrowSize, marginBottom: 8 },
          ]}>
          {t('onboarding.s6.inputPlaceholder').split(' ').slice(0, 2).join(' ').toUpperCase()}
        </Text>
        <View
          style={[
            styles.s5InputWrapper,
            {
              backgroundColor: theme.cardBg,
              borderColor: customGoal ? theme.purple : theme.border,
              borderWidth: customGoal ? 1.5 : 1,
              paddingVertical: layout.inputPaddingY,
              borderRadius: clampNumber(layout.cardRadius - 2, 14, 20),
            },
          ]}>
          <TextInput
            ref={inputRef}
            style={[styles.s5Input, { color: theme.textPrimary, fontSize: layout.inputFontSize }]}
            placeholder={t('onboarding.s6.inputPlaceholder')}
            placeholderTextColor={theme.textTertiary}
            value={customGoal}
            onChangeText={(text) => {
              setCustomGoal(text);
              setSelectedGoal(null);
            }}
            returnKeyType="done"
          />
          {customGoal.length > 0 ? (
            <Ionicons name="checkmark-circle" size={18} color={theme.purple} />
          ) : (
            <Ionicons name="create-outline" size={18} color={theme.textTertiary} />
          )}
        </View>
      </AdaptiveStepContent>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.bg,
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.footerTop,
            paddingBottom: layout.footerBottom,
          },
        ]}>
        <CTAButton
          label={t('onboarding.s6.cta')}
          onPress={handleNext}
          theme={theme}
          icon="arrow-forward"
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 7 — Budget Setup
// ─────────────────────────────────────────────
type BudgetPlan = {
  expenseBudgets: Record<string, number>;
  customExpenseBudget: number;
  goalTargetAmount: number;
};

type BudgetItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgLight: string;
  min: number;
  max: number;
  step: number;
  initial: number;
};

function getGoalPreset(goalKey: string | null, language: string) {
  const usesHryvnia = language === 'ua';

  if (!goalKey) {
    return {
      key: 'custom',
      icon: 'flag' as const,
      color: '#10B981',
      bgLight: '#D1FAE5',
      budget: usesHryvnia ? 50000 : 1500,
    };
  }

  const goal = GOAL_OPTIONS.find((item) => item.key === goalKey) ?? GOAL_OPTIONS[0];

  if (!usesHryvnia) {
    return goal;
  }

  const localizedBudgetByGoalKey: Record<string, number> = {
    chip1: 60000,
    chip2: 70000,
    chip3: 25000,
    chip4: 150000,
  };

  return {
    ...goal,
    budget: localizedBudgetByGoalKey[goal.key] ?? 50000,
  };
}

function BudgetSlider({
  value,
  min,
  max,
  step,
  tintColor,
  trackColor,
  thumbBorderColor,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  tintColor: string;
  trackColor?: string;
  thumbBorderColor?: string;
  onChange: (next: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [trackPageX, setTrackPageX] = useState(0);
  const sliderRef = useRef<View | null>(null);

  const progress = max > min ? (value - min) / (max - min) : 0;
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  const thumbLeft = trackWidth * normalizedProgress;

  const updateTrackMetrics = () => {
    sliderRef.current?.measureInWindow((x, _y, width) => {
      setTrackPageX(x);
      setTrackWidth(width);
    });
  };

  const handleChange = (pageX: number) => {
    if (trackWidth <= 0) {
      return;
    }

    const relativeX = pageX - trackPageX;
    const clampedX = Math.min(Math.max(relativeX, 0), trackWidth);
    const nextRaw = min + (clampedX / trackWidth) * (max - min);
    const next = Math.max(min, Math.min(max, Math.round(nextRaw / step) * step));
    onChange(next);
  };

  return (
    <View
      ref={sliderRef}
      style={styles.s7SliderArea}
      onLayout={updateTrackMetrics}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        updateTrackMetrics();
        handleChange(event.nativeEvent.pageX);
      }}
      onResponderMove={(event) => handleChange(event.nativeEvent.pageX)}>
      <View style={[styles.s7SliderTrack, { backgroundColor: trackColor ?? '#E2E8F0' }]}>
        <View
          style={[
            styles.s7SliderFill,
            {
              width: Math.max(thumbLeft, 0),
              backgroundColor: tintColor,
            },
          ]}
        />
        <View
          style={[
            styles.s7SliderThumb,
            {
              left: Math.min(Math.max(thumbLeft - 9, 0), Math.max(trackWidth - 18, 0)),
              backgroundColor: tintColor,
              borderColor: thumbBorderColor ?? '#fff',
            },
          ]}
        />
      </View>
    </View>
  );
}

function Screen7({
  theme,
  t,
  onBack,
  step,
  selectedCategoryKeys,
  customCategory,
  goalName,
  goalKey,
  onFinish,
  language,
}: SharedProps & {
  selectedCategoryKeys: string[];
  customCategory: string;
  goalName: string;
  goalKey: string | null;
  onFinish: (plan: BudgetPlan) => Promise<void> | void;
}) {
  const layout = useAdaptiveOnboardingLayout();
  const { currency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({});
  const [goalAmount, setGoalAmount] = useState<number | null>(null);
  const usesHryvnia = language === 'ua';
  const expenseBudgetMax = usesHryvnia ? 20000 : 2000;
  const expenseBudgetStep = usesHryvnia ? 500 : 50;
  const customExpenseInitial = usesHryvnia ? 5000 : 200;
  const goalBudgetMax = usesHryvnia ? 200000 : 10000;
  const goalBudgetStep = usesHryvnia ? 5000 : 100;
  const goalPreset = getGoalPreset(goalKey, language);
  const screenBackground = theme.isDark ? theme.bg : '#FDFCFE';

  useEffect(() => {
    const nextBudgets: Record<string, number> = {};

    selectedCategoryKeys.forEach((key) => {
      const category = CATEGORY_OPTIONS.find((option) => option.key === key);
      if (category) {
        nextBudgets[key] = category.budget;
      }
    });

    if (customCategory.trim()) {
      nextBudgets.customCategory = customExpenseInitial;
    }

    setBudgetMap(nextBudgets);
    setGoalAmount(goalName.trim() ? goalPreset.budget : null);
  }, [customCategory, customExpenseInitial, goalName, goalPreset.budget, selectedCategoryKeys]);

  const selectedExpenseItems: BudgetItem[] = selectedCategoryKeys
    .map((key) => {
      const category = CATEGORY_OPTIONS.find((option) => option.key === key);
      if (!category) {
        return null;
      }

      return {
        id: key,
        label: t(`onboarding.s5.${category.key}`),
        icon: category.icon,
        color: category.color,
        bgLight: category.bgLight,
        min: 0,
        max: expenseBudgetMax,
        step: expenseBudgetStep,
        initial: usesHryvnia ? category.budget * 25 : category.budget,
      } satisfies BudgetItem;
    })
    .filter(Boolean) as BudgetItem[];

  if (customCategory.trim()) {
    selectedExpenseItems.push({
      id: 'customCategory',
      label: customCategory.trim(),
      icon: 'cash',
      color: '#64748B',
      bgLight: '#E2E8F0',
      min: 0,
      max: expenseBudgetMax,
      step: expenseBudgetStep,
      initial: customExpenseInitial,
    });
  }

  const goalItems: BudgetItem[] = goalName.trim()
    ? [
        {
          id: 'goal',
          label: goalName.trim(),
          icon: goalPreset.icon,
          color: goalPreset.color,
          bgLight: goalPreset.bgLight,
          min: 0,
          max: goalBudgetMax,
          step: goalBudgetStep,
          initial: goalPreset.budget,
        },
      ]
    : [];

  const complete = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      await onFinish({
        expenseBudgets: budgetMap,
        customExpenseBudget: budgetMap.customCategory ?? customExpenseInitial,
        goalTargetAmount: goalAmount ?? goalPreset.budget,
      });
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (amount: number) => {
    const normalizedCurrency =
      language === 'ua' ? 'UAH' : normalizeCurrencyCode(currency);

    if (language === 'ua' && normalizedCurrency === 'UAH') {
      const formattedNumber = new Intl.NumberFormat('uk-UA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
      return `${formattedNumber} грн`;
    }

    return formatCurrencyAmount(amount, normalizedCurrency, language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };
  const title = `${t('onboarding.s7.titlePart1')}${t('onboarding.s7.titleAccent')}${t(
    'onboarding.s7.titlePart2'
  )}`;

  const updateBudget = (id: string, next: number) => {
    setBudgetMap((prev) => ({ ...prev, [id]: next }));
  };

  return (
    <View
      style={[
        styles.screenContainer,
        styles.s7ScreenContainer,
        { backgroundColor: screenBackground },
      ]}>
      <View
        style={[styles.blobTopRight, { backgroundColor: theme.purple + '0d' }]}
        pointerEvents="none"
      />
      <View
        style={[styles.blobBottomLeft, { backgroundColor: '#3B82F60d' }]}
        pointerEvents="none"
      />

      <Header theme={theme} onBack={onBack} step={step} showBack />

      <AdaptiveStepContent
        contentContainerStyle={[
          styles.scrollContentGrow,
          styles.screen7Content,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: clampNumber(layout.contentTop - 6, 4, 12),
            paddingBottom: layout.contentBottom,
          },
        ]}>
        <View
          style={[
            styles.s7Hero,
            {
              marginBottom: clampNumber(layout.height * 0.03, 22, 30),
              gap: clampNumber(layout.height * 0.014, 10, 12),
            },
          ]}>
          <View
            style={[
              styles.s7HeroIcon,
              {
                width: layout.s7HeroIconSize,
                height: layout.s7HeroIconSize,
                borderRadius: clampNumber(layout.s7HeroIconSize * 0.38, 20, 24),
                backgroundColor: theme.purple + '14',
              },
            ]}>
            <Ionicons name="cash-outline" size={28} color={theme.purple} />
          </View>
          <Text
            style={[
              styles.s7Title,
              {
                color: theme.textPrimary,
                fontSize: layout.s7TitleSize,
                lineHeight: layout.s7TitleLineHeight,
              },
            ]}>
            {title}
          </Text>
          <Text
            style={[
              styles.s7Subtitle,
              {
                color: theme.textSecondary,
                fontSize: layout.s7SubtitleSize,
                lineHeight: clampNumber(layout.bodyLineHeight - 3, 20, 22),
              },
            ]}>
            {t('onboarding.s7.subtitle')}
          </Text>
        </View>

        <View
          style={[styles.s7Section, { marginBottom: clampNumber(layout.height * 0.028, 18, 24) }]}>
          <Text
            style={[
              styles.s7SectionTitle,
              { color: theme.textTertiary, fontSize: layout.eyebrowSize },
            ]}>
            {t('onboarding.s7.expensesSection').toUpperCase()}
          </Text>
          {selectedExpenseItems.length > 0 ? (
            selectedExpenseItems.map((item) => {
              const value = budgetMap[item.id] ?? item.initial;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.s7Card,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.isDark ? theme.border : '#F1F5F9',
                      paddingHorizontal: layout.s7CardPaddingX,
                      paddingVertical: layout.s7CardPaddingY,
                      borderRadius: layout.cardRadius,
                    },
                    !theme.isDark && styles.s7CardShadow,
                  ]}>
                  <View style={styles.s7CardTop}>
                    <View
                      style={[
                        styles.s7IconBox,
                        { backgroundColor: theme.isDark ? item.color + '20' : item.bgLight },
                      ]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={styles.s7CardContent}>
                      <View style={styles.s7CardRow}>
                        <Text
                          style={[styles.s7CardLabel, { color: theme.textPrimary }]}
                          numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.s7CardAmount,
                            {
                              color: theme.textPrimary,
                              fontSize: clampNumber(layout.bodySize - 1, 13, 14),
                            },
                          ]}>
                          {formatAmount(value)}
                        </Text>
                      </View>
                      <BudgetSlider
                        value={value}
                        min={item.min}
                        max={item.max}
                        step={item.step}
                        tintColor={item.color}
                        trackColor={theme.isDark ? theme.border : '#F1F5F9'}
                        thumbBorderColor={theme.cardBg}
                        onChange={(next) => updateBudget(item.id, next)}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View
              style={[
                styles.s7EmptyState,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}>
              <Text style={[styles.s7EmptyText, { color: theme.textSecondary }]}>
                {t('onboarding.s7.emptyExpenses')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.s7Section}>
          <Text
            style={[
              styles.s7SectionTitle,
              { color: theme.textTertiary, fontSize: layout.eyebrowSize },
            ]}>
            {t('onboarding.s7.goalsSection').toUpperCase()}
          </Text>
          {goalItems.length > 0 ? (
            goalItems.map((item) => {
              const value = goalAmount ?? item.initial;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.s7Card,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.isDark ? theme.border : '#F1F5F9',
                      paddingHorizontal: layout.s7CardPaddingX,
                      paddingVertical: layout.s7CardPaddingY,
                      borderRadius: layout.cardRadius,
                    },
                    !theme.isDark && styles.s7CardShadow,
                  ]}>
                  <View style={styles.s7CardTop}>
                    <View
                      style={[
                        styles.s7IconBox,
                        { backgroundColor: theme.isDark ? item.color + '20' : item.bgLight },
                      ]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={styles.s7CardContent}>
                      <View style={styles.s7CardRow}>
                        <Text
                          style={[styles.s7CardLabel, { color: theme.textPrimary }]}
                          numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.s7CardAmount,
                            {
                              color: theme.textPrimary,
                              fontSize: clampNumber(layout.bodySize - 1, 13, 14),
                            },
                          ]}>
                          {formatAmount(value)}
                        </Text>
                      </View>
                      <BudgetSlider
                        value={value}
                        min={item.min}
                        max={item.max}
                        step={item.step}
                        tintColor={item.color}
                        trackColor={theme.isDark ? theme.border : '#F1F5F9'}
                        thumbBorderColor={theme.cardBg}
                        onChange={setGoalAmount}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View
              style={[
                styles.s7EmptyState,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}>
              <Text style={[styles.s7EmptyText, { color: theme.textSecondary }]}>
                {t('onboarding.s7.emptyGoals')}
              </Text>
            </View>
          )}
        </View>
      </AdaptiveStepContent>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: screenBackground,
            paddingHorizontal: layout.horizontalPadding,
            paddingTop: layout.footerTop,
            paddingBottom: layout.footerBottom,
          },
        ]}>
        <CTAButton
          label={t('onboarding.s7.cta')}
          onPress={complete}
          theme={theme}
          icon="chevron-forward"
          loading={saving}
        />
        <Text
          style={[
            styles.footerHint,
            {
              color: theme.textTertiary,
              fontSize: layout.footerHintSize,
              marginTop: layout.footerHintMargin,
            },
          ]}>
          {t('onboarding.s7.hint')}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 8 — Subscription / Paywall (Final Screen)
// ─────────────────────────────────────────────
type SubscriptionPlan = 'annual' | 'monthly';

function Screen8({
  theme,
  t,
  onFinish,
  onBack,
  step,
}: SharedProps & {
  onFinish: () => void;
}) {
  const layout = useAdaptiveOnboardingLayout();
  const compactHeight = layout.height < 860;
  const ultraCompact = layout.height < 780;
  const narrowWidth = layout.isNarrow;

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { offerings, subscribe, tier, loading: subscriptionLoading } = useSubscription();
  const hadActiveTierOnOpen = useRef<boolean | null>(null);
  const currentOffering = offerings?.current;
  const annualPackage =
    currentOffering?.availablePackages.find((p) => p.identifier === 'premium_annual') ||
    currentOffering?.annual ||
    currentOffering?.availablePackages.find((p) => p.packageType === 'ANNUAL') ||
    null;
  const monthlyPackage =
    currentOffering?.availablePackages.find((p) => p.identifier === 'premium_monthly') ||
    currentOffering?.monthly ||
    currentOffering?.availablePackages.find((p) => p.packageType === 'MONTHLY') ||
    null;

  const annualPrice = annualPackage?.product.priceString ?? '$59.99/year';
  const monthlyPrice = monthlyPackage?.product.priceString ?? '$9.99/mo';
  const annualMonthlyEquivalent = annualPackage
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: annualPackage.product.currencyCode,
        maximumFractionDigits: 2,
      }).format(annualPackage.product.price / 12)
    : '$4.99';
  const annualSavingsPercent =
    annualPackage && monthlyPackage
      ? Math.max(
          0,
          Math.round((1 - annualPackage.product.price / (monthlyPackage.product.price * 12)) * 100)
        )
      : 50;

  useEffect(() => {
    if (subscriptionLoading || hadActiveTierOnOpen.current !== null) return;
    hadActiveTierOnOpen.current = tier === 'premium' || tier === 'trial';
  }, [subscriptionLoading, tier]);

  const canContinueWithoutPurchase = hadActiveTierOnOpen.current === true;

  const handleGetStarted = async () => {
    setError(null);

    if (canContinueWithoutPurchase) {
      onFinish();
      return;
    }

    // Get the appropriate package based on selection
    if (!currentOffering) {
      setError('Subscription options not available. Please try again.');
      return;
    }

    let pkg: PurchasesPackage | null = null;
    if (selectedPlan === 'annual') {
      pkg =
        currentOffering.annual ||
        currentOffering.availablePackages.find((p) => p.packageType === 'ANNUAL') ||
        currentOffering.availablePackages[0];
    } else {
      pkg =
        currentOffering.monthly ||
        currentOffering.availablePackages.find((p) => p.packageType === 'MONTHLY') ||
        currentOffering.availablePackages[0];
    }

    if (!pkg) {
      setError('Selected plan not available. Please try again.');
      return;
    }

    setLoading(true);
    try {
      await subscribe(pkg);
      // Purchase successful - proceed to app
      onFinish();
    } catch (err: any) {
      // User cancelled or purchase failed
      if (err?.code !== 'PURCHASE_CANCELLED') {
        setError('Purchase failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Gradient blob background */}
      <View
        style={[styles.s8Blob, { backgroundColor: theme.purple + '18' }]}
        pointerEvents="none"
      />

      <Header theme={theme} onBack={onBack} step={step} showBack />

      <View style={styles.s8Layout}>
        <AdaptiveStepContent
          contentContainerStyle={[
            styles.scrollContentGrow,
            styles.s8Content,
            compactHeight && styles.s8ContentCompact,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: clampNumber(layout.contentTop - 6, 2, 10),
              paddingBottom: layout.contentBottom,
            },
          ]}>
          {/* Hero image with floating badge */}
          <View
            style={[
              styles.s8ImageWrapper,
              compactHeight && styles.s8ImageWrapperCompact,
              {
                height: layout.s8ImageWrapperHeight,
                marginBottom: clampNumber(layout.height * 0.02, 12, 20),
              },
            ]}>
            <View style={[styles.s8ImageGlow, { backgroundColor: theme.purple + '20' }]} />
            <View
              style={[
                styles.s8ImageCard,
                compactHeight && styles.s8ImageCardCompact,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                  width: layout.s8HeroSize,
                  height: layout.s8HeroSize,
                  borderRadius: layout.s8HeroRadius,
                },
              ]}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSfoqHxeAi6k1VosFbuxNW4fwnC2IHPL09qimUrn-GHiNSGyCeIJT7-MC-68CTDnY-AGXMw6sgl8JzRrBdwdfeeWeL26xGxYls8fF1NiMHl3fj5REeDGFe__3mhtVe0C63h7Fxo3AtxIBVwXeV82mm2akg7HwTdagocanR3v4Ffnvqz15BS8rwuxezLPNmwxVWNL0ccGhFbDTZaPDLHR--IhT3gDizTaIIC6Iw5dr-wu4Cc9dWjdZvplOXlFXvisu9mC3xYoXUxM3K',
                }}
                style={[
                  styles.s8HeroImage,
                  compactHeight && styles.s8HeroImageCompact,
                  {
                    width: layout.s8HeroSize,
                    height: layout.s8HeroSize,
                    borderRadius: layout.s8HeroRadius,
                  },
                ]}
                resizeMode="contain"
              />
              {/* Floating badge */}
              <View
                style={[
                  styles.s8FloatingBadge,
                  compactHeight && styles.s8FloatingBadgeCompact,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                ]}>
                <View style={[styles.s8BadgeIcon, { backgroundColor: theme.success }]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
                <View>
                  <Text style={[styles.s8BadgeLabel, { color: theme.textSecondary }]}>
                    {t('onboarding.s8.badgeLabel')}
                  </Text>
                  <Text style={[styles.s8BadgeValue, { color: theme.textPrimary }]}>
                    {t('onboarding.s8.badgeValue')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Text content */}
          <View style={styles.s8TextBlock}>
            <View style={styles.s8TagRow}>
              <View style={[styles.s8TagDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.s8TagText, { color: theme.success }]}>
                {t('onboarding.s8.tag')}
              </Text>
            </View>
            <Text
              style={[
                styles.headline,
                {
                  color: theme.textPrimary,
                  textAlign: 'center',
                  fontSize: layout.titleSize,
                  lineHeight: layout.titleLineHeight,
                },
              ]}>
              {t('onboarding.s8.title')}
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: theme.textSecondary,
                  textAlign: 'center',
                  marginTop: 12,
                  fontSize: layout.bodySize,
                  lineHeight: layout.bodyLineHeight,
                },
              ]}>
              {t('onboarding.s8.subtitle')}
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: theme.purple,
                  textAlign: 'center',
                  marginTop: 10,
                  fontWeight: '700',
                  fontSize: layout.bodySize,
                  lineHeight: layout.bodyLineHeight,
                },
              ]}>
              {t('onboarding.s8.trialBanner')}
            </Text>
          </View>

          {/* Subscription options */}
          <View style={styles.s8PlansContainer}>
            {/* Annual Plan */}
            <Pressable
              onPress={() => setSelectedPlan('annual')}
              style={[
                styles.s8PlanCard,
                narrowWidth && styles.s8PlanCardCompact,
                {
                  backgroundColor: selectedPlan === 'annual' ? theme.cardBg : theme.iconBg,
                  borderColor: selectedPlan === 'annual' ? theme.purple : theme.border,
                  borderWidth: selectedPlan === 'annual' ? 2 : 1,
                  padding: layout.s8PlanPadding,
                  borderRadius: layout.cardRadius,
                },
              ]}>
              <View style={styles.s8PlanLeft}>
                <View
                  style={[
                    styles.s8RadioCircle,
                    {
                      borderColor: selectedPlan === 'annual' ? theme.purple : theme.border,
                    },
                  ]}>
                  {selectedPlan === 'annual' && (
                    <View style={[styles.s8RadioDot, { backgroundColor: theme.purple }]} />
                  )}
                </View>
                <View>
                  <Text
                    style={[
                      styles.s8PlanTitle,
                      narrowWidth && styles.s8PlanTitleCompact,
                      { color: theme.textPrimary },
                    ]}>
                    Annual
                  </Text>
                  <View
                    style={[styles.s8PlanPriceRow, narrowWidth && styles.s8PlanPriceRowCompact]}>
                    <Text style={[styles.s8PlanPrice, { color: theme.textSecondary }]}>
                      {annualPrice}
                    </Text>
                    <View style={[styles.s8SaveBadge, { backgroundColor: theme.successBg }]}>
                      <Text style={[styles.s8SaveBadgeText, { color: theme.success }]}>
                        Save {annualSavingsPercent}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={[styles.s8PlanRight, narrowWidth && styles.s8PlanRightCompact]}>
                <Text style={[styles.s8PlanSmall, { color: theme.textSecondary }]}>Only</Text>
                <Text
                  style={[
                    styles.s8PlanHighlight,
                    narrowWidth && styles.s8PlanHighlightCompact,
                    { color: theme.purple },
                  ]}>
                  {annualMonthlyEquivalent}/mo
                </Text>
              </View>
            </Pressable>

            {/* Monthly Plan */}
            <Pressable
              onPress={() => setSelectedPlan('monthly')}
              style={[
                styles.s8PlanCard,
                narrowWidth && styles.s8PlanCardCompact,
                {
                  backgroundColor: selectedPlan === 'monthly' ? theme.cardBg : theme.iconBg,
                  borderColor: selectedPlan === 'monthly' ? theme.purple : theme.border,
                  borderWidth: selectedPlan === 'monthly' ? 2 : 1,
                  padding: layout.s8PlanPadding,
                  borderRadius: layout.cardRadius,
                },
              ]}>
              <View style={styles.s8PlanLeft}>
                <View
                  style={[
                    styles.s8RadioCircle,
                    {
                      borderColor: selectedPlan === 'monthly' ? theme.purple : theme.border,
                    },
                  ]}>
                  {selectedPlan === 'monthly' && (
                    <View style={[styles.s8RadioDot, { backgroundColor: theme.purple }]} />
                  )}
                </View>
                <View>
                  <Text
                    style={[
                      styles.s8PlanTitle,
                      narrowWidth && styles.s8PlanTitleCompact,
                      { color: theme.textPrimary },
                    ]}>
                    Monthly
                  </Text>
                  <Text style={[styles.s8PlanPrice, { color: theme.textSecondary }]}>
                    {monthlyPrice}
                  </Text>
                </View>
              </View>
              <View style={[styles.s8PlanRight, narrowWidth && styles.s8PlanRightCompact]}>
                <Text style={[styles.s8PlanSmall, { color: theme.textSecondary }]}>Billed</Text>
                <Text
                  style={[
                    styles.s8PlanMonth,
                    narrowWidth && styles.s8PlanMonthCompact,
                    { color: theme.textPrimary },
                  ]}>
                  Monthly
                </Text>
              </View>
            </Pressable>
          </View>

          <View
            style={[
              styles.footerStatic,
              compactHeight && styles.footerStaticCompact,
              {
                paddingHorizontal: layout.horizontalPadding,
                paddingTop: layout.footerTop,
                paddingBottom: layout.footerBottom,
              },
            ]}>
            {error && (
              <View style={[styles.s8ErrorContainer, { backgroundColor: theme.error + '15' }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.s8ErrorText, { color: theme.error }]}>{error}</Text>
              </View>
            )}
            <CTAButton
              label={
                loading
                  ? t('onboarding.s8.processing')
                  : canContinueWithoutPurchase
                    ? t('onboarding.s8.continue')
                    : t('onboarding.s8.cta')
              }
              onPress={handleGetStarted}
              theme={theme}
              icon={canContinueWithoutPurchase ? 'arrow-forward' : 'card'}
              loading={loading}
            />
            <Text
              style={[
                styles.s8TermsText,
                {
                  color: theme.textTertiary,
                  fontSize: layout.eyebrowSize,
                  lineHeight: clampNumber(layout.bodyLineHeight - 8, 14, 18),
                },
              ]}>
              {t('onboarding.s8.terms')}
            </Text>
          </View>
        </AdaptiveStepContent>
      </View>
    </View>
  );
}

function Screen9({
  theme,
  t,
  onFinish,
  step,
}: Pick<SharedProps, 'theme' | 't' | 'step'> & {
  onFinish: () => void;
}) {
  const layout = useAdaptiveOnboardingLayout();
  const compactHeight = layout.height < 860;
  const ultraCompact = layout.height < 780;

  const highlights = [
    {
      title: t('onboarding.s9.step1Title'),
      body: t('onboarding.s9.step1Body'),
      color: theme.success,
      number: '1',
    },
    {
      title: t('onboarding.s9.step2Title'),
      body: t('onboarding.s9.step2Body'),
      color: theme.purple,
      number: '2',
    },
    {
      title: t('onboarding.s9.step3Title'),
      body: t('onboarding.s9.step3Body'),
      color: '#F59E0B',
      number: '3',
    },
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <View
        style={[styles.s9BlobTop, { backgroundColor: theme.success + '16' }]}
        pointerEvents="none"
      />
      <View
        style={[styles.s9BlobBottom, { backgroundColor: theme.purple + '14' }]}
        pointerEvents="none"
      />

      <Header theme={theme} onBack={() => {}} step={step} />

      <AdaptiveStepContent
        contentContainerStyle={[
          styles.scrollContentGrow,
          styles.s9Screen,
          styles.s9ScrollContent,
          compactHeight && styles.s9ScrollContentCompact,
          {
            paddingBottom: layout.contentBottom,
          },
        ]}>
        <View
          style={[
            styles.s9Content,
            compactHeight && styles.s9ContentCompact,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: clampNumber(layout.contentTop - (compactHeight ? 4 : 0), 2, 16),
              paddingBottom: clampNumber(layout.contentBottom - (compactHeight ? 6 : 4), 6, 18),
            },
          ]}>
          <View
            style={[
              styles.s9Hero,
              compactHeight && styles.s9HeroCompact,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}>
            <LinearGradient
              colors={[theme.success, theme.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.s9HeroGlow}
            />
            <View style={styles.s9HeroIconWrap}>
              <View
                style={[
                  styles.s9HeroIcon,
                  {
                    backgroundColor: '#fff',
                    width: compactHeight
                      ? clampNumber(layout.s9HeroIconSize - 8, 22, 40)
                      : layout.s9HeroIconSize,
                    height: compactHeight
                      ? clampNumber(layout.s9HeroIconSize - 8, 22, 40)
                      : layout.s9HeroIconSize,
                    borderRadius: compactHeight
                      ? clampNumber((layout.s9HeroIconSize - 8) / 2, 11, 20)
                      : layout.s9HeroIconSize / 2,
                  },
                ]}>
                <Ionicons
                  name="checkmark"
                  size={compactHeight ? (ultraCompact ? 24 : 28) : 34}
                  color={theme.success}
                />
              </View>
            </View>
            <Text style={[styles.s9Eyebrow, { color: theme.success }]}>
              {t('onboarding.s9.eyebrow')}
            </Text>
            <Text
              style={[
                styles.headline,
                styles.s9Title,
                {
                  color: theme.textPrimary,
                  fontSize: compactHeight
                    ? clampNumber(layout.titleSize - (ultraCompact ? 10 : 8), 20, 28)
                    : clampNumber(layout.titleSize - 2, 24, 32),
                  lineHeight: compactHeight
                    ? clampNumber(layout.titleLineHeight - (ultraCompact ? 14 : 12), 24, 32)
                    : clampNumber(layout.titleLineHeight - 6, 30, 36),
                },
              ]}>
              {t('onboarding.s9.title')}
            </Text>
            <Text
              style={[
                styles.bodyText,
                styles.s9Subtitle,
                {
                  color: theme.textSecondary,
                  fontSize: compactHeight
                    ? clampNumber(layout.bodySize - 2, 12, 14)
                    : clampNumber(layout.bodySize - 1, 13, 15),
                  lineHeight: compactHeight
                    ? clampNumber(layout.bodyLineHeight - 7, 16, 20)
                    : clampNumber(layout.bodyLineHeight - 4, 19, 22),
                },
              ]}>
              {t('onboarding.s9.subtitle')}
            </Text>
          </View>

          <View style={styles.s9Highlights}>
            {highlights.map((item) => (
              <View
                key={item.title}
                style={[
                  styles.s9HighlightCard,
                  compactHeight && styles.s9HighlightCardCompact,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    minHeight: compactHeight
                      ? clampNumber(layout.s9HighlightMinHeight - (ultraCompact ? 12 : 8), 42, 64)
                      : layout.s9HighlightMinHeight,
                    paddingVertical: compactHeight
                      ? clampNumber(layout.s9CardPaddingY - 2, 4, 10)
                      : layout.s9CardPaddingY,
                    borderRadius: layout.cardRadius,
                  },
                ]}>
                <View style={styles.s9StepRail}>
                  <View
                    style={[
                      styles.s9StepNumber,
                      compactHeight && styles.s9StepNumberCompact,
                      { backgroundColor: item.color },
                    ]}>
                    <Text
                      style={[
                        styles.s9StepNumberText,
                        compactHeight && styles.s9StepNumberTextCompact,
                      ]}>
                      {item.number}
                    </Text>
                  </View>
                </View>
                <View style={styles.s9HighlightText}>
                  <Text
                    style={[
                      styles.s9HighlightTitle,
                      compactHeight && styles.s9HighlightTitleCompact,
                      { color: theme.textPrimary },
                    ]}>
                    {item.title}
                  </Text>
                  <View style={styles.s9HighlightBodyRow}>
                    {item.number === '1' ? (
                      <>
                        <Text
                          style={[
                            styles.s9HighlightBody,
                            compactHeight && styles.s9HighlightBodyCompact,
                            { color: theme.textSecondary },
                          ]}>
                          {t('onboarding.s9.step1BodyPrefix')}
                        </Text>
                        <View style={styles.s9InlineMicBadge}>
                          <Ionicons name="mic" size={12} color="#fff" />
                        </View>
                        <Text
                          style={[
                            styles.s9HighlightBody,
                            compactHeight && styles.s9HighlightBodyCompact,
                            { color: theme.textSecondary },
                          ]}>
                          {t('onboarding.s9.step1BodySuffix')}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.s9HighlightBody,
                          compactHeight && styles.s9HighlightBodyCompact,
                          { color: theme.textSecondary },
                        ]}>
                        {item.body}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.footerStatic,
            compactHeight && styles.footerStaticCompact,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingTop: layout.footerTop,
              paddingBottom: layout.footerBottom,
            },
          ]}>
          <CTAButton
            label={t('onboarding.s9.cta')}
            onPress={onFinish}
            theme={theme}
            icon="arrow-forward"
          />
          <Text
            style={[
              styles.footerHint,
              {
                color: theme.textTertiary,
                fontSize: layout.footerHintSize,
                marginTop: layout.footerHintMargin,
              },
            ]}>
            {t('onboarding.s9.hint')}
          </Text>
        </View>
      </AdaptiveStepContent>
    </View>
  );
}

// ─────────────────────────────────────────────
// Root Onboarding Component
// ─────────────────────────────────────────────
export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Collected data from interactive screens
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalKey, setGoalKey] = useState<string | null>(null);

  const completeOnboarding = async (
    catKeys: string[] = selectedCategoryKeys,
    custom: string = customCategory,
    goal: string = goalName,
    selectedGoal: string | null = goalKey,
    budgetPlan?: BudgetPlan
  ) => {
    if (user) {
      const uid = user.uid;
      const periodStart = getCurrentMonthStartIso();
      const goalPreset = getGoalPreset(selectedGoal);
      const expenseBudgets = budgetPlan?.expenseBudgets ?? {};
      const customBudget = budgetPlan?.customExpenseBudget ?? 200;
      const goalTargetAmount = budgetPlan?.goalTargetAmount ?? 0;

      // Seed selected categories (skip default seeding in useBudget by pre-populating)
      const categoriesToCreate = CATEGORY_OPTIONS.filter((c) => catKeys.includes(c.key));
      if (categoriesToCreate.length > 0) {
        await Promise.all(
          categoriesToCreate.map((cat) =>
            addDoc(collection(db, 'budgetCategories'), {
              name: cat.firestoreName,
              budget: expenseBudgets[cat.key] ?? cat.budget,
              spent: 0,
              periodStart,
              icon: cat.icon,
              colorLight: cat.bgLight,
              colorDark: cat.bgDark,
              userId: uid,
            })
          )
        );
      }

      // Custom category
      if (custom) {
        await addDoc(collection(db, 'budgetCategories'), {
          name: custom,
          budget: customBudget,
          spent: 0,
          periodStart,
          icon: 'cash',
          colorLight: '#E2E8F0',
          colorDark: '#94A3B8',
          userId: uid,
        });
      }

      // Goal
      if (goal) {
        await addDoc(collection(db, 'goals'), {
          name: goal,
          targetAmount: goalTargetAmount,
          icon: goalPreset.icon,
          colorLight: goalPreset.bgLight,
          colorDark: goalPreset.color,
          userId: uid,
        });
      }
    }

    if (user) {
      await AsyncStorage.setItem(getOnboardingStorageKey(user.uid), 'true');
    }
    router.replace('/(tabs)/overview');
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  const shared: SharedProps = {
    theme,
    t,
    language: i18n.language,
    onNext: next,
    onBack: back,
    step: step + 1,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg, paddingTop: topPadding }]}>
      {step === 0 && <Screen1 theme={theme} t={t} onNext={next} />}
      {step === 1 && <Screen2 {...shared} />}
      {step === 2 && <Screen3 {...shared} />}
      {step === 3 && <Screen4 {...shared} />}
      {step === 4 && (
        <Screen5
          {...shared}
          onSelectionsChange={(keys, custom) => {
            setSelectedCategoryKeys(keys);
            setCustomCategory(custom);
          }}
        />
      )}
      {step === 5 && (
        <Screen6
          {...shared}
          onGoalChange={(goal, nextGoalKey) => {
            setGoalName(goal);
            setGoalKey(nextGoalKey);
          }}
        />
      )}
      {step === 6 && (
        <Screen7
          {...shared}
          selectedCategoryKeys={selectedCategoryKeys}
          customCategory={customCategory}
          goalName={goalName}
          goalKey={goalKey}
          onFinish={() => setStep(7)}
        />
      )}
      {step === 7 && <Screen8 {...shared} onFinish={() => setStep(8)} />}
      {step === 8 && (
        <Screen9
          {...shared}
          onFinish={() =>
            completeOnboarding(selectedCategoryKeys, customCategory, goalName, goalKey)
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  screenContainer: { flex: 1, overflow: 'hidden' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    zIndex: 2,
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
  logoBox2: { width: 32, alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  progressTrack: { flex: 1, height: 4, borderRadius: 4, marginHorizontal: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // CTA
  ctaButtonWrapper: { width: '100%', maxWidth: 440 },
  ctaButton: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  scrollContentGrow: { flex: 1 },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    paddingTop: 8,
    alignItems: 'center',
  },
  footerHint: { marginTop: 8, fontSize: 12, textAlign: 'center', width: '100%' },
  footerStatic: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    alignItems: 'center',
  },
  footerStaticCompact: {
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },

  // Skip
  skipButton: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14, fontWeight: '600' },

  // Screen 9
  s9BlobTop: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 140,
  },
  s9BlobBottom: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 160,
  },
  s9ScrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  s9Screen: {
    justifyContent: 'space-between',
  },
  s9ScrollContentCompact: {
    paddingBottom: 2,
  },
  s9Content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  s9ContentCompact: {
    paddingTop: 4,
    gap: 6,
  },
  s9Hero: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 6,
  },
  s9HeroCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 0,
  },
  s9HeroGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  s9HeroIconWrap: {
    marginBottom: 6,
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  s9HeroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s9Eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  s9Title: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
  },
  s9Subtitle: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  s9Highlights: {
    gap: 4,
  },
  s9HighlightCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 60,
  },
  s9HighlightCardCompact: {
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  s9StepRail: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  s9StepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s9StepNumberText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  s9StepNumberCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  s9StepNumberTextCompact: {
    fontSize: 13,
  },
  s9HighlightText: {
    flex: 1,
    gap: 3,
  },
  s9HighlightTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  s9HighlightTitleCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  s9InlineMicBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    marginTop: 1,
  },
  s9HighlightBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  s9HighlightBody: {
    fontSize: 13,
    lineHeight: 19,
    flexShrink: 1,
  },
  s9HighlightBodyCompact: {
    fontSize: 11,
    lineHeight: 16,
  },

  // ── Screen 1 ──
  screen1Content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0 },
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
  decorativeCluster: { width: '100%', height: 270, position: 'relative', marginBottom: 20 },
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
  screen1Text: { gap: 12, position: 'relative', zIndex: 20, elevation: 20 },
  headline: { fontSize: 30, fontWeight: '800', lineHeight: 38, letterSpacing: -0.5, flexShrink: 1 },
  bodyText: { fontSize: 16, lineHeight: 24, flexShrink: 1 },
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  taglineLine: { width: 40, height: 3, borderRadius: 4 },
  taglineText: { fontSize: 12, fontWeight: '600', letterSpacing: 1.5 },

  // ── Screen 2 ──
  screen2Content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0 },
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

  // ── Screen 3 ──
  screen3Content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 0 },
  screen3Illustration: {
    width: '100%',
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
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
  screen3TextBlock: { alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
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

  // ── Screen 4 ──
  screen4Layout: { flex: 1, justifyContent: 'space-between' },
  screen4Content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  screen4ContentCompact: { paddingTop: 6, paddingBottom: 4 },
  s4LogoWrapper: { alignItems: 'center', marginBottom: 10, position: 'relative' },
  s4LogoWrapperCompact: { marginBottom: 6 },
  s4LogoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s4Badge: {
    position: 'absolute',
    top: -8,
    right: '28%',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  s4BadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  s4SpreadsheetWrapper: {
    position: 'relative',
    opacity: 0.5,
    marginBottom: 0,
    alignItems: 'center',
  },
  s4Spreadsheet: { borderWidth: 1, borderRadius: 14, padding: 8, width: '90%' },
  s4SpreadsheetCompact: { width: '100%', padding: 6 },
  s4SheetHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 6,
    gap: 4,
  },
  s4SheetHeaderCell: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  s4SheetRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  s4SheetCell: { fontSize: 9 },
  s4SheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 4,
  },
  s4SheetFooterLabel: { fontSize: 8, fontWeight: '700' },
  s4SheetFooterValue: { fontSize: 9, fontWeight: '700' },
  s4XBadge: {
    position: 'absolute',
    top: -8,
    right: '4%',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  s4Arrow: { alignItems: 'center', marginVertical: 8 },
  s4ArrowCompact: { marginVertical: 4 },
  s4ArrowLine: { width: 1, height: 24 },
  s4ArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s4CatCard: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  s4CatCardCompact: {
    padding: 10,
  },
  s4CatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  s4CatLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  s4CatIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s4CatLabel: { fontSize: 14, fontWeight: '700' },
  s4CatLeft_left: { fontSize: 13, fontWeight: '700' },

  // ── Screen 5 ──
  screen5StaticContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0 },
  screen5Content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0 },
  s5Grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  s5GridItem: {
    width: '47%',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  s5AddMore: { borderStyle: 'dashed' },
  s5CheckBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s5IconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s5ItemLabel: { fontSize: 14, fontWeight: '700' },
  s5CustomLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  s5InputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  s5Input: { flex: 1, fontSize: 15, fontWeight: '500' },

  // ── Screen 7 ──
  s7ScreenContainer: { overflow: 'hidden' },
  screen7Content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 0 },
  s7Header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  s7HeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s7Logo: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  s7DotsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  s7Dot: { height: 4, borderRadius: 999 },
  s7Hero: { alignItems: 'center', marginBottom: 16, gap: 10, paddingHorizontal: 12 },
  s7HeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s7Title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  s7Subtitle: { fontSize: 15, fontWeight: '500', lineHeight: 22, textAlign: 'center' },
  s7Section: { gap: 10, marginBottom: 16 },
  s7SectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 8,
    marginBottom: 0,
  },
  s7Card: {
    minHeight: 60,
    borderRadius: 24,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  s7CardShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  s7CardTop: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  s7IconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s7CardContent: { flex: 1, marginLeft: 16, minWidth: 0 },
  s7CardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  s7CardLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  s7CardAmount: { fontSize: 13, fontWeight: '800' },
  s7EmptyState: {
    borderRadius: 24,
    borderWidth: 2,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
  },
  s7EmptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  s7SliderArea: { height: 24, justifyContent: 'center' },
  s7SliderTrack: {
    height: 4,
    borderRadius: 999,
    overflow: 'visible',
    justifyContent: 'center',
  },
  s7SliderFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 999,
  },
  s7SliderThumb: {
    position: 'absolute',
    top: -7,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  s7Footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  s7FooterFade: {
    ...StyleSheet.absoluteFillObject,
  },
  s7SaveButtonWrapper: { width: '100%', maxWidth: 440 },
  s7SaveButton: {
    width: '100%',
    minHeight: 60,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  s7SaveButtonText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  s7HomeIndicator: {
    width: 128,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginTop: 24,
  },

  // ── Screen 6 ──
  screen6Content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0 },
  s6InputWrapper: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  s6Input: { fontSize: 18, fontWeight: '500' },
  s6Chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  s6Chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  s6ChipText: { fontSize: 14, fontWeight: '600' },

  // ── Screen 8 ──
  s8Blob: {
    position: 'absolute',
    top: 80,
    left: '50%',
    marginLeft: -128,
    width: 256,
    height: 256,
    borderRadius: 128,
    zIndex: -1,
  },
  s8Layout: { flex: 1, justifyContent: 'space-between' },
  s8Content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  s8ContentCompact: { paddingTop: 2, paddingBottom: 4 },
  s8ImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 220,
    position: 'relative',
  },
  s8ImageWrapperCompact: {
    marginBottom: 12,
    height: 144,
  },
  s8ImageGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  s8ImageCard: {
    width: 180,
    height: 180,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
  },
  s8ImageCardCompact: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  s8HeroImage: {
    width: 180,
    height: 180,
    borderRadius: 40,
  },
  s8HeroImageCompact: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  s8FloatingBadge: {
    position: 'absolute',
    bottom: -12,
    right: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  s8FloatingBadgeCompact: {
    bottom: -2,
    right: -2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  s8BadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s8BadgeLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  s8BadgeValue: { fontSize: 12, fontWeight: '800' },
  s8TextBlock: { alignItems: 'center', marginBottom: 10 },
  s8TagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  s8TagDot: { width: 6, height: 6, borderRadius: 3 },
  s8TagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  s8PlansContainer: { gap: 8, marginBottom: 10 },
  s8PlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  s8PlanCardCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  s8PlanLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  s8RadioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s8RadioDot: { width: 12, height: 12, borderRadius: 6 },
  s8PlanTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  s8PlanTitleCompact: { fontSize: 14 },
  s8PlanPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  s8PlanPriceRowCompact: { gap: 6 },
  s8PlanPrice: { fontSize: 13, fontWeight: '500' },
  s8SaveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  s8SaveBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  s8PlanRight: { alignItems: 'flex-end', flexShrink: 0, marginLeft: 10, maxWidth: '42%' },
  s8PlanRightCompact: { maxWidth: '44%' },
  s8PlanSmall: { fontSize: 10, fontWeight: '500', marginBottom: 2 },
  s8PlanHighlight: { fontSize: 18, fontWeight: '800' },
  s8PlanHighlightCompact: { fontSize: 15 },
  s8PlanMonth: { fontSize: 16, fontWeight: '700' },
  s8PlanMonthCompact: { fontSize: 14 },
  s8TermsText: {
    marginTop: 12,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 20,
  },
  s8ErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  s8ErrorText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
