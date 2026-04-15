import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebaseConfig';
import { useTransactions } from './useTransactions';
import { BudgetCategory, NewBudgetCategory } from '../types';

function getCurrentMonthStartIso() {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBudget(userId: string | null | undefined) {
  const [storedCategories, setStoredCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { expenses } = useTransactions(userId);

  // ─── Real-time listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setStoredCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(collection(db, 'budgetCategories'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: BudgetCategory[] = snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? '',
          budget: d.data().budget ?? 0,
          spent: d.data().spent ?? 0,
          periodStart: d.data().periodStart ?? getCurrentMonthStartIso(),
          icon: d.data().icon ?? 'cash',
          colorLight: d.data().colorLight ?? '#E2E8F0',
          colorDark: d.data().colorDark ?? '#94A3B8',
          userId: d.data().userId,
        }));

        setStoredCategories(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useBudget] Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  /** Add a new budget category */
  async function addCategory(category: NewBudgetCategory) {
    if (!userId) throw new Error('Not authenticated');
    await addDoc(collection(db, 'budgetCategories'), {
      ...category,
      spent: 0,
      periodStart: getCurrentMonthStartIso(),
      userId,
    });
  }

  /** Update a category's budget limit or other fields */
  async function updateCategory(
    id: string,
    changes: Partial<Omit<BudgetCategory, 'id' | 'userId'>>
  ) {
    await updateDoc(doc(db, 'budgetCategories', id), changes);
  }

  /** Delete a category */
  async function deleteCategory(id: string) {
    await deleteDoc(doc(db, 'budgetCategories', id));
  }

  /**
   * Reset all categories `spent` to 0 and apply new budgets.
   * Useful for monthly rollover.
   */
  async function resetAllCategories(newBudgets: Record<string, number>) {
    if (!userId) throw new Error('Not authenticated');

    const nextPeriodStart = new Date().toISOString();
    const promises = storedCategories.map((cat) => {
      const newLimit = newBudgets[cat.id] ?? cat.budget;
      return updateDoc(doc(db, 'budgetCategories', cat.id), {
        spent: 0,
        budget: newLimit,
        periodStart: nextPeriodStart,
      });
    });

    await Promise.all(promises);
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const categories = useMemo(
    () =>
      storedCategories.map((category) => {
        const periodStartTime = new Date(
          category.periodStart ?? getCurrentMonthStartIso()
        ).getTime();
        const spent = expenses.reduce((sum, expense) => {
          const expenseTime = new Date(expense.date).getTime();
          const matchesCategory =
            expense.categoryId === category.id ||
            (!expense.categoryId &&
              (expense.category ?? '').trim().toLowerCase() === category.name.trim().toLowerCase());

          if (!matchesCategory || expenseTime < periodStartTime) {
            return sum;
          }

          return sum + expense.amount;
        }, 0);

        return {
          ...category,
          spent,
        };
      }),
    [expenses, storedCategories]
  );

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);

  return {
    categories,
    totalBudget,
    totalSpent,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    resetAllCategories,
  };
}
