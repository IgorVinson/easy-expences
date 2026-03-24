# RevenueCat Production Key Setup

## Overview
Currently using a test key (`test_...`). Production requires separate keys per platform (iOS/Android).

**Code to change:** `contexts/SubscriptionContext.tsx:68`
```ts
// Before (single test key):
Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_API_KEY! });

// After (platform-specific production keys):
import { Platform } from 'react-native';
const apiKey = Platform.OS === 'ios'
  ? process.env.EXPO_PUBLIC_RC_API_KEY_IOS!
  : process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID!;
Purchases.configure({ apiKey });
```

---

## 1. RevenueCat Dashboard — Get API Keys
Go to **RevenueCat Dashboard → Project → API Keys**
- Copy the **iOS public SDK key** (starts with `appl_`)
- Copy the **Android public SDK key** (starts with `goog_`)

## 2. Set Up Entitlement (if not done)
In RevenueCat: **Entitlements → + New** → ID must be exactly: `SaySpend Pro`

## 3. Set Up Products & Offerings
**App Store Connect (iOS):**
- Create subscription product, copy the product ID
- Submit for review if needed

**Google Play Console (Android):**
- Create subscription product, copy the product ID

**RevenueCat → Products → Add** both product IDs
**RevenueCat → Offerings → + New** → attach products to packages

## 4. Update `.env`
```
EXPO_PUBLIC_RC_API_KEY_IOS=appl_...
EXPO_PUBLIC_RC_API_KEY_ANDROID=goog_...
```
Remove or keep the old `EXPO_PUBLIC_RC_API_KEY` (unused after code change).

## 5. Add EAS Secrets
```bash
eas secret:create --name EXPO_PUBLIC_RC_API_KEY_IOS --value "appl_..."
eas secret:create --name EXPO_PUBLIC_RC_API_KEY_ANDROID --value "goog_..."
```

## 6. Rebuild
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```
