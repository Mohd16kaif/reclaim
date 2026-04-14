import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { startPanicSession } from "../utils/statsStorage";

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  PanicActivated: undefined;
  PanicCoach: { remainingSeconds: number };
};

type NavigationProp = StackNavigationProp<RootStackParamList, "PanicActivated">;

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DURATION_SECONDS = 30 * 60; // 30 minutes default

// ============================================================================
// ICONS
// ============================================================================

const NotificationBellIcon = () => (
  <View style={styles.bellContainer}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0"
        stroke="#1F2937"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** NSFW badge card — red rounded rect with "18+" text */
const NsfwCard = () => (
  <View style={styles.iconCard}>
    <View style={styles.nsfwBadge}>
      <Text style={styles.nsfwText}>18+</Text>
    </View>
    <Text style={styles.nsfwLabel}>NSFW</Text>
  </View>
);

/** Padlock card — central focal-point card with slight elevation */
const LockCard = () => (
  <View style={[styles.iconCard, styles.iconCardCenter]}>
    <Ionicons name="lock-closed" size={36} color="#000000" />
  </View>
);

/** Browser-blocked card — globe with X overlay */
const BrowserBlockedCard = () => (
  <View style={styles.iconCard}>
    <View style={styles.browserIconWrapper}>
      <Ionicons name="globe-outline" size={30} color="#6B7280" />
      <View style={styles.xOverlay}>
        <Ionicons name="close" size={16} color="#EF4444" />
      </View>
    </View>
  </View>
);

/** Single protection-status row */
const StatusRow = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.statusRow}>
    <View style={[styles.statusDot, { backgroundColor: color }]} />
    <Text style={styles.statusLabel}>{label}</Text>
  </View>
);

// ============================================================================
// HELPERS
// ============================================================================

const formatTime = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PanicActivatedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [, setTotalSeconds] = useState<number>(
    DEFAULT_DURATION_SECONDS,
  );
  const [remaining, setRemaining] = useState<number>(DEFAULT_DURATION_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved duration on mount
  useEffect(() => {
    const loadDuration = async () => {
      const saved = await AsyncStorage.getItem("defaultPanicDuration");
      const durationSeconds = saved ? parseInt(saved, 10) : DEFAULT_DURATION_SECONDS;
      setTotalSeconds(durationSeconds);
      setRemaining(durationSeconds);
      // Convert seconds to minutes and store on the session
      // so totalTimeReclaimed is always historically accurate
      const durationMinutes = Math.round(durationSeconds / 60);
      await startPanicSession(durationMinutes);
    };
    loadDuration();
  }, []);

  // ── Countdown timer ──────────────────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Navigate when timer hits 0
  useEffect(() => {
    if (remaining === 0) {
      navigation.replace("PanicCoach", { remainingSeconds: 0 });
    }
  }, [remaining, navigation]);

  // ── Disable hardware back button (Android) ───────────────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  // ── Derived labels ───────────────────────────────────────────────────
  const timerDisplay = formatTime(remaining);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Image
            source={require("../assets/images/reclaim-header.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
            <NotificationBellIcon />
          </TouchableOpacity>
        </View>

        {/* ── Scrollable body ────────────────────────────────────────── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero */}
          <Text style={styles.heading}>Panic Mood Activated</Text>
          <Text style={styles.subtext}>
            Browsers and risky apps are locked.{"\n"}Unmistakable prevention is
            active.
          </Text>

          {/* Illustration cards */}
          <View style={styles.cardsRow}>
            <NsfwCard />
            <LockCard />
            <BrowserBlockedCard />
          </View>

          {/* Countdown */}
          <Text style={styles.protectedLabel}>
            You{"'"}re Protected for the Next
          </Text>
          <Text style={styles.timerText}>{timerDisplay}</Text>

          {/* Sub-label */}
          <Text style={styles.noDecisions}>
            No decisions. No temptation. Just protection.
          </Text>

          {/* Protection status list */}
          <View style={styles.statusList}>
            <StatusRow color="#22C55E" label="Browser Locked" />
            <StatusRow color="#3B82F6" label="Protection Active" />
            <StatusRow
              color="#F97316"
              label={`${timerDisplay} Countdown Running`}
            />
            <StatusRow color="#EF4444" label="Adult Sites Blocked" />
            <StatusRow color="#EF4444" label="Distractions Restricted" />
            <StatusRow color="#22C55E" label="Focus Mode Engaged" />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ── Fixed bottom button ────────────────────────────────────── */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomSafe}>
        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.85}
          onPress={() =>
            navigation.replace("PanicCoach", { remainingSeconds: remaining })
          }
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default PanicActivatedScreen;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoImage: {
    width: 140,
    height: 40,
  },
  bellButton: {
    padding: 5,
  },
  bellContainer: {
    position: "relative" as const,
  },

  // ── Hero ─────────────────────────────────────────────────────────────
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginTop: 24,
  },
  subtext: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },

  // ── Icon cards ──────────────────────────────────────────────────────
  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 12,
  },
  iconCard: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCardCenter: {
    width: 88,
    height: 88,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // NSFW card
  nsfwBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nsfwText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  nsfwLabel: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Browser-blocked card
  browserIconWrapper: {
    position: "relative" as const,
    alignItems: "center",
    justifyContent: "center",
  },
  xOverlay: {
    position: "absolute",
    top: -4,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },

  // ── Countdown ───────────────────────────────────────────────────────
  protectedLabel: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginTop: 32,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    marginTop: 4,
  },

  // ── Sub-label ───────────────────────────────────────────────────────
  noDecisions: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 6,
    marginBottom: 20,
  },

  // ── Status list ─────────────────────────────────────────────────────
  statusList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusLabel: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
  },

  // ── Continue button ─────────────────────────────────────────────────
  bottomSafe: {
    backgroundColor: "#FFFFFF",
  },
  continueButton: {
    backgroundColor: "#000000",
    marginHorizontal: 24,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
