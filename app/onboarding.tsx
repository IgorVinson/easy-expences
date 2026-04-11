import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';
import { PurchasesPackage } from 'react-native-purchases';

const ONBOARDING_KEY = 'onboarding_completed';
const TOTAL_STEPS = 9;

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
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBack ? (
          <Pressable onPress={onBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={theme.textSecondary} />
          </Pressable>
        ) : (
          <View style={styles.logoBox2}>
            <View style={[styles.logoBox, { backgroundColor: theme.purple + '22' }]}>
              <Ionicons name="wallet" size={18} color={theme.purple} />
            </View>
          </View>
        )}
        <Text style={[styles.logoText, { color: theme.purple }]}>Keelio</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
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
  return (
    <Pressable onPress={onPress} style={styles.ctaButtonWrapper} disabled={disabled || loading}>
      <LinearGradient
        colors={[theme.purple, theme.purpleCard]}
        style={[styles.ctaButton, disabled || loading ? { opacity: 0.88 } : null]}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.ctaButtonText}>{label}</Text>
            {icon && <Ionicons name={icon} size={20} color="#fff" />}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Screen 1 — Emotional Welcome
// ─────────────────────────────────────────────
function Screen1({ theme, t, onNext }: Pick<SharedProps, 'theme' | 't' | 'onNext'>) {
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

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={[styles.logoBox, { backgroundColor: theme.purple + '22' }]}>
            <Ionicons name="wallet" size={18} color={theme.purple} />
          </View>
          <Text style={[styles.logoText, { color: theme.purple }]}>Keelio</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.purple, width: `${(1 / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.screen1Content}
        showsVerticalScrollIndicator={false}>
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

      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <CTAButton
          label={t('onboarding.s1.cta')}
          onPress={onNext}
          theme={theme}
          icon="arrow-forward"
        />
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
const OPTION_ICONS: ('pause-circle' | 'help-circle' | 'sad')[] = [
  'pause-circle',
  'help-circle',
  'sad',
];

function Screen2({ theme, t, onNext, onBack, step }: SharedProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const options = [
    t('onboarding.s2.option1'),
    t('onboarding.s2.option2'),
    t('onboarding.s2.option3'),
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <Header theme={theme} onBack={onBack} step={step} showBack />
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
        <CTAButton label={t('onboarding.s2.cta')} onPress={onNext} theme={theme} />
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
function Screen3({ theme, t, onNext, onBack, step }: SharedProps) {
  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <Header theme={theme} onBack={onBack} step={step} showBack />
      <ScrollView
        contentContainerStyle={styles.screen3Content}
        showsVerticalScrollIndicator={false}>
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
        <CTAButton
          label={t('onboarding.s3.cta')}
          onPress={onNext}
          theme={theme}
          icon="arrow-forward"
        />
        <Text style={[styles.footerHint, { color: theme.textTertiary }]}>
          {t('onboarding.s3.hint')}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 4 — Anti-Budgeting Value Prop
// ─────────────────────────────────────────────
function Screen4({ theme, t, onNext, onBack, step }: SharedProps) {
  const DEMO_ROWS = [
    { date: '10/24', desc: 'Whole Foods', amount: '-$84.20' },
    { date: '10/25', desc: 'Rent Payment', amount: '-$1,200' },
    { date: '10/25', desc: 'Starbucks', amount: '-$4.50' },
    { date: '10/26', desc: 'Netflix Sub', amount: '-$15.99' },
  ];
  const DEMO_CATS = [
    { icon: 'restaurant' as const, label: 'Food out', color: '#FB923C', left: '$50' },
    { icon: 'airplane' as const, label: 'Weekend trip', color: '#38BDF8', left: '$800' },
    { icon: 'film' as const, label: 'Entertainment', color: theme.purple, left: '$200' },
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      <Header theme={theme} onBack={onBack} step={step} showBack />

      <View style={styles.screen4Content}>
        {/* Logo + badge */}
        <View style={styles.s4LogoWrapper}>
          <View style={[styles.s4LogoBox, { backgroundColor: theme.successBg }]}>
            <View style={[styles.logoBox, { backgroundColor: theme.success + '33' }]}>
              <Ionicons name="wallet" size={22} color={theme.success} />
            </View>
          </View>
          <View style={[styles.s4Badge, { backgroundColor: theme.purple }]}>
            <Text style={styles.s4BadgeText}>{t('onboarding.s4.tagBadge')}</Text>
          </View>
        </View>

        {/* Headline */}
        <Text
          style={[
            styles.headline,
            { color: theme.textPrimary, textAlign: 'center', marginBottom: 4 },
          ]}>
          {t('onboarding.s4.title').replace(t('onboarding.s4.titleStrike'), '')}
          <Text style={{ textDecorationLine: 'line-through', color: theme.textTertiary }}>
            {t('onboarding.s4.titleStrike')}
          </Text>
        </Text>
        <Text
          style={[
            styles.bodyText,
            { color: theme.textSecondary, textAlign: 'center', marginBottom: 24 },
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
              { backgroundColor: theme.iconBg, borderColor: theme.border },
            ]}>
            <View style={[styles.s4SheetHeader, { borderBottomColor: theme.border }]}>
              {['Date', 'Description', 'Amount', 'Bal'].map((h) => (
                <Text
                  key={h}
                  style={[
                    styles.s4SheetHeaderCell,
                    { color: theme.textTertiary, flex: h === 'Description' ? 2 : 1 },
                  ]}>
                  {h}
                </Text>
              ))}
            </View>
            {DEMO_ROWS.map((row, i) => (
              <View key={i} style={styles.s4SheetRow}>
                <Text style={[styles.s4SheetCell, { color: theme.textSecondary, flex: 1 }]}>
                  {row.date}
                </Text>
                <Text
                  style={[styles.s4SheetCell, { color: theme.textSecondary, flex: 2 }]}
                  numberOfLines={1}>
                  {row.desc}
                </Text>
                <Text
                  style={[styles.s4SheetCell, { color: theme.error, flex: 1, textAlign: 'right' }]}>
                  {row.amount}
                </Text>
              </View>
            ))}
            <View style={[styles.s4SheetFooter, { borderTopColor: theme.border }]}>
              <Text style={[styles.s4SheetFooterLabel, { color: theme.textPrimary }]}>TOTAL</Text>
              <Text style={[styles.s4SheetFooterValue, { color: theme.error }]}>-$1,304.69</Text>
            </View>
          </View>
          {/* X badge */}
          <View
            style={[styles.s4XBadge, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="close" size={14} color={theme.error} />
          </View>
        </View>

        {/* Arrow transition */}
        <View style={styles.s4Arrow}>
          <View style={[styles.s4ArrowLine, { backgroundColor: theme.border }]} />
          <View
            style={[
              styles.s4ArrowCircle,
              { backgroundColor: theme.successBg, borderColor: theme.success + '44' },
            ]}>
            <Ionicons name="arrow-down" size={18} color={theme.success} />
          </View>
        </View>

        {/* Keelio categories card */}
        <View
          style={[styles.s4CatCard, { backgroundColor: theme.cardBg, borderColor: theme.success }]}>
          {DEMO_CATS.map((cat, i) => (
            <View
              key={i}
              style={[styles.s4CatRow, i < DEMO_CATS.length - 1 && { marginBottom: 16 }]}>
              <View style={styles.s4CatLeft}>
                <View style={[styles.s4CatIcon, { backgroundColor: cat.color + '22' }]}>
                  <Ionicons name={cat.icon} size={18} color={cat.color} />
                </View>
                <Text style={[styles.s4CatLabel, { color: theme.textPrimary }]}>{cat.label}</Text>
              </View>
              <Text style={[styles.s4CatLeft_left, { color: theme.textPrimary }]}>
                {cat.left} left
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <CTAButton
          label={t('onboarding.s4.cta')}
          onPress={onNext}
          theme={theme}
          icon="arrow-forward"
        />
        <Text style={[styles.footerHint, { color: theme.textTertiary }]}>
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

      <ScrollView
        contentContainerStyle={styles.screen5Content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.headline, { color: theme.textPrimary, marginBottom: 6 }]}>
          {t('onboarding.s5.titlePart1')}
          <Text style={{ color: theme.info }}>{t('onboarding.s5.titleAccent')}</Text>
          <Text>
            {t('onboarding.s5.titlePart2Prefix')}
            <Text style={{ color: theme.error }}>{t('onboarding.s5.titlePart2Accent')}</Text>
            {t('onboarding.s5.titlePart2Suffix')}
          </Text>
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary, marginBottom: 20 }]}>
          {t('onboarding.s5.subtitle')}
        </Text>

        {/* 2-column grid — 4 category tiles */}
        <View style={styles.s5Grid}>
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
                  },
                ]}>
                {isSelected && (
                  <View style={[styles.s5CheckBadge, { backgroundColor: theme.purple }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
                <View style={[styles.s5IconBox, { backgroundColor: cat.bgLight + '44' }]}>
                  <Ionicons name={cat.icon} size={22} color={cat.color} />
                </View>
                <Text style={[styles.s5ItemLabel, { color: theme.textPrimary }]}>
                  {t(`onboarding.s5.${cat.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom expense input — always visible below the grid */}
        <Text style={[styles.s5CustomLabel, { color: theme.purple }]}>
          {t('onboarding.s5.customLabel').toUpperCase()}
        </Text>
        <View
          style={[
            styles.s5InputWrapper,
            {
              backgroundColor: theme.cardBg,
              borderColor: customText ? theme.purple : theme.border,
              borderWidth: customText ? 1.5 : 1,
            },
          ]}>
          <TextInput
            ref={inputRef}
            style={[styles.s5Input, { color: theme.textPrimary }]}
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
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <CTAButton
          label={t('onboarding.s5.cta')}
          onPress={handleNext}
          theme={theme}
          icon="arrow-forward"
        />
        <Text style={[styles.footerHint, { color: theme.textTertiary }]}>
          {t('onboarding.s5.hint')}
        </Text>
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
      <ScrollView
        contentContainerStyle={styles.screen5Content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.headline, { color: theme.textPrimary, marginBottom: 6 }]}>
          {t('onboarding.s6.titlePart1')}
          <Text style={{ color: theme.success }}>{t('onboarding.s6.titleAccent')}</Text>
          {t('onboarding.s6.titlePart2')}
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary, marginBottom: 20 }]}>
          {t('onboarding.s6.subtitle')}
        </Text>

        {/* 2x2 goal grid */}
        <View style={styles.s5Grid}>
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
                  },
                ]}>
                {isSelected && (
                  <View style={[styles.s5CheckBadge, { backgroundColor: theme.purple }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
                <View style={[styles.s5IconBox, { backgroundColor: goal.bgLight + '88' }]}>
                  <Ionicons name={goal.icon} size={24} color={goal.color} />
                </View>
                <Text style={[styles.s5ItemLabel, { color: theme.textPrimary }]}>
                  {t(`onboarding.s6.${goal.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom goal input */}
        <Text style={[styles.s5CustomLabel, { color: theme.purple }]}>
          {t('onboarding.s6.inputPlaceholder').split(' ').slice(0, 2).join(' ').toUpperCase()}
        </Text>
        <View
          style={[
            styles.s5InputWrapper,
            {
              backgroundColor: theme.cardBg,
              borderColor: customGoal ? theme.purple : theme.border,
              borderWidth: customGoal ? 1.5 : 1,
            },
          ]}>
          <TextInput
            ref={inputRef}
            style={[styles.s5Input, { color: theme.textPrimary }]}
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
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <CTAButton
          label={t('onboarding.s6.cta')}
          onPress={handleNext}
          theme={theme}
          icon="arrow-forward"
        />
        <Text style={[styles.footerHint, { color: theme.textTertiary }]}>
          {t('onboarding.s6.hint')}
        </Text>
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

function getGoalPreset(goalKey: string | null) {
  if (!goalKey) {
    return {
      key: 'custom',
      icon: 'flag' as const,
      color: '#10B981',
      bgLight: '#D1FAE5',
      budget: 1500,
    };
  }

  return GOAL_OPTIONS.find((goal) => goal.key === goalKey) ?? GOAL_OPTIONS[0];
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

  const progress = max > min ? (value - min) / (max - min) : 0;
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  const thumbLeft = trackWidth * normalizedProgress;

  const handleChange = (x: number) => {
    if (trackWidth <= 0) {
      return;
    }

    const clampedX = Math.min(Math.max(x, 0), trackWidth);
    const nextRaw = min + (clampedX / trackWidth) * (max - min);
    const next = Math.max(min, Math.min(max, Math.round(nextRaw / step) * step));
    onChange(next);
  };

  return (
    <View
      style={styles.s7SliderArea}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => handleChange(event.nativeEvent.locationX)}
      onResponderMove={(event) => handleChange(event.nativeEvent.locationX)}>
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
  const { currency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>({});
  const [goalAmount, setGoalAmount] = useState<number | null>(null);
  const goalPreset = getGoalPreset(goalKey);
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
      nextBudgets.customCategory = 200;
    }

    setBudgetMap(nextBudgets);
    setGoalAmount(goalName.trim() ? goalPreset.budget : null);
  }, [customCategory, goalName, goalPreset.budget, selectedCategoryKeys]);

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
        max: 2000,
        step: 50,
        initial: category.budget,
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
      max: 2000,
      step: 50,
      initial: 200,
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
          max: 10000,
          step: 100,
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
        customExpenseBudget: budgetMap.customCategory ?? 200,
        goalTargetAmount: goalAmount ?? goalPreset.budget,
      });
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (amount: number) =>
    formatCurrencyAmount(amount, currency, language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
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

      <ScrollView
        contentContainerStyle={styles.screen7Content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.s7Hero}>
          <View style={[styles.s7HeroIcon, { backgroundColor: theme.purple + '14' }]}>
            <Ionicons name="cash-outline" size={28} color={theme.purple} />
          </View>
          <Text style={[styles.s7Title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.s7Subtitle, { color: theme.textSecondary }]}>
            {t('onboarding.s7.subtitle')}
          </Text>
        </View>

        <View style={styles.s7Section}>
          <Text style={[styles.s7SectionTitle, { color: theme.textTertiary }]}>
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
                        <Text style={[styles.s7CardAmount, { color: theme.textPrimary }]}>
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
          <Text style={[styles.s7SectionTitle, { color: theme.textTertiary }]}>
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
                        <Text style={[styles.s7CardAmount, { color: theme.textPrimary }]}>
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
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: screenBackground }]}>
        <CTAButton
          label={t('onboarding.s7.cta')}
          onPress={complete}
          theme={theme}
          icon="chevron-forward"
          loading={saving}
        />
        <Text style={[styles.footerHint, { color: theme.textTertiary }]}>
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
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { offerings, subscribe, tier, loading: subscriptionLoading } = useSubscription();
  const hadActiveTierOnOpen = useRef<boolean | null>(null);

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
    const currentOffering = offerings?.current;
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

      <View style={styles.s8Content}>
        {/* Hero image with floating badge */}
        <View style={styles.s8ImageWrapper}>
          <View style={[styles.s8ImageGlow, { backgroundColor: theme.purple + '20' }]} />
          <View
            style={[
              styles.s8ImageCard,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSfoqHxeAi6k1VosFbuxNW4fwnC2IHPL09qimUrn-GHiNSGyCeIJT7-MC-68CTDnY-AGXMw6sgl8JzRrBdwdfeeWeL26xGxYls8fF1NiMHl3fj5REeDGFe__3mhtVe0C63h7Fxo3AtxIBVwXeV82mm2akg7HwTdagocanR3v4Ffnvqz15BS8rwuxezLPNmwxVWNL0ccGhFbDTZaPDLHR--IhT3gDizTaIIC6Iw5dr-wu4Cc9dWjdZvplOXlFXvisu9mC3xYoXUxM3K',
              }}
              style={styles.s8HeroImage}
              resizeMode="contain"
            />
            {/* Floating badge */}
            <View
              style={[
                styles.s8FloatingBadge,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}>
              <View style={[styles.s8BadgeIcon, { backgroundColor: theme.success }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <View>
                <Text style={[styles.s8BadgeLabel, { color: theme.textSecondary }]}>
                  Plan Ready
                </Text>
                <Text style={[styles.s8BadgeValue, { color: theme.textPrimary }]}>
                  98% Accuracy
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Text content */}
        <View style={styles.s8TextBlock}>
          <View style={styles.s8TagRow}>
            <View style={[styles.s8TagDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.s8TagText, { color: theme.success }]}>Onboarding Complete</Text>
          </View>
          <Text style={[styles.headline, { color: theme.textPrimary, textAlign: 'center' }]}>
            Ready to experience total financial peace?
          </Text>
          <Text
            style={[
              styles.bodyText,
              { color: theme.textSecondary, textAlign: 'center', marginTop: 12 },
            ]}>
            Your personalized plan for clarity and growth is ready. Join 1,000+ others who have
            reclaimed their financial freedom.
          </Text>
        </View>

        {/* Subscription options */}
        <View style={styles.s8PlansContainer}>
          {/* Annual Plan */}
          <Pressable
            onPress={() => setSelectedPlan('annual')}
            style={[
              styles.s8PlanCard,
              {
                backgroundColor: selectedPlan === 'annual' ? theme.cardBg : theme.iconBg,
                borderColor: selectedPlan === 'annual' ? theme.purple : theme.border,
                borderWidth: selectedPlan === 'annual' ? 2 : 1,
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
                <Text style={[styles.s8PlanTitle, { color: theme.textPrimary }]}>Annual</Text>
                <View style={styles.s8PlanPriceRow}>
                  <Text style={[styles.s8PlanPrice, { color: theme.textSecondary }]}>
                    $59.99/year
                  </Text>
                  <View style={[styles.s8SaveBadge, { backgroundColor: theme.successBg }]}>
                    <Text style={[styles.s8SaveBadgeText, { color: theme.success }]}>Save 50%</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.s8PlanRight}>
              <Text style={[styles.s8PlanSmall, { color: theme.textSecondary }]}>Only</Text>
              <Text style={[styles.s8PlanHighlight, { color: theme.purple }]}>$4.99/mo</Text>
            </View>
          </Pressable>

          {/* Monthly Plan */}
          <Pressable
            onPress={() => setSelectedPlan('monthly')}
            style={[
              styles.s8PlanCard,
              {
                backgroundColor: selectedPlan === 'monthly' ? theme.cardBg : theme.iconBg,
                borderColor: selectedPlan === 'monthly' ? theme.purple : theme.border,
                borderWidth: selectedPlan === 'monthly' ? 2 : 1,
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
                <Text style={[styles.s8PlanTitle, { color: theme.textPrimary }]}>Monthly</Text>
                <Text style={[styles.s8PlanPrice, { color: theme.textSecondary }]}>$9.99/mo</Text>
              </View>
            </View>
            <View style={styles.s8PlanRight}>
              <Text style={[styles.s8PlanSmall, { color: theme.textSecondary }]}>Billed</Text>
              <Text style={[styles.s8PlanMonth, { color: theme.textPrimary }]}>Monthly</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Footer with CTA */}
      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        {error && (
          <View style={[styles.s8ErrorContainer, { backgroundColor: theme.error + '15' }]}>
            <Ionicons name="alert-circle" size={16} color={theme.error} />
            <Text style={[styles.s8ErrorText, { color: theme.error }]}>{error}</Text>
          </View>
        )}
        <CTAButton
          label={loading ? 'Processing...' : canContinueWithoutPurchase ? 'Continue' : 'Subscribe'}
          onPress={handleGetStarted}
          theme={theme}
          icon={canContinueWithoutPurchase ? 'arrow-forward' : 'card'}
          loading={loading}
        />
        <Text style={[styles.s8TermsText, { color: theme.textTertiary }]}>
          Secure payment. Cancel anytime in your account settings.{'\n'}
          Terms of Service and Privacy Policy apply.
        </Text>
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

      <View style={styles.s9Content}>
        <View style={[styles.s9Hero, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <LinearGradient
            colors={[theme.success, theme.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.s9HeroGlow}
          />
          <View style={styles.s9HeroIconWrap}>
            <View style={[styles.s9HeroIcon, { backgroundColor: '#fff' }]}>
              <Ionicons name="checkmark" size={34} color={theme.success} />
            </View>
          </View>
          <Text style={[styles.s9Eyebrow, { color: theme.success }]}>
            {t('onboarding.s9.eyebrow')}
          </Text>
          <Text style={[styles.headline, styles.s9Title, { color: theme.textPrimary }]}>
            {t('onboarding.s9.title')}
          </Text>
          <Text style={[styles.bodyText, styles.s9Subtitle, { color: theme.textSecondary }]}>
            {t('onboarding.s9.subtitle')}
          </Text>
        </View>

        <View style={styles.s9Highlights}>
          {highlights.map((item) => (
            <View
              key={item.title}
              style={[
                styles.s9HighlightCard,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}>
              <View style={styles.s9StepRail}>
                <View style={[styles.s9StepNumber, { backgroundColor: item.color }]}>
                  <Text style={styles.s9StepNumberText}>{item.number}</Text>
                </View>
              </View>
              <View style={styles.s9HighlightText}>
                <Text style={[styles.s9HighlightTitle, { color: theme.textPrimary }]}>
                  {item.title}
                </Text>
                <View style={styles.s9HighlightBodyRow}>
                  {item.number === '1' ? (
                    <>
                      <Text style={[styles.s9HighlightBody, { color: theme.textSecondary }]}>
                        {t('onboarding.s9.step1BodyPrefix')}
                      </Text>
                      <View style={styles.s9InlineMicBadge}>
                        <Ionicons name="mic" size={12} color="#fff" />
                      </View>
                      <Text style={[styles.s9HighlightBody, { color: theme.textSecondary }]}>
                        {t('onboarding.s9.step1BodySuffix')}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.s9HighlightBody, { color: theme.textSecondary }]}>
                      {item.body}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <CTAButton
          label={t('onboarding.s9.cta')}
          onPress={onFinish}
          theme={theme}
          icon="arrow-forward"
        />
        <Text style={[styles.footerHint, { color: theme.textTertiary }]}>
          {t('onboarding.s9.hint')}
        </Text>
      </View>
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

    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
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
  footerHint: { marginTop: 12, fontSize: 12, textAlign: 'center' },

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
  s9Content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 158,
    justifyContent: 'space-between',
    gap: 14,
  },
  s9Hero: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 10,
  },
  s9HeroGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  s9HeroIconWrap: {
    marginBottom: 12,
    padding: 6,
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
    marginBottom: 8,
  },
  s9Title: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
  },
  s9Subtitle: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  s9Highlights: {
    gap: 12,
  },
  s9HighlightCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 92,
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
  s9HighlightText: {
    flex: 1,
    gap: 5,
  },
  s9HighlightTitle: {
    fontSize: 16,
    fontWeight: '800',
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

  // ── Screen 1 ──
  screen1Content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140 },
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

  // ── Screen 2 ──
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

  // ── Screen 3 ──
  screen3Content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 140 },
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

  // ── Screen 4 ──
  screen4Content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 140 },
  s4LogoWrapper: { alignItems: 'center', marginBottom: 20, position: 'relative' },
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
  s4Spreadsheet: { borderWidth: 1, borderRadius: 14, padding: 12, width: '90%' },
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
  s4Arrow: { alignItems: 'center', marginVertical: 12 },
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
    padding: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
  screen5StaticContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  screen5Content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 160 },
  s5Grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
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
  screen7Content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 188 },
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
  s7Hero: { alignItems: 'center', marginBottom: 30, gap: 12, paddingHorizontal: 12 },
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
  s7Section: { gap: 12, marginBottom: 24 },
  s7SectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 8,
    marginBottom: 0,
  },
  s7Card: {
    minHeight: 82,
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
  screen6Content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
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
  s8Content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 180 },
  s8ImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    height: 220,
    position: 'relative',
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
  s8HeroImage: {
    width: 180,
    height: 180,
    borderRadius: 40,
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
  s8BadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  s8BadgeLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  s8BadgeValue: { fontSize: 12, fontWeight: '800' },
  s8TextBlock: { alignItems: 'center', marginBottom: 28 },
  s8TagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  s8TagDot: { width: 6, height: 6, borderRadius: 3 },
  s8TagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  s8PlansContainer: { gap: 12, marginBottom: 24 },
  s8PlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  s8PlanLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
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
  s8PlanPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  s8PlanPrice: { fontSize: 13, fontWeight: '500' },
  s8SaveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  s8SaveBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  s8PlanRight: { alignItems: 'flex-end' },
  s8PlanSmall: { fontSize: 10, fontWeight: '500', marginBottom: 2 },
  s8PlanHighlight: { fontSize: 18, fontWeight: '800' },
  s8PlanMonth: { fontSize: 16, fontWeight: '700' },
  s8TermsText: {
    marginTop: 16,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
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
