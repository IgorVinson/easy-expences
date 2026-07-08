# Funnel Analytics (PostHog) — Design

**Date:** 2026-07-08
**Status:** Approved, pending implementation plan
**App:** Keelio (Expo 54 / RN 0.81, `expo-dev-client`)

## Goal

Instrument the acquisition→revenue funnel so we can diagnose *where* users drop
and *why*. The core diagnostic split:

- `install → aha` — did they get through onboarding setup? (top-of-funnel / onboarding problem)
- `aha → paywall_view` — did they reach the ask?
- `paywall_view → trial` — paywall conversion (value/price problem)
- `trial → paid` — trial conversion, diagnosed via retention (engagement vs. price)

The **aha** event is the pivot: it separates "installs but no trial" into an
onboarding problem vs. a paywall problem. It fires at the value-reveal moment
(personalized plan shown), which must be **before** the paywall for the split to work.

## Provider

**PostHog** (`posthog-react-native`). Chosen for its purpose-built funnel +
retention UI, generous free tier, and Expo config-plugin support. Native module —
works with `expo-dev-client`, requires a native rebuild (won't appear on a
JS-only reload).

## Events

| Event | Fires when | Location |
|---|---|---|
| `app_installed` | First-ever launch only (guarded by AsyncStorage flag) | `lib/analytics.ts`, called from `app/_layout.tsx` |
| `app_opened` | Every launch + every foreground (`AppState` → `active`) | `app/_layout.tsx` AppState listener |
| `aha_plan_ready` | User taps **"Save Budgets"** (Screen5) and personalized plan is shown; once per user | `app/onboarding.tsx` Screen5 handler |
| `paywall_view` | Paywall screen (`Screen8`) mounts | `app/onboarding.tsx` Screen8 |
| `trial_started` | Raw `tier` transitions `none → trial` | `contexts/SubscriptionContext.tsx` listener |
| `subscription_paid` | Raw `tier` transitions into `premium` (non-trial active entitlement) | `contexts/SubscriptionContext.tsx` listener |

### Day-N retention (NOT events)

"Opened day 2 / day 7" are **PostHog retention views over `app_opened`**, not
discrete events. The trial is 7 days, so we want visibility into days 1–7, not
just two hardcoded days. Retention diagnoses the trial→paid gap:

- **Day 2 open** = *activation* — strongest predictor of trial→paid. No return ⇒ engagement problem.
- **Day 7 open** = *engaged at the decision point* — active but not converting ⇒ price/value problem.

No client-side "is it day N?" math. One `app_opened` event powers all of it.

## Identity

- **Pre-auth:** anonymous PostHog device ID (powers `app_installed` / `app_opened`).
- **On auth:** `posthog.identify(firebaseUid)` inside `onAuthStateChanged` in
  **both** `contexts/AuthContext.native.tsx` and `contexts/AuthContext.tsx` (web).
  Signup precedes onboarding, so `aha_plan_ready` onward is tied to the person.
- **RevenueCat join:** RC `appUserID` is already the Firebase UID; set it as a
  PostHog person property so RC-side trial/paid data joins cleanly.
- **On sign-out:** `posthog.reset()`.

## Module boundary — `lib/analytics.ts`

The **only** file that imports `posthog-react-native`. Thin wrapper; every call
site imports from here. Matches repo conventions (no barrels, import from
specific file, thin wrappers around SDKs).

```
initAnalytics()          // configure client at startup
track(event, props?)     // generic event emit
identifyUser(uid)        // posthog.identify(uid)
resetAnalytics()         // posthog.reset() on sign-out
markInstalledOnce()      // fires app_installed exactly once (AsyncStorage guard)
```

AsyncStorage keys (namespaced under existing `settings.*` / new `analytics.*`):
- `analytics.installed` — install-once guard
- `analytics.ahaFired` — aha-once guard (per user; keyed by uid or stored in profile)

## Critical correctness notes

1. **Use RAW `tier`, never `effectiveTier`.** `effectiveTier` is hardcoded
   `'premium'` in `__DEV__` (`SubscriptionContext.tsx:139`). Using it would fire
   `subscription_paid` on every dev launch and pollute the data.
2. **De-dupe tier transitions.** The RC real-time listener re-fires on
   renewals/refreshes. Track previous raw tier in a ref; emit only on an actual
   `none→trial` / `→premium` change.
3. **`aha_plan_ready` fires once per user.** Re-editing budgets must not re-fire.
4. **`app_installed` fires once ever**, guarded before any `app_opened`.

## Config & setup

- Add `posthog-react-native` (+ Expo-compatible peer deps). Native rebuild
  required (`npm run prebuild` + new dev build).
- Wrap app in `PostHogProvider` in `app/_layout.tsx`, above `AuthProvider` so the
  client is ready before `identify`.
- Env vars (match `EXPO_PUBLIC_RC_*` convention):
  `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`. Wire into `eas.json`
  build profiles.
- Create a PostHog project to obtain the key.

## Verification

No test runner exists in this repo. Verify manually on a dev build:
confirm each event appears in PostHog's live event feed with the correct
distinct_id (anonymous pre-auth, firebase uid post-auth), and that
`subscription_paid` does **not** fire in `__DEV__`.

## Files touched

- **New:** `lib/analytics.ts`
- **Edit:** `app/_layout.tsx`, `contexts/AuthContext.native.tsx`,
  `contexts/AuthContext.tsx`, `contexts/SubscriptionContext.tsx`,
  `app/onboarding.tsx`, `package.json`, `eas.json` (+ `.env` example)

## Out of scope

- Autocapture / screen tracking (funnel events only for now)
- Server-side event forwarding
- A/B experimentation
