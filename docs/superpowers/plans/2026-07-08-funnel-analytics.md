# Funnel Analytics (PostHog) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instrument the install→aha→paywall→trial→paid funnel with PostHog so drop-off can be diagnosed as an onboarding problem vs. a paywall/price problem.

**Architecture:** A single thin wrapper module (`lib/analytics.ts`) owns the PostHog SDK and exposes imperative helpers. React tree is wrapped in `PostHogProvider` sharing the same client. Events are emitted from four call sites: `_layout.tsx` (install/open/identity), `onboarding.tsx` (aha/paywall_view), and `SubscriptionContext.tsx` (trial/paid). Day-2/day-7 are derived in PostHog from a recurring `app_opened` event, not emitted as events.

**Tech Stack:** Expo 54, React Native 0.81, React 19, `posthog-react-native`, `@react-native-async-storage/async-storage` (already installed), Firebase Auth, RevenueCat.

## Global Constraints

- **No test runner exists** in this repo (no jest/vitest/e2e). "Verify" steps are `npx tsc --noEmit` for type safety plus **manual verification on a dev build against the PostHog live event feed**. Never invent a test command.
- **Native rebuild required:** `posthog-react-native` is a native module. After install run `npm run prebuild` and launch a fresh dev build — events will NOT appear on a JS-only reload.
- **Use RAW `tier`, never `effectiveTier`** for revenue events. `effectiveTier` is hardcoded `'premium'` in `__DEV__` (`contexts/SubscriptionContext.tsx:139`).
- **Env var convention:** mirror `EXPO_PUBLIC_RC_*`. Use `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST`.
- **Edit both firebase/auth variants only where imperative** — but identity is centralized in `_layout.tsx` (see Task 3), so the two `AuthContext` files are NOT touched.
- **Graceful no-op:** if `EXPO_PUBLIC_POSTHOG_KEY` is unset, the wrapper must no-op without throwing (so local runs without a key don't crash).
- **i18n:** no new user-facing strings are introduced by this plan, so no `locales/*.json` edits.

---

### Task 1: Install PostHog SDK and wire env vars

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `eas.json` (env for build profiles)
- Modify: `.env` (local; create if absent — it is gitignored)

**Interfaces:**
- Consumes: nothing.
- Produces: `posthog-react-native` available for import; `process.env.EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` readable at runtime.

- [ ] **Step 1: Install the SDK**

Run:
```bash
npx expo install posthog-react-native
```
Expected: `posthog-react-native` added to `package.json` dependencies at an Expo-54-compatible version, `package-lock.json` updated.

- [ ] **Step 2: Add env vars to `.env`**

Add these lines to `.env` (create the file if it does not exist). Use the real Project API key + host from the PostHog project settings (US cloud host shown):
```
EXPO_PUBLIC_POSTHOG_KEY=phc_your_project_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 3: Add env vars to `eas.json` build profiles**

In `eas.json`, add both keys to the `env` block of the `production` profile (and `preview` if present), alongside the existing `EXPO_PUBLIC_RC_*` entries. Example shape (merge into the existing `env` object, do not replace it):
```json
"env": {
  "EXPO_PUBLIC_POSTHOG_KEY": "phc_your_project_api_key_here",
  "EXPO_PUBLIC_POSTHOG_HOST": "https://us.i.posthog.com"
}
```

- [ ] **Step 4: Prebuild native projects**

Run:
```bash
npm run prebuild
```
Expected: `ios/` and `android/` regenerate without error, including the new native module.

- [ ] **Step 5: Verify type/build integrity**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors (the import isn't used yet; this just confirms the dep resolves).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json eas.json
git commit -m "chore: add posthog-react-native dependency and env config"
```

---

### Task 2: Create the analytics wrapper module

**Files:**
- Create: `lib/analytics.ts`

**Interfaces:**
- Consumes: `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` env; `@react-native-async-storage/async-storage`.
- Produces (exact signatures other tasks rely on):
  - `export const posthog: PostHog | null` — shared client (null when key unset)
  - `export function track(event: string, properties?: Record<string, unknown>): void`
  - `export function identifyUser(uid: string, properties?: Record<string, unknown>): void`
  - `export function resetAnalytics(): void`
  - `export async function markInstalledOnce(): Promise<void>` — fires `app_installed` exactly once
  - Event-name constants: `export const EVENTS = { installed: 'app_installed', opened: 'app_opened', aha: 'aha_plan_ready', paywallView: 'paywall_view', trialStarted: 'trial_started', subscriptionPaid: 'subscription_paid' } as const`

- [ ] **Step 1: Write the module**

Create `lib/analytics.ts`:
```ts
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
  posthog?.capture(event, properties);
}

export function identifyUser(uid: string, properties?: Record<string, unknown>): void {
  posthog?.identify(uid, properties);
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
```

- [ ] **Step 2: Verify types**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS with no errors. If `new PostHog(...)` signature differs in the installed version, adjust the constructor call to match the installed SDK's TypeScript types (do not change the exported helper signatures).

- [ ] **Step 3: Commit**

```bash
git add lib/analytics.ts
git commit -m "feat: add analytics wrapper module around posthog"
```

---

### Task 3: Wire provider, install/open events, and identity in `_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `posthog`, `track`, `identifyUser`, `resetAnalytics`, `markInstalledOnce`, `EVENTS` from `lib/analytics.ts`; `user` from `useAuth()`.
- Produces: `app_installed` (once), `app_opened` (launch + every foreground), `identify(uid)` on login, `reset()` on logout.

- [ ] **Step 1: Add imports**

At the top of `app/_layout.tsx`, add:
```ts
import { AppState } from 'react-native';
import { PostHogProvider } from 'posthog-react-native';
import {
  posthog,
  track,
  identifyUser,
  resetAnalytics,
  markInstalledOnce,
  EVENTS,
} from '../lib/analytics';
```

- [ ] **Step 2: Fire install + open on launch, and on every foreground**

Inside `RootLayoutNav`, add a new effect (place it next to the existing `syncDailyReminderOnLaunch` effect at line 22):
```ts
  useEffect(() => {
    // Install fires once ever; open fires on this launch.
    markInstalledOnce().finally(() => track(EVENTS.opened));

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') track(EVENTS.opened);
    });
    return () => sub.remove();
  }, []);
```
Note: the launch `app_opened` is emitted after `markInstalledOnce` resolves so `app_installed` always precedes the first `app_opened` for a new install.

- [ ] **Step 3: Identify on login, reset on logout**

Still inside `RootLayoutNav`, add an effect keyed on the user id:
```ts
  useEffect(() => {
    if (user) {
      identifyUser(user.uid);
    } else {
      resetAnalytics();
    }
  }, [user]);
```
This single effect covers both the web and native `AuthContext` (both surface `user` through `useAuth()`), so neither `AuthContext` file needs editing.

- [ ] **Step 4: Wrap the tree in `PostHogProvider`**

In `RootLayout` (the default export), wrap the existing `GestureHandlerRootView` subtree. Because `posthog` may be null (no key), only mount the provider when it exists:
```tsx
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
```

- [ ] **Step 5: Verify types**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 6: Manual verification on a dev build**

Launch a fresh dev build (`npm run ios` or `npm run android`). In the PostHog project's **Activity → Live events** feed, confirm:
- `app_installed` appears exactly once on first launch (delete/reinstall to re-test).
- `app_opened` appears on launch and again after backgrounding + foregrounding the app.
- After logging in, subsequent events carry `distinct_id` = the Firebase UID (check an event's person).
- After logging out, `reset` is reflected (new events revert to an anonymous id).

- [ ] **Step 7: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: track app_installed/app_opened and identity via posthog"
```

---

### Task 4: Fire `aha_plan_ready` and `paywall_view` in onboarding

**Files:**
- Modify: `app/onboarding.tsx`

**Interfaces:**
- Consumes: `track`, `EVENTS` from `lib/analytics.ts`.
- Produces: `aha_plan_ready` (once per install, on Save Budgets success in `Screen7.complete`), `paywall_view` (on `Screen8` mount).

- [ ] **Step 1: Add imports and the aha guard key**

At the top of `app/onboarding.tsx`, add:
```ts
import { track, EVENTS } from '../lib/analytics';
```
And near the existing top-level constants (e.g. next to `const TOTAL_STEPS = 9;` at line 35), add:
```ts
const AHA_FIRED_KEY = 'analytics.ahaFired';
```
(`AsyncStorage` is already imported in this file — confirm; if not, add `import AsyncStorage from '@react-native-async-storage/async-storage';`.)

- [ ] **Step 2: Fire `aha_plan_ready` once in `Screen7.complete`**

In `Screen7`, modify the `complete` handler (currently at `app/onboarding.tsx:1947`) to fire the event once, after the plan save succeeds:
```ts
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
      // Aha moment: personalized plan committed. Fire once per install.
      const alreadyFired = await AsyncStorage.getItem(AHA_FIRED_KEY);
      if (alreadyFired !== 'true') {
        await AsyncStorage.setItem(AHA_FIRED_KEY, 'true');
        track(EVENTS.aha);
      }
    } finally {
      setSaving(false);
    }
  };
```

- [ ] **Step 3: Fire `paywall_view` on `Screen8` mount**

In `Screen8` (starts at `app/onboarding.tsx:2258`), add a mount effect near the top of the component body (right after the existing `const { offerings, subscribe, ... } = useSubscription();` line at ~2278):
```ts
  useEffect(() => {
    track(EVENTS.paywallView);
  }, []);
```
Confirm `useEffect` is imported (it is used elsewhere in this file; the top import from `'react'` already includes it).

- [ ] **Step 4: Verify types**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 5: Manual verification on a dev build**

Create a new account and go through onboarding. In PostHog Live events confirm:
- `aha_plan_ready` fires when tapping **Save Budgets** (Screen7), and does NOT fire again if you navigate back and re-save (guarded by `analytics.ahaFired`).
- `paywall_view` fires when the paywall (Screen8) appears.
- Both carry the Firebase UID as `distinct_id` (onboarding is post-signup).

- [ ] **Step 6: Commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: track aha_plan_ready and paywall_view in onboarding"
```

---

### Task 5: Fire `trial_started` and `subscription_paid` on tier transitions

**Files:**
- Modify: `contexts/SubscriptionContext.tsx`

**Interfaces:**
- Consumes: `track`, `EVENTS` from `lib/analytics.ts`; the raw `tier` state (NOT `effectiveTier`).
- Produces: `trial_started` on raw `none → trial`; `subscription_paid` on raw transition into `premium` (non-trial active entitlement).

- [ ] **Step 1: Add import**

At the top of `contexts/SubscriptionContext.tsx`, add:
```ts
import { track, EVENTS } from '../lib/analytics';
```

- [ ] **Step 2: Add a de-duped transition effect**

Add a `useRef` to remember the previous raw tier and an effect that emits only on real transitions. Place the ref near the other state declarations (around line 129–141) and the effect after the existing RevenueCat login effect (after line 257). Ensure `useRef` is imported from `'react'`.

```ts
  // Tracks the last raw tier we emitted an event for, to avoid duplicate
  // events when the RevenueCat listener re-fires on renewal/refresh.
  const prevTierRef = useRef<SubscriptionTier | null>(null);

  useEffect(() => {
    // Use RAW `tier`, never `effectiveTier` (which is 'premium' in __DEV__).
    const prev = prevTierRef.current;

    // Skip the very first observed value (initial load, not a transition).
    if (prev === null) {
      prevTierRef.current = tier;
      return;
    }

    if (prev === tier) return;

    if (tier === 'trial' && prev !== 'trial') {
      track(EVENTS.trialStarted);
    }
    if (tier === 'premium' && prev !== 'premium') {
      track(EVENTS.subscriptionPaid);
    }

    prevTierRef.current = tier;
  }, [tier]);
```
Note: `subscription_paid` fires on the `→ premium` transition, which is exactly a trial converting to a paid entitlement (or a direct purchase). Because dev builds set `tier` (raw) from real RevenueCat state — not `effectiveTier` — this will not false-fire in `__DEV__` unless a real purchase occurs.

- [ ] **Step 3: Verify types**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 4: Manual verification**

In a **release/preview** build (so real RevenueCat entitlements drive raw `tier`), with a RevenueCat sandbox account:
- Start the free trial from the paywall → confirm `trial_started` fires once in PostHog (not repeatedly on app refresh).
- Let the trial convert / make a purchase → confirm `subscription_paid` fires once.
- Confirm neither event fires spuriously on ordinary app launches in `__DEV__`.

- [ ] **Step 5: Commit**

```bash
git add contexts/SubscriptionContext.tsx
git commit -m "feat: track trial_started and subscription_paid on tier transitions"
```

---

## Post-implementation: build the funnel in PostHog

Not code — configure once in the PostHog UI after events are flowing:

1. **Funnel** (Product Analytics → New Insight → Funnel) with steps:
   `app_installed → aha_plan_ready → paywall_view → trial_started → subscription_paid`.
2. **Retention** insight on `app_opened` (performed event = `app_opened`, cohortized by first `app_installed` or `trial_started`) to read day-1…day-7 engagement — this is your "opened day 2 / day 7" diagnostic for the trial→paid gap.

---

## Self-Review

**Spec coverage:**
- PostHog provider — Task 3 ✓
- `app_installed` (once) — Task 2 (`markInstalledOnce`) + Task 3 ✓
- `app_opened` (launch + foreground) — Task 3 ✓
- `aha_plan_ready` (Save Budgets, once) — Task 4 ✓
- `paywall_view` — Task 4 ✓
- `trial_started` / `subscription_paid` (raw tier, de-duped, dev-safe) — Task 5 ✓
- Identity (UID on auth, reset on logout) — Task 3 (centralized in `_layout.tsx`; improves on the spec's two-file approach) ✓
- Day-2/day-7 as retention over `app_opened` — post-implementation PostHog config ✓
- `lib/analytics.ts` sole SDK owner — Task 2 ✓
- Env convention `EXPO_PUBLIC_POSTHOG_*` + eas.json — Task 1 ✓
- Graceful no-op without key — Task 2 (`posthog` null-guard) ✓
- Native rebuild note — Global Constraints + Task 1 ✓

**Deviation from spec:** identity is centralized in `_layout.tsx` rather than edited into both `AuthContext` files. This is DRY-superior (single call site, covers web+native) and was flagged during brainstorming. The two `AuthContext` files are intentionally NOT in the files-touched list.

**Placeholder scan:** no TBD/TODO; all code steps show full code. API-key placeholders in `.env`/`eas.json` are literal values the user substitutes — acceptable.

**Type consistency:** helper names (`track`, `identifyUser`, `resetAnalytics`, `markInstalledOnce`, `posthog`, `EVENTS`) are identical across Tasks 2–5. `EVENTS` keys used in call sites (`opened`, `installed`, `aha`, `paywallView`, `trialStarted`, `subscriptionPaid`) all exist in the Task 2 definition.
