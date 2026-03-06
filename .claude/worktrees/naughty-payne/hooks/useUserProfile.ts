import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string | null;
  currency: string;
  monthlyBudgetLimit: number;
  notificationsEnabled: boolean;
  plan: 'free' | 'pro';
  planExpiresAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export const defaultProfile: Omit<UserProfile, 'uid' | 'email'> = {
  displayName: 'User',
  currency: 'USD',
  monthlyBudgetLimit: 1000,
  notificationsEnabled: true,
  plan: 'free',
  planExpiresAt: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const createUserProfile = async (
  uid: string,
  email: string | null,
  displayName: string | null
): Promise<UserProfile> => {
  try {
    const newProfile: UserProfile = {
      ...defaultProfile,
      uid,
      email,
      displayName: displayName || defaultProfile.displayName,
    };
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};