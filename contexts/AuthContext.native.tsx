import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
    GoogleAuthProvider,
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

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [postSignupRedirectPending, setPostSignupRedirectPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
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
    await signOut(auth);
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user found.');
    }

    await deleteCurrentUserAccount(auth.currentUser);
  };

  const googleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || (response as any).idToken;
      if (!idToken) {
        throw new Error('Google Sign-In failed to return an ID token.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
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
