import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const { FamilyControlsBridge } = NativeModules;

const UNINSTALL_PREVENTION_KEY = '@reclaim_uninstall_prevention_enabled';

/**
 * Returns whether the user has enabled Uninstall Prevention.
 */
export const isUninstallPreventionEnabled = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(UNINSTALL_PREVENTION_KEY);
  return raw === 'true';
};

/**
 * Enables Uninstall Prevention: requests Family Controls authorization
 * (if not already granted) and opens the app picker so the user selects
 * which of their installed apps should be shielded during panic sessions.
 * Returns true only if authorization succeeded AND the picker wasn't cancelled.
 */
export const enableUninstallPrevention = async (): Promise<{
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

    await AsyncStorage.setItem(UNINSTALL_PREVENTION_KEY, 'true');
    return { success: true };
  } catch {
    return { success: false, reason: 'error' };
  }
};

/**
 * Disables Uninstall Prevention. Does not clear selected app tokens —
 * if re-enabled later, the user can re-pick or keep the same selection.
 */
export const disableUninstallPrevention = async (): Promise<void> => {
  await AsyncStorage.setItem(UNINSTALL_PREVENTION_KEY, 'false');
};
