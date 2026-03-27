# Income & Goals Feature — Design Spec

**Date:** 2026-03-27
**Status:** Approved

---

## Context

SaySpend currently only tracks expenses against budget categories. Users want to also track income and save toward financial goals. Income and goal contributions are the same concept — when a user earns money, they can optionally assign it to a savings goal. This spec covers the full feature: unified transaction model, savings goals, and UI changes.

---

## Data Model

### Firestore Collections

Replace the `expenses` collection with `transactions`. No migration needed (no production users yet).

**`transactions/{id}`**
```
type:        'expense' | 'income'
title:       string
amount:      number               (always positive)
date:        Timestamp
icon:        string (Ionicons key)
colorLight:  string
colorDark:   string
userId:      string

// expense-only fields
category?:   string
categoryId?: string
budgetLeft?: number

// income-only fields
goalId?:     string               (optional: assigns income to a goal)
```

**`goals/{id}`**
```
name:          string
targetAmount:  number
icon:          string (Ionicons key)
colorLight:    string
colorDark:     string
userId:        string
```

Goal progress (`savedAmount`) is computed at runtime: sum of income transactions where `goalId === goal.id`.

### types.ts Changes

- Rename `Expense` → `Transaction`, add `type: 'expense' | 'income'` and optional `goalId?: string`
- Keep `NewTransaction = Omit<Transaction, 'id' | 'userId'>` (replaces `NewExpense`)
- Add `Goal` type
- Add `NewGoal = Omit<Goal, 'id' | 'userId'>`
- Keep `BudgetCategory` and `NewBudgetCategory` unchanged

---

## Hooks

### `useTransactions(userId)` (replaces `useExpenses`)

- Listens to `transactions` collection (was `expenses`)
- Returns:
  - `expenses: Transaction[]` — filtered to `type === 'expense'`, newest first
  - `income: Transaction[]` — filtered to `type === 'income'`, newest first
  - `todayExpenses`, `yesterdayExpenses`, `olderExpenses` — unchanged, expenses only
  - `monthlyTotal: number` — sum of expenses this month
  - `monthlyIncome: number` — sum of income this month
  - `addTransaction(t: NewTransaction): Promise<void>` — unified add (replaces `addExpense`)
  - `updateTransaction`, `deleteTransaction` — replaces `updateExpense`, `deleteExpense`

### `useGoals(userId)` (new)

- Listens to `goals` collection
- Receives `income: Transaction[]` as a parameter (caller passes the income array from `useTransactions`) to compute `savedAmount` per goal
- Returns:
  - `goals: Goal[]` — each enriched with `savedAmount: number` and `progressPercent: number`
  - `addGoal(g: NewGoal): Promise<void>`
  - `updateGoal(id, changes): Promise<void>`
  - `deleteGoal(id): Promise<void>`

---

## Navigation

- Budget tab renamed to **Goals** (tab label + i18n key `tabs.goals`)
- Tab order: `['overview', 'goals', 'profile']`
- Rename `app/(tabs)/budget.tsx` → `app/(tabs)/goals.tsx` (Expo Router uses filename as route — update tab href in `app/(tabs)/_layout.tsx` from `budget` to `goals`)

---

## UI: Overview Tab

No summary row added. The only change is the `+` button behavior.

**+ Button → `AddTransactionModal`** (replaces `AddExpenseModal`):
- Tab switcher at top: **Expense** (default) | **Income**
- **Expense tab**: identical to current `AddExpenseModal` form
- **Income tab**: title, amount, icon, color — plus optional "Assign to Goal" selector (dropdown/picker showing all user goals)
- Income entries without a `goalId` are plain income; with a `goalId` they count toward that goal's progress

---

## UI: Goals Tab (was Budget Tab)

Two collapsible sections, each independently expandable:

```
[▼ Budgets]
   Food & Dining  $312/$500  ████░░
   Weekend Trip   $420/$800  ██████░░
   [+ Add Budget]

[▼ Goals]
   Vacation Fund   $420/$2,000  ████░░░░░░
   Emergency Fund  $1,200/$5,000  ████░░░░░░
   [+ Add Goal]
```

Budget section: current `BudgetCategoryItem` list, unchanged.
Goals section: new `GoalItem` component — same swipeable pattern (swipe left = delete, swipe right = edit).

**Goal Detail Modal** (tap a goal):
- Shows goal name, target, progress bar, percentage
- Lists income transactions assigned to this goal (the contribution history)
- No "add contribution" button — contributions are added via the + button on Overview (Income tab)

---

## New & Modified Components

| Component | Status | Notes |
|-----------|--------|-------|
| `AddTransactionModal` | Rename + modify `AddExpenseModal` | Add tab switcher, income form, goal selector |
| `GoalItem` | New | Swipeable, same pattern as `BudgetCategoryItem` |
| `AddEditGoalModal` | New | Same pattern as `AddEditCategoryModal`: name, targetAmount, icon, color |
| `GoalDetailModal` | New | Shows goal progress + linked income transactions |
| `app/(tabs)/goals.tsx` | Rename `budget.tsx` | Add collapsible Budgets + Goals sections |

---

## i18n Changes

Add keys to `locales/en.json`, `locales/ua.json`, `locales/es.json`:

```json
"tabs": { "goals": "Goals" },
"goals": {
  "title": "Goals",
  "budgetsSection": "Budgets",
  "goalsSection": "Goals",
  "noGoals": "No goals yet",
  "tapAdd": "Tap \"Add\" to create your first savings goal.",
  "saved": "saved",
  "of": "of",
  "deleteTitle": "Delete Goal",
  "deleteConfirm": "Are you sure you want to delete this goal?"
},
"addGoal": {
  "addTitle": "Add Goal",
  "editTitle": "Edit Goal",
  "nameLabel": "Goal Name",
  "namePlaceholder": "e.g. Vacation Fund",
  "targetLabel": "Target Amount",
  "save": "Save Goal"
},
"addTransaction": {
  "expenseTab": "Expense",
  "incomeTab": "Income",
  "assignToGoal": "Assign to Goal (optional)",
  "noGoal": "No goal"
}
```

Rename `budget.categories` → `budget.budgets` and update the tab key `tabs.budget` → `tabs.goals`.

---

## Firestore Rules

Add rules for `transactions` (copy from `expenses`) and `goals`:

```
match /transactions/{doc} {
  allow read, update, delete: if resource.data.userId == request.auth.uid;
  allow create: if request.resource.data.userId == request.auth.uid;
}
match /goals/{doc} {
  allow read, update, delete: if resource.data.userId == request.auth.uid;
  allow create: if request.resource.data.userId == request.auth.uid;
}
```

Remove old `expenses` rules.

---

## Verification

1. **Expense flow**: Add an expense → appears in Overview under today, deducted from correct budget category
2. **Income flow**: Press + → Income tab → enter amount → appears in Overview income list
3. **Goal contribution**: Press + → Income tab → select goal → income appears in Goal Detail Modal
4. **Goal progress**: Progress bar updates correctly based on sum of assigned income
5. **Budget section**: Existing budget categories still work after rename
6. **Goals section**: Collapsible, add/edit/delete goal works
7. **Theme**: All new components respect dark/light theme
8. **i18n**: All strings translated in en/ua/es
