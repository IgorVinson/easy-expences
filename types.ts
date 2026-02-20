import { Ionicons } from '@expo/vector-icons';

// ─── Expense ─────────────────────────────────────────────────────────────────

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number; // always positive (we treat all as spending)
  icon: keyof typeof Ionicons.glyphMap;
  colorLight: string;
  colorDark: string;
  date: string; // ISO string, e.g. "2024-09-15T10:30:00.000Z"
  budgetLeft?: string; // optional computed display string
  userId?: string; // set by hooks, not required on creation
};

// Omit generated fields when the user creates a new expense
export type NewExpense = Omit<Expense, 'id' | 'userId' | 'budgetLeft'>;

// ─── Budget Category ──────────────────────────────────────────────────────────

export type BudgetCategory = {
  id: string;
  name: string;
  budget: number; // monthly limit
  spent: number;  // computed / stored
  icon: keyof typeof Ionicons.glyphMap;
  colorLight: string;
  colorDark: string;
  userId?: string;
};

export type NewBudgetCategory = Omit<BudgetCategory, 'id' | 'userId' | 'spent'>;
