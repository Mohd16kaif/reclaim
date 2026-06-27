import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const { FamilyControlsBridge } = NativeModules;

export type FamilyControlsAuthStatus = 'authorized' | 'denied' | 'notDetermined';

export const requestFamilyControlsAuth = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  try {
    const result = await FamilyControlsBridge.requestAuthorization();
    return result?.authorized === true;
  } catch {
    return false;
  }
};

export const getFamilyControlsAuthStatus = async (): Promise<FamilyControlsAuthStatus> => {
  if (Platform.OS !== 'ios') return 'notDetermined';
  try {
    const result = await FamilyControlsBridge.getAuthorizationStatus();
    return result?.status ?? 'notDetermined';
  } catch {
    return 'notDetermined';
  }
};

export const hasSelectedPanicApps = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  try {
    const result = await FamilyControlsBridge.hasSelectedApps();
    return result?.hasApps === true;
  } catch {
    return false;
  }
};

export const startPanicSession = async (durationSeconds: number): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  try {
    const result = await FamilyControlsBridge.startPanicSession(durationSeconds);
    return result?.success === true;
  } catch {
    return false;
  }
};

export const stopPanicSession = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  try {
    const result = await FamilyControlsBridge.stopPanicSession();
    return result?.success === true;
  } catch {
    return false;
  }
};

export const presentAppPicker = async (): Promise<{ success: boolean; cancelled?: boolean }> => {
  if (Platform.OS !== 'ios') return { success: false };
  try {
    const result = await FamilyControlsBridge.presentAppPicker();
    return { success: result?.success === true, cancelled: result?.cancelled === true };
  } catch {
    return { success: false };
  }
};

export const saveSelectedAppTokens = async (tokenData: string): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  try {
    const result = await FamilyControlsBridge.saveSelectedAppTokens(tokenData);
    return result?.success === true;
  } catch {
    return false;
  }
};

export async function saveBrowserCategoryTokens(tokenData: string): Promise<void> {
  const { FamilyControlsBridge } = NativeModules;
  await FamilyControlsBridge.saveBrowserCategoryTokens(tokenData);
}

/**
 * Enables adult content web filter for a given number of days.
 * Pass 0 for permanent (no expiry).
 */
export const enableBlockerWithDuration = async (days: number): Promise<void> => {
  await FamilyControlsBridge.enableBlockerWithDuration(days);
};

/**
 * Disables adult content web filter and cancels any active schedule.
 */
export const disableBlocker = async (): Promise<void> => {
  await FamilyControlsBridge.disableBlocker();
};

/**
 * Returns the remaining seconds of an active panic session, or null if
 * no session is active (or it has already expired). Does NOT mutate any
 * storage — pure read-only check, safe to call from anywhere.
 */
export const getActivePanicSessionRemaining = async (): Promise<number | null> => {
  try {
    const activeSessionId = await AsyncStorage.getItem('@reclaim_active_panic_session_id');
    const endTsRaw = await AsyncStorage.getItem('@reclaim_panic_end_timestamp');
    if (!activeSessionId || !endTsRaw) return null;

    const endTs = parseInt(endTsRaw, 10);
    const remainingMs = endTs - Date.now();
    if (remainingMs <= 0) return null;

    return Math.ceil(remainingMs / 1000);
  } catch {
    return null;
  }
};
