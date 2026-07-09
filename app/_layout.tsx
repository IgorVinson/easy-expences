import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostHogProvider } from 'posthog-react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { SubscriptionProvider, useSubscription } from '../contexts/SubscriptionContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../global.css';
import '../i18n';
import {
  posthog,
  track,
  identifyUser,
  resetAnalytics,
  markInstalledOnce,
  EVENTS,
} from '../lib/analytics';
import { configureNotificationHandler, syncDailyReminderOnLaunch } from '../lib/dailyReminder';
import { LEGACY_ONBOARDING_KEY, getOnboardingStorageKey } from '../utils/onboarding';

configureNotificationHandler();

function RootLayoutNav() {
  const { user, loading, postSignupRedirectPending } = useAuth();
  const { loading: subLoading } = useSubscription();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    syncDailyReminderOnLaunch();
  }, []);

  useEffect(() => {
    // Install fires once ever; open fires on this launch.
    markInstalledOnce().finally(() => track(EVENTS.opened));

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') track(EVENTS.opened);
    });
    return () => sub.remove();
  }, []);

  const wasIdentifiedRef = useRef(false);

  useEffect(() => {
    if (user) {
      identifyUser(user.uid);
      wasIdentifiedRef.current = true;
    } else if (wasIdentifiedRef.current) {
      resetAnalytics();
      wasIdentifiedRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (loading || subLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (postSignupRedirectPending && inAuthGroup) {
      return;
    }

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Always read fresh from AsyncStorage — avoids stale state when
    // onboarding completes and segments change in the same cycle.
    const onboardingKey = getOnboardingStorageKey(user.uid);

    Promise.all([
      AsyncStorage.getItem(onboardingKey),
      AsyncStorage.getItem(LEGACY_ONBOARDING_KEY),
    ]).then(async ([userScopedValue, legacyValue]) => {
      const onboardingDone = userScopedValue === 'true' || legacyValue === 'true';

      if (userScopedValue !== 'true' && legacyValue === 'true') {
        await AsyncStorage.setItem(onboardingKey, 'true');
      }

      if (!onboardingDone && !inOnboarding) {
        router.replace('/onboarding');
      } else if (onboardingDone && (inAuthGroup || inOnboarding)) {
        router.replace('/(tabs)/overview');
      }
    });
  }, [user, loading, subLoading, segments, router, postSignupRedirectPending]);

  if (loading || subLoading) {
    return null;
  }

  // Hard paywall: block app when trial has genuinely expired.
  // Only activate when RevenueCat offerings are loaded (products configured)
  // AND the user's entitlement history shows they once had access.
  // TODO: Enable once RevenueCat products are live and trial flow is tested
  // if (user && tier === 'none' && offerings?.current) {
  //   return <TrialExpiredScreen />;
  // }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const tree = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <SubscriptionProvider>
              <RootLayoutNav />
            </SubscriptionProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );

  return posthog ? <PostHogProvider client={posthog}>{tree}</PostHogProvider> : tree;
}
