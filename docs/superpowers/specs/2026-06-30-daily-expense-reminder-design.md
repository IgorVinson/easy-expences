# Daily Expense-Logging Reminder — Design

**Date:** 2026-06-30
**Status:** Approved (design)
**Author:** Igor Vinson (with Claude)

## Goal

Add a single **daily local notification** that nudges the user to log their
expenses/income. On-device only (option A): no push, no backend, no server
infrastructure. Fires even when the device is offline.

### Explicitly out of scope (YAGNI)

- Subscription-charge reminders (Apple already warns before trial conversion;
  decided against for now).
- Time picker / fully configurable schedule.
- "Smart" skip-if-already-logged-today behavior.
- Server-driven / push notifications (RevenueCat webhooks, APNs/FCM).

## Store-delivery impact

`expo-notifications` is a **native module** with native permission requirements,
so this requires a **new native build + a new submission to both stores**. It
cannot ship as an OTA / EAS Update (and EAS Update is not configured in this
project anyway).

This release is **bundled together with the in-progress Gemini → local
`expo-speech-recognition` voice change**, which also requires a new build — one
submission covers both.

## User-facing behavior

- **Default: ON.** On the first launch after this update, the app requests
  notification permission once.
  - Permission **granted** → schedule the daily reminder at **20:00 (8:00 PM)**;
    toggle shows ON.
  - Permission **denied** at OS level → stored toggle flips **OFF** so the UI
    stays honest; no notification scheduled.
- A **toggle in Profile** lets the user turn the reminder on/off at any time.
  - Turning ON when OS permission is denied → show an `Alert` directing the user
    to system Settings; leave the toggle off.
- The notification fires **once per day at 20:00**, repeating, regardless of
  whether the user already logged something that day (skip-if-logged is out of
  scope).

## Architecture

### 1. Dependency & native config

- Add `expo-notifications` to `package.json`.
- Add the `expo-notifications` config plugin to `app.json` `plugins`, including
  the iOS permission usage description.
- Run `npx expo prebuild` to regenerate native projects.

### 2. `lib/dailyReminder.ts` — self-contained helper (no React)

Single file that owns all `expo-notifications` surface area. Interface:

| Function | Responsibility |
|---|---|
| `requestPermission(): Promise<boolean>` | Ask the OS once; return granted/denied. |
| `scheduleDailyReminder(hour=20, minute=0): Promise<void>` | Cancel any existing reminder, then schedule a repeating daily notification at the given time. |
| `cancelDailyReminder(): Promise<void>` | Cancel the scheduled reminder. |
| `isReminderEnabled(): Promise<boolean>` | Read stored toggle state (default `true` when key absent). |
| `setReminderEnabled(enabled: boolean): Promise<void>` | Persist toggle state. |

- Toggle state persisted in **AsyncStorage** under `settings.dailyReminder`
  (device-global, matching how theme/language are stored). Absent key = `true`
  (default ON).
- Notification content (title/body) pulled from i18n at schedule time.
- A fixed notification identifier / category is used so re-scheduling is
  idempotent (cancel-then-create).

### 3. App-launch sync

In the app's root/launch path (e.g. `app/_layout.tsx` or an effect mounted with
the tabs), on start:

1. Read `isReminderEnabled()`.
2. If enabled:
   - Ensure OS permission. If permission status is undetermined, request it.
   - If granted → `scheduleDailyReminder()` (idempotent re-assert; guards
     against the OS dropping the schedule).
   - If denied → `setReminderEnabled(false)`.

This is the mechanism that makes "default ON" work for existing users updating
the app, and self-heals if a scheduled notification is lost.

### 4. Profile UI — toggle row

In `app/(tabs)/profile.tsx`, add a `Switch` row (new "Notifications" card or
appended to the settings section), styled to match existing rows
(`theme.cardBg`, `theme.border`, `theme.textPrimary/textSecondary`, dark/light
shadow pattern). Behavior:

- **Switch ON:** `requestPermission()` → if granted `scheduleDailyReminder()` +
  `setReminderEnabled(true)`; if denied, `Alert` → system Settings, keep off.
- **Switch OFF:** `cancelDailyReminder()` + `setReminderEnabled(false)`.

### 5. i18n

Add keys to **all three** locales (`locales/en.json`, `es.json`, `ua.json`):

- Toggle row label + subtitle (e.g. "Daily reminder" / "Get a nudge to log
  your expenses").
- Permission-denied alert title + body.
- **Notification title + body** (e.g. title "Keelio", body "Don't forget to log
  today's expenses 📝").

## Data flow

```
App launch ──► isReminderEnabled()?
                    │ true
                    ▼
            OS permission status?
             ├─ granted ──► scheduleDailyReminder(20:00)
             ├─ undetermined ──► requestPermission() ──► (granted/denied branch)
             └─ denied ──► setReminderEnabled(false)

Profile Switch ──► ON  ──► requestPermission ──► schedule + persist(true)
                └─ OFF ──► cancelDailyReminder + persist(false)
```

## Error handling

- All `expo-notifications` calls wrapped in try/catch; failures log and degrade
  gracefully (never crash the app over a reminder).
- Permission denial is a normal, expected path — reflected in stored state, not
  an error.
- Re-scheduling is always cancel-then-create to avoid duplicate stacked daily
  notifications.

## Testing (manual — no test runner in this project)

- Fresh install / first launch after update: permission prompt appears once;
  granting schedules the 8 PM reminder.
- Toggle off in Profile → no notification next day; toggle on → it returns.
- Deny OS permission → toggle reflects OFF; re-enabling re-prompts / routes to
  Settings.
- Verify in all three languages.
- Verify on both iOS and Android (permission models differ).
