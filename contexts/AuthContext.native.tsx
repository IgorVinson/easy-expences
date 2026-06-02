import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  GoogleAuthProvider,
  OAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { deleteCurrentUserAccount } from '../utils/accountDeletion';

const SESSION_STARTED_AT_KEY = 'auth_session_started_at';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

const NONCE_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  postSignupRedirectPending: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  finishPostSignupRedirect: () => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  appleSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function persistSessionStart(): Promise<void> {
  await AsyncStorage.setItem(SESSION_STARTED_AT_KEY, String(Date.now()));
}

async function clearSessionStart(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STARTED_AT_KEY);
}

async function isSessionExpired(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(SESSION_STARTED_AT_KEY);

  if (!stored) {
    await persistSessionStart();
    return false;
  }

  const startedAt = Number(stored);
  if (!Number.isFinite(startedAt)) {
    await persistSessionStart();
    return false;
  }

  return Date.now() - startedAt > SESSION_MAX_AGE_MS;
}

function generateNonce(length = 32): string {
  const randomValues = Crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (value) => NONCE_CHARSET[value % NONCE_CHARSET.length]).join('');
}

function buildAppleDisplayName(
  fullName?: AppleAuthentication.AppleAuthenticationFullName | null
): string | null {
  const parts = [fullName?.givenName, fullName?.familyName]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' ') : null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [postSignupRedirectPending, setPostSignupRedirectPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const expired = await isSessionExpired();
        if (expired) {
          await clearSessionStart();
          await signOut(auth);
          await GoogleSignin.signOut().catch(() => {});
          setUser(null);
          return;
        }

        setUser(user);
      } catch (error) {
        console.error('Auth session check failed:', error);
        setUser(user);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    await persistSessionStart();
  };

  const signup = async (email: string, password: string, name: string) => {
    setPostSignupRedirectPending(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await signOut(auth);
    } catch (error) {
      setPostSignupRedirectPending(false);
      throw error;
    }
  };

  const finishPostSignupRedirect = () => {
    setPostSignupRedirectPending(false);
  };

  const logout = async () => {
    await clearSessionStart();
    await signOut(auth);
    await GoogleSignin.signOut().catch(() => {});
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user found.');
    }

    await deleteCurrentUserAccount(auth.currentUser);
    await clearSessionStart();
    await GoogleSignin.signOut().catch(() => {});
  };

  const googleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut().catch(() => {});
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || (response as any).idToken;
      if (!idToken) {
        throw new Error('Google Sign-In failed to return an ID token.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      await persistSessionStart();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const appleSignIn = async () => {
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device.');
      }

      const rawNonce = generateNonce();
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Apple Sign-In failed to return an identity token.');
      }

      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce,
      });

      const result = await signInWithCredential(auth, firebaseCredential);
      const displayName = buildAppleDisplayName(credential.fullName);

      if (displayName && !result.user.displayName) {
        await updateProfile(result.user, { displayName });
      }

      await persistSessionStart();
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        postSignupRedirectPending,
        login,
        signup,
        finishPostSignupRedirect,
        logout,
        deleteAccount,
        googleSignIn,
        appleSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
