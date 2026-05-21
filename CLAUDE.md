# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start                    # Expo dev server (default — choose ios/android/web from menu)
npm run ios                  # expo run:ios — builds + opens iOS simulator
npm run android              # expo run:android — builds + opens Android emulator/device
npm run web                  # Web build via expo start --web
npm run prebuild             # Regenerate native ios/ and android/ from app.json plugins
npx expo start --clear       # Start with cleared Metro cache (fixes most stale-bundle issues)

# Code quality
npm run lint                 # ESLint + prettier --check on .{js,jsx,ts,tsx,json}
npm run format               # ESLint --fix + prettier --write
npx tsc --noEmit             # TypeScript type check (no test runner is configured)

# Cloud Functions (cd functions/ first; node 22 required)
cd functions && npm run build    # tsc compile to functions/lib
cd functions && npm run deploy   # firebase deploy --only functions
# Local emulator: set FUNCTIONS_EMULATOR=true to bypass voice subscription gating
```

There is **no test runner** in this project — no jest, no vitest, no e2e harness. Manual verification on simulator/device is the only path; do not invent test commands.

## Architecture

**Keelio** (slug `sayspend`, bundle `com.sayspend.app`) — Expo 54 / React Native 0.81 / React 19 expense tracker with Firebase backend, RevenueCat subscriptions, and a Gemini-powered voice-to-expense feature.

### Routing — Expo Router (file-based)

[app/_layout.tsx](app/_layout.tsx) is the auth/onboarding gate. It composes providers in this order (top-down):
`GestureHandlerRootView → AuthProvider → ThemeProvider → CurrencyProvider → SubscriptionProvider → RootLayoutNav`.

Route groups:
- `app/(auth)/` — `login`, `signup`, `forgot-password`. Shown when `user == null`.
- `app/(tabs)/` — `overview`, `goals`, `profile`. The post-auth surface. **There is no separate `budget` tab** — budget categories live inside `goals`/`overview`.
- `app/onboarding.tsx` — shown after first signup; completion is tracked per-user in AsyncStorage under `getOnboardingStorageKey(uid)`, with `LEGACY_ONBOARDING_KEY` migration.

`RootLayoutNav` reads onboarding state fresh from AsyncStorage in each redirect cycle (see comment in `_layout.tsx:36-48`) — do not cache this in component state or you'll re-introduce the stale-state bug it was written to avoid.

### Auth — Firebase Auth, platform-split

Two entry points share the same Firebase config but differ in persistence:
- [firebaseConfig.js](firebaseConfig.js) — web fallback, plain `getAuth`
- [firebaseConfig.native.js](firebaseConfig.native.js) — native, `initializeAuth` with AsyncStorage persistence so sessions survive app restarts

Metro picks the right one via the `.native.js` extension. **Edit both** when changing exports.

There are also two AuthContext variants: [contexts/AuthContext.tsx](contexts/AuthContext.tsx) (web — uses `signInWithPopup`) and `contexts/AuthContext.native.tsx` (native — uses Google Sign-In native SDK). The signup flow intentionally calls `signOut` after `createUserWithEmailAndPassword` and sets `postSignupRedirectPending` so the user lands on login, not directly in-app.

### Data layer — Firestore + real-time hooks

All data access is via `onSnapshot` subscriptions in custom hooks under [hooks/](hooks/):
- `useTransactions(userId)` — single source for both expenses *and* income (unified `transactions` collection, discriminated by `type` field). Exposes derived `expenses`, `income`, `todayExpenses`, `yesterdayExpenses`, `olderExpenses`, `monthlyTotal`, `monthlyIncome`, plus CRUD. **Use `useTransactions`, not a non-existent `useExpenses`.**
- `useBudget(userId)` — budget categories. `spent` is computed client-side by joining transactions against `categoryId` (with a name-based fallback for legacy rows without `categoryId`), respecting each category's `periodStart`.
- `useGoals`, `useUserProfile` — analogous patterns.

Firestore collections (rules in [firestore.rules](firestore.rules)): `users`, `transactions`, `goals`, `budgetCategories`, `monthlyBudgets`, `subscriptions`. **Every doc except `users`/`subscriptions` carries a `userId` field**; the rules deny access to anything where `resource.data.userId != request.auth.uid`. New collections must follow this pattern or rules will reject reads/writes.

Dates are stored as Firestore `Timestamp` and converted to ISO strings at the hook boundary (`docToTransaction` in `useTransactions.ts`).

### Subscriptions — RevenueCat (not Stripe)

**Product model: premium-only, pay-to-use. There is no free tier.** Users either have an active `SaySpend Premium` entitlement (including trial) or they cannot use the app.

[contexts/SubscriptionContext.tsx](contexts/SubscriptionContext.tsx) wraps `react-native-purchases`. Entitlement IDs in RevenueCat:

- `SaySpend Premium` → tier `premium` (or `trial` when `periodType === 'TRIAL'`) — the only tier that grants access
- `SaySpend Pro` → legacy entitlement, mapped to premium for grandfathered users
- `SaySpend Basic` and tier `none` — vestiges of an earlier tiered model still present in the type union, the `determineTier` mapping, and the `BASIC_VOICE_LIMIT = 30` constant. **These code paths exist but should not be reachable under the current product model.** Don't extend basic-tier logic; when touching this area, prefer removing it over adding to it.

API keys come from `EXPO_PUBLIC_RC_API_KEY_IOS` / `EXPO_PUBLIC_RC_API_KEY_ANDROID`. RevenueCat is logged in with the Firebase UID, and tier changes are mirrored to the `subscriptions/{uid}` Firestore doc via `syncTierToFirestore` so the cloud function can enforce server-side limits.

**Dev override**: `effectiveTier` is hardcoded to `'premium'` when `__DEV__` is true (`SubscriptionContext.tsx:140`). All `isPro` / `canUseVoice` checks pass in dev regardless of actual entitlement. Keep this in mind when debugging paywall behavior — test paywall logic in a release/preview build.

The "hard paywall" `TrialExpiredScreen` block in `app/_layout.tsx:62-68` is currently commented out pending RevenueCat product launch. Under the premium-only model this gate is what actually blocks non-paying users from the app — re-enable it when products go live.

### Voice expenses — Gemini via Cloud Function

End-to-end flow:
1. [hooks/useVoiceExpense.ts](hooks/useVoiceExpense.ts) records via `expo-audio` (`MPEG4AAC`, 24kHz mono, 32kbps, 30s hard cap), reads file as base64.
2. Sends to the `processVoiceExpense` callable function with `categories` and `devMode: __DEV__`.
3. [functions/src/index.ts](functions/src/index.ts) enforces three limits in parallel: per-user rate limit (5/min, 50/hour), daily hard limit (200/day), and subscription gate. Audio over 1MB base64 (~45s HIGH_QUALITY) is rejected.
4. Calls Gemini (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-flash-latest` fallback chain) with `responseMimeType: 'application/json'` and `temperature: 0`. The `GEMINI_API_KEY` is a Firebase Functions secret.
5. Returns `{ transcript, title, amount, category }`.

When `devMode === true` AND `FUNCTIONS_EMULATOR === 'true'`, the subscription check is bypassed (`canBypassVoiceSubscriptionInDev`). Rate and daily limits still apply.

### Styling — NativeWind + ThemeContext

NativeWind 4 (Tailwind for RN). Use `className` for layout/spacing and `theme.*` from [contexts/ThemeContext.tsx](contexts/ThemeContext.tsx) for colors so dark/light/auto preference flows through. The app launches in dark mode by default (`themePreference: 'dark'` initial state; `userInterfaceStyle: 'dark'` in `app.json`).

`prettier-plugin-tailwindcss` auto-sorts class names — don't fight it.

### i18n

[i18n.ts](i18n.ts) wires i18next with three locales in [locales/](locales/): `en`, `es`, `ua`. The detector normalizes `uk` → `ua`. User selection is persisted in AsyncStorage under `settings.lang`. Add a key to **all three** JSONs when introducing a new string.

## Conventions worth knowing

- **No barrel/index re-exports** in `components/`, `hooks/`, `contexts/` — import from the specific file.
- **Hooks own their Firestore listener lifecycle** — they all early-return and clear state when `userId` is falsy. Follow that shape for new data hooks.
- **Backward-compat aliases**: `Expense` aliases `Transaction`, `addExpense` aliases `addTransaction({...t, type:'expense'})`. Prefer the transaction-flavored names in new code.
- ESLint flat config based on `eslint-config-expo`, ignores `dist/*` and `functions/**` (functions has its own tsconfig — lint there separately).
- The repo's working branch is `dev`; `main` is the release branch. The git user is the sole maintainer — do not push or open PRs without explicit instruction.
