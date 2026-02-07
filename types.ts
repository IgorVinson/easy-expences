import { Ionicons } from '@expo/vector-icons';

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  icon: keyof typeof Ionicons.glyphMap;
  budgetLeft?: string;
  colorLight: string;
  colorDark: string;
};
