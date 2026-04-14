import AsyncStorage from "@react-native-async-storage/async-storage";
import { syncEventToSupabase, syncStreakToSupabase } from "./supabase";

// ============================================================================
// STORAGE KEYS — single source of truth
// ============================================================================

export const STATS_KEYS = {
  CHECK_IN_HISTORY: "@reclaim_checkin_history",
  RELAPSE_HISTORY: "@reclaim_relapse_history",
  PANIC_SESSIONS: "@reclaim_panic_sessions",
  STREAK_START_DATE: "streakStartDate",
  MEMBER_SINCE_DATE: "memberSinceDate",
  PANIC_GRACE_END: "@reclaim_panic_grace_end",
  PANIC_GRACE_START: "@reclaim_panic_grace_start",
  GRACE_SESSION_ID: "@reclaim_grace_session_id",
  PANIC_PENDING_VERDICT: "@reclaim_panic_pending_verdict",
};

// ============================================================================
// TYPES
// ============================================================================

export interface CheckInEntry {
  date: string; // YYYY-MM-DD
  mood: string | null;
  trigger: string | null;
  timestamp: number;
}

export interface RelapseEntry {
  date: string; // YYYY-MM-DD
  timestamp: number;
  reason: string | null;
}

export interface PanicSession {
  id: string;
  startTimestamp: number;
  endTimestamp: number | null;
  durationSeconds: number | null;
  endedInRelapse: boolean;
  wasSuccessful: boolean;
  panicDurationMinutes: number; // duration selected by user AT TIME of session start
}

// ============================================================================
// TIME RANGE TYPES & HELPERS
// ============================================================================

export type StatsTimeRange = "Day" | "Week" | "Month";

export const getUserPanicDuration = async (): Promise<number> => {
  const raw = await AsyncStorage.getItem("defaultPanicDuration");
  if (!raw) return 15; // default 15 minutes
  const value = parseInt(raw);
  // defaultPanicDuration is stored in SECONDS (e.g. 900 = 15 min, 1800 = 30 min)
  // Convert to minutes for all stats calculations
  return Math.round(value / 60);
};

export const getDateRange = (
  range: StatsTimeRange,
): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (range === "Day") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (range === "Week") {
    const start = new Date(now);
    const day = now.getDay();
    start.setDate(now.getDate() - ((day + 6) % 7));
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  // Month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

export const isInRange = (
  timestamp: number,
  start: Date,
  end: Date,
): boolean => {
  const d = new Date(timestamp);
  return d >= start && d <= end;
};

export const isDateInRange = (
  dateStr: string,
  start: Date,
  end: Date,
): boolean => {
  const d = new Date(dateStr + "T00:00:00");
  return d >= start && d <= end;
};

// ============================================================================
// COMPUTED STATS INTERFACE
// ============================================================================

export interface ComputedStats {
  controlStreak: number;
  relapses: number;
  urgesDefeated: number;
  panicSuccess: number;
  panicUses: number;
  panicProtectionData: PanicProtectionBar[];
  riskWindowData: RiskWindowBar[];
  riskiestTime: string;
  totalTimeReclaimed: number;
  streakRingProgress: number;
}

export interface PanicProtectionBar {
  label: string;
  panicCount: number;
  urgesDefeated: number;
  isHigh: boolean;
}

export interface RiskWindowBar {
  label: string;
  count: number;
  intensity: number;
}

// ============================================================================
// FUNCTION 1 — Record Check-in
// ============================================================================

export const recordCheckIn = async (
  mood: string | null,
  trigger: string | null,
): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const timestamp = Date.now();

  const existing = await getCheckInHistory();

  const alreadyToday = existing.some((e) => e.date === today);
  if (alreadyToday) return;

  const entry: CheckInEntry = { date: today, mood, trigger, timestamp };
  existing.push(entry);

  await AsyncStorage.setItem(
    STATS_KEYS.CHECK_IN_HISTORY,
    JSON.stringify(existing),
  );
  await AsyncStorage.setItem("lastCheckInDate", today);

  // Supabase sync — fire and forget, never blocks the UI
  syncEventToSupabase("check_in", { mood, trigger, date: today, timestamp });
};

export const getCheckInHistory = async (): Promise<CheckInEntry[]> => {
  const raw = await AsyncStorage.getItem(STATS_KEYS.CHECK_IN_HISTORY);
  return raw ? JSON.parse(raw) : [];
};

// ============================================================================
// FUNCTION 2 — Record Relapse
// ============================================================================

export const recordRelapseEvent = async (
  reason: string | null,
): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const timestamp = Date.now();

  const existing = await getRelapseHistory();
  const entry: RelapseEntry = { date: today, timestamp, reason };
  existing.push(entry);

  await AsyncStorage.setItem(
    STATS_KEYS.RELAPSE_HISTORY,
    JSON.stringify(existing),
  );

  // Close any still-open panic session as failed (standalone relapse)
  // Note: if user came from panic flow, resolvePendingVerdict handles it separately
  await closeOpenPanicSession(true);

  // Supabase sync — fire and forget, after all local writes are done
  syncEventToSupabase("relapse", { reason, date: today, timestamp });
  syncStreakToSupabase();
};

export const getRelapseHistory = async (): Promise<RelapseEntry[]> => {
  const raw = await AsyncStorage.getItem(STATS_KEYS.RELAPSE_HISTORY);
  return raw ? JSON.parse(raw) : [];
};

// ============================================================================
// FUNCTION 3 — Panic Session Management
// ============================================================================

export const startPanicSession = async (panicDurationMinutes?: number): Promise<string> => {
  const id = Date.now().toString();
  // Use passed duration or fall back to current setting
  const durationMinutes = panicDurationMinutes ?? await getUserPanicDuration();
  const session: PanicSession = {
    id,
    startTimestamp: Date.now(),
    endTimestamp: null,
    durationSeconds: null,
    endedInRelapse: false,
    wasSuccessful: false,
    panicDurationMinutes: durationMinutes,
  };

  const existing = await getPanicSessions();
  existing.push(session);

  await AsyncStorage.setItem(
    STATS_KEYS.PANIC_SESSIONS,
    JSON.stringify(existing),
  );
  await AsyncStorage.setItem("@reclaim_active_panic_session_id", id);

  // Supabase sync — fire and forget
  syncEventToSupabase("panic_session", {
    startTimestamp: session.startTimestamp,
  });

  return id;
};

export const closeOpenPanicSession = async (
  endedInRelapse: boolean,
): Promise<void> => {
  const activeId = await AsyncStorage.getItem(
    "@reclaim_active_panic_session_id",
  );
  if (!activeId) return;

  const sessions = await getPanicSessions();
  const index = sessions.findIndex((s) => s.id === activeId);
  if (index === -1) return;

  const now = Date.now();
  const start = sessions[index].startTimestamp;
  const durationSeconds = Math.floor((now - start) / 1000);

  sessions[index].endTimestamp = now;
  sessions[index].durationSeconds = durationSeconds;
  sessions[index].endedInRelapse = endedInRelapse;
  sessions[index].wasSuccessful = !endedInRelapse;

  await AsyncStorage.setItem(
    STATS_KEYS.PANIC_SESSIONS,
    JSON.stringify(sessions),
  );
  await AsyncStorage.removeItem("@reclaim_active_panic_session_id");
};

export const completePanicSessionWithGrace = async (): Promise<void> => {
  const activeId = await AsyncStorage.getItem("@reclaim_active_panic_session_id");
  if (!activeId) return;

  // Mark session as pending verdict — do NOT close it yet
  // Store the session ID so we can close it after user answers
  await AsyncStorage.setItem(STATS_KEYS.PANIC_PENDING_VERDICT, activeId);
  // Remove active session marker — session stays in list but is no longer "active"
  await AsyncStorage.removeItem("@reclaim_active_panic_session_id");
};

// Called when user answers "Did you stay strong?" modal
// wasSuccessful = true if user stayed strong, false if user relapsed
export const resolvePendingVerdict = async (wasSuccessful: boolean): Promise<void> => {
  const pendingId = await AsyncStorage.getItem(STATS_KEYS.PANIC_PENDING_VERDICT);
  if (!pendingId) return;

  const sessions = await getPanicSessions();
  const index = sessions.findIndex((s) => s.id === pendingId);
  if (index === -1) {
    await AsyncStorage.removeItem(STATS_KEYS.PANIC_PENDING_VERDICT);
    return;
  }

  const now = Date.now();
  const start = sessions[index].startTimestamp;
  sessions[index].endTimestamp = now;
  sessions[index].durationSeconds = Math.floor((now - start) / 1000);
  sessions[index].endedInRelapse = !wasSuccessful;
  sessions[index].wasSuccessful = wasSuccessful;

  await AsyncStorage.setItem(STATS_KEYS.PANIC_SESSIONS, JSON.stringify(sessions));
  await AsyncStorage.removeItem(STATS_KEYS.PANIC_PENDING_VERDICT);
};

export const hasPendingVerdict = async (): Promise<boolean> => {
  const pendingId = await AsyncStorage.getItem(STATS_KEYS.PANIC_PENDING_VERDICT);
  return !!pendingId;
};

export const getPanicSessions = async (): Promise<PanicSession[]> => {
  const raw = await AsyncStorage.getItem(STATS_KEYS.PANIC_SESSIONS);
  return raw ? JSON.parse(raw) : [];
};

// ============================================================================
// BEHAVIOR INTELLIGENCE SYSTEM — computeStatsByRange
// ============================================================================

export const computeStatsByRange = async (
  range: StatsTimeRange,
): Promise<ComputedStats> => {
  const [relapses, panicSessions, streakStartStr, panicDuration] =
    await Promise.all([
      getRelapseHistory(),
      getPanicSessions(),
      AsyncStorage.getItem(STATS_KEYS.STREAK_START_DATE),
      getUserPanicDuration(), // kept as fallback for sessions created before this fix
    ]);

  const { start, end } = getDateRange(range);

  // ── CONTROL STREAK ──
  let controlStreak = 0;
  if (streakStartStr) {
    const streakStart = new Date(streakStartStr);
    streakStart.setHours(0, 0, 0, 0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    controlStreak = Math.max(
      0,
      Math.floor((todayMidnight.getTime() - streakStart.getTime()) / 86400000),
    );
  }

  const periodDays =
    range === "Day"
      ? 1
      : range === "Week"
        ? 7
        : new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0,
          ).getDate();
  const streakRingProgress = Math.min(controlStreak / periodDays, 1);

  // ── FILTER TO RANGE ──
  const filteredRelapses = relapses.filter((r) =>
    isInRange(r.timestamp, start, end),
  );
  const filteredPanic = panicSessions.filter((s) =>
    isInRange(s.startTimestamp, start, end),
  );

  const relapseCount = filteredRelapses.length;
  const panicUses = filteredPanic.length;

  const completedPanic = filteredPanic.filter((s) => s.endTimestamp !== null);
  const successfulPanic = completedPanic.filter((s) => s.wasSuccessful === true);
  const urgesDefeated = successfulPanic.length;

  const panicSuccess =
    panicUses > 0 ? Math.round((urgesDefeated / panicUses) * 100) : 0;

  // Use each session's own stored duration — not the current settings value
  // This ensures historical accuracy even if user changes duration later
  const totalTimeReclaimed = successfulPanic.reduce((sum, session) => {
    // If session has its own stored duration → use it (accurate historical data)
    // If session is old and has no stored duration → use actual elapsed time
    // calculated from startTimestamp and endTimestamp (most accurate fallback)
    // Only fall back to current setting as last resort if no timestamps either
    let sessionDuration: number;
    if (session.panicDurationMinutes != null) {
      sessionDuration = session.panicDurationMinutes;
    } else if (session.endTimestamp != null && session.startTimestamp != null) {
      // Calculate actual elapsed time in minutes from real timestamps
      sessionDuration = Math.round((session.endTimestamp - session.startTimestamp) / 60000);
    } else {
      // Absolute last resort — use current setting but cap at 120 min to prevent insane values
      sessionDuration = Math.min(panicDuration, 120);
    }
    return sum + sessionDuration;
  }, 0);

  // ── PANIC PROTECTION TIME ──
  let panicProtectionData: PanicProtectionBar[] = [];

  if (range === "Day") {
    // 5 time blocks: Night / Morning / Afternoon / Evening / Late Night
    const timeBlocks = [
      { label: "Night\n12-6AM", start: 0, end: 5 },
      { label: "Morning\n6-12PM", start: 6, end: 11 },
      { label: "Afternoon\n12-5PM", start: 12, end: 16 },
      { label: "Evening\n5-9PM", start: 17, end: 20 },
      { label: "Late\n9PM-12", start: 21, end: 23 },
    ];

    panicProtectionData = timeBlocks.map((block) => {
      const blockPanic = filteredPanic.filter((s) => {
        const hour = new Date(s.startTimestamp).getHours();
        return hour >= block.start && hour <= block.end;
      });
      const panicCount = blockPanic.length;
      const urgesDefeatedCount = blockPanic.filter((s) => s.wasSuccessful).length;
      const maxCount = Math.max(
        ...timeBlocks.map((b) =>
          filteredPanic.filter((s) => {
            const h = new Date(s.startTimestamp).getHours();
            return h >= b.start && h <= b.end;
          }).length
        ),
        1
      );
      return {
        label: block.label,
        panicCount,
        urgesDefeated: urgesDefeatedCount,
        isHigh: panicCount === maxCount && maxCount > 0,
      };
    });

  } else if (range === "Week") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayCounts = new Array(7).fill(0);
    const dayUrges = new Array(7).fill(0);

    filteredPanic.forEach((s) => {
      const d = new Date(s.startTimestamp);
      const dayIndex = (d.getDay() + 6) % 7;
      dayCounts[dayIndex]++;
      if (s.wasSuccessful) dayUrges[dayIndex]++;
    });

    const maxCount = Math.max(...dayCounts, 1);
    panicProtectionData = days.map((day, i) => ({
      label: day,
      panicCount: dayCounts[i],
      urgesDefeated: dayUrges[i],
      isHigh: dayCounts[i] === maxCount && maxCount > 0,
    }));

  } else {
    const weekCounts = [0, 0, 0, 0, 0];
    const weekUrges = [0, 0, 0, 0, 0];

    filteredPanic.forEach((s) => {
      const d = new Date(s.startTimestamp);
      const weekIndex = Math.min(Math.floor((d.getDate() - 1) / 7), 4);
      weekCounts[weekIndex]++;
      if (s.wasSuccessful) weekUrges[weekIndex]++;
    });

    const maxCount = Math.max(...weekCounts, 1);
    panicProtectionData = weekCounts.map((count, i) => ({
      label: `Week ${i + 1}`,
      panicCount: count,
      urgesDefeated: weekUrges[i],
      isHigh: count === maxCount && maxCount > 0,
    }));
  }

  // ── RISK WINDOW ──
  const hourlyCounts = new Array(24).fill(0);
  filteredRelapses.forEach((r) => {
    const hour = new Date(r.timestamp).getHours();  
    hourlyCounts[hour]++;
  });
  const maxRelapse = Math.max(...hourlyCounts, 1);
  const riskWindowData: RiskWindowBar[] = hourlyCounts.map((count, i) => {
    const hour =
      i === 0 ? "12AM" : i < 12 ? `${i}AM` : i === 12 ? "12PM" : `${i - 12}PM`;
    return {
      label: hour,
      count,
      intensity: Math.round((count / maxRelapse) * 100),
    };
  });

  const maxHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
  const riskiestTime =
    Math.max(...hourlyCounts) === 0
      ? "No data yet"
      : maxHour === 0
        ? "12 AM"
        : maxHour < 12
          ? `${maxHour} AM`
          : maxHour === 12
            ? "12 PM"
            : `${maxHour - 12} PM`;

  return {
    controlStreak,
    streakRingProgress,
    relapses: relapseCount,
    urgesDefeated,
    panicSuccess,
    panicUses,
    panicProtectionData,
    riskWindowData,
    riskiestTime,
    totalTimeReclaimed,
  };
};

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

export const computeStats = async () => {
  return computeStatsByRange("Week");
};

export interface LegacyComputedStats {
  totalCheckIns: number;
  checkInsThisWeek: number;
  totalSafeDays: number;
  safeDaysThisWeek: number;
  totalRelapses: number;
  relapsesThisWeek: number;
  relapseDaysThisWeek: number;
  totalPanicUses: number;
  panicUsesThisWeek: number;
  totalUrgesOvercome: number;
  urgesOvercomeThisWeek: number;
  panicSuccessRate: number;
  totalTimeReclaimedMinutes: number;
  timeReclaimedThisWeekMinutes: number;
  protectionDays: number;
}

