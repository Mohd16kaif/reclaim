// ============================================================================
// RECLAIM SHIELD — Shield Manager
// utils/shieldManager.ts
//
// Central manager for DNS shield state, OS-level filter tracking,
// self-heal flow state, and full shield status snapshots.
//
// All functions use AsyncStorage and the native FamilyControlsBridge.
// Requires Family Controls entitlement in main app.
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
const { FamilyControlsBridge } = NativeModules;
import {
  computeShieldScore,
  
  DEFAULT_LAYER_STATUSES,
  ShieldLayerStatuses,
} from "./shieldLayers";

// ============================================================================
// STORAGE KEYS
// ============================================================================

const KEYS = {
  DNS_PROFILE_STATUS: "@reclaim_dns_profile_status",
  OS_LEVEL_ENABLED: "@reclaim_os_level_enabled",
  SELF_HEAL_PENDING: "@reclaim_self_heal_pending",
  LAYER_STATUSES: "@reclaim_layer_statuses",
  LAST_VERIFIED_AT: "@reclaim_last_verified_at",
};

// ============================================================================
// DNS PROFILE STATUS TYPE
// ============================================================================

/**
 * Represents the current state of the iOS DNS configuration profile:
 * - "not_installed" — user has never set it up
 * - "pending"       — profile was triggered but not yet confirmed installed
 * - "installed"     — profile is active and confirmed
 * - "broken"        — profile was installed but has since been removed / broken
 */
export type DNSProfileStatus =
  | "not_installed"
  | "pending"
  | "installed"
  | "broken";

// ============================================================================
// DNS PROFILE STATUS — READ / WRITE
// ============================================================================

/**
 * Returns the persisted DNS profile status.
 * Defaults to "not_installed" on first run.
 * Checks Family Controls authorization status first, falls back to AsyncStorage.
 */
export const getDNSProfileStatus = async (): Promise<DNSProfileStatus> => {
  try {
    const statusResult = await FamilyControlsBridge.getAuthorizationStatus();
    if (statusResult?.status === "authorized") {
      // Authorization is granted — check if filter is actually marked installed
      const raw = await AsyncStorage.getItem(KEYS.DNS_PROFILE_STATUS);
      if (raw === "installed") return "installed";
    }
  } catch {
    // Native bridge unavailable — fall back to AsyncStorage
  }
  try {
    const raw = await AsyncStorage.getItem(KEYS.DNS_PROFILE_STATUS);
    if (
      raw === "not_installed" ||
      raw === "pending" ||
      raw === "installed" ||
      raw === "broken"
    ) {
      return raw;
    }
    return "not_installed";
  } catch {
    return "not_installed";
  }
};

const setDNSProfileStatus = async (
  status: DNSProfileStatus
): Promise<void> => {
  await AsyncStorage.setItem(KEYS.DNS_PROFILE_STATUS, status);
};

// ============================================================================
// ENABLE SHIELD
// Opens the mobileconfig URL so iOS prompts the user to install the profile.
// Sets status to "pending" so the app can detect when the user returns.
// ============================================================================

/**
 * Enables the adult content filter via FamilyControlsBridge.
 * On success marks status as "installed"; on failure marks "pending".
 */
export const enableShield = async (): Promise<void> => {
  try {
    // Step 1: Check if already authorized
    const statusResult = await FamilyControlsBridge.getAuthorizationStatus();
    
    // Step 2: Request authorization if not yet approved
    if (statusResult?.status !== "authorized") {
      const authResult = await FamilyControlsBridge.requestAuthorization();
      if (!authResult?.authorized) {
        // User denied permission — do not mark as installed
        await setDNSProfileStatus("not_installed");
        return;
      }
    }

    // Step 3: Enable the content filter
    const filterResult = await FamilyControlsBridge.enableContentFilter();
    if (filterResult?.success === true) {
      await setDNSProfileStatus("installed");
      await AsyncStorage.setItem(KEYS.LAST_VERIFIED_AT, Date.now().toString());
    } else {
      await setDNSProfileStatus("pending");
    }
  } catch (error) {
    await setDNSProfileStatus("pending");
  }
};

// ============================================================================
// CONFIRM SHIELD INSTALLED
// Call this when the user returns from Settings and the profile is confirmed.
// ============================================================================

/**
 * Marks the DNS profile status as "installed".
 * Typically called after detecting the app returning from the background
 * and verifying the profile was installed by the user.
 */
export const confirmShieldInstalled = async (): Promise<void> => {
  await setDNSProfileStatus("installed");
  await AsyncStorage.setItem(KEYS.LAST_VERIFIED_AT, Date.now().toString());
};

// ============================================================================
// DISABLE SHIELD
// Marks the profile as removed. iOS doesn't allow programmatic removal,
// so this only updates local state; the user must remove it from Settings.
// ============================================================================

/**
 * Disables the adult content filter via FamilyControlsBridge and clears local state.
 */
export const disableShield = async (): Promise<void> => {
  try {
    await FamilyControlsBridge.disableContentFilter();
  } catch {
    // Ignore errors — still clear local state
  }
  await setDNSProfileStatus("not_installed");
  await AsyncStorage.removeItem(KEYS.LAYER_STATUSES);
  await AsyncStorage.removeItem(KEYS.LAST_VERIFIED_AT);
};

// ============================================================================
// OS-LEVEL FILTER (Screen Time)
// ============================================================================

/**
 * Returns whether the user has enabled Screen Time Content Restrictions
 * (the OS-level adult content filter — Layer 5).
 */
export const isOSLevelEnabled = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(KEYS.OS_LEVEL_ENABLED);
  return raw === "true";
};

/**
 * Marks the OS-level filter as manually enabled by the user.
 * Called from the SelfHeal flow after the user opens Settings.
 */
export const markOSLevelEnabled = async (): Promise<void> => {
  await AsyncStorage.setItem(KEYS.OS_LEVEL_ENABLED, "true");
};

// ============================================================================
// SELF-HEAL PENDING FLAG
// ============================================================================

/**
 * Returns true if a self-heal flow should be shown to the user.
 * Set automatically by verifyAndUpdateLayers() when protection breaks.
 */
export const isSelfHealPending = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(KEYS.SELF_HEAL_PENDING);
  return raw === "true";
};

/**
 * Clears the self-heal pending flag.
 * Call at the start of the SelfHealScreen so it doesn't re-trigger.
 */
export const clearSelfHealPending = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEYS.SELF_HEAL_PENDING);
};

const setSelfHealPending = async (): Promise<void> => {
  await AsyncStorage.setItem(KEYS.SELF_HEAL_PENDING, "true");
};

// ============================================================================
// SELF-HEAL SHIELD
// Re-opens the profile install flow from within the SelfHeal screen.
// ============================================================================

/**
 * Initiates a shield re-start via FamilyControlsBridge.
 * Equivalent to enableShield() but intended for the self-heal flow context.
 */
export const selfHealShield = async (): Promise<void> => {
  await enableShield();
};

// ============================================================================
// LAYER STATUS PERSISTENCE
// ============================================================================

const saveLayerStatuses = async (
  statuses: ShieldLayerStatuses
): Promise<void> => {
  await AsyncStorage.setItem(KEYS.LAYER_STATUSES, JSON.stringify(statuses));
};

const loadLayerStatuses = async (): Promise<ShieldLayerStatuses> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAYER_STATUSES);
    if (raw) {
      return JSON.parse(raw) as ShieldLayerStatuses;
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_LAYER_STATUSES };
};

// ============================================================================
// VERIFY DNS FILTERING
// Simple status check to verify if the DNS profile is active.
// Canary domain check removed as it was unreliable without a custom domain.
// ============================================================================

export const verifyDNSFiltering = async (): Promise<boolean> => {
  if (Platform.OS !== "ios") return false;
  const status = await getDNSProfileStatus();
  return status === "installed";
};

// ============================================================================
// VERIFY AND UPDATE LAYERS
// Called by the Watchdog to derive layer statuses from available signals.
// This is a JS-only assessment — no native entitlements needed.
// ============================================================================

/**
 * Derives current layer statuses from DNS profile state and OS-level flag,
 * persists the result, and returns the updated statuses.
 *
 * This is imported by watchdog.ts and used as the core check.
 */
export const verifyAndUpdateLayers = async (): Promise<ShieldLayerStatuses> => {
  const dnsStatus = await getDNSProfileStatus();
  const osEnabled = await isOSLevelEnabled();
  const shieldInstalled = dnsStatus === "installed";

  const statuses: ShieldLayerStatuses = {
    // Layers 1–4 are all driven by the DNS profile
    dns_shield: shieldInstalled ? "active" : "inactive",
    safe_search: shieldInstalled ? "active" : "inactive",
    social_media_block: shieldInstalled ? "active" : "inactive",
    bypass_resistance: shieldInstalled ? "active" : "inactive",

    // Layer 5 — OS-level Screen Time filter (user-initiated)
    os_level: osEnabled ? "active" : "unavailable",

    // Layer 6 — Watchdog is active if this code is running
    watchdog: "active",

    // Layer 7 — Self-Heal is always available once app is installed
    self_heal: "active",

    // Layer 8 — Status system is always active
    status_system: "active",
  };

  // If DNS profile is broken (detected externally), ensure self-heal is queued
  if (dnsStatus === "broken") {
    await setSelfHealPending();
  }

  await saveLayerStatuses(statuses);
  await AsyncStorage.setItem(KEYS.LAST_VERIFIED_AT, Date.now().toString());

  return statuses;
};

// ============================================================================
// FULL SHIELD STATUS SNAPSHOT
// Used by ShieldStatusScreen and SelfHealScreen for a complete picture.
// ============================================================================

export interface FullShieldStatus {
  dnsProfileStatus: DNSProfileStatus;
  layerStatuses: ShieldLayerStatuses;
  shieldScore: number;
  lastVerifiedAt: number | null;
}

/**
 * Returns a complete snapshot of the current shield state.
 * Reads from cache — does NOT trigger a fresh verification.
 * Call triggerManualCheck() from watchdog to force a re-verify.
 */
export const getFullShieldStatus = async (): Promise<FullShieldStatus> => {
  const dnsProfileStatus = await getDNSProfileStatus();
  const layerStatuses = await loadLayerStatuses();
  const shieldScore = computeShieldScore(layerStatuses);

  const lastVerifiedRaw = await AsyncStorage.getItem(KEYS.LAST_VERIFIED_AT);
  const lastVerifiedAt = lastVerifiedRaw ? parseInt(lastVerifiedRaw, 10) : null;

  return {
    dnsProfileStatus,
    layerStatuses,
    shieldScore,
    lastVerifiedAt,
  };
};

/**
 * Enables the adult content filter with a duration via FamilyControlsBridge.
 * Replaces enableShield() for the duration-based blocker flow.
 */
export const enableShieldWithDuration = async (days: number): Promise<void> => {
  try {
    const statusResult = await FamilyControlsBridge.getAuthorizationStatus();
    if (statusResult?.status !== "authorized") {
      const authResult = await FamilyControlsBridge.requestAuthorization();
      if (!authResult?.authorized) {
        await setDNSProfileStatus("not_installed");
        return;
      }
    }
    await FamilyControlsBridge.enableBlockerWithDuration(days);
    await setDNSProfileStatus("installed");
    await AsyncStorage.setItem(KEYS.LAST_VERIFIED_AT, Date.now().toString());
  } catch {
    await setDNSProfileStatus("not_installed");
    throw new Error("Failed to enable blocker");
  }
};

/**
 * Disables the adult content filter and clears all blocker state.
 */
export const disableShieldWithDuration = async (): Promise<void> => {
  try {
    await FamilyControlsBridge.disableBlocker();
  } catch {
    // still clear local state
  }
  await setDNSProfileStatus("not_installed");
  await AsyncStorage.removeItem(KEYS.LAYER_STATUSES);
  await AsyncStorage.removeItem(KEYS.LAST_VERIFIED_AT);
};

/**
 * Re-applies the active blocker filter on app launch to clear any stale
 * ManagedSettingsStore state left over from a previous build.
 * Call this once from the app's root component on mount.
 */
export const reapplyBlockerIfActive = async (): Promise<void> => {
  try {
    const status = await AsyncStorage.getItem(KEYS.DNS_PROFILE_STATUS);
    if (status !== 'installed') return;

    const authResult = await FamilyControlsBridge.getAuthorizationStatus();
    if (authResult?.status !== 'authorized') return;

    // Re-apply the filter to overwrite any stale store state from a previous build
    await FamilyControlsBridge.enableBlockerWithDuration(0);

    // Restore the correct unblock date if it was a timed block (not permanent)
    const isPermanent = await AsyncStorage.getItem('blocker_is_permanent');
    const unblockAt = await AsyncStorage.getItem('@reclaim_blocker_unblock_at');
    if (!isPermanent && unblockAt) {
      const days = Math.ceil(
        (new Date(unblockAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (days > 0) {
        await FamilyControlsBridge.enableBlockerWithDuration(days);
      } else {
        // Duration already expired — disable cleanly
        await FamilyControlsBridge.disableBlocker();
        await AsyncStorage.setItem(KEYS.DNS_PROFILE_STATUS, 'not_installed');
      }
    }
  } catch {
    // Silently fail — stale state is a cosmetic issue, not a crash
  }
};
