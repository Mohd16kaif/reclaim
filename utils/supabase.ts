import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/react-native";
import * as Application from "expo-application";
import * as AppleAuthentication from "expo-apple-authentication";
import { getUserName, getUserEmail, setUserName, setUserEmail } from "./profileStorage";
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

// Ensures a minimal row exists in "users" for this device_id before any
// other table (streaks, stats) tries to insert/upsert a row referencing it
// via a foreign key. Safe to call frequently — does nothing if the row
// already exists, and never overwrites existing user_name/user_email.
export const ensureUserRowExists = async (deviceId: string): Promise<void> => {
  try {
    const { error } = await supabase.from("users").upsert(
      { device_id: deviceId },
      { onConflict: "device_id", ignoreDuplicates: true },
    );
    if (error) {
      console.log("[Supabase] ensureUserRowExists error:", error.message);
    }
  } catch (e: any) {
    console.log("[Supabase] ensureUserRowExists skipped — offline or error:", e?.message);
  }
};

export type AppleSignInResult =
  | { status: "linked"; isNewLink: true }
  | { status: "signed_in_existing_account" }
  | { status: "error"; message: string };

export const signInWithApple = async (): Promise<AppleSignInResult> => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    Sentry.addBreadcrumb({
      category: "apple_signin",
      message: "credential received",
      data: { hasIdentityToken: !!credential.identityToken, tokenLength: credential.identityToken?.length ?? 0 },
    });

    console.log("[Supabase] Apple credential received:", {
      ...credential,
      identityToken: credential.identityToken ? `[length: ${credential.identityToken.length}]` : undefined,
    });

    if (!credential.identityToken) {
      return { status: "error", message: "No identity token returned from Apple" };
    }

    Sentry.addBreadcrumb({ category: "apple_signin", message: "attempting linkIdentity" });

    console.log("[Supabase] Attempting linkIdentity");

    // Attempt to link this Apple identity to the CURRENT anonymous session.
    // If this user has never signed in with Apple before, this succeeds and
    // preserves their existing anonymous auth.uid() — meaning all their existing
    // streaks/stats/settings rows (keyed by that uid) remain valid with zero migration.
    const { data: linkData, error: linkError } = await supabase.auth.linkIdentity({
      provider: "apple",
      // @ts-ignore - linkIdentity types may not include idToken directly in this SDK version, verify at runtime
      token: credential.identityToken,
    });

    if (linkError) {
      if ((linkError as any).code === "identity_already_exists") {
        Sentry.addBreadcrumb({
          category: "apple_signin",
          message: "linkIdentity failed - expected for returning users",
          data: { code: (linkError as any).code, message: linkError.message },
        });
      } else {
        Sentry.captureMessage(JSON.stringify(linkError), "error");
      }
      Sentry.addBreadcrumb({
        category: "apple_signin",
        message: "linkIdentity failed",
        data: { message: linkError.message, status: (linkError as any).status },
      });
      console.log("[Supabase] linkIdentity error:", JSON.stringify(linkError));
    } else {
      Sentry.addBreadcrumb({ category: "apple_signin", message: "linkIdentity succeeded" });
    }

    if (!linkError) {
      console.log("[Supabase] Apple identity linked to existing anonymous session");

      // Apple only provides fullName/email on the FIRST sign-in ever for this user.
      // Capture and persist them now, since they won't be sent again on future sign-ins.
      if (credential.email) {
        await setUserEmail(credential.email);
      }
      if (credential.fullName?.givenName) {
        const fullName = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(" ");
        await setUserName(fullName);
      }

      // Eagerly push to Supabase right now, in case the user never reaches
      // OnboardingQuestionScreen (app closed, crash, etc).
      await syncUserToSupabase().catch((e) => console.log("[Supabase] eager post-link sync failed:", e));

      return { status: "linked", isNewLink: true };
    }

    // If linking failed because this Apple ID is ALREADY linked to a different
    // (older) permanent account, that's expected for returning users after reinstall.
    // Discard the current anonymous session's local cache and sign into the original account.
    console.log("[Supabase] linkIdentity failed, attempting signInWithIdToken:", linkError.message);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });

    if (signInError) {
      Sentry.captureMessage(JSON.stringify(signInError), "error");
      Sentry.addBreadcrumb({
        category: "apple_signin",
        message: "signInWithIdToken failed",
        data: { message: signInError.message, status: (signInError as any).status },
      });
      console.log("[Supabase] signInWithIdToken error:", JSON.stringify(signInError));
    } else {
      Sentry.addBreadcrumb({ category: "apple_signin", message: "signInWithIdToken succeeded" });
    }

    if (signInError) {
      return { status: "error", message: signInError.message };
    }

    if (signInData?.user?.id) {
      // Update the cached user id to the ORIGINAL account's uid, replacing
      // whatever anonymous uid was cached before.
      await AsyncStorage.setItem("@reclaim_user_id", signInData.user.id);
      console.log("[Supabase] Signed into existing Apple-linked account:", signInData.user.id);
      return { status: "signed_in_existing_account" };
    }

    return { status: "error", message: "Sign in succeeded but no user returned" };
  } catch (e: any) {
    Sentry.captureException(e);
    if (e.code === "ERR_REQUEST_CANCELED") {
      return { status: "error", message: "User canceled sign in" };
    }
    console.log("[Supabase] signInWithApple error:", e.message);
    return { status: "error", message: e.message ?? "Unknown error" };
  }
};

// ── Sync: User ────────────────────────────────────────────────────────────
// Call once on app start — creates user row if first time, updates if returning
export const syncUserToSupabase = async (): Promise<void> => {
  try {
    const deviceId = await getOrCreateUserId();
    const [userName, userEmail, memberSince] = await Promise.all([
      getUserName(),
      getUserEmail(),
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
    await ensureUserRowExists(deviceId);

    const [streakStart, currentStreak, longestStreak] = await Promise.all([
      AsyncStorage.getItem("streakStartDate"),
      AsyncStorage.getItem("currentStreak"),
      AsyncStorage.getItem("longestStreak"),
    ]);

    const currentStreakDays = parseInt(currentStreak ?? "0", 10);

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
        longest_streak_days: parseInt(longestStreak ?? "0", 10),
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
    await ensureUserRowExists(deviceId);

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

// ── Sync: Panic Session Update ────────────────────────────────────────────
// Call when a panic session verdict is resolved (completes the row inserted
// by startPanicSession with endTimestamp, durationSeconds, wasSuccessful, etc.)
export const updatePanicSessionInSupabase = async (
  sessionId: string,
  eventData: Record<string, any>,
): Promise<void> => {
  try {
    const deviceId = await getOrCreateUserId();
    await ensureUserRowExists(deviceId);
    const { error } = await supabase
      .from("stats")
      .update({ event_data: eventData })
      .eq("device_id", deviceId)
      .eq("event_type", "panic_session")
      .eq("event_data->>id", sessionId);
    if (error) console.log("[Supabase] panic session update error:", error.message);
  } catch (e) {
    console.log("[Supabase] panic session update skipped — offline or error");
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
      AsyncStorage.getItem("@reclaim_dns_profile_status"),
    ]);

    const { error } = await supabase.from("settings").upsert(
      {
        device_id: deviceId,
        panic_duration_minutes: parseInt(panicDuration ?? "15", 10),
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

    const [streaksResult, statsResult, userResult] = await Promise.all([
      supabase.from("streaks").select("*").eq("device_id", userId).single(),
      supabase.from("stats").select("*").eq("device_id", userId).order("created_at", { ascending: true }),
      supabase.from("users").select("user_name, user_email").eq("device_id", userId).single(),
    ]);

    if (userResult.data) {
      if (userResult.data.user_name) {
        await setUserName(userResult.data.user_name);
      }
      if (userResult.data.user_email) {
        await setUserEmail(userResult.data.user_email);
      }
    } else if (userResult.error) {
      console.log("[Supabase] user restore error:", userResult.error.message);
    }

    if (streaksResult.data) {
      const writes: Promise<void>[] = [];
      const srcStreakStart = streaksResult.data.streak_start_date;
      if (srcStreakStart != null) {
        const parsed = new Date(srcStreakStart);
        if (!isNaN(parsed.getTime())) {
          writes.push(AsyncStorage.setItem("streakStartDate", parsed.toISOString()));
        }
      }
      writes.push(AsyncStorage.setItem("currentStreak", String(streaksResult.data.current_streak_days)));
      writes.push(AsyncStorage.setItem("longestStreak", String(streaksResult.data.longest_streak_days)));
      await Promise.all(writes);
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

