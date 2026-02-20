# 🏗️ Easy Expenses Development Protocol

**Repo:** `/Users/ihorvinson/.openclaw/workspace/easy-expences`  
**Stack:** React Native + Expo + NativeWind (Tailwind) + Firebase  
**Project Management:** Notion — EasyBudget Project

---

## 📁 Current Project Structure

```
📁 easy-expences/
├── 📁 app/                          # Expo Router (file-based routing)
│   ├── 📁 (auth)/                   # Auth route group (no tabs)
│   │   ├── _layout.tsx              # Auth stack layout
│   │   ├── login.tsx                # Email + Google login
│   │   ├── signup.tsx               # Registration screen
│   │   └── forgot-password.tsx      # Password reset
│   ├── 📁 (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx              # Tab navigator config
│   │   ├── overview.tsx             # Dashboard with expenses
│   │   ├── budget.tsx               # Budget screen (placeholder)
│   │   └── settings.tsx             # Settings + logout
│   ├── _layout.tsx                  # Root layout with auth redirect
│   └── index.tsx                    # App entry redirect
├── 📁 components/                   # Reusable UI components
│   ├── Container.tsx
│   ├── EditScreenInfo.tsx
│   ├── ExpenseItem.tsx              # Expense list item
│   └── ScreenContent.tsx
├── 📁 contexts/                     # React Context providers
│   ├── AuthContext.tsx              # Firebase auth state
│   └── ThemeContext.tsx             # Dark/light theme
├── 📁 assets/                       # Images, icons, splash
├── 📄 firebaseConfig.js             # Firebase initialization
├── 📄 styles.ts                     # Shared StyleSheet styles
├── 📄 types.ts                      # TypeScript types
├── 📄 global.css                    # Tailwind/global styles
├── 📄 tailwind.config.js            # Tailwind configuration
└── 📄 package.json                  # Dependencies
```

---

## 📝 Task Tracking (Notion Integration)

**ALL tasks for this project are tracked in Notion's EasyBudget project.**

**Notion Project:** [EasyBudget](https://www.notion.so/EasyBudget-2f5d26d1ebf080b19340eed8a777b6c1)  
**Tasks Database:** Vinson Ventures Tasks  
**Project ID:** `2f5d26d1-ebf0-80b1-9340-eed8a777b6c1`

### Atlas Task Workflow:

| Step              | Action                                                                   | Notion Status                   |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------- |
| **1. Initialize** | Create/update task in Notion with estimate (hours, tokens, cost)         | `Backlog Next 7 days`           |
| **2. Start Work** | Move task to In progress when beginning create plan and add it into task | `In progress`                   |
| **3. Progress**   | Add daily notes to task as blocks                                        | Stays `In progress`             |
| **4. Complete**   | Write completion overview, mention @Vinson for review                    | `In progress` (awaiting review) |
| **5. Done**       | —                                                                        | **Mr. Vinson moves to `Done`**  |

### Estimates I Add to Every Task:

- **Plan, hour:** Estimated dev hours
- **Tokens:** ~2M tokens per hour (input + output)
- **Cost:** `(tokens / 1M) × $0.50` (kimi-coding/k2p5 rate)

---

## 🔀 Git Workflow (Atlas + Mr. Vinson)

### Branch Naming Convention:

**Format:** `short-title-oc` (oc = OpenClaw)

Examples:

- `architecture-oc`
- `auth-setup-oc`
- `add-expense-screen-oc`
- `budget-analytics-oc`

### Branch Rules:

| Branch           | Purpose                    | Who Merges               |
| ---------------- | -------------------------- | ------------------------ |
| `main`           | Production code            | Mr. Vinson only (via PR) |
| `dev`            | Development code           | Mr. Vinson only (via PR) |
| `[task-name]-oc` | One branch per Notion task | Mr. Vinson via PR review |

### Workflow:

1. **Notion task created** → I create branch FROM `dev`: `git checkout -b [short-title]-oc`
2. **All work on that task** → commits to that branch
3. **Task complete** → I create PR TO `dev` branch for Mr. Vinson to review
4. **Mr. Vinson reviews** → approves & merges into `dev` or requests changes

### What Goes in a Task Branch (All via PR):

- ✅ New screens/pages (UI)
- ✅ Major design changes
- ✅ Database/Firestore changes
- ✅ Small components (multiple commits OK, still one PR at end)
- ✅ Tests, docs, refactoring related to the task

### PR Template:

```
## Task: [Notion Task Name]
Branch: `[branch-name]` → Target: `dev`

### What Changed:
- [List of changes]

### Screenshots/Videos:
- [If UI changes]

### Testing:
- [How to test]

@Vinson — Ready for review
```

---

## 🖥️ Running the Dev Server

### Atlas MUST Do:

**Always try to start the server before claiming it won't work:**

```bash
cd /Users/ihorvinson/.openclaw/workspace/easy-expences
npm start
```

**If it starts successfully:**
- ✅ Report: "Dev server running on http://localhost:8081"
- ✅ Mr. Vinson can view on his device/simulator
- ✅ Continue with development work

**If it fails:**
- ❌ Capture the exact error message
- ❌ Try common fixes (see below)
- ❌ Report the specific error to Mr. Vinson

### Common Issues & Fixes:

| Issue | Fix |
|-------|-----|
| Port already in use | Kill existing process or use different port |
| Missing node_modules | Run `pnpm install` |
| Metro bundler error | Clear cache: `npx expo start --clear` |
| TypeScript errors | Run `npx tsc --noEmit` to check |

### What NOT to Do:

- ❌ Don't assume the server won't work without trying
- ❌ Don't create web mockups instead of running the actual app
- ❌ Don't tell Mr. Vinson to "run it locally" without attempting first

---

| Technology        | Version | Purpose                     |
| ----------------- | ------- | --------------------------- |
| React Native      | 0.81.5  | Core mobile framework       |
| Expo SDK          | ^54.0.0 | Development platform        |
| Expo Router       | ~6.0.22 | File-based navigation       |
| React             | 19.1.0  | UI library                  |
| NativeWind        | latest  | Tailwind CSS for RN         |
| Firebase          | ^12.8.0 | Auth + Firestore            |
| TypeScript        | ~5.9.2  | Type safety                 |
| Zod (recommended) | —       | Runtime validation (future) |

### Current State ✅

**Implemented:**

- ✅ Expo Router with auth-protected routes
- ✅ Firebase Auth (email/password + Google)
- ✅ Dark/light theme system
- ✅ Tab navigation (Overview, Budget, Settings)
- ✅ Login/Signup screens
- ✅ Overview screen with expense list UI
- ✅ Settings screen with logout

**Still Needed:**

- 🔄 Firestore data layer (stores, sync)
- 🔄 Add expense functionality
- 🔄 Budget management

---

## 🧩 Key Architectural Patterns

### Navigation (Expo Router)

```tsx
// File structure = Route structure
app/
  ├── (auth)/           # Group: no tab bar
  │   └── login.tsx     # Route: /login
  ├── (tabs)/           # Group: with tab bar
  │   └── overview.tsx  # Route: /overview
```

### Auth Protection

```tsx
// Root layout handles redirects
// - No user → redirect to /login
// - User in auth group → redirect to /overview
```

### Theming

```tsx
// Use theme context for colors
const { theme, isDarkMode, toggleTheme } = useTheme();

// Tailwind for layout, theme for colors
<View className="flex-1 p-4" style={{ backgroundColor: theme.bg }}>
```

### Components

```tsx
// Reusable components go in /components
import { ExpenseItem } from '../../components/ExpenseItem';

// Screen-specific logic stays in screen files
```

---

## 🛑 STOP — Request Review Before Coding

| Decision Type          | Examples                                                           | What I Send You                 |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------- |
| **Architecture**       | Navigation changes, state management choice, folder reorganization | Markdown doc with rationale     |
| **Data Layer**         | Firestore schema, data model design, sync strategy                 | Schema + sync strategy          |
| **UI Framework**       | Component library changes, major theming updates                   | Component examples + comparison |
| **Major Dependencies** | Charts, maps, payment integration, backend changes                 | List with size + justification  |
| **Build/Deploy**       | EAS Build config, app store setup, CI/CD                           | Config files for review         |
| **Feature Scope**      | What MVP includes vs v1.0 vs later                                 | Feature list with priorities    |

---

## ✅ GO — I Proceed Without Review

| Task Type                 | Examples                                           |
| ------------------------- | -------------------------------------------------- |
| **New Screens**           | Building screens following established patterns    |
| **UI Components**         | New components following existing design system    |
| **Firestore Integration** | Adding CRUD operations after schema is approved    |
| **Refactoring**           | Code organization, renaming, extracting components |
| **Styling Tweaks**        | Tailwind class adjustments, spacing, colors        |
| **Bug Fixes**             | Logic errors, type fixes within existing patterns  |

---

## 📋 Development Checklist

### Before Starting Work:

- [ ] Check Notion for assigned tasks
- [ ] Ensure you're on `dev` branch: `git checkout dev`
- [ ] Pull latest: `git pull origin dev`
- [ ] Create new branch FROM `dev`: `git checkout -b [task-name]-oc`
- [ ] Update task status to "In progress"
- [ ] **Start the dev server:** Run `npm start` and verify it starts without errors

### While Working:

- [ ] Use theme context for all colors
- [ ] Follow existing file naming conventions
- [ ] Add TypeScript types for new data structures
- [ ] Test on both light and dark mode

### Before Submitting PR:

- [ ] Test the feature works end-to-end
- [ ] Check no console errors
- [ ] Verify TypeScript compiles: `npx tsc --noEmit`
- [ ] Run lint: `npm run lint`
- [ ] Write PR description with screenshots if UI changed
- [ ] Mention @Vinson for review

---

## 📦 Data Models (Current)

### Expense (UI Model)

```typescript
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
```

### Firestore Schema (Planned)

```typescript
// users/{userId}/budgets/{budgetId}
interface Budget {
  id: string;
  month: string; // "2026-02"
  totalBudget: number;
  categories: Category[];
  createdAt: Timestamp;
}

// users/{userId}/transactions/{transactionId}
interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  note?: string;
  date: Timestamp;
  createdAt: Timestamp;
}
```

---

## 📝 Communication Format

When I need review:

```
🛑 REVIEW REQUIRED: [Topic]

Options:
1. [Option A] — pros/cons
2. [Option B] — pros/cons

Recommendation: [My pick + why]

@Vinson — Approve or discuss?
```

When proceeding:

```
✅ ON IT: [Task]
[Progress updates]
```

---

## 🚀 Next Development Priorities

1. **Firestore Data Layer** — Connect expense data to Firebase
2. **Add Expense Screen** — Modal/screen for adding new expenses
3. **Budget Management** — CRUD for budget categories

---

**Last Updated:** 2026-02-07 by Atlas 🌍 (Added: Dev server startup protocol)
