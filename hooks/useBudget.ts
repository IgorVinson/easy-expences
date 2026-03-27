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

// ─── Default categories (seeded for new users) ───────────────────────────────

const DEFAULT_CATEGORIES: Omit<NewBudgetCategory, never>[] = [
  {
    name: 'Food & Dining',
    budget: 500,
    icon: 'restaurant',
    colorLight: '#FED7AA',
    colorDark: '#FB923C',
  },
  {
    name: 'Transportation',
    budget: 300,
    icon: 'car',
    colorLight: '#E2E8F0',
    colorDark: '#94A3B8',
  },
  {
    name: 'Utilities',
    budget: 250,
    icon: 'bulb',
    colorLight: '#FEF08A',
    colorDark: '#FACC15',
  },
  {
    name: 'Entertainment',
    budget: 200,
    icon: 'ticket',
    colorLight: '#FECACA',
    colorDark: '#F87171',
  },
  {
    name: 'Shopping',
    budget: 400,
    icon: 'cart',
    colorLight: '#BFDBFE',
    colorDark: '#60A5FA',
  },
];

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
      async (snapshot) => {
        // First time a user connects — seed their default categories
        if (snapshot.empty) {
          await seedDefaultCategories(userId);
          return; // onSnapshot will fire again with the newly created docs
        }

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

  // ─── Seed helper ──────────────────────────────────────────────────────────

  async function seedDefaultCategories(uid: string) {
    const promises = DEFAULT_CATEGORIES.map((cat) =>
      addDoc(collection(db, 'budgetCategories'), {
        ...cat,
        spent: 0,
        periodStart: getCurrentMonthStartIso(),
        userId: uid,
      })
    );
    await Promise.all(promises);
  }

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
