const LEGACY_ONBOARDING_KEY = 'onboarding_completed';

export function getOnboardingStorageKey(userId: string) {
  return `${LEGACY_ONBOARDING_KEY}:${userId}`;
}

export { LEGACY_ONBOARDING_KEY };
