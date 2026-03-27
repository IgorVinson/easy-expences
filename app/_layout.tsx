import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { TrialExpiredScreen } from '../components/TrialExpiredScreen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { SubscriptionProvider, useSubscription } from '../contexts/SubscriptionContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../global.css';
import '../i18n';
import { ONBOARDING_KEY } from './onboarding';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { tier, loading: subLoading } = useSubscription();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading || subLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      setReady(true);
      return;
    }

    // Always read fresh from AsyncStorage — avoids stale state when
    // onboarding completes and segments change in the same cycle.
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      const onboardingDone = value === 'true';
      if (!onboardingDone && !inOnboarding) {
        router.replace('/onboarding');
      } else if (onboardingDone && (inAuthGroup || inOnboarding)) {
        router.replace('/(tabs)/overview');
      }
      setReady(true);
    });
  }, [user, loading, subLoading, segments, router, tier]);

  if (loading || subLoading || !ready) {
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
  return (
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
}
