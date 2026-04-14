import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { scheduleWeeklyTimeReclaimed } from "../utils/notificationManager";
import {
  CheckInEntry,
  ComputedStats,
  computeStatsByRange,
  getCheckInHistory,
  getDateRange,
  getPanicSessions,
  getRelapseHistory,
  isDateInRange,
  isInRange,
  PanicSession,
  RelapseEntry,
  StatsTimeRange,
} from "../utils/statsStorage";

// ============================================================================
// TYPES
// ============================================================================

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactElement;
}

interface TimeRangeButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

// ============================================================================
// COMPONENTS
// ============================================================================

const TimeRangeButton: React.FC<TimeRangeButtonProps> = ({
  label,
  isActive,
  onPress,
}): React.ReactElement => (
  <TouchableOpacity
    style={[styles.timeRangeButton, isActive && styles.timeRangeButtonActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text
      style={[
        styles.timeRangeButtonText,
        isActive && styles.timeRangeButtonTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
}): React.ReactElement => (
  <View style={styles.statCard}>
    <View style={styles.statCardIconContainer}>{icon}</View>
    <Text style={styles.statCardLabel}>{label}</Text>
    <Text style={styles.statCardValue}>{value}</Text>
  </View>
);

const SemicircleProgressRing: React.FC<{ progress: number; days: number }> = ({
  progress,
  days,
}): React.ReactElement => {
  const size = 240;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.ringContainer}>
      <Svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
      >
        <Defs>
          <LinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor="#6C63FF" />
            <Stop offset="100%" stopColor="#A78BFA" />
          </LinearGradient>
        </Defs>

        {/* Background arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference / 2} ${circumference}`}
          transform={`rotate(180, ${size / 2}, ${size / 2})`}
        />

        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference / 2} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(180, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Center text */}
      <View style={styles.ringCenterContent}>
        <Text style={styles.ringDaysValue}>{days}</Text>
        <Text style={styles.ringDaysLabel}>Day Streak</Text>
      </View>

      {/* Percentage badge */}
      <View style={styles.percentageBadge}>
        <Text style={styles.percentageBadgeText}>{percentage}%</Text>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function HomeScreen(): React.ReactElement {
  const [timeRange, setTimeRange] = useState<StatsTimeRange>("Week");
  const [computedStats, setComputedStats] = useState<ComputedStats | null>(
    null,
  );
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([]);
  const [relapses, setRelapses] = useState<RelapseEntry[]>([]);
  const [panicSessions, setPanicSessions] = useState<PanicSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, checkInData, relapseData, panicData] = await Promise.all([
        computeStatsByRange(timeRange),
        getCheckInHistory(),
        getRelapseHistory(),
        getPanicSessions(),
      ]);
      setComputedStats(stats);
      setCheckIns(checkInData);
      setRelapses(relapseData);
      setPanicSessions(panicData);

      // ── Schedule weekly time reclaimed notification ───────────────────
      // Only schedule when viewing the Week range so hours_saved is accurate.
      // scheduleWeeklyTimeReclaimed cancels the previous one before rescheduling,
      // so calling this on every weekly-range load is safe and keeps it current.
      if (timeRange === "Week" && stats.totalTimeReclaimed > 0) {
        const hoursSaved = Math.round(stats.totalTimeReclaimed / 60);
        scheduleWeeklyTimeReclaimed(hoursSaved).catch(console.error);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData]),
  );

  // Compute the 6 stat cards locally from raw data
  const stats = useMemo(() => {
    if (!computedStats) return null;

    const { start, end } = getDateRange(timeRange);

    // 1. Check-ins
    const checkInsInRange = checkIns.filter((entry) =>
      isInRange(entry.timestamp, start, end),
    ).length;

    // 2. Safe Days
    const daysInRange =
      timeRange === "Day"
        ? 1
        : timeRange === "Week"
          ? 7
          : new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

    const relapseDatesInRange = new Set(
      relapses
        .filter((entry) => isDateInRange(entry.date, start, end))
        .map((entry) => entry.date),
    ).size;
    const safeDays = Math.max(0, daysInRange - relapseDatesInRange);

    // 3. Panic Help Used
    const panicHelpUsed = panicSessions.filter((session) =>
      isInRange(session.startTimestamp, start, end),
    ).length;

    // 4. Urges Overcome
    const urgesOvercome = panicSessions.filter(
      (session) =>
        isInRange(session.startTimestamp, start, end) && session.wasSuccessful,
    ).length;

    // 5. Protection Days
    const completedPanicSessions = panicSessions.filter(
      (session) =>
        isInRange(session.startTimestamp, start, end) &&
        session.endTimestamp !== null,
    );
    const totalDurationSeconds = completedPanicSessions.reduce(
      (sum, session) => sum + (session.durationSeconds || 0),
      0,
    );
    const protectionDays = Math.round((totalDurationSeconds / 86400) * 10) / 10;

    // 6. Time Reclaimed
    const successfulSessions = panicSessions.filter(
      (session) =>
        isInRange(session.startTimestamp, start, end) && session.wasSuccessful,
    );
    const totalReclaimedSeconds = successfulSessions.reduce(
      (sum, session) => sum + (session.durationSeconds || 0),
      0,
    );
    const totalReclaimedMinutes =
      Math.round((totalReclaimedSeconds / 60) * 10) / 10;

    let timeReclaimedDisplay: string;
    if (totalReclaimedMinutes < 60) {
      timeReclaimedDisplay = `${totalReclaimedMinutes}m`;
    } else {
      const hours = Math.floor(totalReclaimedMinutes / 60);
      const mins = Math.round(totalReclaimedMinutes % 60);
      timeReclaimedDisplay = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    return {
      checkIns: checkInsInRange,
      safeDays,
      panicHelpUsed,
      urgesOvercome,
      protectionDays,
      timeReclaimed: timeReclaimedDisplay,
    };
  }, [checkIns, relapses, panicSessions, timeRange, computedStats]);

  if (loading || !computedStats || !stats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Your Progress</Text>
          <View style={styles.timeRangeContainer}>
            <TimeRangeButton
              label="Day"
              isActive={timeRange === "Day"}
              onPress={() => setTimeRange("Day")}
            />
            <TimeRangeButton
              label="Week"
              isActive={timeRange === "Week"}
              onPress={() => setTimeRange("Week")}
            />
            <TimeRangeButton
              label="Month"
              isActive={timeRange === "Month"}
              onPress={() => setTimeRange("Month")}
            />
          </View>
        </View>

        {/* Semicircle Progress Ring */}
        <SemicircleProgressRing
          progress={computedStats.streakRingProgress}
          days={computedStats.controlStreak}
        />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Check-ins"
            value={stats.checkIns.toString()}
            icon={
              <Ionicons name="checkbox-outline" size={24} color="#6C63FF" />
            }
          />
          <StatCard
            label="Safe Days"
            value={stats.safeDays.toString()}
            icon={
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color="#4ADE80"
              />
            }
          />
          <StatCard
            label="Panic Help Used"
            value={stats.panicHelpUsed.toString()}
            icon={
              <Ionicons name="alert-circle-outline" size={24} color="#F472B6" />
            }
          />
          <StatCard
            label="Urges Overcome"
            value={stats.urgesOvercome.toString()}
            icon={
              <MaterialCommunityIcons
                name="arm-flex-outline"
                size={24}
                color="#60A5FA"
              />
            }
          />
          <StatCard
            label="Protection Days"
            value={stats.protectionDays.toString()}
            icon={<Ionicons name="time-outline" size={24} color="#A78BFA" />}
          />
          <StatCard
            label="Time Reclaimed"
            value={stats.timeReclaimed}
            icon={
              <Ionicons name="hourglass-outline" size={24} color="#FBBF24" />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES — unchanged from original
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0D0D0D",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  timeRangeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4B5563",
    backgroundColor: "transparent",
  },
  timeRangeButtonActive: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },
  timeRangeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  timeRangeButtonTextActive: {
    color: "#FFFFFF",
  },
  ringContainer: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  ringCenterContent: {
    position: "absolute",
    top: 80,
    alignItems: "center",
  },
  ringDaysValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 56,
  },
  ringDaysLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 4,
  },
  percentageBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  percentageBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A78BFA",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 16,
    marginBottom: 4,
  },
  statCardIconContainer: {
    marginBottom: 12,
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
