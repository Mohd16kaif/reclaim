// ============================================================================
// RECLAIM — Notification Manager
// utils/notificationManager.ts
//
// Handles all 9 notification types for Reclaim.
// Uses expo-notifications — already in your package.json.
//
// All notifications are local. No server, no APNs certificate needed.
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { OverallShieldState } from "./shieldLayers";

// ============================================================================
// NOTIFICATION HANDLER CONFIG
// Call this once at app startup (in App.tsx or _layout.tsx)
// ============================================================================

export const configureNotifications = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

// ============================================================================
// PERMISSION REQUEST
// Call once during onboarding or first shield enable.
// ============================================================================

export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

const NOTIF_KEYS = {
  DAILY_CHECKIN_ID: "@reclaim_notif_daily_checkin",
  WEEKLY_RECLAIMED_ID: "@reclaim_notif_weekly_reclaimed",
  RISK_WINDOW_ID: "@reclaim_notif_risk_window",
  LAST_STREAK_NOTIFIED: "@reclaim_notif_last_streak",
  CHECKIN_HOUR: "@reclaim_notif_checkin_hour",
  CHECKIN_MINUTE: "@reclaim_notif_checkin_minute",
  RISK_HOUR: "@reclaim_notif_risk_hour",
};

// ============================================================================
// STREAK MILESTONES
// ============================================================================

const STREAK_MILESTONES = [3, 7, 15, 30, 45, 60, 90];

const getBigMilestone = (days: number): boolean => days >= 30;

// ============================================================================
// 1. DAILY CHECK-IN REMINDER
// Scheduled recurring — fires every day at user's preferred time.
// ============================================================================

export const scheduleDailyCheckIn = async (
  hour: number = 20,
  minute: number = 0,
): Promise<void> => {
  // Cancel existing before rescheduling
  await cancelDailyCheckIn();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Check-In",
      body: "Take a minute to log today.",
      data: { type: "daily_checkin" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });

  await AsyncStorage.multiSet([
    [NOTIF_KEYS.DAILY_CHECKIN_ID, id],
    [NOTIF_KEYS.CHECKIN_HOUR, hour.toString()],
    [NOTIF_KEYS.CHECKIN_MINUTE, minute.toString()],
  ]);
};

export const cancelDailyCheckIn = async (): Promise<void> => {
  const id = await AsyncStorage.getItem(NOTIF_KEYS.DAILY_CHECKIN_ID);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(NOTIF_KEYS.DAILY_CHECKIN_ID);
  }
};

// ============================================================================
// 2. STREAK MILESTONE
// Fired immediately when user hits a milestone streak day.
// Call this from your check-in / streak update logic.
// ============================================================================

export const fireStreakMilestone = async (
  streakDays: number,
): Promise<void> => {
  if (!STREAK_MILESTONES.includes(streakDays)) return;

  // Prevent duplicate notifications for the same milestone
  const lastNotified = await AsyncStorage.getItem(
    NOTIF_KEYS.LAST_STREAK_NOTIFIED,
  );
  if (lastNotified === streakDays.toString()) return;

  const isBig = getBigMilestone(streakDays);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isBig ? `${streakDays} Days` : `${streakDays} Days Strong`,
      body: isBig ? "Progress compounds over time." : "Momentum is building.",
      data: { type: "streak_milestone", days: streakDays },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });

  await AsyncStorage.setItem(
    NOTIF_KEYS.LAST_STREAK_NOTIFIED,
    streakDays.toString(),
  );
};

// ============================================================================
// 3. CHAPTER COMPLETED
// Fire when user completes the last day of a chapter.
// ============================================================================

export const fireChapterCompleted = async (
  nextChapterName: string,
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Chapter Complete",
      body: `${nextChapterName} begins now.`,
      data: { type: "chapter_completed", nextChapter: nextChapterName },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
};

// ============================================================================
// 4. CHAPTER REMAINING
// Scheduled when a chapter starts. Fires 1–2 days before chapter ends.
// ============================================================================

export const scheduleChapterReminder = async (
  chapterEndDate: Date,
  daysBeforeEnd: 1 | 2 = 1,
): Promise<void> => {
  const fireDate = new Date(chapterEndDate);
  fireDate.setDate(fireDate.getDate() - daysBeforeEnd);
  fireDate.setHours(9, 0, 0, 0); // 9 AM on reminder day

  // Don't schedule if the fire date is in the past
  if (fireDate <= new Date()) return;

  const almostThere = daysBeforeEnd <= 2;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: almostThere
        ? "Almost There"
        : `${daysBeforeEnd} Days to Next Milestone`,
      body: almostThere
        ? `${daysBeforeEnd} day${daysBeforeEnd > 1 ? "s" : ""} remaining.`
        : "Stay steady.",
      data: { type: "chapter_remaining", daysRemaining: daysBeforeEnd },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });
};

// ============================================================================
// 5. BLOCKING ACTIVATED (Panic Pressed)
// Fire immediately when user confirms panic mode.
// ============================================================================

export const fireBlockingActivated = async (): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Focus Mode Activated",
      body: "You took control.",
      data: { type: "blocking_activated" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  });
};

// ============================================================================
// 6. PANIC SUCCESSFUL (No Relapse)
// Fire when panic session ends and user stayed strong.
// ============================================================================

export const firePanicSuccessful = async (): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Session Complete",
      body: "You stayed aligned.",
      data: { type: "panic_successful" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  });
};

// ============================================================================
// 7. RELAPSE (Delayed — 30 min after logging)
// Delayed so it doesn't feel like punishment in the moment.
// ============================================================================

export const scheduleRelapseRecovery = async (): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Stay Steady",
      body: "One moment doesn't define progress.",
      data: { type: "relapse_recovery" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 30 * 60, // 30 minutes
    },
  });
};

// ============================================================================
// 8. RISK WINDOW REMINDER
// Daily notification at user's identified risk time.
// ============================================================================

export const scheduleRiskWindowReminder = async (
  riskHour: number,
  riskMinute: number = 0,
): Promise<void> => {
  // Cancel existing risk window reminder first
  await cancelRiskWindowReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Stay Intentional",
      body: `Your focused hour begins at ${formatHour(riskHour)}.`,
      data: { type: "risk_window", riskHour },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: riskHour,
      minute: riskMinute,
      repeats: true,
    },
  });

  await AsyncStorage.multiSet([
    [NOTIF_KEYS.RISK_WINDOW_ID, id],
    [NOTIF_KEYS.RISK_HOUR, riskHour.toString()],
  ]);
};

export const cancelRiskWindowReminder = async (): Promise<void> => {
  const id = await AsyncStorage.getItem(NOTIF_KEYS.RISK_WINDOW_ID);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(NOTIF_KEYS.RISK_WINDOW_ID);
  }
};

// ============================================================================
// 9. TIME RECLAIMED (Weekly)
// Scheduled every Sunday morning. Reads week's session data at fire time.
// Pass in hours_saved when scheduling — computed from statsStorage.
// ============================================================================

export const scheduleWeeklyTimeReclaimed = async (
  hoursSaved: number,
): Promise<void> => {
  // Cancel existing weekly notification
  const existingId = await AsyncStorage.getItem(NOTIF_KEYS.WEEKLY_RECLAIMED_ID);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time Reclaimed",
      body: `You redirected ${hoursSaved} hour${hoursSaved !== 1 ? "s" : ""} this week.`,
      data: { type: "time_reclaimed", hoursSaved },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 1, // Sunday (1 = Sunday in expo-notifications)
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });

  await AsyncStorage.setItem(NOTIF_KEYS.WEEKLY_RECLAIMED_ID, id);
};

// ============================================================================
// WATCHDOG ALERT (Internal — called from watchdog.ts)
// Not part of the user-facing 9 notifications.
// Fires when shield protection drops significantly.
// ============================================================================

export const scheduleWatchdogAlert = async (
  state: OverallShieldState,
  score: number,
): Promise<void> => {
  const isVulnerable = state === "vulnerable";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isVulnerable ? "Protection Disabled" : "Shield Weakened",
      body: isVulnerable
        ? "Your Reclaim Shield is off. Tap to re-enable."
        : "Some protection layers are inactive. Tap to restore.",
      data: { type: "watchdog_alert", score, state },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  });
};

// ============================================================================
// SETUP ALL RECURRING NOTIFICATIONS
// Call during onboarding completion or after permissions granted.
// ============================================================================

export const setupRecurringNotifications = async (options?: {
  checkInHour?: number;
  checkInMinute?: number;
  riskHour?: number;
}): Promise<void> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const promises: Promise<void>[] = [
    scheduleDailyCheckIn(
      options?.checkInHour ?? 20,
      options?.checkInMinute ?? 0,
    ),
  ];

  if (options?.riskHour !== undefined) {
    promises.push(scheduleRiskWindowReminder(options.riskHour));
  }

  await Promise.all(promises);
};

// ============================================================================
// CANCEL ALL NOTIFICATIONS
// Use when user disables notifications in settings.
// ============================================================================

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.multiRemove([
    NOTIF_KEYS.DAILY_CHECKIN_ID,
    NOTIF_KEYS.WEEKLY_RECLAIMED_ID,
    NOTIF_KEYS.RISK_WINDOW_ID,
  ]);
};

// ============================================================================
// NOTIFICATION RESPONSE HANDLER
// Wire this to Notifications.addNotificationResponseReceivedListener
// in your _layout.tsx. Returns the route to navigate to.
// ============================================================================

export type NotificationRouteAction =
  | { navigate: "Blocker" }
  | { navigate: "Home" }
  | { navigate: "PanicShield" }
  | { navigate: "Stats" }
  | null;

export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
): NotificationRouteAction => {
  const data = response.notification.request.content.data as Record<
    string,
    unknown
  >;
  const type = data?.type as string;

  switch (type) {
    case "daily_checkin":
      return { navigate: "Home" };
    case "streak_milestone":
      return { navigate: "Stats" };
    case "chapter_completed":
    case "chapter_remaining":
      return { navigate: "Home" };
    case "blocking_activated":
    case "panic_successful":
      return { navigate: "Home" };
    case "relapse_recovery":
      return { navigate: "Home" };
    case "risk_window":
      return { navigate: "PanicShield" };
    case "time_reclaimed":
      return { navigate: "Stats" };
    case "watchdog_alert":
      return { navigate: "Blocker" };
    default:
      return null;
  }
};

// ============================================================================
// HELPERS
// ============================================================================

const formatHour = (hour: number): string => {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
};
