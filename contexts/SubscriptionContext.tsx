import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanType = 'free' | 'pro_monthly' | 'pro_annual';

export interface SubscriptionInfo {
  plan: PlanType;
  subscribedAt: string | null;   // ISO date
  expiresAt: string | null;      // ISO date
  voiceRecordingsThisMonth: number;
  voiceRecordingsResetMonth: string; // "YYYY-MM"
}

export interface SubscriptionContextType {
  isPro: boolean;
  subscription: SubscriptionInfo;
  loading: boolean;
  voiceRecordingsLeft: number;
  canUseVoice: boolean;
  incrementVoiceUsage: () => Promise<void>;
  subscribe: (plan: 'pro_monthly' | 'pro_annual') => Promise<void>;
  restorePurchases: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const FREE_VOICE_LIMIT = 5;
const PLANS = {
  pro_monthly: { price: 6.99, label: '$6.99/mo' },
  pro_annual: { price: 67.10, label: '$67.10/yr' },
} as const;

export { FREE_VOICE_LIMIT, PLANS };

// ─── Defaults ───────────────────────────────────────────────────────────────

const defaultSubscription: SubscriptionInfo = {
  plan: 'free',
  subscribedAt: null,
  expiresAt: null,
  voiceRecordingsThisMonth: 0,
  voiceRecordingsResetMonth: getCurrentMonth(),
};

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getExpirationDate(plan: 'pro_monthly' | 'pro_annual'): string {
  const now = new Date();
  if (plan === 'pro_monthly') {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now.toISOString();
}

// ─── Context ────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>(defaultSubscription);
  const [loading, setLoading] = useState(true);

  // Firestore doc ref for subscription
  const getSubDocRef = useCallback(
    () => (user ? doc(db, 'subscriptions', user.uid) : null),
    [user]
  );

  // Load subscription on auth change
  useEffect(() => {
    if (!user) {
      setSubscription(defaultSubscription);
      setLoading(false);
      return;
    }

    const loadSubscription = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'subscriptions', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as SubscriptionInfo;
          const currentMonth = getCurrentMonth();

          // Reset voice counter if we're in a new month
          if (data.voiceRecordingsResetMonth !== currentMonth) {
            await updateDoc(ref, {
              voiceRecordingsThisMonth: 0,
              voiceRecordingsResetMonth: currentMonth,
            });
            data.voiceRecordingsThisMonth = 0;
            data.voiceRecordingsResetMonth = currentMonth;
          }

          // Check if subscription expired
          if (data.plan !== 'free' && data.expiresAt) {
            const expired = new Date(data.expiresAt) < new Date();
            if (expired) {
              await updateDoc(ref, { plan: 'free', expiresAt: null, subscribedAt: null });
              data.plan = 'free';
              data.expiresAt = null;
              data.subscribedAt = null;
            }
          }

          setSubscription(data);
        } else {
          // Create default subscription doc
          const defaultSub = { ...defaultSubscription };
          await setDoc(ref, defaultSub);
          setSubscription(defaultSub);
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
        setSubscription(defaultSubscription);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  const isPro = subscription.plan !== 'free';

  const voiceRecordingsLeft = isPro
    ? Infinity
    : Math.max(0, FREE_VOICE_LIMIT - subscription.voiceRecordingsThisMonth);

  const canUseVoice = isPro || voiceRecordingsLeft > 0;

  const incrementVoiceUsage = useCallback(async () => {
    const ref = getSubDocRef();
    if (!ref) return;

    const currentMonth = getCurrentMonth();

    // If month rolled over, reset first
    if (subscription.voiceRecordingsResetMonth !== currentMonth) {
      await updateDoc(ref, {
        voiceRecordingsThisMonth: 1,
        voiceRecordingsResetMonth: currentMonth,
      });
      setSubscription((prev) => ({
        ...prev,
        voiceRecordingsThisMonth: 1,
        voiceRecordingsResetMonth: currentMonth,
      }));
    } else {
      await updateDoc(ref, {
        voiceRecordingsThisMonth: increment(1),
      });
      setSubscription((prev) => ({
        ...prev,
        voiceRecordingsThisMonth: prev.voiceRecordingsThisMonth + 1,
      }));
    }
  }, [getSubDocRef, subscription.voiceRecordingsResetMonth]);

  // DEV MODE: Instantly activates Pro (no real payment)
  const subscribe = useCallback(
    async (plan: 'pro_monthly' | 'pro_annual') => {
      const ref = getSubDocRef();
      if (!ref) return;

      const now = new Date().toISOString();
      const expiresAt = getExpirationDate(plan);

      const update = {
        plan,
        subscribedAt: now,
        expiresAt,
      };

      await updateDoc(ref, update);
      setSubscription((prev) => ({ ...prev, ...update }));
    },
    [getSubDocRef]
  );

  const restorePurchases = useCallback(async () => {
    // In dev mode, just re-read from Firestore
    const ref = getSubDocRef();
    if (!ref) return;

    const snap = await getDoc(ref);
    if (snap.exists()) {
      setSubscription(snap.data() as SubscriptionInfo);
    }
  }, [getSubDocRef]);

  const cancelSubscription = useCallback(async () => {
    const ref = getSubDocRef();
    if (!ref) return;

    const update = { plan: 'free' as PlanType, subscribedAt: null, expiresAt: null };
    await updateDoc(ref, update);
    setSubscription((prev) => ({ ...prev, ...update }));
  }, [getSubDocRef]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        subscription,
        loading,
        voiceRecordingsLeft,
        canUseVoice,
        incrementVoiceUsage,
        subscribe,
        restorePurchases,
        cancelSubscription,
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
