import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const { FamilyControlsBridge } = NativeModules;

const UNINSTALL_PREVENTION_KEY = '@reclaim_uninstall_prevention_enabled';
const PANIC_APP_SELECTION_KEY = '@reclaim_panic_app_selection_enabled';

/**
 * Returns whether the user has enabled Uninstall Prevention.
 */
export const isUninstallPreventionEnabled = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(UNINSTALL_PREVENTION_KEY);
  return raw === 'true';
};

/**
 * Enables Uninstall Prevention: requests Family Controls authorization only.
 * No app picker here — app selection is now a separate toggle.
 */
export const enableUninstallPrevention = async (): Promise<{
  success: boolean;
  reason?: 'auth_denied' | 'error';
}> => {
  if (Platform.OS !== 'ios') return { success: false, reason: 'error' };

  try {
    const statusResult = await FamilyControlsBridge.getAuthorizationStatus();
    if (statusResult?.status !== 'authorized') {
      const authResult = await FamilyControlsBridge.requestAuthorization();
      if (!authResult?.authorized) {
        return { success: false, reason: 'auth_denied' };
      }
    }
    await AsyncStorage.setItem(UNINSTALL_PREVENTION_KEY, 'true');
    return { success: true };
  } catch {
    return { success: false, reason: 'error' };
  }
};

/**
 * Disables Uninstall Prevention.
 */
export const disableUninstallPrevention = async (): Promise<void> => {
  await AsyncStorage.setItem(UNINSTALL_PREVENTION_KEY, 'false');
};

/**
 * Returns whether the user has enabled "Block Apps During Panic".
 */
export const isPanicAppSelectionEnabled = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(PANIC_APP_SELECTION_KEY);
  return raw === 'true';
};

/**
 * Enables "Block Apps During Panic": requests Family Controls authorization
 * if not already granted (shared with the other toggle — iOS authorization
 * is per-app, not per-feature), then opens the app picker so the user
 * selects which installed apps to shield during panic sessions.
 */
export const enablePanicAppSelection = async (): Promise<{
  success: boolean;
  reason?: 'auth_denied' | 'picker_cancelled' | 'error';
}> => {
  if (Platform.OS !== 'ios') return { success: false, reason: 'error' };

  try {
    const statusResult = await FamilyControlsBridge.getAuthorizationStatus();
    if (statusResult?.status !== 'authorized') {
      const authResult = await FamilyControlsBridge.requestAuthorization();
      if (!authResult?.authorized) {
        return { success: false, reason: 'auth_denied' };
      }
    }

    const pickerResult = await FamilyControlsBridge.presentAppPicker();
    if (pickerResult?.cancelled || !pickerResult?.success) {
      return { success: false, reason: 'picker_cancelled' };
    }

    await AsyncStorage.setItem(PANIC_APP_SELECTION_KEY, 'true');
    return { success: true };
  } catch {
    return { success: false, reason: 'error' };
  }
};

/**
 * Disables "Block Apps During Panic". Does not clear selected app tokens —
 * if re-enabled later, the user can re-pick or keep the same selection.
 */
export const disablePanicAppSelection = async (): Promise<void> => {
  await AsyncStorage.setItem(PANIC_APP_SELECTION_KEY, 'false');
};

/**
 * Returns true only if both toggles required for Panic Mode are enabled.
 */
export const arePanicRequirementsMet = async (): Promise<boolean> => {
  const [uninstall, apps] = await Promise.all([
    isUninstallPreventionEnabled(),
    isPanicAppSelectionEnabled(),
  ]);
  return uninstall && apps;
};
