import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type SubscriptionStore = 'subscriptions' | 'users' | 'local';

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

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'permission-denied'
  );
}

function normalizeSubscription(data?: Partial<SubscriptionInfo> | null): SubscriptionInfo {
  return {
    ...defaultSubscription,
    ...data,
    plan:
      data?.plan === 'pro_monthly' || data?.plan === 'pro_annual' || data?.plan === 'free'
        ? data.plan
        : defaultSubscription.plan,
    subscribedAt: data?.subscribedAt ?? null,
    expiresAt: data?.expiresAt ?? null,
    voiceRecordingsThisMonth:
      typeof data?.voiceRecordingsThisMonth === 'number' ? data.voiceRecordingsThisMonth : 0,
    voiceRecordingsResetMonth:
      typeof data?.voiceRecordingsResetMonth === 'string'
        ? data.voiceRecordingsResetMonth
        : getCurrentMonth(),
  };
}

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

function getLocalSubscriptionKey(userId: string): string {
  return `subscription_${userId}`;
}

// ─── Context ────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>(defaultSubscription);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<SubscriptionStore>('subscriptions');

  // Firestore doc ref for subscription
  const getSubscriptionsRef = useCallback(
    () => (user ? doc(db, 'subscriptions', user.uid) : null),
    [user]
  );

  const saveToUsersDoc = useCallback(
    async (nextSubscription: SubscriptionInfo) => {
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? 'User',
          updatedAt: Date.now(),
          subscription: nextSubscription,
        },
        { merge: true }
      );
    },
    [user]
  );

  const loadFromUsersDoc = useCallback(async (): Promise<SubscriptionInfo> => {
    if (!user) return defaultSubscription;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const profileData = snap.exists() ? snap.data() : {};
    const nestedSubscription = normalizeSubscription(profileData?.subscription);

    if (!snap.exists() || !profileData?.subscription) {
      await saveToUsersDoc(nestedSubscription);
    }

    return nestedSubscription;
  }, [saveToUsersDoc, user]);

  const saveToLocalStorage = useCallback(
    async (nextSubscription: SubscriptionInfo) => {
      if (!user) return;
      await AsyncStorage.setItem(
        getLocalSubscriptionKey(user.uid),
        JSON.stringify(nextSubscription)
      );
    },
    [user]
  );

  const loadFromLocalStorage = useCallback(async (): Promise<SubscriptionInfo> => {
    if (!user) return defaultSubscription;

    const raw = await AsyncStorage.getItem(getLocalSubscriptionKey(user.uid));
    const localSubscription = normalizeSubscription(raw ? JSON.parse(raw) : null);

    if (!raw) {
      await saveToLocalStorage(localSubscription);
    }

    return localSubscription;
  }, [saveToLocalStorage, user]);

  const persistSubscription = useCallback(
    async (nextSubscription: SubscriptionInfo) => {
      if (!user) return;

      if (store === 'local') {
        await saveToLocalStorage(nextSubscription);
        return;
      }

      if (store === 'users') {
        await saveToUsersDoc(nextSubscription);
        return;
      }

      const ref = doc(db, 'subscriptions', user.uid);
      await setDoc(ref, nextSubscription);
    },
    [saveToLocalStorage, saveToUsersDoc, store, user]
  );

  // Load subscription on auth change
  useEffect(() => {
    if (!user) {
      setSubscription(defaultSubscription);
      setLoading(false);
      setStore('subscriptions');
      return;
    }

    const loadSubscription = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'subscriptions', user.uid);
        const snap = await getDoc(ref);

        setStore('subscriptions');

        let data = snap.exists() ? normalizeSubscription(snap.data() as SubscriptionInfo) : { ...defaultSubscription };

        if (!snap.exists()) {
          await setDoc(ref, data);
        }

        const currentMonth = getCurrentMonth();

        if (data.voiceRecordingsResetMonth !== currentMonth) {
          data = {
            ...data,
            voiceRecordingsThisMonth: 0,
            voiceRecordingsResetMonth: currentMonth,
          };
          await setDoc(ref, data);
        }

        if (data.plan !== 'free' && data.expiresAt) {
          const expired = new Date(data.expiresAt) < new Date();
          if (expired) {
            data = { ...data, plan: 'free', expiresAt: null, subscribedAt: null };
            await setDoc(ref, data);
          }
        }

        setSubscription(data);
      } catch (err) {
        if (isPermissionDenied(err)) {
          try {
            setStore('users');
            let data = await loadFromUsersDoc();
            const currentMonth = getCurrentMonth();

            if (data.voiceRecordingsResetMonth !== currentMonth) {
              data = {
                ...data,
                voiceRecordingsThisMonth: 0,
                voiceRecordingsResetMonth: currentMonth,
              };
              await saveToUsersDoc(data);
            }

            if (data.plan !== 'free' && data.expiresAt) {
              const expired = new Date(data.expiresAt) < new Date();
              if (expired) {
                data = { ...data, plan: 'free', expiresAt: null, subscribedAt: null };
                await saveToUsersDoc(data);
              }
            }

            setSubscription(data);
            return;
          } catch (fallbackError) {
            if (isPermissionDenied(fallbackError)) {
              try {
                setStore('local');
                let data = await loadFromLocalStorage();
                const currentMonth = getCurrentMonth();

                if (data.voiceRecordingsResetMonth !== currentMonth) {
                  data = {
                    ...data,
                    voiceRecordingsThisMonth: 0,
                    voiceRecordingsResetMonth: currentMonth,
                  };
                  await saveToLocalStorage(data);
                }

                if (data.plan !== 'free' && data.expiresAt) {
                  const expired = new Date(data.expiresAt) < new Date();
                  if (expired) {
                    data = { ...data, plan: 'free', expiresAt: null, subscribedAt: null };
                    await saveToLocalStorage(data);
                  }
                }

                setSubscription(data);
                return;
              } catch (localFallbackError) {
                console.error(
                  'Failed to load subscription fallback from local storage:',
                  localFallbackError
                );
              }
            } else {
              console.error('Failed to load subscription fallback from users doc:', fallbackError);
            }
          }
        } else {
          console.error('Failed to load subscription:', err);
        }
        setSubscription(defaultSubscription);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [loadFromLocalStorage, loadFromUsersDoc, saveToLocalStorage, saveToUsersDoc, user]);

  const isPro = subscription.plan !== 'free';

  const voiceRecordingsLeft = isPro
    ? Infinity
    : Math.max(0, FREE_VOICE_LIMIT - subscription.voiceRecordingsThisMonth);

  const canUseVoice = isPro || voiceRecordingsLeft > 0;

  const incrementVoiceUsage = useCallback(async () => {
    const currentMonth = getCurrentMonth();

    if (!user) return;

    if (subscription.voiceRecordingsResetMonth !== currentMonth) {
      const nextSubscription = {
        ...subscription,
        voiceRecordingsThisMonth: 1,
        voiceRecordingsResetMonth: currentMonth,
      };
      await persistSubscription(nextSubscription);
      setSubscription(nextSubscription);
      return;
    }

    if (store === 'subscriptions') {
      const ref = getSubscriptionsRef();
      if (!ref) return;

      await updateDoc(ref, {
        voiceRecordingsThisMonth: increment(1),
      });
      setSubscription((prev) => ({
        ...prev,
        voiceRecordingsThisMonth: prev.voiceRecordingsThisMonth + 1,
      }));
    } else {
      const nextSubscription = {
        ...subscription,
        voiceRecordingsThisMonth: subscription.voiceRecordingsThisMonth + 1,
      };
      await persistSubscription(nextSubscription);
      setSubscription(nextSubscription);
    }
  }, [getSubscriptionsRef, persistSubscription, store, subscription, user]);

  // DEV MODE: Instantly activates Pro (no real payment)
  const subscribe = useCallback(
    async (plan: 'pro_monthly' | 'pro_annual') => {
      if (!user) return;

      const now = new Date().toISOString();
      const expiresAt = getExpirationDate(plan);

      const nextSubscription = {
        ...subscription,
        plan,
        subscribedAt: now,
        expiresAt,
      };

      await persistSubscription(nextSubscription);
      setSubscription(nextSubscription);
    },
    [persistSubscription, subscription, user]
  );

  const restorePurchases = useCallback(async () => {
    if (!user) return;

    if (store === 'subscriptions') {
      const ref = getSubscriptionsRef();
      if (!ref) return;

      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSubscription(normalizeSubscription(snap.data() as SubscriptionInfo));
      }
      return;
    }

    const data = store === 'users' ? await loadFromUsersDoc() : await loadFromLocalStorage();
    setSubscription(data);
  }, [getSubscriptionsRef, loadFromLocalStorage, loadFromUsersDoc, store, user]);

  const cancelSubscription = useCallback(async () => {
    const nextSubscription = {
      ...subscription,
      plan: 'free' as PlanType,
      subscribedAt: null,
      expiresAt: null,
    };
    await persistSubscription(nextSubscription);
    setSubscription(nextSubscription);
  }, [persistSubscription, subscription]);

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
