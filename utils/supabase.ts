import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as Application from "expo-application";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Device ID ─────────────────────────────────────────────────────────────
// Uses iOS identifierForVendor — stable per device per app install
export const getDeviceId = async (): Promise<string> => {
  const cached = await AsyncStorage.getItem("@reclaim_device_id");
  if (cached) return cached;

  const id =
    (await Application.getIosIdForVendorAsync()) ?? `device_${Date.now()}`;
  await AsyncStorage.setItem("@reclaim_device_id", id);
  return id;
};

export const getOrCreateUserId = async (): Promise<string> => {
  try {
    const cachedUserId = await AsyncStorage.getItem("@reclaim_user_id");
    if (cachedUserId) return cachedUserId;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.log("[Supabase] Anonymous sign-in error:", error.message);
      return await getDeviceId(); // Fallback to device ID
    }

    if (data?.user?.id) {
      await AsyncStorage.setItem("@reclaim_user_id", data.user.id);
      return data.user.id;
    } else {
      console.log("[Supabase] Anonymous sign-in returned no user ID.");
      return await getDeviceId(); // Fallback to device ID
    }
  } catch (e: any) {
    console.log("[Supabase] getOrCreateUserId error:", e.message);
    return await getDeviceId(); // Fallback to device ID
  }
};

// ── Sync: User ────────────────────────────────────────────────────────────
// Call once on app start — creates user row if first time, updates if returning
export const syncUserToSupabase = async (): Promise<void> => {
  try {
    const deviceId = await getOrCreateUserId();
    const [userName, userEmail, memberSince] = await Promise.all([
      AsyncStorage.getItem("userName"),
      AsyncStorage.getItem("userEmail"),
      AsyncStorage.getItem("memberSinceDate"),
    ]);

    const { error } = await supabase.from("users").upsert(
      {
        device_id: deviceId,
        user_name: userName ?? null,
        user_email: userEmail ?? null,
        member_since_date: (() => {
          if (!memberSince) return new Date().toISOString();
          const d = new Date(memberSince);
          return isNaN(d.getTime())
            ? new Date().toISOString()
            : d.toISOString();
        })(),
      },
      { onConflict: "device_id" },
    );

    if (error) console.log("[Supabase] user sync error:", error.message);
  } catch (e: any) {
    console.log("[Supabase] user sync skipped — offline or error");
  }
};

// ── Sync: Streak ──────────────────────────────────────────────────────────
// Call after any streak change (relapse, new day)
export const syncStreakToSupabase = async (): Promise<void> => {
  try {
    const deviceId = await getOrCreateUserId();
    const [streakStart, currentStreak, longestStreak] = await Promise.all([
      AsyncStorage.getItem("streakStartDate"),
      AsyncStorage.getItem("currentStreak"),
      AsyncStorage.getItem("longestStreak"),
    ]);

    const currentStreakDays = parseInt(currentStreak ?? "0");

    // Calculate streak directly from streakStartDate instead of trusting
    // the cached currentStreak value which may not be updated yet
    let calculatedStreakDays = currentStreakDays;
    if (streakStart) {
      const start = new Date(streakStart);
      start.setHours(0, 0, 0, 0);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      calculatedStreakDays = Math.max(
        0,
        Math.floor((todayMidnight.getTime() - start.getTime()) / 86400000),
      );
    }

    // Never sync 0 if we can calculate a real streak from streakStartDate
    // This prevents race conditions where cached value hasn't updated yet
    const streakToSync = calculatedStreakDays > 0
      ? calculatedStreakDays
      : currentStreakDays;

    // Skip sync entirely if streak is 0 and start date is today or missing
    // — this means it's a fresh reset and we don't want to overwrite real data
    if (streakToSync === 0 && streakStart) {
      const start = new Date(streakStart);
      start.setHours(0, 0, 0, 0);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      if (start.getTime() >= todayMidnight.getTime()) {
        console.log("[Supabase] streak sync skipped — streak just reset today");
        return;
      }
    }

    const { error } = await supabase.from("streaks").upsert(
      {
        device_id: deviceId,
        streak_start_date: streakStart
          ? new Date(streakStart).toISOString()
          : null,
        current_streak_days: streakToSync,
        longest_streak_days: parseInt(longestStreak ?? "0"),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id" },
    );

    if (error) console.log("[Supabase] streak sync error:", error.message);
  } catch (e) {
    console.log("[Supabase] streak sync skipped — offline or error");
  }
};

// ── Sync: Event ───────────────────────────────────────────────────────────
// Call when a panic session, relapse, or check-in is recorded
export const syncEventToSupabase = async (
  eventType: "panic_session" | "relapse" | "check_in",
  eventData: Record<string, any>,
): Promise<void> => {
  try {
    const deviceId = await getOrCreateUserId();

    const { error } = await supabase.from("stats").insert({
      device_id: deviceId,
      event_type: eventType,
      event_data: eventData,
      created_at: new Date().toISOString(),
    });

    if (error) console.log("[Supabase] event sync error:", error.message);
  } catch (e) {
    console.log("[Supabase] event sync skipped — offline or error");
  }
};

// ── Sync: Settings ────────────────────────────────────────────────────────
// Call when user changes panic duration, coach mode, or DNS shield status
export const syncSettingsToSupabase = async (): Promise<void> => {
  try {
    const deviceId = await getOrCreateUserId();
    const [panicDuration, coachMode, dnsInstalled] = await Promise.all([
      AsyncStorage.getItem("defaultPanicDuration"),
      AsyncStorage.getItem("aiCoachMode"),
      AsyncStorage.getItem("@reclaim_dns_profile_installed"),
    ]);

    const { error } = await supabase.from("settings").upsert(
      {
        device_id: deviceId,
        panic_duration_minutes: parseInt(panicDuration ?? "15"),
        coach_mode: coachMode ?? "calm",
        dns_shield_installed: dnsInstalled === "installed",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id" },
    );

    if (error) console.log("[Supabase] settings sync error:", error.message);
  } catch (e) {
    console.log("[Supabase] settings sync skipped — offline or error");
  }
};

// ── Fetch: Streak Percentile ──────────────────────────────────────────────
// Returns what percentage of users the current user beats (higher = better)
// Example: 85 means "you have a longer streak than 85% of users"
export const fetchStreakPercentile = async (currentStreakDays: number): Promise<number | null> => {
  try {
    // Count total users who have a streak record
    const { count: totalCount, error: totalError } = await supabase
      .from("streaks")
      .select("*", { count: "exact", head: true });

    if (totalError || !totalCount || totalCount === 0) return null;

    // Count users with a strictly lower streak than current user
    const { count: belowCount, error: belowError } = await supabase
      .from("streaks")
      .select("*", { count: "exact", head: true })
      .lt("current_streak_days", currentStreakDays);

    if (belowError || belowCount === null) return null;

    // Percentile = percentage of users the current user beats
    const percentile = Math.round((belowCount / totalCount) * 100);
    return percentile;
  } catch (e) {
    console.log("[Supabase] percentile fetch skipped — offline or error");
    return null;
  }
};

export const restoreFromSupabase = async (): Promise<void> => {
  try {
    const userId = await getOrCreateUserId();

    const [streaksResult, statsResult] = await Promise.all([
      supabase.from("streaks").select("*").eq("device_id", userId).single(),
      supabase.from("stats").select("*").eq("device_id", userId).order("created_at", { ascending: true }),
    ]);

    if (streaksResult.data) {
      await Promise.all([
        AsyncStorage.setItem("streakStartDate", new Date(streaksResult.data.streak_start_date).toISOString()),
        AsyncStorage.setItem("currentStreak", String(streaksResult.data.current_streak_days)),
        AsyncStorage.setItem("longestStreak", String(streaksResult.data.longest_streak_days)),
      ]);
    } else if (streaksResult.error) {
      console.log("[Supabase] streaks restore error:", streaksResult.error.message);
    }

    if (statsResult.data && statsResult.data.length > 0) {
      const relapseHistory: any[] = [];
      const checkInHistory: any[] = [];
      const panicSessions: any[] = [];

      statsResult.data.forEach((row: any) => {
        if (row.event_type === "relapse") {
          relapseHistory.push({
            date: row.event_data.date,
            timestamp: row.event_data.timestamp,
            reason: row.event_data.reason,
          });
        } else if (row.event_type === "check_in") {
          checkInHistory.push({
            date: row.event_data.date,
            mood: row.event_data.mood,
            trigger: row.event_data.trigger,
            timestamp: row.event_data.timestamp,
          });
        } else if (row.event_type === "panic_session") {
          panicSessions.push({
            id: row.event_data.id,
            startTimestamp: row.event_data.startTimestamp,
            endTimestamp: row.event_data.endTimestamp,
            durationSeconds: row.event_data.durationSeconds,
            endedInRelapse: row.event_data.endedInRelapse,
            wasSuccessful: row.event_data.wasSuccessful,
            panicDurationMinutes: row.event_data.panicDurationMinutes,
          });
        }
      });

      if (relapseHistory.length > 0) {
        await AsyncStorage.setItem("@reclaim_relapse_history", JSON.stringify(relapseHistory));
      }
      if (checkInHistory.length > 0) {
        await AsyncStorage.setItem("@reclaim_checkin_history", JSON.stringify(checkInHistory));
      }
      if (panicSessions.length > 0) {
        await AsyncStorage.setItem("@reclaim_panic_sessions", JSON.stringify(panicSessions));
      }
    } else if (statsResult.error) {
      console.log("[Supabase] stats restore error:", statsResult.error.message);
    }
  } catch (e: any) {
    console.log("[Supabase] restore skipped — offline or error");
  }
};

export const shouldRestore = async (): Promise<boolean> => {
  try {
    const streakStartDate = await AsyncStorage.getItem("streakStartDate");
    return !streakStartDate;
  } catch (e) {
    console.log("[Supabase] shouldRestore error:", e);
    return false;
  }
};

// ── Storage: Avatars ────────────────────────────────────────────────────────
export const uploadAvatar = async (base64Jpeg: string): Promise<string | null> => {
  try {
    const userId = await getOrCreateUserId();
    const blob = await (await fetch('data:image/jpeg;base64,' + base64Jpeg)).blob();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(userId + ".jpg", blob, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      console.log("[Supabase] avatar upload failed:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(userId + ".jpg");
    return data.publicUrl;
  } catch (e: any) {
    console.log("[Supabase] avatar upload failed:", e.message);
    return null;
  }
};

export const getAvatarUrl = async (): Promise<string | null> => {
  try {
    const userId = await getOrCreateUserId();
    const { data } = supabase.storage.from("avatars").getPublicUrl(userId + ".jpg");
    return data.publicUrl;
  } catch (e) {
    console.log("[Supabase] getAvatarUrl error:", e);
    return null;
  }
};

