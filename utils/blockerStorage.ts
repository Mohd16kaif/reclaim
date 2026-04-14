import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const BLOCKER_STORAGE_KEYS = {
  BLOCKER_ENABLED: '@reclaim_blocker_enabled',
  SCHEDULE_MODE: '@reclaim_blocker_schedule_mode',
  CUSTOM_START_HOUR: '@reclaim_blocker_custom_start_hour',
  CUSTOM_END_HOUR: '@reclaim_blocker_custom_end_hour',
  BLOCKED_CATEGORIES: '@reclaim_blocker_categories',
  BLOCK_EVENT_LOG: '@reclaim_blocker_event_log',
};

// ============================================================================
// TYPES
// ============================================================================

export type ScheduleMode = 'all_day' | 'custom_hours' | 'vulnerable_moments';

export interface BlockEvent {
  timestamp: number;
  category: string;
}

export interface BlockerSettings {
  enabled: boolean;
  scheduleMode: ScheduleMode;
  customStartHour: number; // 0-23
  customEndHour: number;   // 0-23
  blockedCategories: string[];
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_CATEGORIES = ['Social Media', 'Adult Content', 'Gaming', 'Streaming'];

export const DEFAULT_SETTINGS: BlockerSettings = {
  enabled: true,
  scheduleMode: 'all_day',
  customStartHour: 22, // 10 PM
  customEndHour: 8,    // 8 AM
  blockedCategories: ['Social Media', 'Adult Content'],
};

// ============================================================================
// READ HELPERS
// ============================================================================

export const getBlockerEnabled = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.BLOCKER_ENABLED);
    if (val === null) return DEFAULT_SETTINGS.enabled;
    return val === 'true';
  } catch {
    return DEFAULT_SETTINGS.enabled;
  }
};

export const getScheduleMode = async (): Promise<ScheduleMode> => {
  try {
    const val = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.SCHEDULE_MODE);
    if (val === 'all_day' || val === 'custom_hours' || val === 'vulnerable_moments') return val;
    return DEFAULT_SETTINGS.scheduleMode;
  } catch {
    return DEFAULT_SETTINGS.scheduleMode;
  }
};

export const getCustomHours = async (): Promise<{ start: number; end: number }> => {
  try {
    const startStr = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.CUSTOM_START_HOUR);
    const endStr = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.CUSTOM_END_HOUR);
    return {
      start: startStr ? parseInt(startStr, 10) : DEFAULT_SETTINGS.customStartHour,
      end: endStr ? parseInt(endStr, 10) : DEFAULT_SETTINGS.customEndHour,
    };
  } catch {
    return { start: DEFAULT_SETTINGS.customStartHour, end: DEFAULT_SETTINGS.customEndHour };
  }
};

export const getBlockedCategories = async (): Promise<string[]> => {
  try {
    const val = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.BLOCKED_CATEGORIES);
    if (val) return JSON.parse(val);
    return DEFAULT_SETTINGS.blockedCategories;
  } catch {
    return DEFAULT_SETTINGS.blockedCategories;
  }
};

export const getBlockEventLog = async (): Promise<BlockEvent[]> => {
  try {
    const val = await AsyncStorage.getItem(BLOCKER_STORAGE_KEYS.BLOCK_EVENT_LOG);
    if (val) return JSON.parse(val);
    return [];
  } catch {
    return [];
  }
};

export const getAllBlockerSettings = async (): Promise<BlockerSettings> => {
  const [enabled, scheduleMode, customHours, blockedCategories] = await Promise.all([
    getBlockerEnabled(),
    getScheduleMode(),
    getCustomHours(),
    getBlockedCategories(),
  ]);
  return {
    enabled,
    scheduleMode,
    customStartHour: customHours.start,
    customEndHour: customHours.end,
    blockedCategories,
  };
};

// ============================================================================
// WRITE HELPERS
// ============================================================================

export const setBlockerEnabled = async (enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(BLOCKER_STORAGE_KEYS.BLOCKER_ENABLED, String(enabled));
};

export const setScheduleMode = async (mode: ScheduleMode): Promise<void> => {
  await AsyncStorage.setItem(BLOCKER_STORAGE_KEYS.SCHEDULE_MODE, mode);
};

export const setCustomHours = async (start: number, end: number): Promise<void> => {
  await Promise.all([
    AsyncStorage.setItem(BLOCKER_STORAGE_KEYS.CUSTOM_START_HOUR, String(start)),
    AsyncStorage.setItem(BLOCKER_STORAGE_KEYS.CUSTOM_END_HOUR, String(end)),
  ]);
};

export const setBlockedCategories = async (categories: string[]): Promise<void> => {
  await AsyncStorage.setItem(BLOCKER_STORAGE_KEYS.BLOCKED_CATEGORIES, JSON.stringify(categories));
};

export const logBlockEvent = async (category: string): Promise<void> => {
  try {
    const existing = await getBlockEventLog();
    const event: BlockEvent = { timestamp: Date.now(), category };
    existing.push(event);
    await AsyncStorage.setItem(BLOCKER_STORAGE_KEYS.BLOCK_EVENT_LOG, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to log block event:', e);
  }
};

// ============================================================================
// STATS HELPERS
// ============================================================================

export const getBlockerStats = async (): Promise<{ daysProtected: number; blocksToday: number }> => {
  try {
    const events = await getBlockEventLog();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Blocks today
    const blocksToday = events.filter((e) => {
      const d = new Date(e.timestamp);
      return d.toISOString().split('T')[0] === todayStr;
    }).length;

    // Days protected: distinct calendar days with at least one block event
    // OR days since blocker was first enabled
    const uniqueDays = new Set(
      events.map((e) => new Date(e.timestamp).toISOString().split('T')[0])
    );
    const daysProtected = uniqueDays.size;

    return { daysProtected, blocksToday };
  } catch {
    return { daysProtected: 0, blocksToday: 0 };
  }
};

// ============================================================================
// ONBOARDING DATA READER (for pre-configuring defaults)
// ============================================================================

export const getOnboardingDefaults = async (): Promise<{
  defaultCategories: string[];
  vulnerableMoments: string[];
}> => {
  try {
    const profileStr = await AsyncStorage.getItem('userProfile');
    if (!profileStr) return { defaultCategories: DEFAULT_SETTINGS.blockedCategories, vulnerableMoments: [] };

    const profile = JSON.parse(profileStr);
    const categories: string[] = [];
    const vulnerableMoments: string[] = [];

    // From TemptingAppsScreen: selectedApp (e.g., "Instagram", "YouTube")
    if (profile.selectedApp) {
      categories.push('Social Media');
    }

    // From SuggestiveImagesFilterScreen: suggestiveFilter (e.g., "Yes")
    if (profile.suggestiveFilter === 'Yes' || profile.selectedFilter === 'Yes') {
      categories.push('Adult Content');
    }

    // From SocialMediaTriggerScreen: selectedTrigger (e.g., "Yes")
    if (profile.selectedTrigger === 'Yes' || profile.selectedTrigger === 'sometimes') {
      if (!categories.includes('Social Media')) categories.push('Social Media');
    }

    // Always include Adult Content by default for safety
    if (!categories.includes('Adult Content')) {
      categories.push('Adult Content');
    }

    // Vulnerable moments from stress/boredom frequency
    if (profile.stressFrequency) {
      vulnerableMoments.push(`Stress: ${profile.stressFrequency}`);
    }
    if (profile.boredomFrequency) {
      vulnerableMoments.push(`Boredom: ${profile.boredomFrequency}`);
    }

    return {
      defaultCategories: categories.length > 0 ? categories : DEFAULT_SETTINGS.blockedCategories,
      vulnerableMoments,
    };
  } catch {
    return { defaultCategories: DEFAULT_SETTINGS.blockedCategories, vulnerableMoments: [] };
  }
};
