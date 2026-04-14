import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    BlockerSettings,
    DEFAULT_SETTINGS,
    getAllBlockerSettings,
    getBlockerStats,
    logBlockEvent,
    setBlockedCategories as persistCategories,
    setCustomHours as persistCustomHours,
    setBlockerEnabled as persistEnabled,
    setScheduleMode as persistScheduleMode,
    ScheduleMode,
} from '../utils/blockerStorage';

// ============================================================================
// TYPES
// ============================================================================

interface BlockerContextType {
  // State
  blockerEnabled: boolean;
  scheduleMode: ScheduleMode;
  customStartHour: number;
  customEndHour: number;
  blockedCategories: string[];
  daysProtected: number;
  blocksToday: number;
  loading: boolean;

  // Actions
  setBlockerEnabled: (enabled: boolean) => Promise<void>;
  setScheduleMode: (mode: ScheduleMode) => Promise<void>;
  setCustomHours: (start: number, end: number) => Promise<void>;
  setBlockedCategories: (categories: string[]) => Promise<void>;
  logBlock: (category: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const BlockerContext = createContext<BlockerContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const BlockerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BlockerSettings>(DEFAULT_SETTINGS);
  const [daysProtected, setDaysProtected] = useState(0);
  const [blocksToday, setBlocksToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [s, stats] = await Promise.all([getAllBlockerSettings(), getBlockerStats()]);
      setSettings(s);
      setDaysProtected(stats.daysProtected);
      setBlocksToday(stats.blocksToday);
    } catch (e) {
      console.error('BlockerContext load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSetEnabled = useCallback(async (enabled: boolean) => {
    await persistEnabled(enabled);
    setSettings((prev) => ({ ...prev, enabled }));
  }, []);

  const handleSetScheduleMode = useCallback(async (mode: ScheduleMode) => {
    await persistScheduleMode(mode);
    setSettings((prev) => ({ ...prev, scheduleMode: mode }));
  }, []);

  const handleSetCustomHours = useCallback(async (start: number, end: number) => {
    await persistCustomHours(start, end);
    setSettings((prev) => ({ ...prev, customStartHour: start, customEndHour: end }));
  }, []);

  const handleSetCategories = useCallback(async (categories: string[]) => {
    await persistCategories(categories);
    setSettings((prev) => ({ ...prev, blockedCategories: categories }));
  }, []);

  const handleLogBlock = useCallback(async (category: string) => {
    await logBlockEvent(category);
    // Refresh stats
    const stats = await getBlockerStats();
    setDaysProtected(stats.daysProtected);
    setBlocksToday(stats.blocksToday);
  }, []);

  const value: BlockerContextType = {
    blockerEnabled: settings.enabled,
    scheduleMode: settings.scheduleMode,
    customStartHour: settings.customStartHour,
    customEndHour: settings.customEndHour,
    blockedCategories: settings.blockedCategories,
    daysProtected,
    blocksToday,
    loading,
    setBlockerEnabled: handleSetEnabled,
    setScheduleMode: handleSetScheduleMode,
    setCustomHours: handleSetCustomHours,
    setBlockedCategories: handleSetCategories,
    logBlock: handleLogBlock,
    refresh: loadAll,
  };

  return <BlockerContext.Provider value={value}>{children}</BlockerContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

export const useBlocker = (): BlockerContextType => {
  const context = useContext(BlockerContext);
  if (!context) {
    throw new Error('useBlocker must be used within a BlockerProvider');
  }
  return context;
};

export default BlockerContext;
