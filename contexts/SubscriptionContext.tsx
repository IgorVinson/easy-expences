import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

// ─── Constants ──────────────────────────────────────────────────────────────

const ENTITLEMENT_ID = 'SaySpend Pro';
export const FREE_VOICE_LIMIT = 15;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubscriptionContextType {
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

interface VoiceUsage {
  voiceRecordingsThisMonth: number;
  voiceRecordingsResetMonth: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function syncProStatusToFirestore(userId: string, isPro: boolean): Promise<void> {
  const ref = doc(db, 'subscriptions', userId);
  await setDoc(ref, { isPro }, { merge: true });
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [voiceUsage, setVoiceUsage] = useState<VoiceUsage>({
    voiceRecordingsThisMonth: 0,
    voiceRecordingsResetMonth: getCurrentMonth(),
  });

  // Configure RevenueCat once on mount
  useEffect(() => {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_API_KEY! });
  }, []);

  // Login/logout with Firebase UID, load customer info + voice usage, attach real-time listener
  useEffect(() => {
    if (!user) {
      Purchases.logOut().catch(() => {});
      setIsPro(false);
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
        const proActive = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        setIsPro(proActive);
        setCustomerInfo(info);

        // Best-effort sync to Firestore — Cloud Function reads this field.
        // Do not let a Firestore permission error abort the rest of init.
        syncProStatusToFirestore(user.uid, proActive).catch((e) =>
          console.warn('syncProStatus failed:', e)
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

    // Real-time listener — keeps isPro in sync across purchase, renewal, expiration
    const listener = (info: CustomerInfo) => {
      if (removed) return;
      const proActive = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPro(proActive);
      setCustomerInfo(info);
      syncProStatusToFirestore(user.uid, proActive).catch(console.error);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      removed = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [user]);

  const voiceRecordingsLeft = isPro
    ? Infinity
    : Math.max(0, FREE_VOICE_LIMIT - voiceUsage.voiceRecordingsThisMonth);

  const canUseVoice = isPro || voiceRecordingsLeft > 0;

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
    await Purchases.purchasePackage(pkg);
    // isPro updates automatically via the real-time listener
  }, []);

  const restorePurchases = useCallback(async () => {
    await Purchases.restorePurchases();
    // listener updates state
  }, []);

  const presentCustomerCenter = useCallback(async () => {
    await RevenueCatUI.presentCustomerCenter();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        loading,
        customerInfo,
        offerings,
        canUseVoice,
        voiceRecordingsLeft,
        incrementVoiceUsage,
        subscribe,
        restorePurchases,
        presentCustomerCenter,
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
