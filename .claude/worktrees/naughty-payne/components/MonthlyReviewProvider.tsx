import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../hooks/useBudget';
import { MonthlyReviewModal } from './MonthlyReviewModal';

export function MonthlyReviewProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { categories, resetAllCategories, loading } = useBudget(user?.uid);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function checkMonthlyReview() {
      if (!user || loading || categories.length === 0) return;

      const now = new Date();
      // Format: "2026-11"
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      try {
        const lastReviewedMonth = await AsyncStorage.getItem(`lastReview_${user.uid}`);
        
        if (lastReviewedMonth !== currentMonthKey) {
          setShowModal(true);
        }
      } catch (e) {
        console.error('Failed to read AsyncStorage for monthly review', e);
      }
    }

    checkMonthlyReview();
  }, [user, loading, categories.length]);

  async function handleSaveReview(newBudgets: Record<string, number>) {
    await resetAllCategories(newBudgets);
    
    // Save to AsyncStorage so it doesn't prompt again this month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    if (user?.uid) {
      await AsyncStorage.setItem(`lastReview_${user.uid}`, currentMonthKey);
    }
    
    setShowModal(false);
  }

  return (
    <>
      {children}
      <MonthlyReviewModal
        visible={showModal}
        categories={categories}
        onSave={handleSaveReview}
      />
    </>
  );
}