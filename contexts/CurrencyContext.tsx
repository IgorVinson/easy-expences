import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { currencies, normalizeCurrencyCode, SupportedCurrencyCode } from '../config/currencies';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

type CurrencyContextType = {
  currency: SupportedCurrencyCode;
  currencies: typeof currencies;
  loading: boolean;
  setCurrency: (currency: SupportedCurrencyCode) => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

function getLocalCurrencyKey(userId: string) {
  return `settings.currency.${userId}`;
}

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<SupportedCurrencyCode>('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCurrencyState('USD');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadCurrency = async () => {
      setLoading(true);
      const localCurrency = normalizeCurrencyCode(
        await AsyncStorage.getItem(getLocalCurrencyKey(user.uid))
      );

      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        const storedCurrency = normalizeCurrencyCode(snapshot.data()?.currency ?? localCurrency);

        await AsyncStorage.setItem(getLocalCurrencyKey(user.uid), storedCurrency);

        if (!snapshot.exists() || snapshot.data()?.currency !== storedCurrency) {
          await setDoc(
            userRef,
            {
              uid: user.uid,
              email: user.email ?? null,
              displayName: user.displayName ?? 'User',
              currency: storedCurrency,
              createdAt: snapshot.exists()
                ? (snapshot.data()?.createdAt ?? Date.now())
                : Date.now(),
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        }

        if (isMounted) {
          setCurrencyState(storedCurrency);
          setLoading(false);
        }
      } catch (error) {
        console.warn('Falling back to local currency preference:', error);
        if (isMounted) {
          setCurrencyState(localCurrency);
          setLoading(false);
        }
      }
    };

    loadCurrency().catch((error) => {
      console.error('Failed to load currency preference:', error);
      if (isMounted) {
        setCurrencyState('USD');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const setCurrency = useCallback(
    async (nextCurrency: SupportedCurrencyCode) => {
      const normalizedCurrency = normalizeCurrencyCode(nextCurrency);
      setCurrencyState(normalizedCurrency);

      if (!user) {
        return;
      }

      await AsyncStorage.setItem(getLocalCurrencyKey(user.uid), normalizedCurrency);

      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email ?? null,
            displayName: user.displayName ?? 'User',
            currency: normalizedCurrency,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (error) {
        console.warn('Failed to sync currency preference to Firestore:', error);
      }
    },
    [user]
  );

  const value = useMemo(
    () => ({
      currency,
      currencies,
      loading,
      setCurrency,
    }),
    [currency, loading, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
