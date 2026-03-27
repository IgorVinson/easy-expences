import { Ionicons } from '@expo/vector-icons';

// ─── Transaction (expense or income) ─────────────────────────────────────────

export type Transaction = {
  id: string;
  type: 'expense' | 'income';
  title: string;
  amount: number; // always positive
  icon: keyof typeof Ionicons.glyphMap;
  colorLight: string;
  colorDark: string;
  date: string; // ISO string
  userId?: string;

  // expense-only
  category?: string;
  categoryId?: string;
  budgetLeft?: number;

  // income-only
  goalId?: string; // if set, this income counts toward that goal
};

/** Backward-compat alias — existing code using Expense still compiles */
export type Expense = Transaction;

export type NewTransaction = Omit<Transaction, 'id' | 'userId'>;
export type NewExpense = NewTransaction; // backward-compat alias

// ─── Budget Category ──────────────────────────────────────────────────────────

export type BudgetCategory = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  periodStart?: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorLight: string;
  colorDark: string;
  userId?: string;
};

export type NewBudgetCategory = Omit<BudgetCategory, 'id' | 'userId' | 'spent'>;

// ─── Goal ────────────────────────────────────────────────────────────────────

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  icon: keyof typeof Ionicons.glyphMap;
  colorLight: string;
  colorDark: string;
  userId?: string;
};

export type GoalWithProgress = Goal & {
  savedAmount: number;
  progressPercent: number;
};

export type NewGoal = Omit<Goal, 'id' | 'userId'>;
