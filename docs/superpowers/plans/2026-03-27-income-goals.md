# Income & Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add income tracking and savings goals to SaySpend — unified transaction model (`transactions` Firestore collection), savings goals with contribution tracking via income, and a redesigned Goals tab with collapsible Budgets/Goals sections.

**Architecture:** Replace `expenses` Firestore collection with `transactions` (type: 'expense'|'income', optional goalId). Create `goals` collection. `useTransactions` replaces `useExpenses`. `useGoals` computes savedAmount from income transactions. AddExpenseModal gains an Income tab with goal selector. Budget tab becomes Goals tab with two collapsible sections.

**Tech Stack:** React Native (Expo 54), Firebase Firestore, TypeScript, NativeWind, react-i18next, react-native-gesture-handler (Swipeable), @expo/vector-icons (Ionicons)

**Spec:** `docs/superpowers/specs/2026-03-27-income-goals-design.md`

---

## File Map

**Create:**
- `hooks/useTransactions.ts` — replaces useExpenses, reads 'transactions' collection
- `hooks/useGoals.ts` — reads 'goals' collection, computes savedAmount from income
- `components/GoalItem.tsx` — swipeable list item for savings goals
- `components/AddEditGoalModal.tsx` — create/edit goal (name, target, icon, color)
- `components/GoalDetailModal.tsx` — shows goal progress + linked income transactions
- `app/(tabs)/goals.tsx` — new Goals tab (Budgets + Goals collapsible sections)

**Modify:**
- `types.ts` — add Transaction type, Goal type, NewGoal
- `hooks/useBudget.ts` — switch from useExpenses to useTransactions
- `components/AddExpenseModal.tsx` — add Income tab + goal selector
- `app/(tabs)/_layout.tsx` — rename tab 'budget' → 'goals'
- `app/(tabs)/overview.tsx` — switch to useTransactions, update modal reference
- `firestore.rules` — add transactions + goals rules
- `locales/en.json`, `locales/ua.json`, `locales/es.json` — new keys

**Delete (last task):**
- `hooks/useExpenses.ts`
- `app/(tabs)/budget.tsx`

---

## Task 1: Update types.ts

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Add Transaction and Goal types**

Replace the entire `Expense` section and add Goal types. Open `types.ts` and replace:

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors (Expense alias preserves backward compat).

- [ ] **Step 3: Commit**

```bash
git add types.ts
git commit -m "feat: add Transaction and Goal types, keep Expense as alias"
```

---

## Task 2: Create useTransactions hook

**Files:**
- Create: `hooks/useTransactions.ts`

- [ ] **Step 1: Create the hook**

Create `hooks/useTransactions.ts`:

```typescript
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
import { useEffect, useState } from 'react';
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
    const updateData: Record<string, any> = { ...changes };
    if (changes.date) {
      updateData.date = Timestamp.fromDate(new Date(changes.date));
    }
    await updateDoc(doc(db, 'transactions', id), updateData);
  }

  async function deleteTransaction(id: string) {
    await deleteDoc(doc(db, 'transactions', id));
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const expenses = allTransactions.filter((t) => t.type === 'expense');
  const income = allTransactions.filter((t) => t.type === 'income');

  const todayExpenses = expenses.filter((e) => isToday(e.date));
  const yesterdayExpenses = expenses.filter((e) => isYesterday(e.date));
  const olderExpenses = expenses.filter((e) => !isToday(e.date) && !isYesterday(e.date));

  const monthlyTotal = expenses
    .filter((e) => isThisMonth(e.date))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyIncome = income
    .filter((t) => isThisMonth(t.date))
    .reduce((sum, t) => sum + t.amount, 0);

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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useTransactions.ts
git commit -m "feat: create useTransactions hook for unified expense/income collection"
```

---

## Task 3: Update useBudget to use useTransactions

**Files:**
- Modify: `hooks/useBudget.ts`

- [ ] **Step 1: Replace useExpenses import**

In `hooks/useBudget.ts`, change line 13:
```typescript
// FROM:
import { useExpenses } from './useExpenses';
// TO:
import { useTransactions } from './useTransactions';
```

Change line 69:
```typescript
// FROM:
const { expenses } = useExpenses(userId);
// TO:
const { expenses } = useTransactions(userId);
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useBudget.ts
git commit -m "feat: switch useBudget to useTransactions hook"
```

---

## Task 4: Create useGoals hook

**Files:**
- Create: `hooks/useGoals.ts`

- [ ] **Step 1: Create the hook**

Create `hooks/useGoals.ts`:

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useGoals.ts
git commit -m "feat: create useGoals hook with savedAmount computed from income"
```

---

## Task 5: Update Firestore rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add transactions and goals rules**

Replace the full `firestore.rules` content:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /transactions/{docId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /goals/{docId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /budgetCategories/{categoryId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /monthlyBudgets/{monthlyBudgetId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /subscriptions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

- [ ] **Step 2: Deploy rules**

```bash
cd functions && firebase deploy --only firestore:rules
```

Expected: `Deploy complete!`

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore rules for transactions and goals collections"
```

---

## Task 6: Add i18n keys to all locales

**Files:**
- Modify: `locales/en.json`, `locales/ua.json`, `locales/es.json`

- [ ] **Step 1: Update locales/en.json**

In `locales/en.json`, make these changes:

1. Under `"tabs"`, rename `"budget"` key and add:
```json
"tabs": {
  "overview": "Overview",
  "goals": "Goals",
  "profile": "Profile"
},
```

2. Rename `"budget"` namespace key to keep `budget` (used internally for budget section) and add `goals` namespace:
```json
"budget": {
  "title": "Monthly Budget",
  "totalSpent": "Total Spent",
  "totalBudget": "Total Budget",
  "remaining": "Remaining",
  "overBudget": "Over Budget",
  "budgetUsed": "{{percent}}% of budget used",
  "budgets": "Budgets",
  "loading": "Loading budgets…",
  "noCategories": "No budgets yet",
  "tapAdd": "Tap \"Add\" to create your first budget.",
  "deleteTitle": "Delete Budget",
  "deleteConfirm": "Are you sure you want to delete this budget?",
  "resetSpentTitle": "Reset Spent Amount?",
  "resetSpentConfirm": "This will reset the spent amount for \"{{name}}\" back to zero. Perfect for starting a new cycle early.",
  "resetToZero": "Reset to zero",
  "transactionsTitle": "Transactions",
  "noTransactions": "No transactions in this budget yet."
},
"goals": {
  "title": "Goals",
  "budgetsSection": "Budgets",
  "goalsSection": "Goals",
  "noGoals": "No goals yet",
  "tapAddGoal": "Tap \"+\" to create your first savings goal.",
  "saved": "saved",
  "deleteTitle": "Delete Goal",
  "deleteConfirm": "Are you sure you want to delete this goal?"
},
"addGoal": {
  "addTitle": "Add Goal",
  "editTitle": "Edit Goal",
  "nameLabel": "Goal Name",
  "namePlaceholder": "e.g. Vacation Fund",
  "targetLabel": "Target Amount ({{currency}})",
  "targetPlaceholder": "0.00",
  "iconLabel": "Icon",
  "colorLabel": "Color",
  "save": "Save Goal",
  "missingName": "Missing name",
  "enterName": "Please enter a name for the goal."
},
"addTransaction": {
  "expenseTab": "Expense",
  "incomeTab": "Income",
  "addIncomeTitle": "Add Income",
  "incomeNamePlaceholder": "e.g. Salary",
  "assignToGoal": "Assign to Goal (optional)",
  "noGoal": "No goal",
  "saveIncome": "Save Income"
},
```

- [ ] **Step 2: Update locales/ua.json**

Apply equivalent changes in Ukrainian. Add the same keys with Ukrainian translations:

```json
"tabs": {
  "overview": "Огляд",
  "goals": "Цілі",
  "profile": "Профіль"
},
```

Add to `budget` namespace — change `"categories"` key to `"budgets": "Бюджети"`, update related strings.

Add new namespaces:
```json
"goals": {
  "title": "Цілі",
  "budgetsSection": "Бюджети",
  "goalsSection": "Цілі",
  "noGoals": "Цілей ще немає",
  "tapAddGoal": "Натисніть \"+\", щоб створити першу ціль.",
  "saved": "збережено",
  "deleteTitle": "Видалити ціль",
  "deleteConfirm": "Ви впевнені, що хочете видалити цю ціль?"
},
"addGoal": {
  "addTitle": "Додати ціль",
  "editTitle": "Редагувати ціль",
  "nameLabel": "Назва цілі",
  "namePlaceholder": "напр. Відпустка",
  "targetLabel": "Цільова сума ({{currency}})",
  "targetPlaceholder": "0.00",
  "iconLabel": "Іконка",
  "colorLabel": "Колір",
  "save": "Зберегти ціль",
  "missingName": "Відсутня назва",
  "enterName": "Будь ласка, введіть назву цілі."
},
"addTransaction": {
  "expenseTab": "Витрата",
  "incomeTab": "Дохід",
  "addIncomeTitle": "Додати дохід",
  "incomeNamePlaceholder": "напр. Зарплата",
  "assignToGoal": "Призначити цілі (необов'язково)",
  "noGoal": "Без цілі",
  "saveIncome": "Зберегти дохід"
},
```

- [ ] **Step 3: Update locales/es.json**

Apply equivalent changes in Spanish:

```json
"tabs": {
  "overview": "Resumen",
  "goals": "Metas",
  "profile": "Perfil"
},
```

Add new namespaces:
```json
"goals": {
  "title": "Metas",
  "budgetsSection": "Presupuestos",
  "goalsSection": "Metas",
  "noGoals": "Aún no hay metas",
  "tapAddGoal": "Toca \"+\" para crear tu primera meta.",
  "saved": "guardado",
  "deleteTitle": "Eliminar meta",
  "deleteConfirm": "¿Estás seguro de que quieres eliminar esta meta?"
},
"addGoal": {
  "addTitle": "Agregar meta",
  "editTitle": "Editar meta",
  "nameLabel": "Nombre de la meta",
  "namePlaceholder": "ej. Fondo de vacaciones",
  "targetLabel": "Monto objetivo ({{currency}})",
  "targetPlaceholder": "0.00",
  "iconLabel": "Ícono",
  "colorLabel": "Color",
  "save": "Guardar meta",
  "missingName": "Falta el nombre",
  "enterName": "Por favor ingresa un nombre para la meta."
},
"addTransaction": {
  "expenseTab": "Gasto",
  "incomeTab": "Ingreso",
  "addIncomeTitle": "Agregar ingreso",
  "incomeNamePlaceholder": "ej. Salario",
  "assignToGoal": "Asignar a meta (opcional)",
  "noGoal": "Sin meta",
  "saveIncome": "Guardar ingreso"
},
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add locales/en.json locales/ua.json locales/es.json
git commit -m "feat: add i18n keys for goals, income, and rename budget tab"
```

---

## Task 7: Create GoalItem component

**Files:**
- Create: `components/GoalItem.tsx`

- [ ] **Step 1: Create the component**

Create `components/GoalItem.tsx`:

```typescript
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { styles } from '../styles';
import { GoalWithProgress } from '../types';

type GoalItemProps = {
  goal: GoalWithProgress;
  onPress?: (goal: GoalWithProgress) => void;
  onDelete?: (id: string) => void;
  onEdit?: (goal: GoalWithProgress) => void;
};

export const GoalItem = ({ goal, onPress, onDelete, onEdit }: GoalItemProps) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const swipeableRef = useRef<Swipeable>(null);

  const formattedSaved = formatCurrencyAmount(goal.savedAmount, currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedTarget = formatCurrencyAmount(goal.targetAmount, currency, i18n.language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({ inputRange: [-80, 0], outputRange: [0, 80] });
    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onEdit?.(goal);
        }}
        className="mb-3 ml-2 flex-row items-center justify-end rounded-2xl px-6"
        style={{ backgroundColor: theme.purple }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="create-outline" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({ inputRange: [0, 80], outputRange: [-80, 0] });
    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onDelete?.(goal.id);
        }}
        className="mb-3 mr-2 flex-row items-center justify-start rounded-2xl px-6"
        style={{ backgroundColor: '#EF4444' }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Ionicons name="trash-outline" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableRightOpen={() => {
        onEdit?.(goal);
        setTimeout(() => swipeableRef.current?.close(), 100);
      }}
      onSwipeableLeftOpen={() => {
        onDelete?.(goal.id);
        setTimeout(() => swipeableRef.current?.close(), 100);
      }}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(goal)}
        style={[
          styles.expenseItem,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
            flexDirection: 'column',
            alignItems: 'stretch',
          },
          !theme.isDark && styles.expenseItemShadow,
        ]}>
        {/* Top row */}
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <View
              className="h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: theme.isDark ? goal.colorDark + '33' : goal.colorLight,
              }}>
              <Ionicons name={goal.icon} size={24} color={goal.colorDark} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
                {goal.name}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: theme.textTertiary }}>
                {formattedSaved} / {formattedTarget}
              </Text>
            </View>
          </View>
          <Text className="text-sm font-semibold" style={{ color: goal.colorDark }}>
            {Math.round(goal.progressPercent)}%
          </Text>
        </View>

        {/* Progress bar */}
        <View
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${goal.progressPercent}%`,
              backgroundColor: goal.colorDark,
            }}
          />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/GoalItem.tsx
git commit -m "feat: add GoalItem swipeable list component"
```

---

## Task 8: Create AddEditGoalModal

**Files:**
- Create: `components/AddEditGoalModal.tsx`

- [ ] **Step 1: Create the modal**

Create `components/AddEditGoalModal.tsx` (same pattern as `AddEditCategoryModal`):

```typescript
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { Goal, GoalWithProgress, NewGoal } from '../types';

const GOAL_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'flag', 'trophy', 'star', 'heart', 'home', 'car', 'airplane', 'school',
  'medkit', 'gift', 'briefcase', 'camera', 'musical-notes', 'fitness',
  'bicycle', 'pizza', 'paw', 'leaf', 'diamond', 'rocket',
];

const GOAL_COLORS: Array<{ light: string; dark: string }> = [
  { light: '#D1FAE5', dark: '#10B981' },
  { light: '#BFDBFE', dark: '#3B82F6' },
  { light: '#E9D5FF', dark: '#8B5CF6' },
  { light: '#FCE7F3', dark: '#EC4899' },
  { light: '#FEF3C7', dark: '#F59E0B' },
  { light: '#FEE2E2', dark: '#EF4444' },
  { light: '#CFFAFE', dark: '#06B6D4' },
  { light: '#D1FAE5', dark: '#059669' },
  { light: '#FED7AA', dark: '#F97316' },
  { light: '#E0E7FF', dark: '#6366F1' },
];

type AddEditGoalModalProps = {
  visible: boolean;
  onClose: () => void;
  goal: GoalWithProgress | null;
  onSave: (data: NewGoal) => Promise<void>;
  onDelete?: (id: string) => void;
};

export const AddEditGoalModal: React.FC<AddEditGoalModalProps> = ({
  visible,
  onClose,
  goal,
  onSave,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currency } = useCurrency();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('flag');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (goal) {
        setName(goal.name);
        setTargetAmount(String(goal.targetAmount));
        setSelectedIcon(goal.icon);
        const idx = GOAL_COLORS.findIndex((c) => c.dark === goal.colorDark);
        setSelectedColorIdx(idx >= 0 ? idx : 0);
      } else {
        setName('');
        setTargetAmount('');
        setSelectedIcon('flag');
        setSelectedColorIdx(0);
      }
    }
  }, [visible, goal]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(t('addGoal.missingName'), t('addGoal.enterName'));
      return;
    }
    const parsed = parseFloat(targetAmount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid target amount.');
      return;
    }
    try {
      setSaving(true);
      await onSave({
        name: name.trim(),
        targetAmount: parsed,
        icon: selectedIcon,
        colorLight: GOAL_COLORS[selectedColorIdx].light,
        colorDark: GOAL_COLORS[selectedColorIdx].dark,
      });
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
    color: theme.textPrimary,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  };

  const labelStyle = {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: theme.bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '90%',
            }}>
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
                {goal ? t('addGoal.editTitle') : t('addGoal.addTitle')}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.iconBg }}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Name */}
              <Text style={labelStyle}>{t('addGoal.nameLabel')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('addGoal.namePlaceholder')}
                placeholderTextColor={theme.textTertiary}
                style={[inputStyle, { marginBottom: 20 }]}
              />

              {/* Target amount */}
              <Text style={labelStyle}>{t('addGoal.targetLabel', { currency })}</Text>
              <TextInput
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder={t('addGoal.targetPlaceholder')}
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
                style={[inputStyle, { marginBottom: 20 }]}
              />

              {/* Icon picker */}
              <Text style={[labelStyle, { marginBottom: 12 }]}>{t('addGoal.iconLabel')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {GOAL_ICONS.map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  const color = GOAL_COLORS[selectedColorIdx];
                  return (
                    <TouchableOpacity
                      key={iconName}
                      onPress={() => setSelectedIcon(iconName)}
                      style={{
                        width: 48, height: 48,
                        borderRadius: 14,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isSelected ? (theme.isDark ? color.dark + '33' : color.light) : theme.cardBg,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? color.dark : theme.border,
                      }}>
                      <Ionicons name={iconName} size={22} color={isSelected ? color.dark : theme.textTertiary} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Color picker */}
              <Text style={[labelStyle, { marginBottom: 12 }]}>{t('addGoal.colorLabel')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {GOAL_COLORS.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedColorIdx(idx)}
                    style={{
                      width: 36, height: 36,
                      borderRadius: 18,
                      backgroundColor: color.dark,
                      borderWidth: selectedColorIdx === idx ? 3 : 0,
                      borderColor: theme.textPrimary,
                    }}
                  />
                ))}
              </View>

              {/* Delete (edit mode only) */}
              {goal && onDelete && (
                <TouchableOpacity
                  onPress={() => { onClose(); onDelete(goal.id); }}
                  style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 16, backgroundColor: '#EF444415', marginBottom: 8 }}>
                  <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>
                    {t('goals.deleteTitle')}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{ backgroundColor: theme.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{t('addGoal.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/AddEditGoalModal.tsx
git commit -m "feat: add AddEditGoalModal for creating and editing savings goals"
```

---

## Task 9: Create GoalDetailModal

**Files:**
- Create: `components/GoalDetailModal.tsx`

- [ ] **Step 1: Create the modal**

Create `components/GoalDetailModal.tsx`:

```typescript
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatCurrencyAmount } from '../config/currencies';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { GoalWithProgress, Transaction } from '../types';

type GoalDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  goal: GoalWithProgress | null;
  contributions: Transaction[]; // income transactions with goalId === goal.id
};

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  visible,
  onClose,
  goal,
  contributions,
}) => {
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const { i18n } = useTranslation();

  if (!goal) return null;

  const formattedSaved = formatCurrencyAmount(goal.savedAmount, currency, i18n.language);
  const formattedTarget = formatCurrencyAmount(goal.targetAmount, currency, i18n.language);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '80%',
          }}>
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? goal.colorDark + '33' : goal.colorLight }}>
                <Ionicons name={goal.icon} size={22} color={goal.colorDark} />
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                {goal.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: theme.iconBg }}>
              <Ionicons name="close" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Progress */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: theme.textTertiary, fontSize: 13 }}>
                {formattedSaved} saved
              </Text>
              <Text style={{ color: theme.textTertiary, fontSize: 13 }}>
                {formattedTarget} target
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <View style={{ height: '100%', borderRadius: 4, width: `${goal.progressPercent}%`, backgroundColor: goal.colorDark }} />
            </View>
            <Text style={{ color: goal.colorDark, fontSize: 13, fontWeight: '600', marginTop: 6, textAlign: 'right' }}>
              {Math.round(goal.progressPercent)}%
            </Text>
          </View>

          {/* Contributions list */}
          <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {contributions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="cash-outline" size={40} color={theme.textTertiary} />
                <Text style={{ color: theme.textTertiary, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                  No contributions yet.{'\n'}Add income and assign it to this goal.
                </Text>
              </View>
            ) : (
              contributions.map((t) => (
                <View
                  key={t.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}>
                  <View>
                    <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '500' }}>
                      {t.title}
                    </Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}>
                      {new Date(t.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '700' }}>
                    +{formatCurrencyAmount(t.amount, currency, i18n.language)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/GoalDetailModal.tsx
git commit -m "feat: add GoalDetailModal showing goal progress and contributions"
```

---

## Task 10: Add Income tab to AddExpenseModal

**Files:**
- Modify: `components/AddExpenseModal.tsx`

- [ ] **Step 1: Add Income tab and goal selector**

Replace the full content of `components/AddExpenseModal.tsx`:

```typescript
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBudget } from '../hooks/useBudget';
import { useTransactions } from '../hooks/useTransactions';
import { BudgetCategory, GoalWithProgress } from '../types';
import { ExpenseAmountInput, resolveCalculatedAmount } from './ExpenseAmountInput';

type Tab = 'expense' | 'income';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialCategory?: BudgetCategory | null;
  goals?: GoalWithProgress[];
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  userId,
  initialCategory,
  goals = [],
}) => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { currency } = useCurrency();
  const { addTransaction } = useTransactions(userId);
  const { categories } = useBudget(userId);

  const [activeTab, setActiveTab] = useState<Tab>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [calculatorExpression, setCalculatorExpression] = useState('');
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible && initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [visible, initialCategory]);

  function resetForm() {
    setTitle('');
    setAmount('');
    setCalculatorExpression('');
    setIsCalculatorVisible(false);
    setSelectedCategory(null);
    setSelectedGoal(null);
    setActiveTab('expense');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function hideCalculator() {
    setIsCalculatorVisible(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert(t('addExpense.missingTitle'), t('addExpense.enterTitle'));
      return;
    }

    const resolvedAmount = resolveCalculatedAmount(calculatorExpression, amount);
    if (resolvedAmount === null) {
      Alert.alert(t('addExpense.invalidAmount'), t('addExpense.enterAmount'));
      return;
    }
    const parsedAmount = parseFloat(resolvedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('addExpense.invalidAmount'), t('addExpense.enterAmount'));
      return;
    }

    try {
      setSaving(true);
      if (activeTab === 'expense') {
        if (!selectedCategory) {
          Alert.alert(t('addExpense.noCategory'), t('addExpense.selectCategory'));
          return;
        }
        await addTransaction({
          type: 'expense',
          title: title.trim(),
          amount: parsedAmount,
          budgetLeft: selectedCategory.budget - selectedCategory.spent - parsedAmount,
          category: selectedCategory.name,
          categoryId: selectedCategory.id,
          icon: selectedCategory.icon,
          colorLight: selectedCategory.colorLight,
          colorDark: selectedCategory.colorDark,
          date: new Date().toISOString(),
        });
      } else {
        await addTransaction({
          type: 'income',
          title: title.trim(),
          amount: parsedAmount,
          goalId: selectedGoal?.id,
          icon: 'cash',
          colorLight: '#D1FAE5',
          colorDark: '#10B981',
          date: new Date().toISOString(),
        });
      }
      resetForm();
      onClose();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('addExpense.failedSave'));
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
    color: theme.textPrimary,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  };

  const amountLabelStyle = {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          </TouchableWithoutFeedback>

          <View style={{ flexShrink: 1, height: Dimensions.get('window').height * 0.85, backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
                {activeTab === 'expense' ? t('addExpense.title') : t('addTransaction.addIncomeTitle')}
              </Text>
              <TouchableOpacity onPress={handleClose} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.iconBg }}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Tab switcher */}
            <View style={{ flexDirection: 'row', marginHorizontal: 24, marginBottom: 16, borderRadius: 12, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
              {(['expense', 'income'] as Tab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => { setActiveTab(tab); resetForm(); }}
                  style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: activeTab === tab ? theme.purple : 'transparent' }}>
                  <Text style={{ color: activeTab === tab ? '#fff' : theme.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {tab === 'expense' ? t('addTransaction.expenseTab') : t('addTransaction.incomeTab')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ flexShrink: 1, width: '100%', paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Title */}
              <Text style={amountLabelStyle}>{t('addExpense.nameLabel')}</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                onFocus={hideCalculator}
                placeholder={activeTab === 'expense' ? t('addExpense.namePlaceholder') : t('addTransaction.incomeNamePlaceholder')}
                placeholderTextColor={theme.textTertiary}
                style={[inputStyle, { marginBottom: 20 }]}
              />

              {/* Amount */}
              <ExpenseAmountInput
                value={amount}
                expression={calculatorExpression}
                onValueChange={setAmount}
                onExpressionChange={setCalculatorExpression}
                onShowCalculator={() => setIsCalculatorVisible(true)}
                label={t('addExpense.amountLabel', { currency })}
                placeholder={t('addExpense.amountPlaceholder')}
                isCalculatorVisible={isCalculatorVisible}
                inputStyle={inputStyle}
                labelStyle={amountLabelStyle}
              />

              {/* Expense: category selector */}
              {activeTab === 'expense' && (
                <>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
                    {t('addExpense.categoryLabel')}
                  </Text>
                  {categories.length === 0 ? (
                    <Text style={{ color: theme.textTertiary, fontSize: 14, marginBottom: 20 }}>
                      {t('addExpense.noCategories')}
                    </Text>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                      {categories.map((cat) => {
                        const isSelected = selectedCategory?.id === cat.id;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => { hideCalculator(); setSelectedCategory(cat); }}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: isSelected ? (isDarkMode ? cat.colorDark + '33' : cat.colorLight) : theme.cardBg, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? cat.colorDark : theme.border }}>
                            <Ionicons name={cat.icon as any} size={15} color={isSelected ? cat.colorDark : theme.textTertiary} />
                            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '500', color: isSelected ? cat.colorDark : theme.textSecondary }}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </>
              )}

              {/* Income: optional goal selector */}
              {activeTab === 'income' && goals.length > 0 && (
                <>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
                    {t('addTransaction.assignToGoal')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedGoal(null)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: !selectedGoal ? theme.iconBg : theme.cardBg, borderWidth: !selectedGoal ? 2 : 1, borderColor: !selectedGoal ? theme.purple : theme.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: !selectedGoal ? theme.purple : theme.textSecondary }}>
                        {t('addTransaction.noGoal')}
                      </Text>
                    </TouchableOpacity>
                    {goals.map((goal) => {
                      const isSelected = selectedGoal?.id === goal.id;
                      return (
                        <TouchableOpacity
                          key={goal.id}
                          onPress={() => setSelectedGoal(goal)}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: isSelected ? (isDarkMode ? goal.colorDark + '33' : goal.colorLight) : theme.cardBg, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? goal.colorDark : theme.border }}>
                          <Ionicons name={goal.icon as any} size={15} color={isSelected ? goal.colorDark : theme.textTertiary} />
                          <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '500', color: isSelected ? goal.colorDark : theme.textSecondary }}>
                            {goal.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ backgroundColor: theme.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                    {activeTab === 'expense' ? t('addExpense.save') : t('addTransaction.saveIncome')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/AddExpenseModal.tsx
git commit -m "feat: add Income tab with goal selector to AddExpenseModal"
```

---

## Task 11: Create app/(tabs)/goals.tsx

**Files:**
- Create: `app/(tabs)/goals.tsx`

- [ ] **Step 1: Create the Goals screen**

Create `app/(tabs)/goals.tsx`:

```typescript
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AddEditCategoryModal } from '../../components/AddEditCategoryModal';
import { AddEditGoalModal } from '../../components/AddEditGoalModal';
import { BudgetCategoryItem } from '../../components/BudgetCategoryItem';
import { GoalDetailModal } from '../../components/GoalDetailModal';
import { GoalItem } from '../../components/GoalItem';
import { formatCurrencyAmount } from '../../config/currencies';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBudget } from '../../hooks/useBudget';
import { useGoals } from '../../hooks/useGoals';
import { useTransactions } from '../../hooks/useTransactions';
import { BudgetCategory, GoalWithProgress, NewBudgetCategory, NewGoal } from '../../types';

export default function GoalsScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { currency } = useCurrency();

  const { expenses, income, updateTransaction } = useTransactions(user?.uid);
  const {
    categories,
    totalBudget,
    totalSpent,
    loading: budgetLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useBudget(user?.uid);
  const {
    goals,
    loading: goalsLoading,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoals(user?.uid, income);

  // ─── Collapsible state ────────────────────────────────────────────────────
  const [budgetsExpanded, setBudgetsExpanded] = useState(true);
  const [goalsExpanded, setGoalsExpanded] = useState(true);

  // ─── Budget modal state ───────────────────────────────────────────────────
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  // ─── Goal modal state ─────────────────────────────────────────────────────
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [detailGoal, setDetailGoal] = useState<GoalWithProgress | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // ─── Budget handlers ──────────────────────────────────────────────────────
  function openAddBudget() {
    setEditingCategory(null);
    setBudgetModalVisible(true);
  }

  function openEditBudget(category: BudgetCategory) {
    setEditingCategory(category);
    setBudgetModalVisible(true);
  }

  async function handleSaveBudget(data: NewBudgetCategory, resetSpent?: boolean) {
    if (editingCategory) {
      const nextData = resetSpent
        ? { ...data, spent: 0, periodStart: new Date().toISOString() }
        : data;
      await updateCategory(editingCategory.id, nextData);

      const relatedExpenses = expenses.filter(
        (e) =>
          e.categoryId === editingCategory.id ||
          (!e.categoryId && e.category?.trim().toLowerCase() === editingCategory.name.trim().toLowerCase())
      );
      const requiresSync = relatedExpenses.some(
        (e) =>
          e.categoryId !== editingCategory.id ||
          e.category !== data.name ||
          e.icon !== data.icon ||
          e.colorLight !== data.colorLight ||
          e.colorDark !== data.colorDark
      );
      if (requiresSync) {
        await Promise.all(
          relatedExpenses.map((e) =>
            updateTransaction(e.id, {
              category: data.name,
              categoryId: editingCategory.id,
              icon: data.icon,
              colorLight: data.colorLight,
              colorDark: data.colorDark,
            })
          )
        );
      }
    } else {
      await addCategory(data);
    }
  }

  function handleDeleteBudget(id: string) {
    Alert.alert(t('budget.deleteTitle'), t('budget.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCategory(id) },
    ]);
  }

  // ─── Goal handlers ────────────────────────────────────────────────────────
  function openAddGoal() {
    setEditingGoal(null);
    setGoalModalVisible(true);
  }

  function openEditGoal(goal: GoalWithProgress) {
    setEditingGoal(goal);
    setGoalModalVisible(true);
  }

  function openGoalDetail(goal: GoalWithProgress) {
    setDetailGoal(goal);
    setDetailModalVisible(true);
  }

  async function handleSaveGoal(data: NewGoal) {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await addGoal(data);
    }
  }

  function handleDeleteGoal(id: string) {
    Alert.alert(t('goals.deleteTitle'), t('goals.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  }

  // ─── Derived ──────────────────────────────────────────────────────────────
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const categoryTransactions = editingCategory
    ? expenses.filter(
        (e) =>
          e.categoryId === editingCategory.id ||
          (!e.categoryId && e.category?.trim().toLowerCase() === editingCategory.name.trim().toLowerCase())
      )
    : [];

  const detailContributions = detailGoal
    ? income.filter((t) => t.goalId === detailGoal.id)
    : [];

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.purple} colors={[theme.purple]} />
        }>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
            {t('goals.title')}
          </Text>
          <TouchableOpacity onPress={toggleTheme} className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: theme.iconBg }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Budget Summary Card */}
        <View className="mb-6 px-6">
          <View className="rounded-[32px] p-6" style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: theme.iconBg }}>
                <Ionicons name="calendar-clear" size={14} color={theme.purple} />
                <Text className="text-xs font-semibold" style={{ color: theme.purple }}>{monthLabel}</Text>
              </View>
            </View>
            <View className="mb-6 flex-row items-end justify-between">
              <View>
                <Text className="mb-1 text-sm font-medium" style={{ color: theme.textTertiary }}>{t('budget.totalSpent')}</Text>
                <Text className="text-4xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
                  {formatCurrencyAmount(totalSpent, currency, i18n.language)}
                </Text>
              </View>
              <View className="items-end pb-1">
                <Text className="mb-1 text-xs font-medium" style={{ color: theme.textTertiary }}>{t('budget.totalBudget')}</Text>
                <Text className="text-lg font-bold" style={{ color: theme.textSecondary }}>
                  {formatCurrencyAmount(totalBudget, currency, i18n.language, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: totalRemaining > 0 ? '#10B981' : '#EF4444' }}>
                  {totalRemaining > 0 ? t('budget.remaining') : t('budget.overBudget')}
                </Text>
                <Text className="text-sm font-bold" style={{ color: totalRemaining > 0 ? '#10B981' : '#EF4444' }}>
                  {formatCurrencyAmount(Math.abs(totalBudget - totalSpent), currency, i18n.language)}
                </Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full" style={{ backgroundColor: theme.border }}>
                <View className="h-full rounded-full" style={{ width: `${Math.min(overallPercentage, 100)}%`, backgroundColor: overallPercentage > 100 ? '#EF4444' : theme.purple }} />
              </View>
              <Text className="mt-2 text-right text-[10px] font-medium" style={{ color: theme.textTertiary }}>
                {t('budget.budgetUsed', { percent: Math.round(overallPercentage) })}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Budgets Section ─────────────────────────────────────────────── */}
        <View className="mb-4 px-6">
          <TouchableOpacity
            onPress={() => setBudgetsExpanded((v) => !v)}
            className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('goals.budgetsSection')}
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={openAddBudget} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.purple }}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <Ionicons name={budgetsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textTertiary} />
            </View>
          </TouchableOpacity>

          {budgetsExpanded && (
            budgetLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={theme.purple} />
              </View>
            ) : categories.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="wallet-outline" size={40} color={theme.textTertiary} />
                <Text className="mt-3 text-sm font-semibold" style={{ color: theme.textSecondary }}>{t('budget.noCategories')}</Text>
              </View>
            ) : (
              categories.map((cat) => (
                <BudgetCategoryItem
                  key={cat.id}
                  category={cat}
                  onPress={openEditBudget}
                  onDelete={handleDeleteBudget}
                  onEdit={openEditBudget}
                />
              ))
            )
          )}
        </View>

        {/* ─── Goals Section ───────────────────────────────────────────────── */}
        <View className="mb-8 px-6">
          <TouchableOpacity
            onPress={() => setGoalsExpanded((v) => !v)}
            className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
              {t('goals.goalsSection')}
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={openAddGoal} style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.purple }}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <Ionicons name={goalsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textTertiary} />
            </View>
          </TouchableOpacity>

          {goalsExpanded && (
            goalsLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={theme.purple} />
              </View>
            ) : goals.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="flag-outline" size={40} color={theme.textTertiary} />
                <Text className="mt-3 text-sm font-semibold" style={{ color: theme.textSecondary }}>{t('goals.noGoals')}</Text>
                <Text className="mt-1 text-center text-sm" style={{ color: theme.textTertiary }}>{t('goals.tapAddGoal')}</Text>
              </View>
            ) : (
              goals.map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onPress={openGoalDetail}
                  onDelete={handleDeleteGoal}
                  onEdit={openEditGoal}
                />
              ))
            )
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Modals */}
      <AddEditCategoryModal
        visible={budgetModalVisible}
        onClose={() => { setBudgetModalVisible(false); setEditingCategory(null); }}
        category={editingCategory}
        categoryTransactions={categoryTransactions}
        onSave={handleSaveBudget}
        onDelete={handleDeleteBudget}
      />

      <AddEditGoalModal
        visible={goalModalVisible}
        onClose={() => { setGoalModalVisible(false); setEditingGoal(null); }}
        goal={editingGoal}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
      />

      <GoalDetailModal
        visible={detailModalVisible}
        onClose={() => { setDetailModalVisible(false); setDetailGoal(null); }}
        goal={detailGoal}
        contributions={detailContributions}
      />
    </View>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/goals.tsx
git commit -m "feat: create Goals screen with collapsible Budgets and Goals sections"
```

---

## Task 12: Update _layout.tsx — rename budget tab to goals

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Update tabOrder and Tab.Screen**

In `app/(tabs)/_layout.tsx`, make two changes:

Change line 133:
```typescript
// FROM:
const tabOrder = ['overview', 'budget', 'profile'];
// TO:
const tabOrder = ['overview', 'goals', 'profile'];
```

Change the `budget` Tab.Screen block (lines 185-191):
```typescript
// FROM:
<Tabs.Screen
  name="budget"
  options={{
    title: t('tabs.budget'),
    tabBarIcon: ({ color }) => <Ionicons name="calendar" size={32} color={color} />,
  }}
/>
// TO:
<Tabs.Screen
  name="goals"
  options={{
    title: t('tabs.goals'),
    tabBarIcon: ({ color }) => <Ionicons name="trophy" size={32} color={color} />,
  }}
/>
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat: rename budget tab to goals in navigation"
```

---

## Task 13: Update overview.tsx to use useTransactions and pass goals

**Files:**
- Modify: `app/(tabs)/overview.tsx`

- [ ] **Step 1: Read the current overview.tsx to find all useExpenses/AddExpenseModal references**

Read `app/(tabs)/overview.tsx` and make these changes:

1. Replace `import { useExpenses }` with `import { useTransactions }`
2. Replace `useExpenses(user?.uid)` with `useTransactions(user?.uid)`
3. Add import for `useGoals`: `import { useGoals } from '../../hooks/useGoals';`
4. Add `useGoals` hook call after `useTransactions`: `const { goals } = useGoals(user?.uid, income);`
5. Pass `goals` to `AddExpenseModal`: `<AddExpenseModal ... goals={goals} />`
6. Replace destructured `addExpense` / `deleteExpense` / `updateExpense` with `addTransaction` / `deleteTransaction` / `updateTransaction` (or use the backward-compat aliases — they still exist in `useTransactions`)

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/overview.tsx"
git commit -m "feat: update overview to use useTransactions and pass goals to modal"
```

---

## Task 14: Delete old files and clean up remaining references

**Files:**
- Delete: `hooks/useExpenses.ts`, `app/(tabs)/budget.tsx`
- Check: `components/MonthlyReviewProvider.tsx`, `components/RecordingModal.tsx` for any remaining useExpenses references

- [ ] **Step 1: Check for remaining useExpenses references**

```bash
grep -r "useExpenses" --include="*.ts" --include="*.tsx" .
```

For each file still importing `useExpenses`, replace with `useTransactions`.

- [ ] **Step 2: Check for remaining budget route references**

```bash
grep -r "tabs/budget\|/(budget)" --include="*.ts" --include="*.tsx" .
```

Update any navigation references from `budget` to `goals`.

- [ ] **Step 3: Delete old files**

```bash
rm hooks/useExpenses.ts
rm "app/(tabs)/budget.tsx"
```

- [ ] **Step 4: Final type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Start the app and verify on iOS simulator**

```bash
npm run ios
```

Verify:
1. Tab bar shows Overview | Goals (trophy icon) | Profile
2. Goals tab: Budgets section (collapsible) + Goals section (collapsible)
3. Overview: `+` button opens modal with Expense / Income tabs
4. Income tab: title + amount + optional goal selector
5. Adding income with goal → goal progress bar updates
6. Tapping a goal → GoalDetailModal shows contributions
7. Add/edit/delete goals works
8. Swipe left on goal = delete, swipe right = edit
9. Existing budget functionality unchanged

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: remove useExpenses and budget.tsx, complete income+goals feature"
```

---

## Verification Summary

| Flow | Expected behavior |
|------|-------------------|
| Overview `+` → Expense tab | Same as before — category selector, saves to `transactions` with `type:'expense'` |
| Overview `+` → Income tab | Title + amount + optional goal → saves to `transactions` with `type:'income'` |
| Income with goal selected | Goal progress bar increases immediately (real-time) |
| Goals tab Budgets section | All budget categories, expand/collapse works |
| Goals tab Goals section | All savings goals, expand/collapse works |
| Tap goal | GoalDetailModal opens with income contribution list |
| Swipe left goal | Delete confirmation |
| Swipe right goal | Edit goal modal |
| Add new goal | Name + target + icon + color, appears in list |
| TypeScript | `npx tsc --noEmit` passes with 0 errors |
