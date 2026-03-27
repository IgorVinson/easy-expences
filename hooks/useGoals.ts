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
import { Goal, GoalWithProgress, NewGoal, Transaction } from '../types';

export function useGoals(
  userId: string | null | undefined,
  income: Transaction[]
) {
  const [storedGoals, setStoredGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStoredGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(collection(db, 'goals'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: Goal[] = snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? '',
          targetAmount: d.data().targetAmount ?? 0,
          icon: d.data().icon ?? 'flag',
          colorLight: d.data().colorLight ?? '#D1FAE5',
          colorDark: d.data().colorDark ?? '#10B981',
          userId: d.data().userId,
        }));
        setStoredGoals(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useGoals] Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  // ─── Compute savedAmount from income transactions ──────────────────────────

  const goals: GoalWithProgress[] = useMemo(
    () =>
      storedGoals.map((goal) => {
        const savedAmount = income
          .filter((t) => t.goalId === goal.id)
          .reduce((sum, t) => sum + t.amount, 0);
        const progressPercent =
          goal.targetAmount > 0
            ? Math.min((savedAmount / goal.targetAmount) * 100, 100)
            : 0;
        return { ...goal, savedAmount, progressPercent };
      }),
    [storedGoals, income]
  );

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async function addGoal(goal: NewGoal) {
    if (!userId) throw new Error('Not authenticated');
    await addDoc(collection(db, 'goals'), { ...goal, userId });
  }

  async function updateGoal(id: string, changes: Partial<Omit<Goal, 'id' | 'userId'>>) {
    await updateDoc(doc(db, 'goals', id), changes);
  }

  async function deleteGoal(id: string) {
    await deleteDoc(doc(db, 'goals', id));
  }

  return { goals, loading, error, addGoal, updateGoal, deleteGoal };
}
