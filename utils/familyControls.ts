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
