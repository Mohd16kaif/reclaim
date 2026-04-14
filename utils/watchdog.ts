// ============================================================================
// RECLAIM SHIELD — Watchdog Monitor
// utils/watchdog.ts
//
// Layer 6 of the Reclaim Shield system.
// Monitors all shield layers, detects breaks, fires notifications,
// and triggers the self-heal flow when protection drops.
//
// Works entirely in JS — no native entitlements required.
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { scheduleWatchdogAlert } from "./notificationManager";
import {
  computeShieldScore,
  getOverallShieldState,
  OverallShieldState,
  ShieldLayerStatuses,
} from "./shieldLayers";
import {
  getDNSProfileStatus,
  isSelfHealPending,
  verifyAndUpdateLayers,
} from "./shieldManager";

// ============================================================================
// CONFIG
// ============================================================================

// How often the Watchdog polls when app is in foreground (ms)
const FOREGROUND_POLL_INTERVAL_MS = 60 * 1000; // 1 minute

// Minimum time between watchdog alert notifications (ms)
// Prevents notification spam if shield stays broken
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// Score drop threshold that triggers an alert
// If score drops by this much or more, fire an alert
const SCORE_DROP_ALERT_THRESHOLD = 20;

// ============================================================================
// STORAGE KEYS
// ============================================================================

const WATCHDOG_KEYS = {
  LAST_ALERT_SENT_AT: "@reclaim_watchdog_last_alert",
  LAST_KNOWN_SCORE: "@reclaim_watchdog_last_score",
  WATCHDOG_ENABLED: "@reclaim_watchdog_enabled",
};

// ============================================================================
// WATCHDOG STATE
// Internal singleton — only one instance runs at a time
// ============================================================================

let foregroundPollTimer: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let onStatusChange:
  | ((state: OverallShieldState, score: number) => void)
  | null = null;
let onSelfHealNeeded: (() => void) | null = null;

// ============================================================================
// WATCHDOG RESULT TYPE
// ============================================================================

export interface WatchdogCheckResult {
  previousScore: number;
  currentScore: number;
  overallState: OverallShieldState;
  layerStatuses: ShieldLayerStatuses;
  alertFired: boolean;
  selfHealTriggered: boolean;
}

// ============================================================================
// CORE CHECK
// Runs a full shield verification and handles any state changes.
// ============================================================================

export const runWatchdogCheck = async (): Promise<WatchdogCheckResult> => {
  // Get previous score for comparison
  const prevScoreRaw = await AsyncStorage.getItem(
    WATCHDOG_KEYS.LAST_KNOWN_SCORE,
  );
  const previousScore = prevScoreRaw ? parseInt(prevScoreRaw) : 100;

  // Run full layer verification
  const layerStatuses = await verifyAndUpdateLayers();
  const currentScore = computeShieldScore(layerStatuses);
  const overallState = getOverallShieldState(currentScore);

  // Persist new score
  await AsyncStorage.setItem(
    WATCHDOG_KEYS.LAST_KNOWN_SCORE,
    currentScore.toString(),
  );

  let alertFired = false;
  let selfHealTriggered = false;

  const scoreDrop = previousScore - currentScore;
  const dnsStatus = await getDNSProfileStatus();

  // ── Check if alert should fire ─────────────────────────────────────────
  if (
    (overallState === "vulnerable" ||
      scoreDrop >= SCORE_DROP_ALERT_THRESHOLD) &&
    dnsStatus !== "not_installed" // Only alert if user had shield enabled
  ) {
    const shouldAlert = await checkAlertCooldown();
    if (shouldAlert) {
      await scheduleWatchdogAlert(overallState, currentScore);
      await AsyncStorage.setItem(
        WATCHDOG_KEYS.LAST_ALERT_SENT_AT,
        Date.now().toString(),
      );
      alertFired = true;
    }
  }

  // ── Check if self-heal flow should trigger ─────────────────────────────
  const selfHealPending = await isSelfHealPending();
  if (selfHealPending && onSelfHealNeeded) {
    onSelfHealNeeded();
    selfHealTriggered = true;
  }

  // ── Notify status change listeners ────────────────────────────────────
  if (onStatusChange && currentScore !== previousScore) {
    onStatusChange(overallState, currentScore);
  }

  return {
    previousScore,
    currentScore,
    overallState,
    layerStatuses,
    alertFired,
    selfHealTriggered,
  };
};

// ============================================================================
// ALERT COOLDOWN CHECK
// Prevents spamming the user with repeated notifications
// ============================================================================

const checkAlertCooldown = async (): Promise<boolean> => {
  const lastAlertRaw = await AsyncStorage.getItem(
    WATCHDOG_KEYS.LAST_ALERT_SENT_AT,
  );
  if (!lastAlertRaw) return true;

  const lastAlert = parseInt(lastAlertRaw);
  const elapsed = Date.now() - lastAlert;
  return elapsed >= ALERT_COOLDOWN_MS;
};

// ============================================================================
// START / STOP WATCHDOG
// Call startWatchdog() in your root component or App.tsx on app load.
// ============================================================================

export interface WatchdogOptions {
  /** Callback fired whenever overall shield state changes */
  onStatusChange?: (state: OverallShieldState, score: number) => void;
  /** Callback fired when self-heal flow needs to be shown */
  onSelfHealNeeded?: () => void;
}

export const startWatchdog = (options?: WatchdogOptions): void => {
  if (options?.onStatusChange) {
    onStatusChange = options.onStatusChange;
  }
  if (options?.onSelfHealNeeded) {
    onSelfHealNeeded = options.onSelfHealNeeded;
  }

  // Run immediately on start
  runWatchdogCheck().catch(console.error);

  // Poll every minute while in foreground
  if (!foregroundPollTimer) {
    foregroundPollTimer = setInterval(() => {
      runWatchdogCheck().catch(console.error);
    }, FOREGROUND_POLL_INTERVAL_MS);
  }

  // Run check every time app comes to foreground
  if (!appStateSubscription) {
    let lastAppState: AppStateStatus = AppState.currentState;

    appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const wasBackground =
          lastAppState === "background" || lastAppState === "inactive";
        const nowActive = nextState === "active";

        if (wasBackground && nowActive) {
          // App came to foreground — run a check
          runWatchdogCheck().catch(console.error);
        }

        lastAppState = nextState;
      },
    );
  }

  AsyncStorage.setItem(WATCHDOG_KEYS.WATCHDOG_ENABLED, "true").catch(
    console.error,
  );
};

export const stopWatchdog = (): void => {
  if (foregroundPollTimer) {
    clearInterval(foregroundPollTimer);
    foregroundPollTimer = null;
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  onStatusChange = null;
  onSelfHealNeeded = null;

  AsyncStorage.setItem(WATCHDOG_KEYS.WATCHDOG_ENABLED, "false").catch(
    console.error,
  );
};

// ============================================================================
// QUICK STATUS READ
// Lightweight — reads from cache, does NOT re-verify.
// Use in UI components that just need current state, not a fresh check.
// ============================================================================

export const getWatchdogCachedStatus = async (): Promise<{
  score: number;
  state: OverallShieldState;
}> => {
  const raw = await AsyncStorage.getItem(WATCHDOG_KEYS.LAST_KNOWN_SCORE);
  const score = raw ? parseInt(raw) : 0;
  return {
    score,
    state: getOverallShieldState(score),
  };
};

// ============================================================================
// MANUAL TRIGGER
// Call this from BlockerScreen after user re-enables shield,
// or from SelfHealScreen after re-enable completes.
// ============================================================================

export const triggerManualCheck = async (): Promise<WatchdogCheckResult> => {
  return runWatchdogCheck();
};

// ============================================================================
// WATCHDOG ENABLED CHECK
// ============================================================================

export const isWatchdogRunning = (): boolean => {
  return foregroundPollTimer !== null;
};
