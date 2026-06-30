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
