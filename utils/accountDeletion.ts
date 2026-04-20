import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteUser, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { LEGACY_ONBOARDING_KEY, getOnboardingStorageKey } from './onboarding';

export const ACCOUNT_DELETION_FAREWELL_KEY = 'account_deletion_farewell';

const USER_OWNED_COLLECTIONS = ['transactions', 'goals', 'budgetCategories'] as const;
const DELETE_BATCH_LIMIT = 400;
const RECENT_LOGIN_WINDOW_MS = 10 * 60 * 1000;

function getCurrencyStorageKey(userId: string) {
  return `settings.currency.${userId}`;
}

function assertRecentLogin(user: User) {
  const lastSignInTime = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).getTime()
    : 0;

  if (!lastSignInTime || Date.now() - lastSignInTime > RECENT_LOGIN_WINDOW_MS) {
    const error = new Error('Recent login required to delete this account.');
    (error as Error & { code?: string }).code = 'auth/requires-recent-login';
    throw error;
  }
}

async function deleteCollectionDocsByUserId(collectionName: string, userId: string) {
  const snapshot = await getDocs(query(collection(db, collectionName), where('userId', '==', userId)));

  if (snapshot.empty) {
    return;
  }

  for (let index = 0; index < snapshot.docs.length; index += DELETE_BATCH_LIMIT) {
    const batch = writeBatch(db);
    const docsChunk = snapshot.docs.slice(index, index + DELETE_BATCH_LIMIT);

    docsChunk.forEach((snapshotDoc) => {
      batch.delete(snapshotDoc.ref);
    });

    await batch.commit();
  }
}

export async function deleteCurrentUserAccount(user: User) {
  assertRecentLogin(user);

  await Promise.all(USER_OWNED_COLLECTIONS.map((name) => deleteCollectionDocsByUserId(name, user.uid)));

  await Promise.all([
    deleteDoc(doc(db, 'users', user.uid)),
    deleteDoc(doc(db, 'subscriptions', user.uid)),
    AsyncStorage.multiRemove([
      getOnboardingStorageKey(user.uid),
      LEGACY_ONBOARDING_KEY,
      getCurrencyStorageKey(user.uid),
    ]),
  ]);

  await deleteUser(user);
  await AsyncStorage.setItem(ACCOUNT_DELETION_FAREWELL_KEY, 'true');
}
