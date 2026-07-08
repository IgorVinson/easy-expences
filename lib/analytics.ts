import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHog from 'posthog-react-native';

const INSTALLED_KEY = 'analytics.installed';

export const EVENTS = {
  installed: 'app_installed',
  opened: 'app_opened',
  aha: 'aha_plan_ready',
  paywallView: 'paywall_view',
  trialStarted: 'trial_started',
  subscriptionPaid: 'subscription_paid',
} as const;

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// Null when no key configured (local dev without a key) — every helper no-ops.
export const posthog: PostHog | null = apiKey ? new PostHog(apiKey, { host }) : null;

export function track(event: string, properties?: Record<string, unknown>): void {
  posthog?.capture(event, properties as any);
}

export function identifyUser(uid: string, properties?: Record<string, unknown>): void {
  posthog?.identify(uid, properties as any);
}

export function resetAnalytics(): void {
  posthog?.reset();
}

// Fires app_installed exactly once, ever, on this install.
export async function markInstalledOnce(): Promise<void> {
  try {
    const already = await AsyncStorage.getItem(INSTALLED_KEY);
    if (already === 'true') return;
    await AsyncStorage.setItem(INSTALLED_KEY, 'true');
    track(EVENTS.installed);
  } catch (err) {
    console.warn('markInstalledOnce failed:', err);
  }
}
