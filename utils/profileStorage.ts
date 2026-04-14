import { uploadAvatar, getAvatarUrl } from "./supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEYS = {
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
  AVATAR_IMAGE_DATA: 'userAvatarImageData', // base64 jpeg (string)
  LONGEST_STREAK: 'longestStreak', // integer days (string)
} as const;

// Used elsewhere in the app already (dashboard/stats).
const DASHBOARD_KEYS = {
  CURRENT_STREAK_START: '@reclaim_current_streak_start', // ISO string
  SIGNUP_DATE: '@reclaim_signup_date', // ISO string
} as const;

const daysBetween = (start: Date, end: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / oneDay));
};

export async function getUserName(): Promise<string> {
  const name = await AsyncStorage.getItem(PROFILE_KEYS.USER_NAME);
  return name ?? '';
}

export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEYS.USER_NAME, name);
}

export async function getUserEmail(): Promise<string> {
  const email = await AsyncStorage.getItem(PROFILE_KEYS.USER_EMAIL);
  return email ?? '';
}

export async function setUserEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEYS.USER_EMAIL, email);
}

export async function getAvatarBase64Jpeg(): Promise<string | null> {
  const data = await AsyncStorage.getItem(PROFILE_KEYS.AVATAR_IMAGE_DATA);
  if (data) return data;

  const url = await getAvatarUrl();
  return url ?? null;
}

export async function setAvatarBase64Jpeg(base64Jpeg: string | null): Promise<void> {
  if (!base64Jpeg) {
    await AsyncStorage.removeItem(PROFILE_KEYS.AVATAR_IMAGE_DATA);
    return;
  }
  await AsyncStorage.setItem(PROFILE_KEYS.AVATAR_IMAGE_DATA, base64Jpeg);
  uploadAvatar(base64Jpeg).catch(console.error);
}

export async function initSignupDateIfMissing(): Promise<string> {
  const existing = await AsyncStorage.getItem(DASHBOARD_KEYS.SIGNUP_DATE);
  if (existing) return existing;

  const iso = new Date().toISOString();
  await AsyncStorage.setItem(DASHBOARD_KEYS.SIGNUP_DATE, iso);
  return iso;
}

export async function getMemberSinceDate(): Promise<Date | null> {
  // Fallback to dashboard signup date if present (existing app pattern).
  const signupIso = await AsyncStorage.getItem(DASHBOARD_KEYS.SIGNUP_DATE);
  if (signupIso) {
    const d = new Date(signupIso);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  return null;
}

export async function getCurrentStreakDays(): Promise<number> {
  const streakStartIso = await AsyncStorage.getItem(DASHBOARD_KEYS.CURRENT_STREAK_START);
  if (!streakStartIso) return 0;
  const start = new Date(streakStartIso);
  if (!Number.isFinite(start.getTime())) return 0;
  return daysBetween(start, new Date());
}

export async function getLongestStreakDays(): Promise<number> {
  const raw = await AsyncStorage.getItem(PROFILE_KEYS.LONGEST_STREAK);
  const v = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

export async function setLongestStreakDays(days: number): Promise<void> {
  const safe = Math.max(0, Math.floor(days));
  await AsyncStorage.setItem(PROFILE_KEYS.LONGEST_STREAK, String(safe));
}

export async function updateLongestStreakIfNeeded(currentStreakDays: number): Promise<number> {
  const safeCurrent = Math.max(0, Math.floor(currentStreakDays));
  const existing = await getLongestStreakDays();
  if (safeCurrent > existing) {
    await setLongestStreakDays(safeCurrent);
    return safeCurrent;
  }
  return existing;
}

