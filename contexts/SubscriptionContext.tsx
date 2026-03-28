import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

// ─── Constants ──────────────────────────────────────────────────────────────

const ENTITLEMENT_BASIC = 'SaySpend Basic';
const ENTITLEMENT_PREMIUM = 'SaySpend Premium';
// Legacy entitlement — maps existing Pro users to Premium tier
const ENTITLEMENT_LEGACY_PRO = 'SaySpend Pro';

export const BASIC_VOICE_LIMIT = 30;

export type SubscriptionTier = 'none' | 'trial' | 'basic' | 'premium';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubscriptionContextType {
  tier: SubscriptionTier;
  /** @deprecated Use `tier === 'premium' || tier === 'trial'` instead */
  isPro: boolean;
  loading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  canUseVoice: boolean;
  voiceRecordingsLeft: number;
  trialDaysLeft: number;
  isTrialExpired: boolean;
  incrementVoiceUsage: () => Promise<void>;
  subscribe: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  presentCustomerCenter: () => Promise<void>;
  redeemPromoCode: (code: string) => Promise<void>;
}

interface VoiceUsage {
  voiceRecordingsThisMonth: number;
  voiceRecordingsResetMonth: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function determineTier(info: CustomerInfo): SubscriptionTier {
  const premiumEnt = info.entitlements.active[ENTITLEMENT_PREMIUM];
  const legacyProEnt = info.entitlements.active[ENTITLEMENT_LEGACY_PRO];
  const basicEnt = info.entitlements.active[ENTITLEMENT_BASIC];

  const activeEnt = premiumEnt ?? legacyProEnt;

  if (activeEnt) {
    if (activeEnt.periodType === 'TRIAL') return 'trial';
    return 'premium';
  }
  if (basicEnt) return 'basic';
  return 'none';
}

function getTrialDaysLeft(info: CustomerInfo): number {
  const premiumEnt = info.entitlements.active[ENTITLEMENT_PREMIUM]
    ?? info.entitlements.active[ENTITLEMENT_LEGACY_PRO];
  if (!premiumEnt || premiumEnt.periodType !== 'TRIAL') return 0;
  if (!premiumEnt.expirationDate) return 0;
  const expDate = new Date(premiumEnt.expirationDate);
  const now = new Date();
  return Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

async function syncTierToFirestore(userId: string, tier: SubscriptionTier): Promise<void> {
  const ref = doc(db, 'subscriptions', userId);
  await setDoc(ref, {
    tier,
    isPro: tier === 'premium' || tier === 'trial',
  }, { merge: true });
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('none');
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [voiceUsage, setVoiceUsage] = useState<VoiceUsage>({
    voiceRecordingsThisMonth: 0,
    voiceRecordingsResetMonth: getCurrentMonth(),
  });

  const isPro = tier === 'premium' || tier === 'trial';
  const isTrialExpired = tier === 'none';

  // Configure RevenueCat once on mount
  useEffect(() => {
    try {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_RC_API_KEY_IOS!
        : process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID!;
      Purchases.configure({ apiKey });
    } catch (err) {
      console.warn('RevenueCat configure failed (not supported in Expo Go):', err);
    }
  }, []);

  // Login/logout with Firebase UID, load customer info + voice usage, attach real-time listener
  useEffect(() => {
    if (!user) {
      Purchases.isAnonymous().then((anon) => { if (!anon) Purchases.logOut().catch(() => {}); }).catch(() => {});
      setTier('none');
      setCustomerInfo(null);
      setLoading(false);
      return;
    }

    let removed = false;

    const init = async () => {
      setLoading(true);
      try {
        // ── RevenueCat ───────────────────────────────────────────────────────
        await Purchases.logIn(user.uid);

        const info = await Purchases.getCustomerInfo();
        const detectedTier = determineTier(info);
        setTier(detectedTier);
        setCustomerInfo(info);
        setTrialDaysLeft(getTrialDaysLeft(info));

        syncTierToFirestore(user.uid, detectedTier).catch((e) =>
          console.warn('syncTier failed:', e)
        );

        const offs = await Purchases.getOfferings();
        setOfferings(offs);
      } catch (err) {
        console.error('RevenueCat init error:', err);
      }

      // ── Voice usage (Firestore) — independent of RC ──────────────────────
      try {
        const voiceRef = doc(db, 'subscriptions', user.uid);
        const voiceSnap = await getDoc(voiceRef);
        const currentMonth = getCurrentMonth();

        if (!voiceSnap.exists()) {
          const initial: VoiceUsage = {
            voiceRecordingsThisMonth: 0,
            voiceRecordingsResetMonth: currentMonth,
          };
          await setDoc(voiceRef, initial, { merge: true });
          setVoiceUsage(initial);
        } else {
          const data = voiceSnap.data();
          const resetMonth: string = data.voiceRecordingsResetMonth ?? currentMonth;
          if (resetMonth !== currentMonth) {
            const reset: VoiceUsage = {
              voiceRecordingsThisMonth: 0,
              voiceRecordingsResetMonth: currentMonth,
            };
            await setDoc(voiceRef, reset, { merge: true });
            setVoiceUsage(reset);
          } else {
            setVoiceUsage({
              voiceRecordingsThisMonth: data.voiceRecordingsThisMonth ?? 0,
              voiceRecordingsResetMonth: resetMonth,
            });
          }
        }
      } catch (err) {
        console.error('Voice usage load error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Real-time listener — keeps tier in sync across purchase, renewal, expiration
    const listener = (info: CustomerInfo) => {
      if (removed) return;
      const detectedTier = determineTier(info);
      setTier(detectedTier);
      setCustomerInfo(info);
      setTrialDaysLeft(getTrialDaysLeft(info));
      syncTierToFirestore(user.uid, detectedTier).catch(console.error);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      removed = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [user]);

  const voiceRecordingsLeft = (tier === 'premium' || tier === 'trial')
    ? Infinity
    : tier === 'basic'
      ? Math.max(0, BASIC_VOICE_LIMIT - voiceUsage.voiceRecordingsThisMonth)
      : 0;

  const canUseVoice = tier === 'premium' || tier === 'trial' || (tier === 'basic' && voiceRecordingsLeft > 0);

  const incrementVoiceUsage = useCallback(async () => {
    if (!user) return;
    const currentMonth = getCurrentMonth();
    const ref = doc(db, 'subscriptions', user.uid);

    if (voiceUsage.voiceRecordingsResetMonth !== currentMonth) {
      const next: VoiceUsage = {
        voiceRecordingsThisMonth: 1,
        voiceRecordingsResetMonth: currentMonth,
      };
      await setDoc(ref, next, { merge: true });
      setVoiceUsage(next);
      return;
    }

    await updateDoc(ref, { voiceRecordingsThisMonth: increment(1) });
    setVoiceUsage((prev) => ({
      ...prev,
      voiceRecordingsThisMonth: prev.voiceRecordingsThisMonth + 1,
    }));
  }, [user, voiceUsage]);

  const subscribe = useCallback(async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pkg);
      const newTier = determineTier(updatedInfo);
      setTier(newTier);
      setCustomerInfo(updatedInfo);
      setTrialDaysLeft(getTrialDaysLeft(updatedInfo));
      if (user) {
        syncTierToFirestore(user.uid, newTier).catch(console.error);
      }
    } catch (err: any) {
      // Product already owned — user has an active subscription; sync state instead of throwing
      if (err?.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
        const info = await Purchases.getCustomerInfo();
        const newTier = determineTier(info);
        setTier(newTier);
        setCustomerInfo(info);
        setTrialDaysLeft(getTrialDaysLeft(info));
        if (user) {
          syncTierToFirestore(user.uid, newTier).catch(console.error);
        }
        return;
      }
      throw err;
    }
  }, [user]);

  const restorePurchases = useCallback(async () => {
    const updatedInfo = await Purchases.restorePurchases();
    const newTier = determineTier(updatedInfo);
    setTier(newTier);
    setCustomerInfo(updatedInfo);
    setTrialDaysLeft(getTrialDaysLeft(updatedInfo));
    if (user) {
      syncTierToFirestore(user.uid, newTier).catch(console.error);
    }
  }, [user]);

  const presentCustomerCenter = useCallback(async () => {
    await RevenueCatUI.presentCustomerCenter();
  }, []);

  const redeemPromoCode = useCallback(async (_code: string) => {
    if (Platform.OS === 'android') {
      // @ts-expect-error — redeemCode is available on Android
      await Purchases.redeemCode(_code);
    } else {
      // iOS: Open system redemption sheet (iOS 14+)
      await Purchases.presentCodeRedemptionSheet();
    }
    const info = await Purchases.getCustomerInfo();
    const newTier = determineTier(info);
    setTier(newTier);
    setCustomerInfo(info);
    setTrialDaysLeft(getTrialDaysLeft(info));
    if (user) {
      syncTierToFirestore(user.uid, newTier).catch(console.error);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        isPro,
        loading,
        customerInfo,
        offerings,
        canUseVoice,
        voiceRecordingsLeft,
        trialDaysLeft,
        isTrialExpired,
        incrementVoiceUsage,
        subscribe,
        restorePurchases,
        presentCustomerCenter,
        redeemPromoCode,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
