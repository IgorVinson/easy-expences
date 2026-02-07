# 🏗️ Easy Expenses Development Protocol

**Repo:** `/Users/ihorvinson/.openclaw/workspace/easy-expences`  
**Stack:** React Native + Expo + NativeWind (Tailwind)  
**Project Management:** Notion — EasyBudget Project

---

## 📝 Task Tracking (Notion Integration)

**ALL tasks for this project are tracked in Notion's EasyBudget project.**

**Notion Project:** [EasyBudget](https://www.notion.so/EasyBudget-2f5d26d1ebf080b19340eed8a777b6c1)  
**Tasks Database:** Vinson Ventures Tasks  
**Project ID:** `2f5d26d1-ebf0-80b1-9340-eed8a777b6c1`

### Atlas Task Workflow:

| Step | Action | Notion Status |
|------|--------|---------------|
| **1. Initialize** | Create/update task in Notion with estimate (hours, tokens, cost) | `Backlog Next 7 days` |
| **2. Start Work** | Move task to In progress when beginning | `In progress` |
| **3. Progress** | Add daily notes to task as blocks | Stays `In progress` |
| **4. Complete** | Write completion overview, mention @Vinson for review | `In progress` (awaiting review) |
| **5. Done** | — | **Mr. Vinson moves to `Done`** |

### Estimates I Add to Every Task:
- **Plan, hour:** Estimated dev hours
- **Tokens:** ~2M tokens per hour (input + output)
- **Cost:** `(tokens / 1M) × $0.50` (kimi-coding/k2p5 rate)

---

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
| Branch | Purpose | Who Merges |
|--------|---------|------------|
| `main` | Production code | Mr. Vinson only (via PR) |
| `[task-name]-oc` | One branch per Notion task | Mr. Vinson via PR review |

### Workflow:
1. **Notion task created** → I create branch `[short-title]-oc`
2. **All work on that task** → commits to that branch
3. **Task complete** → I create PR for Mr. Vinson to review
4. **Mr. Vinson reviews** → approves & merges or requests changes

### What Goes in a Task Branch (All via PR):
- ✅ Architecture changes
- ✅ New screens/pages (UI)
- ✅ Major design changes
- ✅ Database changes
- ✅ Small components (multiple commits OK, still one PR at end)
- ✅ Tests, docs, refactoring related to the task

### PR Template:
```
## Task: [Notion Task Name]
Branch: `[branch-name]`

### What Changed:
- [List of changes]

### Screenshots/Videos:
- [If UI changes]

### Testing:
- [How to test]

@Vinson — Ready for review
```

### No Direct Commits to:
- ❌ `main` (ever)
- ❌ `atlas-dev` (deprecated — use task branches only)

---

## Current Architecture Overview

```
📁 easy-expences/
├── 📁 components/           # Reusable UI components
│   ├── Container.tsx        # SafeArea wrapper
│   ├── EditScreenInfo.tsx   # Dev info component
│   └── ScreenContent.tsx    # Screen layout template
├── 📁 assets/               # Images, fonts
├── App.tsx                  # Root component (entry point)
├── app.json                 # Expo configuration
├── global.css               # Tailwind imports
├── tailwind.config.js       # Tailwind + NativeWind config
├── metro.config.js          # Metro bundler config
└── babel.config.js          # Babel configuration
```

### Current Stack Details
- **React Native:** 0.81.5
- **Expo SDK:** ^54.0.0
- **React:** 19.1.0
- **NativeWind:** Latest (Tailwind for RN)
- **Navigation:** Not set up yet (needs React Navigation)
- **State Management:** Not set up yet (needs Zustand/Context)
- **Storage:** Not set up yet (needs AsyncStorage/WatermelonDB)

### Current State
**Just a starter template** with:
- Profile card UI placeholder
- NativeWind/Tailwind styling configured
- Basic component structure

---

## 🛑 STOP — Request Review Before Coding

| Decision Type | Examples | What I Send You |
|--------------|----------|-----------------|
| **Architecture** | Navigation structure (React Navigation vs Expo Router), state management choice, folder organization | Markdown doc with rationale |
| **Data Layer** | Storage solution (AsyncStorage vs SQLite vs WatermelonDB), data model design | Schema + sync strategy |
| **UI Framework** | Component library (React Native Paper vs native + Tailwind), theming system | Component examples + comparison |
| **Major Dependencies** | Navigation, charts, auth, backend integration | List with size + justification |
| **Build/Deploy** | EAS Build config, app store setup, CI/CD | Config files for review |
| **Feature Scope** | What MVP includes vs v1.0 vs later | Feature list with priorities |

---

## ✅ GO — I Proceed Without Review

| Task Type | Examples |
|-----------|----------|
| **Boilerplate Setup** | Installing navigation, setting up folder structure following agreed pattern |
| **UI Components** | Building screens following established design system |
| **Screen Implementation** | Individual screens after navigation is set up |
| **Refactoring** | Code organization, renaming, extracting components |
| **Styling Tweaks** | Tailwind class adjustments, spacing, colors |
| **Bug Fixes** | Logic errors, type fixes within existing patterns |

---

## 📋 Checkpoint Workflow

### 1. Architecture Phase (NOW)
Before any feature code, I present:
- Navigation approach (Expo Router vs React Navigation)
- Folder structure (features vs screens vs components)
- State management + storage strategy
- UI component strategy (build vs library)

→ **You approve the blueprint, then I build**

### 2. Foundation Checkpoint
After setup:
- Navigation working with placeholder screens
- Theme/colors configured
- Storage layer working

→ **Quick review, then features**

### 3. Feature Development
Each major feature:
- I build the UI + logic
- You review the UX/behavior
- Iterate if needed

---

## 🎯 First Decision Needed: Architecture Blueprint

### Navigation Options:
| Option | Pros | Cons |
|--------|------|------|
| **Expo Router** (file-based) | Expo official, automatic deep linking, simpler | Newer, smaller community |
| **React Navigation** | Mature, flexible, well-documented | More boilerplate |

**My Recommendation:** Expo Router — cleaner code, Expo-native

### State + Storage Options:
| Layer | Options |
|-------|---------|
| **Global State** | Zustand (lightweight) or Context |
| **Persistent Storage** | AsyncStorage (simple) or WatermelonDB (complex queries) |

**My Recommendation:** Zustand + AsyncStorage for MVP

### Data Model (MVP):
```typescript
// Budget Period (monthly)
interface Budget {
  id: string;
  month: string; // "2026-02"
  totalBudget: number;
  categories: Category[];
}

// Category with planned vs actual
interface Category {
  id: string;
  name: string;
  plannedAmount: number;
  actualAmount: number;
  color: string;
}

// Individual expense transaction
interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  note?: string;
  date: Date;
}
```

### Suggested Folder Structure:
```
📁 app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation group
│   │   ├── index.tsx        # Dashboard/home
│   │   ├── budget.tsx       # Budget setup/view
│   │   ├── expenses.tsx     # Add/view expenses
│   │   └── settings.tsx     # App settings
│   └── _layout.tsx          # Root layout
📁 components/               # Shared UI components
│   ├── ui/                  # Primitive components (Button, Card, Input)
│   ├── budget/              # Budget-specific components
│   └── expenses/            # Expense-specific components
📁 store/                    # Zustand stores
│   ├── budgetStore.ts
│   └── expenseStore.ts
📁 lib/                      # Utilities, constants
│   ├── storage.ts
│   └── utils.ts
📁 types/                    # TypeScript types
│   └── index.ts
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

## 🚀 Next Steps (Need Your Go)

1. **Approve architecture** (Expo Router + Zustand + AsyncStorage)
2. **Set up navigation** with placeholder screens
3. **Build data layer** (stores + storage)
4. **Implement screens** one by one

**Which should we start with?**

---

**Last Updated:** 2026-02-06 by Atlas 🌍
