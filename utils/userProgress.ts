import AsyncStorage from "@react-native-async-storage/async-storage";
import { CHAPTERS } from "../constants/chapters";
import { fireStreakMilestone } from "./notificationManager";

// ── Storage Keys (single source of truth) ─────────────────────────────────
export const KEYS = {
  CURRENT_CHAPTER_INDEX: "currentChapterIndex",
  CURRENT_CHAPTER_DAY: "currentChapterDay",
  CHAPTER_PROGRESS: "chapterProgress",
  CURRENT_STREAK: "currentStreak",
  LONGEST_STREAK: "longestStreak",
  LAST_RELAPSE_DATE: "lastRelapseDate",
  TOTAL_RELAPSE_COUNT: "totalRelapseCount",
  LAST_CHECK_IN_DATE: "lastCheckInDate",
  LAST_PROGRESS_DATE: "lastProgressDate",
  MEMBER_SINCE_DATE: "memberSinceDate",
  USER_NAME: "userName",
  USER_EMAIL: "userEmail",
  RISK_HOUR: "riskHour",
  AI_COACH_MODE: "aiCoachMode",
  DEFAULT_PANIC_DURATION: "defaultPanicDuration",
  APP_NOTIFICATIONS: "appNotifications",
  STREAK_START_DATE: "streakStartDate",
};

// ── User Progress Type ─────────────────────────────────────────────────────
export interface UserProgress {
  currentChapterIndex: number;
  currentChapterDay: number;
  chapterProgress: ChapterProgressItem[];
  currentStreak: number;
  longestStreak: number;
  totalRelapseCount: number;
  lastCheckInDate: string;
  lastRelapseDate: string;
  memberSinceDate: string;
  userName: string;
}

export type ChapterStatus = "active" | "completed" | "locked";

export interface ChapterProgressItem {
  chapter: number;
  status: ChapterStatus;
  daysCompleted: number;
  totalDays?: number;
}

export const getChapterFromStreak = (
  streak: number,
): { chapterIndex: number; chapterDay: number; status: ChapterStatus } => {
  const s = Math.max(0, Math.floor(streak));

  // Relapse / no streak yet: start at Chapter 1, Day 1
  if (s <= 0) {
    return { chapterIndex: 1, chapterDay: 1, status: "active" };
  }

  for (const ch of CHAPTERS) {
    if (s >= ch.startDay && s <= ch.endDay) {
      return {
        chapterIndex: ch.index,
        chapterDay: s - ch.startDay + 1,
        status: "active",
      };
    }
  }

  // Beyond journey: Chapter 7 stays completed
  const last = CHAPTERS[CHAPTERS.length - 1];
  return { chapterIndex: last.index, chapterDay: last.totalDays, status: "completed" };
};

// ── Read All Progress ──────────────────────────────────────────────────────
export const loadUserProgress = async (): Promise<UserProgress> => {
  const [
    streak,
    longestStreak,
    relapseCount,
    lastCheckIn,
    lastRelapse,
    memberSince,
    userName,
  ] = await Promise.all([
    AsyncStorage.getItem(KEYS.CURRENT_STREAK),
    AsyncStorage.getItem(KEYS.LONGEST_STREAK),
    AsyncStorage.getItem(KEYS.TOTAL_RELAPSE_COUNT),
    AsyncStorage.getItem(KEYS.LAST_CHECK_IN_DATE),
    AsyncStorage.getItem(KEYS.LAST_RELAPSE_DATE),
    AsyncStorage.getItem(KEYS.MEMBER_SINCE_DATE),
    AsyncStorage.getItem(KEYS.USER_NAME),
  ]);

  const currentStreak = parseInt(streak ?? "0", 10);

  let currentChapterIndex: number;
  let currentChapterDay: number;
  let chapterProgress: ChapterProgressItem[];

  if (currentStreak <= 0) {
    const derivedZero = getChapterFromStreak(0);
    currentChapterIndex = derivedZero.chapterIndex;
    currentChapterDay = derivedZero.chapterDay;
    chapterProgress = CHAPTERS.map((ch) => ({
      chapter: ch.index,
      status: ch.index === 1 ? "active" : "locked",
      daysCompleted: ch.index === 1 ? 1 : 0,
      totalDays: ch.totalDays,
    }));

    const [storedIndex, storedDay, storedProgress] = await Promise.all([
      AsyncStorage.getItem(KEYS.CURRENT_CHAPTER_INDEX),
      AsyncStorage.getItem(KEYS.CURRENT_CHAPTER_DAY),
      AsyncStorage.getItem(KEYS.CHAPTER_PROGRESS),
    ]);
    if (storedProgress && storedIndex != null && storedDay != null) {
      const idx = parseInt(storedIndex, 10);
      const day = parseInt(storedDay, 10);
      if (
        !Number.isNaN(idx) &&
        idx >= 1 &&
        !Number.isNaN(day) &&
        day >= 1
      ) {
        try {
          const parsed = JSON.parse(storedProgress) as ChapterProgressItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentChapterIndex = idx;
            currentChapterDay = day;
            chapterProgress = parsed;
          }
        } catch {
          // keep default chapter-1 state from above
        }
      }
    }
  } else {
    const derived = getChapterFromStreak(currentStreak);
    currentChapterIndex = derived.chapterIndex;
    currentChapterDay = derived.chapterDay;

    chapterProgress = CHAPTERS.map((ch) => {
      if (currentStreak >= ch.endDay) {
        return {
          chapter: ch.index,
          status: "completed",
          daysCompleted: ch.totalDays,
          totalDays: ch.totalDays,
        };
      }

      if (currentStreak >= ch.startDay && currentStreak <= ch.endDay) {
        return {
          chapter: ch.index,
          status: "active",
          daysCompleted: currentStreak - ch.startDay + 1,
          totalDays: ch.totalDays,
        };
      }

      return {
        chapter: ch.index,
        status: "locked",
        daysCompleted: 0,
        totalDays: ch.totalDays,
      };
    });
  }

  // Persist derived chapter state for any legacy callers that still read it.
  // Source of truth remains KEYS.CURRENT_STREAK.
  await Promise.all([
    AsyncStorage.setItem(KEYS.CURRENT_CHAPTER_INDEX, String(currentChapterIndex)),
    AsyncStorage.setItem(KEYS.CURRENT_CHAPTER_DAY, String(currentChapterDay)),
    AsyncStorage.setItem(KEYS.CHAPTER_PROGRESS, JSON.stringify(chapterProgress)),
  ]);

  return {
    currentChapterIndex,
    currentChapterDay,
    chapterProgress,
    currentStreak,
    longestStreak: parseInt(longestStreak ?? "0"),
    totalRelapseCount: parseInt(relapseCount ?? "0"),
    lastCheckInDate: lastCheckIn ?? "",
    lastRelapseDate: lastRelapse ?? "",
    memberSinceDate: memberSince ?? "",
    userName: userName ?? "",
  };
};

// ── Write helpers ──────────────────────────────────────────────────────────
export const saveCurrentChapter = async (index: number, day: number) => {
  await Promise.all([
    AsyncStorage.setItem(KEYS.CURRENT_CHAPTER_INDEX, index.toString()),
    AsyncStorage.setItem(KEYS.CURRENT_CHAPTER_DAY, day.toString()),
  ]);
};

/**
 * Saves streak and fires milestone notification if applicable.
 * This is the single source of truth for streak updates — notification
 * fires here automatically regardless of which screen triggers the save.
 */
export const saveStreak = async (current: number, longest: number) => {
  await Promise.all([
    AsyncStorage.setItem(KEYS.CURRENT_STREAK, current.toString()),
    AsyncStorage.setItem(
      KEYS.LONGEST_STREAK,
      Math.max(current, longest).toString(),
    ),
  ]);

  // Fire milestone notification if streak hits a milestone day.
  // fireStreakMilestone internally deduplicates — safe to call on every save.
  fireStreakMilestone(current).catch(console.error);
};

export const recordRelapse = async (progress: UserProgress) => {
  const STREAK_START_KEY = KEYS.STREAK_START_DATE;
  const newRelapseCount = progress.totalRelapseCount + 1;
  const today = new Date().toISOString().split("T")[0];

  const streakStartMidnight = new Date();
  streakStartMidnight.setHours(0, 0, 0, 0);

  const newStreak = 0;

  // Stay on current chapter, restart from day 1
  const newChapterIndex = progress.currentChapterIndex;
  const newChapterDay = 1;

  // Rebuild chapter progress — chapters before current stay completed, current resets to active day 1, after are locked
  const newChapterProgress = CHAPTERS.map((ch) => {
    if (ch.index < newChapterIndex) {
      return {
        chapter: ch.index,
        status: "completed" as const,
        daysCompleted: ch.totalDays,
        totalDays: ch.totalDays,
      };
    }
    if (ch.index === newChapterIndex) {
      return {
        chapter: ch.index,
        status: "active" as const,
        daysCompleted: 1,
        totalDays: ch.totalDays,
      };
    }
    return {
      chapter: ch.index,
      status: "locked" as const,
      daysCompleted: 0,
      totalDays: ch.totalDays,
    };
  });

  await Promise.all([
    AsyncStorage.setItem(KEYS.CURRENT_STREAK, String(newStreak)),
    AsyncStorage.setItem(
      STREAK_START_KEY,
      streakStartMidnight.toISOString(),
    ),
    AsyncStorage.setItem(KEYS.CURRENT_CHAPTER_INDEX, newChapterIndex.toString()),
    AsyncStorage.setItem(KEYS.CURRENT_CHAPTER_DAY, newChapterDay.toString()),
    AsyncStorage.setItem(KEYS.TOTAL_RELAPSE_COUNT, newRelapseCount.toString()),
    AsyncStorage.setItem(KEYS.LAST_RELAPSE_DATE, today),
    AsyncStorage.setItem(KEYS.LAST_PROGRESS_DATE, today),
    AsyncStorage.setItem(
      KEYS.CHAPTER_PROGRESS,
      JSON.stringify(newChapterProgress),
    ),
  ]);
};

// ── Computed values ────────────────────────────────────────────────────────
export const getChapterCompletionPercent = (
  chapterDay: number,
  totalDays: number,
): number => {
  return Math.min(100, Math.round((chapterDay / totalDays) * 100));
};

export const getCurrentChapterData = (chapterIndex: number) => {
  return CHAPTERS[Math.min(chapterIndex - 1, CHAPTERS.length - 1)];
};

export const getChapterDisplayName = (chapterIndex: number): string => {
  const ch = getCurrentChapterData(chapterIndex);
  return `Chapter ${String(chapterIndex).padStart(2, "0")} - ${ch.name}`;
};
