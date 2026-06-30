# Daily Expense-Logging Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single on-device daily notification (default 8:00 PM) that reminds the user to log expenses, with an on/off toggle in Profile.

**Architecture:** All `expo-notifications` surface lives in one React-free helper (`lib/dailyReminder.ts`). The Profile screen drives it from a `Switch`. A mount-time effect in `app/_layout.tsx` enforces the "default ON" behavior and re-asserts the schedule on launch. Toggle state persists in AsyncStorage (`settings.dailyReminder`), matching how theme/language are stored.

**Tech Stack:** Expo 54, React Native 0.81, `expo-notifications`, AsyncStorage, i18next (en/es/ua), NativeWind, expo-router.

## Global Constraints

- **No test runner exists** in this project — verification is manual on simulator/device. Every "test" step is a manual observation, not an automated test.
- `expo-notifications` is a **native module** → requires `npx expo prebuild` and a **new build + store submission**. Ships in the same build as the in-progress `expo-speech-recognition` change.
- i18n: add every new string to **all three** locales — `locales/en.json`, `locales/es.json`, `locales/ua.json`.
- App name in copy: **Keelio**.
- Default reminder time: **20:00 (8:00 PM)**.
- AsyncStorage key for toggle: `settings.dailyReminder` (string `'true'`/`'false'`; **absent = treated as ON**).
- AsyncStorage key for scheduled id: `settings.dailyReminderId`.
- Follow existing import style: **no barrel/index re-exports**; import from the specific file.
- Commit after each task.

---

### Task 1: Add `expo-notifications` dependency and native config

**Files:**
- Modify: `package.json` (dependency)
- Modify: `app.json` (`plugins`, iOS `infoPlist`)

**Interfaces:**
- Consumes: nothing
- Produces: the `expo-notifications` native module + config plugin available to later tasks. iOS Info.plist permission string present.

- [ ] **Step 1: Install the package**

Run:
```bash
npx expo install expo-notifications
```
Expected: `expo-notifications` appears under `dependencies` in `package.json` at the SDK-54-compatible version.

- [ ] **Step 2: Add the config plugin to `app.json`**

In `app.json`, inside the `"plugins"` array, add the `expo-notifications` entry alongside the existing plugins (e.g. after the `expo-speech-recognition` block):

```json
[
  "expo-notifications",
  {
    "color": "#8B5CF6"
  }
]
```

- [ ] **Step 3: Add the iOS usage description**

In `app.json` under `"ios" → "infoPlist"`, add (next to the existing keys like `ITSAppUsesNonExemptEncryption`):

```json
"NSUserNotificationsUsageDescription": "Keelio sends you a daily reminder to log your expenses so you never forget."
```

- [ ] **Step 4: Regenerate native projects**

Run:
```bash
npx expo prebuild --clean
```
Expected: completes without errors; `ios/` and `android/` regenerated with the notifications module.

- [ ] **Step 5: Verify it builds + type-checks**

Run:
```bash
npx tsc --noEmit
```
Expected: no new type errors. (Module resolves; nothing imports it yet.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app.json ios android
git commit -m "build: add expo-notifications dependency and native config"
```

---

### Task 2: Create the `lib/dailyReminder.ts` helper

**Files:**
- Create: `lib/dailyReminder.ts`

**Interfaces:**
- Consumes: `expo-notifications`, `@react-native-async-storage/async-storage`, `i18next` (the app's configured instance from `../i18n`), `react-native` `Platform`.
- Produces (exact signatures later tasks rely on):
  - `configureNotificationHandler(): void`
  - `requestPermission(): Promise<boolean>`
  - `scheduleDailyReminder(hour?: number, minute?: number): Promise<void>` (defaults `hour=20, minute=0`)
  - `cancelDailyReminder(): Promise<void>`
  - `isReminderEnabled(): Promise<boolean>` (absent key → `true`)
  - `setReminderEnabled(enabled: boolean): Promise<void>`
  - `syncDailyReminderOnLaunch(): Promise<void>`

- [ ] **Step 1: Write the helper**

Create `lib/dailyReminder.ts` with the full contents:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../i18n';

const ENABLED_KEY = 'settings.dailyReminder';
const SCHEDULED_ID_KEY = 'settings.dailyReminderId';
const ANDROID_CHANNEL_ID = 'daily-reminder';
const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;

/**
 * Show scheduled notifications even when the app is foregrounded.
 * Safe to call multiple times.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: i18n.t('notifications.channelName'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (e) {
    console.warn('[dailyReminder] failed to create channel', e);
  }
}

/** Ask the OS for notification permission. Returns whether it is granted. */
export async function requestPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch (e) {
    console.warn('[dailyReminder] permission request failed', e);
    return false;
  }
}

/** Cancel any existing reminder, then schedule a repeating daily one. */
export async function scheduleDailyReminder(
  hour: number = DEFAULT_HOUR,
  minute: number = DEFAULT_MINUTE
): Promise<void> {
  try {
    await cancelDailyReminder();
    await ensureAndroidChannel();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.dailyReminderTitle'),
        body: i18n.t('notifications.dailyReminderBody'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
    await AsyncStorage.setItem(SCHEDULED_ID_KEY, id);
  } catch (e) {
    console.warn('[dailyReminder] schedule failed', e);
  }
}

/** Cancel the scheduled reminder, if any. */
export async function cancelDailyReminder(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(SCHEDULED_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(SCHEDULED_ID_KEY);
    }
  } catch (e) {
    console.warn('[dailyReminder] cancel failed', e);
  }
}

/** Stored toggle state. Absent key means ON (default). */
export async function isReminderEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ENABLED_KEY);
  return value !== 'false';
}

export async function setReminderEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Enforce default-ON behavior and re-assert the schedule on app launch.
 * - If enabled: ensure permission (request if undetermined). If granted,
 *   (re)schedule. If denied, persist the toggle as off so the UI is honest.
 * - If disabled: do nothing.
 */
export async function syncDailyReminderOnLaunch(): Promise<void> {
  try {
    const enabled = await isReminderEnabled();
    if (!enabled) return;
    const granted = await requestPermission();
    if (granted) {
      await scheduleDailyReminder();
    } else {
      await setReminderEnabled(false);
    }
  } catch (e) {
    console.warn('[dailyReminder] launch sync failed', e);
  }
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors. (i18n keys are referenced as strings; they're added in Task 3 — type-check passes regardless since `t()` takes a string.)

- [ ] **Step 3: Commit**

```bash
git add lib/dailyReminder.ts
git commit -m "feat: add daily reminder notification helper"
```

---

### Task 3: Add i18n strings to all three locales

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/es.json`
- Modify: `locales/ua.json`

**Interfaces:**
- Consumes: nothing
- Produces: i18n keys used by Task 2 (`notifications.*`) and Task 4 (`profile.notifications`, `profile.dailyReminderSubtitle`, `profile.notificationsDeniedTitle`, `profile.notificationsDeniedBody`).

- [ ] **Step 1: Add a top-level `notifications` block + profile keys to `en.json`**

Add a new top-level `"notifications"` object (sibling of `"profile"`):

```json
"notifications": {
  "channelName": "Daily reminders",
  "dailyReminderTitle": "Keelio",
  "dailyReminderBody": "Don't forget to log today's expenses 📝"
}
```

And inside the existing `"profile"` object, add:

```json
"notifications": "Daily reminder",
"dailyReminderSubtitle": "Get a nudge to log your expenses",
"notificationsDeniedTitle": "Notifications are off",
"notificationsDeniedBody": "Enable notifications for Keelio in your device Settings to get daily reminders."
```

- [ ] **Step 2: Add the same keys to `es.json` (Spanish)**

Top-level `"notifications"`:

```json
"notifications": {
  "channelName": "Recordatorios diarios",
  "dailyReminderTitle": "Keelio",
  "dailyReminderBody": "No olvides registrar los gastos de hoy 📝"
}
```

Inside `"profile"`:

```json
"notifications": "Recordatorio diario",
"dailyReminderSubtitle": "Recibe un aviso para registrar tus gastos",
"notificationsDeniedTitle": "Las notificaciones están desactivadas",
"notificationsDeniedBody": "Activa las notificaciones de Keelio en los Ajustes de tu dispositivo para recibir recordatorios diarios."
```

- [ ] **Step 3: Add the same keys to `ua.json` (Ukrainian)**

Top-level `"notifications"`:

```json
"notifications": {
  "channelName": "Щоденні нагадування",
  "dailyReminderTitle": "Keelio",
  "dailyReminderBody": "Не забудьте записати сьогоднішні витрати 📝"
}
```

Inside `"profile"`:

```json
"notifications": "Щоденне нагадування",
"dailyReminderSubtitle": "Отримуйте нагадування записувати витрати",
"notificationsDeniedTitle": "Сповіщення вимкнено",
"notificationsDeniedBody": "Увімкніть сповіщення для Keelio в налаштуваннях пристрою, щоб отримувати щоденні нагадування."
```

- [ ] **Step 4: Verify JSON validity**

Run:
```bash
node -e "['en','es','ua'].forEach(l=>{JSON.parse(require('fs').readFileSync('locales/'+l+'.json','utf8'));console.log(l,'ok')})"
```
Expected: `en ok`, `es ok`, `ua ok` (no JSON parse error from a trailing/missing comma).

- [ ] **Step 5: Commit**

```bash
git add locales/en.json locales/es.json locales/ua.json
git commit -m "i18n: add daily reminder notification strings"
```

---

### Task 4: Add the toggle row to the Profile Settings group

**Files:**
- Modify: `app/(tabs)/profile.tsx` (imports, state, handler, render row in the Settings group ~line 458+)

**Interfaces:**
- Consumes from Task 2: `isReminderEnabled`, `setReminderEnabled`, `requestPermission`, `scheduleDailyReminder`, `cancelDailyReminder`. From Task 3: i18n keys.
- Produces: a working `Switch` row that toggles the reminder.

- [ ] **Step 1: Add `Switch` to the react-native import**

In `app/(tabs)/profile.tsx`, add `Switch` to the existing `react-native` import list (alphabetically near `StatusBar`):

```ts
  StatusBar,
  Switch,
  Text,
```

- [ ] **Step 2: Import the reminder helper**

Add near the other relative imports at the top of `app/(tabs)/profile.tsx`:

```ts
import {
  cancelDailyReminder,
  isReminderEnabled,
  requestPermission,
  scheduleDailyReminder,
  setReminderEnabled,
} from '../../lib/dailyReminder';
```

Also ensure `useEffect` and `useState` are imported from React (the file currently imports `React`):

```ts
import React, { useEffect, useState } from 'react';
```

- [ ] **Step 3: Add state + load current value**

Inside the Profile component body (near the other hooks around line 145), add:

```ts
  const [reminderOn, setReminderOn] = useState(true);

  useEffect(() => {
    isReminderEnabled().then(setReminderOn);
  }, []);
```

- [ ] **Step 4: Add the toggle handler**

Add this handler alongside the other handlers (e.g. near `handleChangeLanguage`):

```ts
  const handleToggleReminder = async (next: boolean) => {
    if (next) {
      const granted = await requestPermission();
      if (!granted) {
        setReminderOn(false);
        await setReminderEnabled(false);
        Alert.alert(
          t('profile.notificationsDeniedTitle'),
          t('profile.notificationsDeniedBody')
        );
        return;
      }
      await scheduleDailyReminder();
      await setReminderEnabled(true);
      setReminderOn(true);
    } else {
      await cancelDailyReminder();
      await setReminderEnabled(false);
      setReminderOn(false);
    }
  };
```

- [ ] **Step 5: Render the toggle row in the Settings group**

In the Settings group card (the `<View>` opened right after `{t('profile.settings')}`, around line 462), add this row as the first child of that inner card `<View>`, immediately above the `{/* Theme Preference */}` block:

```tsx
            {/* Daily Reminder */}
            <View
              className="flex-row items-center justify-between border-b py-4"
              style={{ borderBottomColor: theme.border }}>
              <View className="flex-1 flex-row items-center">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: isDarkMode ? 'rgba(245,158,11,0.15)' : '#FEF3C7' }}>
                  <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                </View>
                <View className="ml-4 flex-1 pr-3">
                  <Text className="text-base font-medium" style={{ color: theme.textPrimary }}>
                    {t('profile.notifications')}
                  </Text>
                  <Text className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                    {t('profile.dailyReminderSubtitle')}
                  </Text>
                </View>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={handleToggleReminder}
                trackColor={{ false: '#767577', true: theme.purple }}
              />
            </View>
```

- [ ] **Step 6: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Manual verification on simulator**

Run:
```bash
npx expo run:ios
```
Manually verify:
- Profile → Settings shows the "Daily reminder" row with a switch ON (default).
- Toggling OFF then ON re-prompts/permits without crashing.
- Denying OS permission (reset permissions in simulator settings) flips the switch OFF and shows the denied alert.

- [ ] **Step 8: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: add daily reminder toggle to profile settings"
```

---

### Task 5: Wire launch-time sync + notification handler in `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx` (import + mount effect)

**Interfaces:**
- Consumes from Task 2: `configureNotificationHandler`, `syncDailyReminderOnLaunch`.
- Produces: default-ON behavior on first launch after update; schedule re-asserted each launch.

- [ ] **Step 1: Import the helpers**

Add to the imports at the top of `app/_layout.tsx`:

```ts
import { configureNotificationHandler, syncDailyReminderOnLaunch } from '../lib/dailyReminder';
```

- [ ] **Step 2: Configure the handler once at module load**

Immediately after the imports in `app/_layout.tsx` (top level, outside any component), add:

```ts
configureNotificationHandler();
```

- [ ] **Step 3: Run the launch sync from `RootLayoutNav`**

Inside `RootLayoutNav`, add a mount-only effect (alongside the existing `useEffect`):

```ts
  useEffect(() => {
    syncDailyReminderOnLaunch();
  }, []);
```

- [ ] **Step 4: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Manual verification (default-ON first launch)**

Run:
```bash
npx expo run:ios
```
Manually verify on a fresh install (no stored `settings.dailyReminder`):
- App requests notification permission once on launch.
- Granting → Profile toggle shows ON.
- Denying → Profile toggle shows OFF.
- To verify firing without waiting until 8 PM, temporarily change the launch schedule to a near-future minute (or use a one-off test schedule), confirm the banner appears with the localized title/body, then revert.

- [ ] **Step 6: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: schedule daily reminder on app launch (default on)"
```

---

## Final verification (before submission)

- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run lint` clean.
- [ ] Reminder toggle works in all three languages (en/es/ua) — labels and notification copy localized.
- [ ] Verified on **both** iOS and Android (permission models and channel behavior differ).
- [ ] Confirm this build also contains the `expo-speech-recognition` voice change before submitting (single combined release).
