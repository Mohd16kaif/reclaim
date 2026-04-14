import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Haptics from "expo-haptics";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { computeStatsByRange, StatsTimeRange } from "../utils/statsStorage";
import { fetchStreakPercentile } from "../utils/supabase";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RootStackParamList = {
  MainDashboard: undefined;
  Home: any;
  Stats: undefined;
  Blocker: undefined;
  AICoach: undefined;
  Profile: undefined;
  Notifications: undefined;
};

type StatsNavigationProp = StackNavigationProp<RootStackParamList, "Stats">;

type TimeRange = StatsTimeRange;

interface StatsData {
  controlStreak: number;
  streakRingProgress: number;
  relapses: number;
  relapseChangeText: string;
  panicUses: number;
  urgesDefeated: number;
  panicSuccess: number;
  userPercentile: number;

  // New Dynamic Data
  panicProtectionData: { label: string; panicCount: number; urgesDefeated: number; isHigh: boolean }[];
  riskWindowData: { label: string; count: number; intensity: number }[];

  totalTimeReclaimed: number; // minutes
  riskiestTimeRange: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width } = Dimensions.get("window");

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const NotificationBellIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0"
      stroke="#000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Control Streak Circle Component
// Create Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Control Streak Circle Component
const ControlStreakCircle = ({
  days,
  size = 180,
  animatedProgress,
  ringProgress = 0,
}: {
  days: number;
  size?: number;
  animatedProgress: Animated.Value;
  ringProgress?: number;
}) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Use ringProgress based on selected period (passed from parent)
  const targetOffset = circumference * (1 - ringProgress);

  // Interpolate strokeDashoffset from full circumference (0% progress) to target (current progress)
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, targetOffset],
  });

  return (
    <View style={[styles.streakCircleContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.streakCircleSvg}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle - Animated */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1F2937"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.streakCircleContent}>
        <Text style={styles.streakDaysNumber}>{days}</Text>
        <Text style={styles.streakDaysLabel}>Days</Text>
      </View>
    </View>
  );
};

// Small Circular Progress for Panic Success
const PanicSuccessCircle = ({
  percentage,
  size = 70,
}: {
  percentage: number;
  size?: number;
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Ensure percentage is 0-100
  const validPercentage = Math.min(Math.max(percentage, 0), 100);
  const targetOffset = circumference * (1 - validPercentage / 100);

  // Static for simplicity as per previous component state
  const strokeDashoffset = targetOffset;

  return (
    <View style={[styles.panicSuccessContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1F2937"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.panicSuccessContent}>
        <Text style={styles.panicSuccessText}>
          {Math.round(validPercentage)}%
        </Text>
      </View>
    </View>
  );
};

// Progress Bar Component
const ProgressBar = ({
  progress,
  color = "#10B981",
  height = 6,
}: {
  progress: number;
  color?: string;
  height?: number;
}) => (
  <View style={[styles.progressBarContainer, { height }]}>
    <View
      style={[
        styles.progressBarFill,
        {
          width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
          backgroundColor: color,
          height,
        },
      ]}
    />
  </View>
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getDateRangeText = (range: TimeRange): string => {
  const now = new Date();

  if (range === "Day") {
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } else if (range === "Week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    const startStr = startOfWeek.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = endOfWeek.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${startStr} to ${endStr}`;
  } else {
    // Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
};

const getStreakPercentile = (days: number): number => {
  if (days < 3) return 50;
  if (days < 7) return 25;
  if (days < 14) return 10;
  if (days < 30) return 5;
  return 1; // Top 1%
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StatsScreen: React.FC = () => {
  const navigation = useNavigation<StatsNavigationProp>();
  const route = useRoute<any>();
  const scrollTo = route.params?.scrollTo; // 'riskTime' | 'timeReclaimed'

  // Scroll ref for auto-scroll to sections
  const scrollViewRef = useRef<ScrollView>(null);

  // Y positions for scroll targets
  const [riskTimeY, setRiskTimeY] = useState<number>(0);
  const [timeReclaimedY, setTimeReclaimedY] = useState<number>(0);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [realPercentile, setRealPercentile] = useState<number | null>(null);

  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("Week");

  // Computed stats for display
  const [stats, setStats] = useState<StatsData>({
    controlStreak: 0,
    streakRingProgress: 0,
    relapses: 0,
    relapseChangeText: "Starting fresh",
    panicUses: 0,
    urgesDefeated: 0,
    panicSuccess: 0,
    userPercentile: 50,
    panicProtectionData: [],
    riskWindowData: [],
    totalTimeReclaimed: 0,
    riskiestTimeRange: "No data yet",
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  // Handle scroll to section on focus
  useFocusEffect(
    useCallback(() => {
      if (!scrollTo) return;
      const timer = setTimeout(() => {
        if (scrollTo === "riskTime" && riskTimeY > 0) {
          scrollViewRef.current?.scrollTo({
            y: riskTimeY - 16,
            animated: true,
          });
        }
        if (scrollTo === "timeReclaimed" && timeReclaimedY > 0) {
          scrollViewRef.current?.scrollTo({
            y: timeReclaimedY - 16,
            animated: true,
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }, [scrollTo, riskTimeY, timeReclaimedY]),
  );

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = useCallback(
    async (range: TimeRange = selectedTimeRange) => {
      setIsLoading(true);
      try {
        const computed = await computeStatsByRange(range);

        setStats({
          controlStreak: computed.controlStreak,
          streakRingProgress: computed.streakRingProgress,
          relapses: computed.relapses,
          relapseChangeText:
            computed.relapses === 0
              ? "Clean this period"
              : `${computed.relapses} this period`,
          panicUses: computed.panicUses,
          urgesDefeated: computed.urgesDefeated,
          panicSuccess: computed.panicSuccess,
          userPercentile: getStreakPercentile(computed.controlStreak),
          panicProtectionData: computed.panicProtectionData,
          riskWindowData: computed.riskWindowData,
          totalTimeReclaimed: computed.totalTimeReclaimed,
          riskiestTimeRange: computed.riskiestTime,
        });

        // Refresh real percentile from Supabase (cached for 24hrs)
        refreshPercentile(computed.controlStreak);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start();
        barAnim.setValue(0);
        Animated.timing(barAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }).start();
      } catch (e) {
        console.error("Stats load error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTimeRange],
  );

  const refreshPercentile = useCallback(async (streakDays: number) => {
    try {
      const lastFetchStr = await AsyncStorage.getItem("@reclaim_percentile_last_fetch");
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      const shouldFetch = !lastFetchStr || (now - parseInt(lastFetchStr)) > ONE_DAY;
      if (!shouldFetch) {
        // Use cached value
        const cached = await AsyncStorage.getItem("@reclaim_percentile_cached");
        if (cached !== null) {
          setRealPercentile(parseInt(cached));
        }
        return;
      }

      const percentile = await fetchStreakPercentile(streakDays);
      if (percentile !== null) {
        setRealPercentile(percentile);
        await AsyncStorage.setItem("@reclaim_percentile_cached", percentile.toString());
        await AsyncStorage.setItem("@reclaim_percentile_last_fetch", now.toString());
      }
    } catch (e) {
      console.log("[Percentile] fetch error:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(selectedTimeRange);
    }, [loadData, selectedTimeRange]),
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTimeRange(range);
      loadData(range);
    },
    [loadData],
  );

  const handleNotificationsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading && !stats.controlStreak) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Your Progress</Text>
              <Text style={styles.headerSubtitle}>
                A clear view of your control and growth
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotificationsPress}
              activeOpacity={0.7}
            >
              <NotificationBellIcon />
            </TouchableOpacity>
          </View>

          {/* Time Range Tabs */}
          <View style={styles.tabsContainer}>
            {(["Day", "Week", "Month"] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.tabButton,
                  selectedTimeRange === range && styles.tabButtonActive,
                ]}
                onPress={() => handleTimeRangeChange(range)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    selectedTimeRange === range && styles.tabButtonTextActive,
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Range Display */}
          <Text style={styles.dateRangeText}>
            {getDateRangeText(selectedTimeRange)}
          </Text>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Control Streak Section */}
            <View style={styles.streakSection}>
              <Text style={styles.streakTitle}>Control Streak</Text>
              <ControlStreakCircle
                days={stats.controlStreak}
                animatedProgress={progressAnim}
                ringProgress={stats.streakRingProgress}
              />

{realPercentile !== null ? (
              <Text style={styles.percentileText}>
                You beat{" "}
                <Text style={styles.percentileHighlight}>
                  {realPercentile}%
                </Text>{" "}
                of all Reclaim users 🏆
              </Text>
            ) : (
              <Text style={styles.percentileText}>
                You are in the top{" "}
                <Text style={styles.percentileHighlight}>
                  {stats.userPercentile}%
                </Text>{" "}
                of users at your stage
              </Text>
            )}
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {/* Relapses Card */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Relapses</Text>
                  <View style={styles.orangeIcon}>
                    <Text style={styles.iconEmoji}>🔶</Text>
                  </View>
                </View>
                <Text style={styles.statNumber}>{stats.relapses}</Text>
                <Text style={styles.statSubtext}>
                  {stats.relapseChangeText}
                </Text>
              </View>

              {/* Panic Uses Card */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Panic uses</Text>
                  <View style={styles.blueIcon}>
                    <Text style={styles.iconEmoji}>🔵</Text>
                  </View>
                </View>
                <Text style={styles.statNumber}>{stats.panicUses}</Text>
                <Text style={styles.statSubtext}>Seeking help is strength</Text>
              </View>

              {/* Urges Defeated Card */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Urges defeated</Text>
                  <View style={styles.greenIcon}>
                    <Text style={styles.iconEmoji}>✅</Text>
                  </View>
                </View>
                <Text style={styles.statNumber}>{stats.urgesDefeated}</Text>
                <ProgressBar
                  progress={stats.urgesDefeated / 100}
                  color="#10B981"
                />
              </View>

              {/* Panic Success Card */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Panic success</Text>
                </View>
                {stats.panicUses === 0 ? (
                  <View style={styles.panicSuccessWrapper}>
                    <Text style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center' }}>
                      No Data
                    </Text>
                  </View>
                ) : (
                  <View style={styles.panicSuccessWrapper}>
                    <PanicSuccessCircle percentage={stats.panicSuccess} />
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
                      {stats.urgesDefeated} of {stats.panicUses} uses
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* SPACER */}
            <View style={{ height: 24 }} />

            {/* Panic Protection Time Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Protection Activity
                </Text>
                <Text style={{ fontSize: 11, color: "#9CA3AF" }}>
                  {selectedTimeRange === "Day"
                    ? "by time of day"
                    : selectedTimeRange === "Week"
                      ? "Mon \u2192 Sun"
                      : "Week by week"}
                </Text>
              </View>

              {/* Legend */}
              <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{
                    width: 12, height: 6, borderRadius: 3,
                    backgroundColor: "#1F2937",
                  }} />
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>Panic uses</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{
                    width: 12, height: 6, borderRadius: 3,
                    backgroundColor: "#9CA3AF",
                  }} />
                  <Text style={{ fontSize: 11, color: "#6B7280" }}>Urges defeated</Text>
                </View>
              </View>

              <View style={styles.chartContainer}>
                {stats.panicProtectionData.every((d) => d.panicCount === 0) ? (
                  <Text style={{ color: "#9CA3AF", fontStyle: "italic" }}>
                    No panic sessions yet
                  </Text>
                ) : (
                  stats.panicProtectionData.map((data, index) => {
                    const maxPanic = Math.max(
                      ...stats.panicProtectionData.map((d) => d.panicCount), 1
                    );
                    const panicWidth = data.panicCount > 0
                      ? Math.max((data.panicCount / maxPanic) * 100, 4)
                      : 0;
                    const urgeWidth = data.panicCount > 0
                      ? Math.max((data.urgesDefeated / maxPanic) * 100, data.urgesDefeated > 0 ? 4 : 0)
                      : 0;

                    return (
                      <View key={index} style={{ marginBottom: 14 }}>
                        {/* Label row */}
                        <View style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 5,
                        }}>
                          <Text style={{
                            fontSize: 12,
                            color: "#374151",
                            fontWeight: "500",
                            flex: 1,
                          }}>
                            {data.label}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#6B7280" }}>
                            {data.urgesDefeated}/{data.panicCount}
                          </Text>
                        </View>

                        {/* Panic bar — dark animated */}
                        <View style={styles.horizontalBarTrack}>
                          <Animated.View
                            style={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: data.isHigh ? "#000000" : "#1F2937",
                              width: barAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", `${panicWidth}%`],
                              }),
                            }}
                          />
                        </View>

                        {/* Urge defeated bar — gray animated */}
                        <View style={{ height: 4 }} />
                        <View style={styles.horizontalBarTrack}>
                          <Animated.View
                            style={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "#9CA3AF",
                              width: barAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", `${urgeWidth}%`],
                              }),
                            }}
                          />
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            {/* Risk Window Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Risk Window (Hourly)</Text>
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#1F2937" }]}
                    />
                    <Text style={styles.legendText}>Intensity</Text>
                  </View>
                </View>
              </View>
<View style={styles.verticalChartContainer}>
                  <Svg height="120" width="100%">
                    <Defs>
                      <LinearGradient
                        id="barGradient"
                        x1="0"
                        y1="1"
                        x2="0"
                        y2="0"
                      >
                        <Stop offset="0" stopColor="#1F2937" stopOpacity="1" />
                        <Stop offset="1" stopColor="#4B5563" stopOpacity="1" />
                      </LinearGradient>
                    </Defs>
                    {stats.riskWindowData.map((bar, i) => (
                      <Rect
                        key={i}
                        x={`${i * (100 / 24)}%`}
                        y={
                          120 -
                          (bar.intensity > 0 ? (bar.intensity / 100) * 115 : 0)
                        }
                        width="3%"
                        height={
                          bar.intensity > 0 ? (bar.intensity / 100) * 115 : 0
                        }
                        fill="url(#barGradient)"
                        rx="1"
                      />
                    ))}
                    {/* Baseline if empty */}
                    <Rect x="0" y="119" width="100%" height="1" fill="#E5E7EB" />
                  </Svg>
                  <View style={styles.xAxisContainer}>
                    <Text style={styles.xAxisLabel}>12 AM</Text>
                    <Text style={styles.xAxisLabel}>6 AM</Text>
                    <Text style={styles.xAxisLabel}>12 PM</Text>
                    <Text style={styles.xAxisLabel}>6 PM</Text>
                    <Text style={styles.xAxisLabel}>12 AM</Text>
                  </View>
                </View>
            </View>

            {/* Riskiest Time */}
            <View
              collapsable={false}
              onLayout={(e) => setRiskTimeY(e.nativeEvent.layout.y)}
              style={styles.factorsContainer}
            >
              <Text style={styles.factorsTitle}>RISKIEST TIME</Text>
              <View style={styles.riskiestTimeCard}>
                <Text style={styles.riskiestTimeText}>
                  {stats.riskiestTimeRange}
                </Text>
              </View>
            </View>

            {/* Total Time Reclaimed */}
            <View
              collapsable={false}
              onLayout={(e) => setTimeReclaimedY(e.nativeEvent.layout.y)}
              style={styles.totalTimeCard}
            >
              <ExpoLinearGradient
                colors={["#1F2937", "#000000"]}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.9, y: 0.9 }}
                style={styles.totalTimeGradient}
              >
                <View style={styles.totalTimeHeader}>
                  <Text style={styles.totalTimeIcon}>⏱️</Text>
                </View>
                <Text style={styles.totalTimeLabel}>Total Time Reclaimed</Text>
                <View style={styles.totalTimeValueRow}>
                  <Text style={styles.totalTimeValue}>
                    {stats.totalTimeReclaimed === 0
                      ? "0"
                      : stats.totalTimeReclaimed >= 60
                        ? `${Math.floor(stats.totalTimeReclaimed / 60)}h ${stats.totalTimeReclaimed % 60 > 0 ? `${stats.totalTimeReclaimed % 60}m` : ""}`
                        : `${stats.totalTimeReclaimed}`}
                  </Text>
                  <Text style={styles.totalTimeUnit}>
                    {stats.totalTimeReclaimed >= 60 ? "" : "Mins"}
                  </Text>
                </View>
                <Text style={styles.totalTimeSubtitle}>
                  {stats.totalTimeReclaimed === 0
                    ? "Complete a panic session to start reclaiming time"
                    : stats.totalTimeReclaimed >= 1440
                      ? `${(stats.totalTimeReclaimed / 1440).toFixed(1)} days of full freedom gained back`
                      : stats.totalTimeReclaimed >= 60
                        ? `${Math.floor(stats.totalTimeReclaimed / 60)}h ${stats.totalTimeReclaimed % 60}m reclaimed from temptation`
                        : `${stats.totalTimeReclaimed} minutes reclaimed — every minute counts`}
                </Text>
              </ExpoLinearGradient>
            </View>

            {/* Add some bottom padding for scroll */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    position: "relative",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
  },
  notificationButton: {
    position: "absolute",
    right: 20,
    top: 8,
    padding: 8,
  },

  // Time Range Tabs
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabButtonTextActive: {
    color: "#000000",
    fontWeight: "600",
  },

  // Date Range
  dateRangeText: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 16,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Streak Section
  streakSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 20,
  },
  streakCircleContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  streakCircleSvg: {
    position: "absolute",
  },
  streakCircleContent: {
    alignItems: "center",
  },
  streakDaysNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 56,
  },
  streakDaysLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#9CA3AF",
    marginTop: -4,
  },
  percentileText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  percentileHighlight: {
    fontWeight: "700",
    color: "#000000",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 120,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  statSubtext: {
    fontSize: 11,
    fontWeight: "400",
    color: "#9CA3AF",
    lineHeight: 14,
  },

  // Icon Styles
  orangeIcon: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  blueIcon: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  greenIcon: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconEmoji: {
    fontSize: 14,
  },

  // Progress Bar
  progressBarContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: {
    borderRadius: 4,
  },

  // Panic Success Circle
  panicSuccessWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  panicSuccessContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  panicSuccessContent: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  panicSuccessText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },

  // Section Styles
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  chartContainer: {
    paddingVertical: 8,
  },
  horizontalBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  horizontalBarLabel: {
    width: 40,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  horizontalBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginLeft: 12,
    overflow: "hidden",
  },
  horizontalBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  legendContainer: {
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  verticalChartContainer: {
    height: 150,
    justifyContent: "flex-end",
  },
  xAxisContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 0,
  },
  xAxisLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  // Factors
  factorsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  factorsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Riskiest Time
  riskiestTimeCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  riskiestTimeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  // Total Time Card
  totalTimeCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  totalTimeGradient: {
    padding: 24,
  },
  totalTimeHeader: {
    marginBottom: 16,
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  totalTimeIcon: {
    fontSize: 20,
  },
  totalTimeLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  totalTimeValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  totalTimeValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    marginRight: 8,
    lineHeight: 56,
  },
  totalTimeUnit: {
    fontSize: 16,
    color: "#D1D5DB",
    fontWeight: "500",
  },
  totalTimeSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 20,
  },
});

export default StatsScreen;
