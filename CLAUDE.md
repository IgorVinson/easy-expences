# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run ios                  # Start iOS simulator
npm run android              # Start Android emulator
npm run web                  # Start web version
npx expo start --clear       # Start with cleared Metro cache

# Code quality
npm run lint                 # ESLint + Prettier check
npm run format               # Auto-fix ESLint + Prettier
npx tsc --noEmit             # TypeScript type check

# Cloud Functions (run from /functions)
cd functions && npm run build    # Compile TypeScript
cd functions && npm run deploy   # Deploy to Firebase
```

## Architecture

**Keelio** — React Native (Expo 54) expense tracker with Firebase backend.

### Routing & Navigation

Expo Router with file-based routing in `app/`. Route groups:

- `(auth)/` — login, signup, forgot-password (no tab bar)
- `(tabs)/` — overview, budget, profile (tab navigation)
- Root `_layout.tsx` handles auth protection via `useSegments()` redirects

### State Management

React Context API only (no Redux/Zustand):

- `AuthContext` — Firebase auth state, login/signup/logout
- `ThemeContext` — dark/light/auto theme with `useTheme()` hook
- `CurrencyContext` — currency selection and locale
- `SubscriptionContext` — premium tier status

### Data Layer

Firebase Firestore with real-time listeners (`onSnapshot`). Custom hooks (`useExpenses`, `useBudget`) provide data access with loading/error states. All documents are isolated by `userId` field enforced in `firestore.rules`.

### Voice Expense Feature

Audio recorded via `expo-av` → base64 sent to Firebase Cloud Function (`functions/src/index.ts`) → processed by Google Gemini API → returns transcript, title, amount, category. Rate-limited per user (5/min, 50/hour, 200/day). Free tier: 15 recordings/month.

### Payments

Stripe via `@stripe/stripe-react-native`. Config in `config/stripe.ts`. `PaywallModal` component gates premium features.

## Key Patterns

### Styling

NativeWind (Tailwind for RN) for layout + theme context for semantic colors:

```tsx
<View className="flex-1 p-4" style={{ backgroundColor: theme.bg }}>
```

Prettier plugin auto-sorts Tailwind classes.

### Firebase Config

Platform-split: `firebaseConfig.js` (web) and `firebaseConfig.native.js` (native).

### i18n

i18next with `react-i18next`. Translations in `locales/`. Device locale detected via `expo-localization`.

## Git Workflow

- Branch from `dev`, not `main`
- Branch naming: `[short-task-name]-oc`
- PRs target `dev` branch
- Only the repo owner merges to `main` and `dev`
