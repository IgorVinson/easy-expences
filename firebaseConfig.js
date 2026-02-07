import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyBqZpgR4bAvF6bRzsGxFEVVLDGTUu5zcHM',
  authDomain: 'easybudget-9da69.firebaseapp.com',
  projectId: 'easybudget-9da69',
  storageBucket: 'easybudget-9da69.firebasestorage.app',
  messagingSenderId: '953973293469',
  appId: '1:953973293469:web:8652f756186c6a0052af74',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
