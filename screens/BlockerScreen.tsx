import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { useBlocker } from "../context/BlockerContext";
import { getOnboardingDefaults } from "../utils/blockerStorage";
import { SHIELD_STATE_COLORS } from "../utils/shieldLayers";
import {
  confirmShieldInstalled,
  disableShield,
  DNSProfileStatus,
  enableShield,
  getDNSProfileStatus,
} from "../utils/shieldManager";

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  MainDashboard: undefined;
  Blocker: undefined;
  Notifications: undefined;
  ShieldStatus: undefined;
  SelfHeal: undefined;
};

type BlockerNavigationProp = StackNavigationProp<RootStackParamList, "Blocker">;

interface Notification {
  read: boolean;
  [key: string]: unknown;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ANIMATION_DURATION = 400;
const PULSE_SCALE_MAX = 1.04;
const PULSE_DURATION = 2000;

// ============================================================================
// ICONS
// ============================================================================

const NotificationBellIcon = ({ unreadCount = 0 }: { unreadCount?: number }): React.ReactElement => (
  <View style={styles.notificationIconContainer}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0"
        stroke="#1F2937"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
    {unreadCount > 0 && (
      <View style={styles.notifBadge}>
        <Text style={styles.notifBadgeText}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </Text>
      </View>
    )}
  </View>
);

const ChevronRightIcon = (): React.ReactElement => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke="#C7C7CC"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Static hero: solid black shield with white padlock (~100×110). */
const HeroShieldWithLockIcon = (): React.ReactElement => (
  <Svg width={100} height={110} viewBox="0 0 100 110">
    <Path
      d="M50 4 L92 16 L92 56 Q92 78 76 94 Q63 106 50 106 Q37 106 24 94 Q8 78 8 56 L8 16 Z"
      fill="#000000"
    />
    <Path
      d="M50 40c-7.2 0-13 5.8-13 13v5H32v16h36V58H63v-5c0-7.2-5.8-13-13-13zm0 8c2.8 0 5 2.2 5 5v5H45v-5c0-2.8 2.2-5 5-5z"
      fill="#FFFFFF"
    />
  </Svg>
);

const ToggleCheckmarkCircleIcon = (): React.ReactElement => (
  <Svg width={22} height={22} viewBox="0 0 22 22">
    <Circle cx={11} cy={11} r={11} fill="#000000" />
    <Path
      d="M6.5 11.2 L9.5 14.25 L15.5 8.25"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// ============================================================================
// SHIELD SCORE RING
// ============================================================================

interface ShieldScoreRingProps {
  score: number;
  state: string;
}

/* Retained for experiments; not used in current layout. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- definition kept intentionally
const ShieldScoreRing = ({ score, state }: ShieldScoreRingProps): React.ReactElement => {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);
  const color = SHIELD_STATE_COLORS[state as keyof typeof SHIELD_STATE_COLORS] ?? "#E5E5EA";

  return (
    <View style={styles.ringWrapper}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringScore, { color }]}>{score}</Text>
        <Text style={styles.ringLabel}>/ 100</Text>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BlockerScreen = (): React.ReactElement => {
  const navigation = useNavigation<BlockerNavigationProp>();
  const [unreadCount, setUnreadCount] = useState(0);

  const { loading, setBlockerEnabled, setBlockedCategories, refresh } = useBlocker();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shieldScale = useRef(new Animated.Value(1)).current;

  // Shield state
  const [dnsStatus, setDnsStatus] = useState<DNSProfileStatus>("not_installed");
  const [dnsLoading, setDnsLoading] = useState(false);
  const appState = useRef(AppState.currentState);

  // Load shield status on mount
  useEffect(() => {
    loadShieldStatus();
  }, []);

  const loadShieldStatus = async (): Promise<void> => {
    const status = await getDNSProfileStatus();
    setDnsStatus(status);
  };

  // Detect app returning from Settings after profile install
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          const status = await getDNSProfileStatus();
          if (status === "pending") {
            await confirmShieldInstalled();
            setDnsStatus("installed");
            await setBlockerEnabled(true);
          }
        }
        appState.current = nextState;
      }
    );
    return () => subscription?.remove();
  }, [setBlockerEnabled]);

  // Load onboarding defaults once
  useEffect(() => {
    const loadOnboardingDefaults = async (): Promise<void> => {
      try {
        const defaults = await getOnboardingDefaults();
        const existingCats = await AsyncStorage.getItem("@reclaim_blocker_categories");
        if (!existingCats && defaults.defaultCategories.length > 0) {
          await setBlockedCategories(defaults.defaultCategories);
        }
      } catch {
        // Silently fail - onboarding defaults are not critical
      }
    };
    loadOnboardingDefaults();
  }, [setBlockedCategories]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      refresh();
      loadShieldStatus();
    }, [refresh])
  );

  // Load unread notifications on focus
  useFocusEffect(
    useCallback(() => {
      const loadUnread = async (): Promise<void> => {
        try {
          const stored = await AsyncStorage.getItem("appNotifications");
          const notifs: Notification[] = stored ? JSON.parse(stored) : [];
          setUnreadCount(notifs.filter((n) => !n.read).length);
        } catch {
          setUnreadCount(0);
        }
      };
      loadUnread();
    }, [])
  );

  // Fade in
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  // Shield pulse when active (retained for future use; hero is static in current UI)
  useEffect(() => {
    if (dnsStatus === "installed") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(shieldScale, {
            toValue: PULSE_SCALE_MAX,
            duration: PULSE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(shieldScale, {
            toValue: 1,
            duration: PULSE_DURATION,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      shieldScale.setValue(1);
    }
  }, [dnsStatus, shieldScale]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleEnableShield = async (): Promise<void> => {
    try {
      setDnsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await enableShield();
    } catch {
      // Shield enable failed - user will see UI state unchanged
    } finally {
      setDnsLoading(false);
    }
  };

  const handleDisableShield = async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await disableShield();
    setDnsStatus("not_installed");
    await setBlockerEnabled(false);
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const shieldActive = dnsStatus === "installed";

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Image
            source={require("../assets/images/reclaim-header.png")}
            style={styles.logoImage}
          />
          <View style={styles.headerEnd}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <NotificationBellIcon unreadCount={unreadCount} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={styles.animatedContainer}>

            {/* ── HERO SECTION ─────────────────────────────────────────── */}
            <View style={styles.heroSection}>
              <View style={styles.shieldIconWrapper}>
                <HeroShieldWithLockIcon />
              </View>
              <Text style={styles.heroTitle}>
                {dnsStatus === "pending"
                  ? "Finishing Setup..."
                  : shieldActive
                    ? "Blocker Enabled"
                    : "Blocker Inactive"}
              </Text>
              <Text style={styles.heroSubtitle}>
                {shieldActive
                  ? "Reclaim is now protecting your focus."
                  : "Enable the shield to start protecting yourself."}
              </Text>
            </View>

            {/* ── DESCRIPTIVE TEXT ─────────────────────────────────────── */}
            <View style={styles.descRule} />
            <View style={styles.descCard}>
              <Text style={styles.descText}>
                Harmful and distracting content will be blocked automatically during your vulnerable moments.
              </Text>
            </View>
            <View style={styles.descRule} />

            {/* ── BLOCKER TOGGLE CARD ───────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}>
                  {shieldActive ? (
                    <ToggleCheckmarkCircleIcon />
                  ) : (
                    <View style={styles.toggleInactiveIcon} />
                  )}
                  <Text style={styles.toggleLabel}>
                    {shieldActive ? "Blocker is active" : "Blocker is inactive"}
                  </Text>
                </View>
                <Switch
                  value={shieldActive}
                  onValueChange={(enabled) => {
                    if (enabled) {
                      void handleEnableShield();
                    } else {
                      void handleDisableShield();
                    }
                  }}
                  disabled={dnsLoading || dnsStatus === "pending"}
                  trackColor={{ false: "#E5E5EA", true: "#000000" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {dnsStatus === "pending" && (
                <View style={styles.pendingContainer}>
                  <Text style={styles.pendingText}>
                    {"1. Go to Settings app\n"}
                    {"2. Tap 'Profile Downloaded' at the top\n"}
                    {"3. Tap 'Install' then enter passcode\n"}
                    {"4. Come back to RECLAIM"}
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleEnableShield}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>Open Profile Again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Self-heal when broken — visually hidden in this layout */}
            {dnsStatus === "broken" && (
              <View style={styles.selfHealBannerHidden} pointerEvents="none">
                <TouchableOpacity
                  style={styles.selfHealBanner}
                  onPress={() => navigation.navigate("SelfHeal")}
                  activeOpacity={0.85}
                >
                  <View style={styles.selfHealIcon}>
                    <Text style={styles.selfHealIconText}>⚠️</Text>
                  </View>
                  <View style={styles.selfHealContent}>
                    <Text style={styles.selfHealTitle}>Protection Broken</Text>
                    <Text style={styles.selfHealDesc}>Tap to restore your shield now</Text>
                  </View>
                  <ChevronRightIcon />
                </TouchableOpacity>
              </View>
            )}

            {/* ── REMINDER ──────────────────────────────────────────────── */}
            <View style={styles.reminderContainer}>
              <Text style={styles.reminderText}>
                Blocking is not punishment. It&apos;s protection.
              </Text>
            </View>

            <View style={styles.spacerBottom} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerSpacer: { flex: 1 },
  headerEnd: { flex: 1, alignItems: "flex-end" },
  logoImage: { width: 160, height: 36, resizeMode: "contain" },
  notificationButton: { padding: 5 },
  notificationIconContainer: { position: "relative" },
  notifBadge: {
    position: "absolute", top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center", justifyContent: "center",
  },
  notifBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20, paddingTop: 10 },
  animatedContainer: { opacity: 1 },
  spacerBottom: { height: 20 },

  // Hero
  heroSection: { alignItems: "center", paddingTop: 8, paddingBottom: 20 },
  shieldIconWrapper: { alignItems: "center", marginBottom: 16 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  descRule: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 4,
  },
  descCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  descText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    textAlign: "center",
  },

  // Score ring (ShieldScoreRing component — still defined above)
  ringWrapper: { width: 120, height: 120, position: "relative", alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringScore: { fontSize: 28, fontWeight: "800" },
  ringLabel: { fontSize: 11, color: "#8E8E93", fontWeight: "500" },

  // Card
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: { fontSize: 16, fontWeight: "600", color: "#000000", flexShrink: 1 },
  toggleInactiveIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },

  // Buttons
  primaryButton: {
    backgroundColor: "#000000", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
    marginTop: 14,
  },
  primaryButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  // Pending
  pendingContainer: { gap: 12, marginTop: 12 },
  pendingText: {
    fontSize: 13, color: "#6B7280", lineHeight: 22,
    backgroundColor: "#F9FAFB", padding: 12, borderRadius: 8,
  },

  // Self heal banner
  selfHealBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FEF3C7", borderRadius: 14,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#FDE68A",
  },
  selfHealIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 12 },
  selfHealIconText: { fontSize: 20 },
  selfHealContent: { flex: 1 },
  selfHealTitle: { fontSize: 14, fontWeight: "700", color: "#92400E" },
  selfHealDesc: { fontSize: 12, color: "#B45309", marginTop: 2 },
  selfHealBannerHidden: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    marginBottom: 0,
  },

  // Reminder
  reminderContainer: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#E5E5EA", marginTop: 4 },
  reminderText: { fontSize: 13, fontWeight: "400", color: "#8E8E93", textAlign: "center", lineHeight: 20 },
});

export default BlockerScreen;
