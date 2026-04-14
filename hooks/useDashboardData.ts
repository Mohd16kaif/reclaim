import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { CHAPTERS } from '../constants/chapters';
import { updateLongestStreakIfNeeded } from '../utils/profileStorage';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardData {
  streak: number;
  streakStartDate: string; // ISO Date string for precise countdown
  totalCleanDays: number;
  checkInsLastWeek: number;
  urgesDefeated: number;
  protectionHours: number;
  timeReclaimedHours: number;
  panicHelpUsed: number;
  stabilityScore: number; // 0-100 for the gauge
  stabilityMessage: string;
  currentChapter: {
    id: string;
    title: string;
    subtitle: string;
    progress: number;
  };
  currentChapterIndex: number;
  currentChapterDay: number;
  hasCheckedInToday: boolean;
  relapseHistory: string[];
  calendarDays: CalendarDay[];
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  dayName: string;
  status: 'clean' | 'relapse' | 'future' | 'before_signup';
  isToday: boolean;
}

const STORAGE_KEYS = {
  CURRENT_STREAK_START: 'streakStartDate',
  CHAPTER_INDEX: 'currentChapterIndex',
  CHAPTER_DAY: 'currentChapterDay',
  CHAPTER_PROGRESS: 'chapterProgress',
  MEMBER_SINCE_DATE: 'memberSinceDate',
  LAST_CHECK_IN_DATE: 'lastCheckInDate',
  CHECK_IN_HISTORY: '@reclaim_checkin_history',
  RELAPSE_HISTORY: '@reclaim_relapse_history',
  PANIC_SESSIONS: '@reclaim_panic_sessions',
};

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// ============================================================================
// HELPERS
// ============================================================================

const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  // Reset time part to ensure we count full calendar days
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round((end.getTime() - start.getTime()) / oneDay);
};

const generateWeekCalendar = (centerDate: Date, relapseHistory: string[], signupDate: Date | null): CalendarDay[] => {
  const today = new Date();
  const days: CalendarDay[] = [];
  
  // Start of week (Monday)
  const startOfWeek = new Date(centerDate);
  startOfWeek.setDate(centerDate.getDate() - ((centerDate.getDay() + 6) % 7));
  
  const relapseSet = new Set(relapseHistory);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    
    const dateStr = date.toISOString().split('T')[0];
    const isToday = date.toDateString() === today.toDateString();
    
    // Time-normalized comparisons
    const dateStartOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayStartOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const signupStartOfDay = signupDate ? new Date(signupDate.getFullYear(), signupDate.getMonth(), signupDate.getDate()) : null;

    const isFuture = dateStartOfDay > todayStartOfDay;
    // Before signup check: strictly before the signup date
    const isBeforeSignup = signupStartOfDay ? dateStartOfDay < signupStartOfDay : false;
    
    let status: CalendarDay['status'] = 'clean';
    
    if (isFuture) { 
        status = 'future';
    } else if (isBeforeSignup) {
        status = 'before_signup';
    } else if (relapseSet.has(dateStr)) {
        status = 'relapse';
    }
    
    days.push({
      date: dateStr,
      dayOfMonth: date.getDate(),
      dayName: DAY_NAMES[date.getDay()],
      status,
      isToday,
    });
  }
  return days;
};

// ============================================================================
// HOOK
// ============================================================================

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
        setLoading(true);
        setError(null);

        const [
          streakStartStr,
          chapterIndexStr,
          chapterDayStr,
          chapterProgressRaw,
          memberSinceStr,
          lastCheckInDate,
          checkInHistoryRaw,
          relapseHistoryRaw,
          panicSessionsRaw,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.CURRENT_STREAK_START),
          AsyncStorage.getItem(STORAGE_KEYS.CHAPTER_INDEX),
          AsyncStorage.getItem(STORAGE_KEYS.CHAPTER_DAY),
          AsyncStorage.getItem(STORAGE_KEYS.CHAPTER_PROGRESS),
          AsyncStorage.getItem(STORAGE_KEYS.MEMBER_SINCE_DATE),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECK_IN_DATE),
          AsyncStorage.getItem(STORAGE_KEYS.CHECK_IN_HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.RELAPSE_HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.PANIC_SESSIONS),
        ]);

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // ── Streak ──
        const streakStart = streakStartStr ? new Date(streakStartStr) : today;
        const streak = Math.max(0, getDaysBetween(streakStart, today));
        await updateLongestStreakIfNeeded(streak);

        // ── Chapter ──
        const currentChapterIndex = parseInt(chapterIndexStr ?? '1');
        const currentChapterDay = parseInt(chapterDayStr ?? '1');
        const currentChapterData = CHAPTERS[Math.min(currentChapterIndex - 1, CHAPTERS.length - 1)];

        // ── Chapter progress percent ──
        const chapterProgress = Math.min(
          100,
          Math.round((currentChapterDay / currentChapterData.totalDays) * 100)
        );

        // ── Check-ins ──
        const checkInHistory: { date: string; timestamp: number }[] = checkInHistoryRaw
          ? JSON.parse(checkInHistoryRaw)
          : [];
        const hasCheckedInToday = lastCheckInDate === todayStr;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        const checkInsLastWeek = checkInHistory.filter((c) => {
          const d = new Date(c.date);
          return d >= oneWeekAgo && d <= today;
        }).length;

        // ── Relapse history ──
        const relapseHistory: { date: string; timestamp: number }[] = relapseHistoryRaw
          ? JSON.parse(relapseHistoryRaw)
          : [];
        const relapseDates = relapseHistory.map((r) => r.date);

        // ── Panic sessions ──
        const panicSessions: {
          wasSuccessful: boolean;
          endTimestamp: number | null;
          startTimestamp: number;
          panicDurationMinutes: number | null;
        }[] = panicSessionsRaw ? JSON.parse(panicSessionsRaw) : [];

        const urgesDefeated = panicSessions.filter((s) => s.wasSuccessful).length;
        const panicHelpUsed = panicSessions.length;

        // ── Time reclaimed (all-time, successful sessions only) ──
        const totalTimeReclaimedMinutes = panicSessions
          .filter((s) => s.wasSuccessful && s.endTimestamp !== null)
          .reduce((sum, s) => {
            if (s.panicDurationMinutes != null) return sum + s.panicDurationMinutes;
            if (s.endTimestamp && s.startTimestamp) {
              return sum + Math.round((s.endTimestamp - s.startTimestamp) / 60000);
            }
            return sum;
          }, 0);
        const timeReclaimedHours = totalTimeReclaimedMinutes / 60;

        // ── Calendar ──
        const signupDate = memberSinceStr ? new Date(memberSinceStr) : today;
        const calendarDays = generateWeekCalendar(today, relapseDates, signupDate);

        // ── Stability score (kept from original) ──
        let score = 0;
        if (streak > 0 || checkInsLastWeek > 0 || urgesDefeated > 0) {
          score = 50 + (streak * 1.5) + (checkInsLastWeek * 4) + (urgesDefeated * 2);
        } else {
          score = 10;
        }
        score = Math.min(100, Math.max(0, Math.round(score)));

        let stabilityMessage = 'Just starting out';
        if (score > 80) stabilityMessage = 'Excellent progress';
        else if (score > 60) stabilityMessage = 'Stable but improving';
        else if (score > 40) stabilityMessage = 'Keep pushing forward';
        else if (score > 20) stabilityMessage = 'Needs attention';

        // ── Protection hours ──
        const totalCleanDays = streak;
        const protectionHours = Math.round(totalCleanDays * 0.5 + panicHelpUsed + (hasCheckedInToday ? 1 : 0));

        setData({
          streak,
          streakStartDate: streakStart.toISOString(),
          totalCleanDays,
          checkInsLastWeek,
          urgesDefeated,
          protectionHours,
          timeReclaimedHours,
          panicHelpUsed,
          stabilityScore: score,
          stabilityMessage,
          currentChapter: {
            id: `chapter_${String(currentChapterIndex).padStart(2, '0')}`,
            title: `Chapter ${String(currentChapterIndex).padStart(2, '0')}`,
            subtitle: currentChapterData.name,
            progress: chapterProgress,
          },
          currentChapterIndex,
          currentChapterDay,
          hasCheckedInToday,
          relapseHistory: relapseDates,
          calendarDays,
        });

    } catch (e) {
        console.error("Failed to load dashboard data", e);
        setError("Failed to load dashboard data");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
};
