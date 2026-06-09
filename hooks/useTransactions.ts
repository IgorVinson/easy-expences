import {
  Timestamp,
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
import { NewTransaction, Transaction } from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

function docToTransaction(id: string, data: Record<string, any>): Transaction {
  return {
    id,
    type: data.type ?? 'expense',
    title: data.title ?? '',
    category: data.category,
    categoryId: data.categoryId,
    amount: data.amount ?? 0,
    budgetLeft: data.budgetLeft ?? 0,
    goalId: data.goalId,
    icon: data.icon ?? 'cash',
    colorLight: data.colorLight ?? '#E2E8F0',
    colorDark: data.colorDark ?? '#94A3B8',
    date:
      data.date instanceof Timestamp
        ? data.date.toDate().toISOString()
        : (data.date ?? new Date().toISOString()),
    userId: data.userId,
  };
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransactions(userId: string | null | undefined) {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAllTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(collection(db, 'transactions'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs
          .map((d) => docToTransaction(d.id, d.data()))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllTransactions(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useTransactions] Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async function addTransaction(transaction: NewTransaction) {
    if (!userId) throw new Error('Not authenticated');
    await addDoc(collection(db, 'transactions'), {
      ...transaction,
      date: Timestamp.fromDate(new Date(transaction.date)),
      userId,
    });
  }

  async function updateTransaction(
    id: string,
    changes: Partial<Omit<NewTransaction, 'date'> & { date?: string }>
  ) {
    const updateData: Record<string, any> = Object.fromEntries(
      Object.entries(changes).filter(([, v]) => v !== undefined)
    );
    if (changes.date) {
      updateData.date = Timestamp.fromDate(new Date(changes.date));
    }
    await updateDoc(doc(db, 'transactions', id), updateData);
  }

  async function deleteTransaction(id: string) {
    await deleteDoc(doc(db, 'transactions', id));
  }

  // ─── Derived (memoized to keep stable references) ──────────────────────────

  const expenses = useMemo(
    () => allTransactions.filter((t) => t.type === 'expense'),
    [allTransactions]
  );
  const income = useMemo(
    () => allTransactions.filter((t) => t.type === 'income'),
    [allTransactions]
  );

  const todayExpenses = useMemo(() => expenses.filter((e) => isToday(e.date)), [expenses]);
  const yesterdayExpenses = useMemo(() => expenses.filter((e) => isYesterday(e.date)), [expenses]);
  const olderExpenses = useMemo(
    () => expenses.filter((e) => !isToday(e.date) && !isYesterday(e.date)),
    [expenses]
  );

  const monthlyTotal = useMemo(
    () => expenses.filter((e) => isThisMonth(e.date)).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const monthlyIncome = useMemo(
    () => income.filter((t) => isThisMonth(t.date)).reduce((sum, t) => sum + t.amount, 0),
    [income]
  );

  // Backward-compat aliases
  const addExpense = (expense: NewTransaction) => addTransaction({ ...expense, type: 'expense' });
  const updateExpense = updateTransaction;
  const deleteExpense = deleteTransaction;

  return {
    expenses,
    income,
    allTransactions,
    todayExpenses,
    yesterdayExpenses,
    olderExpenses,
    monthlyTotal,
    monthlyIncome,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // backward compat
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
