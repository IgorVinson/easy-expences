import {
    Timestamp,
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { Expense, NewExpense } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Firestore document into our typed Expense */
function docToExpense(id: string, data: Record<string, any>): Expense {
  return {
    id,
    title: data.title ?? '',
    category: data.category ?? '',
    amount: data.amount ?? 0,
    icon: data.icon ?? 'cash',
    colorLight: data.colorLight ?? '#E2E8F0',
    colorDark: data.colorDark ?? '#94A3B8',
    // Store as Firestore Timestamp, expose as ISO string
    date:
      data.date instanceof Timestamp
        ? data.date.toDate().toISOString()
        : data.date ?? new Date().toISOString(),
    userId: data.userId,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExpenses(userId: string | null | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Real-time listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => docToExpense(d.id, d.data()));
        setExpenses(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useExpenses] Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe; // Cleanup on unmount or userId change
  }, [userId]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  /** Add a new expense document for the current user */
  async function addExpense(expense: NewExpense) {
    if (!userId) throw new Error('Not authenticated');

    await addDoc(collection(db, 'expenses'), {
      ...expense,
      // Convert ISO string → Firestore Timestamp for proper ordering
      date: Timestamp.fromDate(new Date(expense.date)),
      userId,
    });
  }

  /** Update any fields on an existing expense */
  async function updateExpense(id: string, changes: Partial<Omit<NewExpense, 'date'> & { date?: string }>) {
    const updateData: Record<string, any> = { ...changes };
    if (changes.date) {
      updateData.date = Timestamp.fromDate(new Date(changes.date));
    }
    await updateDoc(doc(db, 'expenses', id), updateData);
  }

  /** Delete an expense by id */
  async function deleteExpense(id: string) {
    await deleteDoc(doc(db, 'expenses', id));
  }

  // ─── Computed helpers ─────────────────────────────────────────────────────

  /** Expenses for today (local date) */
  const todayExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });

  /** Expenses for yesterday (local date) */
  const yesterdayExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate()
    );
  });

  /** Total spent this calendar month */
  const monthlyTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    expenses,
    todayExpenses,
    yesterdayExpenses,
    monthlyTotal,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
