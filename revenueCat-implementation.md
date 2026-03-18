# RevenueCat Implementation Plan

## Why

The current subscription system is a **dev-mode placeholder** — `subscribe()` in `SubscriptionContext.tsx` instantly activates Pro with a fake expiration date, no real payment is processed. Stripe is configured but not wired to any payment flow. RevenueCat replaces all of this with real App Store / Google Play subscriptions, handles receipt validation, renewal, and cross-platform sync out of the box.

---

## Current State (What Exists)

| Layer | File | Status |
|-------|------|--------|
| Subscription context | `contexts/SubscriptionContext.tsx` | Mock `subscribe()`, local expiration logic, Firestore persistence with 3-tier fallback |
| Paywall UI | `components/PaywallModal.tsx` | Custom UI with plan selection, feature comparison, i18n |
| Provider tree | `app/_layout.tsx` | `StripeProvider` wraps `SubscriptionProvider` |
| Stripe config | `config/stripe.ts` | Env vars for Stripe keys — **remove** |
| Server-side check | `functions/src/index.ts` | `checkFreeTierLimit()` reads `subscriptions/{userId}` from Firestore |
| Profile display | `app/(tabs)/profile.tsx` | Shows plan, renewal date, recordings left |
| Voice gate | `app/(tabs)/overview.tsx` | `canUseVoice` / `isPro` from `useSubscription()` |
| i18n keys | `locales/en.json` (+ others) | Paywall & profile plan strings |

---

## RevenueCat Configuration

- **API Key (test):** `test_SbnIIdrDAQNSoYgwqVwBbncGMGP`
- **Entitlement:** `SaySpend Pro`
- **Products:** `monthly` ($6.99/mo), `yearly` ($67.10/yr)
- **Offering:** default with `$rc_monthly` and `$rc_annual` packages

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
# Remove Stripe
npm uninstall @stripe/stripe-react-native

# Install RevenueCat
npm install --save react-native-purchases react-native-purchases-ui
```

Update `app.json` — remove the `@stripe/stripe-react-native` plugin entry.

### Step 2: Add Environment Variable

In `.env` (and `.env.example`):
```
EXPO_PUBLIC_RC_API_KEY=test_SbnIIdrDAQNSoYgwqVwBbncGMGP
```

Remove the old Stripe env vars:
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_STRIPE_PRO_PRICE_ID`
- `EXPO_PUBLIC_BACKEND_URL`

### Step 3: Rewrite `contexts/SubscriptionContext.tsx`

Replace the entire context with RevenueCat-powered logic.

**SDK Initialization** — Configure once on mount, log in/out with Firebase UID:
```typescript
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

// On mount (once):
if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_API_KEY! });

// When user logs in:
await Purchases.logIn(user.uid);

// When user logs out:
await Purchases.logOut();
```

**Entitlement check** — Derive `isPro` from RevenueCat, not Firestore:
```typescript
const ENTITLEMENT_ID = 'SaySpend Pro';

const info = await Purchases.getCustomerInfo();
const isPro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
```

**Real-time listener** — Keeps state in sync across purchase, renewal, expiration:
```typescript
useEffect(() => {
  const listener = (info: CustomerInfo) => {
    setIsPro(typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
    setCustomerInfo(info);
    // Sync isPro flag to Firestore for Cloud Function access
    syncProStatusToFirestore(user.uid, !!info.entitlements.active[ENTITLEMENT_ID]);
  };
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}, [user]);
```

**Load offerings** — Fetch available packages for the paywall:
```typescript
const loadOfferings = async () => {
  const offerings = await Purchases.getOfferings();
  setOfferings(offerings);
};
```

**Purchase flow** — Replace mock `subscribe()`:
```typescript
const subscribe = async (pkg: PurchasesPackage) => {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  // isPro updates automatically via listener
};
```

**Restore purchases** — Replace Firestore lookup:
```typescript
const restorePurchases = async () => {
  const customerInfo = await Purchases.restorePurchases();
  // listener updates state
};
```

**Voice tracking stays in Firestore** — RevenueCat handles entitlements; Firestore handles usage counting. The Firestore `subscriptions/{userId}` doc simplifies to:
```typescript
interface VoiceUsage {
  isPro: boolean; // synced from RevenueCat listener
  voiceRecordingsThisMonth: number;
  voiceRecordingsResetMonth: string; // "YYYY-MM"
}
```

**Remove from context:**
- `cancelSubscription()` — users cancel via App Store / Google Play / Customer Center
- `getExpirationDate()`, `normalizeSubscription()` — RevenueCat manages this
- 3-tier storage fallback (subscriptions → users → AsyncStorage) — RevenueCat is source of truth
- `PlanType`, `SubscriptionInfo` types — replace with simpler types
- `PLANS` constant with hardcoded prices — prices come from store via offerings

**New exported interface:**
```typescript
interface SubscriptionContextType {
  isPro: boolean;
  loading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  canUseVoice: boolean;
  voiceRecordingsLeft: number;
  incrementVoiceUsage: () => Promise<void>;
  subscribe: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  presentCustomerCenter: () => Promise<void>;
}
```

### Step 4: Update `app/_layout.tsx`

- Remove `StripeProvider` import and wrapper
- Remove `@stripe/stripe-react-native` import
- `SubscriptionProvider` stays in the same position (it now configures RevenueCat internally)

```tsx
// Before:
<StripeProvider publishableKey={...}>
  <SubscriptionProvider>
    <RootLayoutNav />
  </SubscriptionProvider>
</StripeProvider>

// After:
<SubscriptionProvider>
  <RootLayoutNav />
</SubscriptionProvider>
```

### Step 5: Replace `components/PaywallModal.tsx` with RevenueCat Paywall

Two options — use whichever fits best:

**Option A: RevenueCat Pre-built Paywall (recommended)**

Design the paywall in the RevenueCat dashboard (remote config, A/B testable) and present it with one call:

```typescript
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

// Imperative presentation (e.g., when mic button is tapped):
const showPaywall = async () => {
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: 'SaySpend Pro',
    displayCloseButton: true,
  });
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
};

// Or as a component (embedded in a modal/screen):
<RevenueCatUI.Paywall
  onPurchaseCompleted={() => onClose()}
  onRestoreCompleted={() => onClose()}
  onDismiss={() => onClose()}
/>
```

With this approach, `PaywallModal.tsx` becomes a thin wrapper around `<RevenueCatUI.Paywall />`, or you can call `RevenueCatUI.presentPaywall()` directly and skip the modal entirely.

**Option B: Keep custom PaywallModal UI, wire to RevenueCat**

If you prefer the existing custom design:
- Read prices from `offerings.current.monthly` / `offerings.current.annual` instead of hardcoded `PLANS`
- Pass the selected `PurchasesPackage` to `subscribe(pkg)` instead of a plan string
- Prices from `pkg.product.priceString` (localized by the store)
- Remove `formatCurrencyAmount` for plan prices
- Keep feature comparison table, savings badge, restore button

### Step 6: Update `app/(tabs)/profile.tsx` — Add Customer Center

Replace the "Cancel Subscription" / "Manage Subscription" section with RevenueCat's Customer Center:

```typescript
import RevenueCatUI from 'react-native-purchases-ui';

// In profile screen:
const handleManageSubscription = async () => {
  await RevenueCatUI.presentCustomerCenter();
};
```

Customer Center provides:
- View current plan and renewal date
- Cancel / change plan
- Request refund
- Restore purchases
- All handled by RevenueCat, no custom UI needed

Other profile changes:
- Keep voice recordings display (`voiceRecordingsLeft` / `FREE_VOICE_LIMIT`)
- Show plan name from `customerInfo.entitlements.active['SaySpend Pro']`
- Expiration from `customerInfo.entitlements.active['SaySpend Pro']?.expirationDate`

### Step 7: Update `app/(tabs)/overview.tsx`

Minimal changes — the voice gate logic stays the same via `useSubscription()`:
```typescript
const { canUseVoice, isPro, voiceRecordingsLeft, incrementVoiceUsage } = useSubscription();
```

Only change: when `!canUseVoice`, either open custom PaywallModal or call `RevenueCatUI.presentPaywall()` depending on which paywall approach you chose in Step 5.

### Step 8: Update Cloud Function `functions/src/index.ts`

Simplify `checkFreeTierLimit()` to check the `isPro` boolean that the client syncs to Firestore:

```typescript
async function checkFreeTierLimit(userId: string): Promise<void> {
  const ref = db.collection('subscriptions').doc(userId);
  const snap = await ref.get();

  if (!snap.exists) return; // new user, allow through

  const data = snap.data()!;
  const isPro: boolean = data.isPro === true;

  if (isPro) return;

  const currentMonth = getCurrentMonth();
  const resetMonth: string = data.voiceRecordingsResetMonth ?? currentMonth;
  const count: number = resetMonth === currentMonth ? (data.voiceRecordingsThisMonth ?? 0) : 0;

  if (count >= FREE_VOICE_LIMIT_PER_MONTH) {
    throw new HttpsError(
      'resource-exhausted',
      'Free tier monthly voice limit reached. Upgrade to Pro for unlimited recordings.'
    );
  }
}
```

Remove the old `plan` / `expiresAt` expiration check logic.

**Future enhancement:** Add a RevenueCat webhook → Firebase Cloud Function that writes `isPro` to Firestore on subscription events (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION) for server-authoritative sync instead of relying on the client.

### Step 9: Delete `config/stripe.ts`

No longer needed.

### Step 10: Update `.env.example`

```
# RevenueCat
EXPO_PUBLIC_RC_API_KEY=test_SbnIIdrDAQNSoYgwqVwBbncGMGP
```

### Step 11: Update `locales/*.json`

- Remove `cancelSubscription` key
- Add `manageSubscription` key (for Customer Center button text)
- If using RevenueCat pre-built paywall: paywall i18n keys become unused (RevenueCat handles localization from dashboard)
- If keeping custom paywall: keys stay, just remove hardcoded price references

---

## Files Changed Summary

| File | Action |
|------|--------|
| `contexts/SubscriptionContext.tsx` | **Rewrite** — RevenueCat SDK replaces mock logic |
| `components/PaywallModal.tsx` | **Replace** with RevenueCat Paywall or **Update** to use offerings |
| `app/_layout.tsx` | **Update** — remove StripeProvider |
| `app/(tabs)/profile.tsx` | **Update** — replace cancel button with Customer Center |
| `app/(tabs)/overview.tsx` | **Minor update** — paywall trigger method |
| `functions/src/index.ts` | **Update** — simplify `checkFreeTierLimit()` to check `isPro` boolean |
| `config/stripe.ts` | **Delete** |
| `app.json` | **Update** — remove Stripe plugin |
| `package.json` | **Update** — swap deps |
| `.env` / `.env.example` | **Update** — swap env vars |
| `locales/*.json` | **Minor update** — cancel → manage subscription |

---

## What Stays the Same

- Voice recording counter logic (Firestore-based `voiceRecordingsThisMonth`)
- `FREE_VOICE_LIMIT` constant (15)
- `canUseVoice` / `voiceRecordingsLeft` computation
- `incrementVoiceUsage()` function
- Server-side rate limiting (daily, per-minute, per-hour)
- Auth flow and all non-subscription features

---

## Verification

1. `npx tsc --noEmit` — no type errors
2. `npm run lint` — passes
3. Run on iOS simulator — RevenueCat SDK initializes (check debug logs)
4. Paywall displays offerings from RevenueCat sandbox with correct prices
5. Test sandbox purchase — `SaySpend Pro` entitlement activates, `isPro` becomes true
6. Kill & reopen app — subscription persists (RevenueCat cache)
7. Test restore purchases — works for previously purchased user
8. Test Customer Center — opens from profile, shows subscription details
9. Test voice recording — free user limited to 15, pro user unlimited
10. Test cloud function — free user blocked after 15, pro user passes through
