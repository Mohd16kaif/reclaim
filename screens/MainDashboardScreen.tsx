import { syncStreakToSupabase } from "@/utils/supabase";
import { CHAPTERS } from "../constants/chapters";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  InteractionManager,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Path,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { useDashboardData } from "../hooks/useDashboardData";
import {
  getTimeOfDay,
  trackCheckInCompleted,
  trackCheckInOpened,
  trackCheckInSkipped,
  trackPanicButtonPressed,
  trackRelapseDenied,
  trackRelapseModalOpened,
  trackRelapseRecorded,
  trackStreakMilestone,
} from "../utils/analytics";
import { getCheckInHistory, getPanicSessions, getRelapseHistory, recordCheckIn, recordRelapseEvent, resolvePendingVerdict, STATS_KEYS } from "../utils/statsStorage";
import {
  getChapterDisplayName,
  loadUserProgress,
  recordRelapse,
} from "../utils/userProgress";

// ── Types ─────────────────────────────────────────────────────────────────────

type RootStackParamList = {
  MainDashboard: { _panicResume?: number } | undefined;
  Home: any;
  Stats: { scrollTo?: string } | undefined;
  Blocker: undefined;
  AICoach: undefined;
  Profile: undefined;
  Notifications: undefined;
  FAQs: undefined;
  ChaptersScreen: undefined;
  ChapterDetail: {
    chapterIndex: number;
  };
  ChapterContent: { chapterId: string };
  PanicShield: undefined;
};

type DashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MainDashboard"
>;

// ── Streak milestones to celebrate ───────────────────────────────────────────
const STREAK_MILESTONES = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];

// ── Icon components ───────────────────────────────────────────────────────────

const NotificationBellIcon = ({ unreadCount }: { unreadCount: number }) => (
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
    {unreadCount > 0 && (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationBadgeText}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </Text>
      </View>
    )}
  </View>
);

const WarningIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke="#fff"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AnimatedFlame: React.FC = () => {
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flameScale, {
            toValue: 1.12,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(flameScale, {
            toValue: 0.95,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(flameY, {
            toValue: -8,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(flameY, {
            toValue: 4,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [flameScale, flameY]);

  return (
    <Animated.Text
      style={{
        fontSize: 72,
        transform: [{ scale: flameScale }, { translateY: flameY }],
      }}
    >
      🔥
    </Animated.Text>
  );
};

const HomeCard = ({
  iconName,
  iconColor,
  iconBg,
  title,
  subtitle,
  badgeLabel,
  badgeBg,
  badgeColor,
  onPress,
}: {
  iconName: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeBg: string;
  badgeColor: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.homeCard}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.homeCardIconContainer, { backgroundColor: iconBg }]}>
      <Ionicons name={iconName as any} size={22} color={iconColor} />
    </View>
    <Text style={styles.homeCardTitle}>{title}</Text>
    <Text style={styles.homeCardSubtitle}>{subtitle}</Text>
    <View style={[styles.homeCardBadge, { backgroundColor: badgeBg }]}>
      <Text style={[styles.homeCardBadgeText, { color: badgeColor }]}>
        {badgeLabel}
      </Text>
    </View>
  </TouchableOpacity>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const getWeekRange = (): string => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
  return `${fmt(monday)} to ${fmt(sunday)}`;
};

const formatTimeReclaimed = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const SemiCircleGauge: React.FC<{ percentage: number; label: string }> = ({
  percentage,
  label,
}) => {
  const width = 260;
  const height = 140;
  const cx = width / 2;
  const cy = height - 10;
  const radius = 110;
  const strokeWidth = 18;

  const polarToCartesian = (angle: number) => {
    const rad = (angle - 180) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const fillAngle = Math.min(179, (percentage / 100) * 180);

  return (
    <View style={{ alignItems: "center", marginVertical: 8 }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id="blackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#555555" stopOpacity="1" />
            <Stop offset="50%" stopColor="#222222" stopOpacity="1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={describeArc(0, 180)}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {percentage > 0 && (
          <Path
            d={describeArc(0, fillAngle)}
            fill="none"
            stroke="url(#blackGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
      </Svg>
      <View style={{ position: "absolute", bottom: 16, alignItems: "center" }}>
        <Text style={{ fontSize: 36, fontWeight: "800", color: "#000000" }}>
          {percentage}%
        </Text>
        <View
          style={{
            backgroundColor: "#000000",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginTop: 6,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "500" }}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const MainDashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "MainDashboard">>();
  const { data, loading, refresh } = useDashboardData();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const lastPanicResumeHandledRef = useRef<number | null>(null);

  const insets = useSafeAreaInsets();
  const NAVBAR_PILL_HEIGHT = 76;
  const NAVBAR_BOTTOM_OFFSET = 28;
  const bottomPadding = insets.bottom + NAVBAR_PILL_HEIGHT + NAVBAR_BOTTOM_OFFSET;

  const [isCheckInVisible, setIsCheckInVisible] = useState(false);
  const [checkInStep, setCheckInStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [hasCheckedInTodayLocal, setHasCheckedInTodayLocal] = useState(false);

  const [isRelapseVisible, setIsRelapseVisible] = useState(false);
  const [relapseStep, setRelapseStep] = useState(1);
  const [relapseReason, setRelapseReason] = useState<string | null>(null);
  const [relapseCommitment, setRelapseCommitment] = useState<string>("");

  const [isPanicVerdictVisible, setIsPanicVerdictVisible] = useState(false);

  const [weeklyStats, setWeeklyStats] = useState({
    safeDays: 0,
    checkIns: 0,
    urgesDefeated: 0,
    totalUrges: 0,
    stabilityScore: 0,
    stabilityLabel: '',
    timeReclaimedMinutes: 0,
  });

  const [unreadCount, setUnreadCount] = useState(0);

  const [summaryStats, setSummaryStats] = useState({
    protectionActiveDays: 0,
    timeReclaimedMinutes: 0,
    panicHelpUsedThisWeek: 0,
    totalRelapseCount: 0,
  });

  const [allTimeReclaimedMinutes, setAllTimeReclaimedMinutes] = useState(0);
  const [allTimeUrgesDefeated, setAllTimeUrgesDefeated] = useState(0);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentChapterDisplay, setCurrentChapterDisplay] = useState(
    "Chapter 01 - Awareness",
  );

  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  /** Prevents re-opening / flashing the panic verdict modal on every tab focus; one prompt per pending session id. */
  const pendingVerdictPromptedForIdRef = useRef<string | null>(null);
  const CARD_WIDTH = 140 + 10;
  const TOTAL_CARDS = 6;
  const VISIBLE_CARDS = 2;
  const TOTAL_DOTS = Math.ceil(TOTAL_CARDS / VISIBLE_CARDS);

  const calculateStreakDays = (streakStartDate: string): number => {
    const start = new Date(streakStartDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.max(
      0,
      Math.floor((now.getTime() - start.getTime()) / 86400000),
    );
  };

  const startTimer = (streakStartDate: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const diff = Math.max(
        0,
        Date.now() - new Date(streakStartDate).getTime(),
      );
      const totalSeconds = Math.floor(diff / 1000);
      setTimerHours(Math.floor((totalSeconds % 86400) / 3600));
      setTimerMinutes(Math.floor((totalSeconds % 3600) / 60));
      setTimerSeconds(totalSeconds % 60);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const ts = route.params?._panicResume;
    if (ts == null) return;
    if (lastPanicResumeHandledRef.current === ts) return;
    lastPanicResumeHandledRef.current = ts;
    const handle = InteractionManager.runAfterInteractions(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      navigation.setParams({ _panicResume: undefined });
    });
    return () => handle.cancel();
  }, [route.params?._panicResume, navigation]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const syncPendingVerdictModal = async () => {
        // Wait 150ms for all other useFocusEffect hooks to settle
        // before reading AsyncStorage — prevents race condition where
        // another effect triggers a re-render that clears modal state
        await new Promise(resolve => setTimeout(resolve, 150));
        if (cancelled) return;

        const pendingId = await AsyncStorage.getItem(STATS_KEYS.PANIC_PENDING_VERDICT);
        if (cancelled) return;

        if (!pendingId) {
          // Only hide if no session was ever prompted this focus cycle
          if (pendingVerdictPromptedForIdRef.current === null) {
            setIsPanicVerdictVisible(false);
          }
          return;
        }

        // Already prompted for this session id — re-assert visible in
        // case a re-render cleared it
        if (pendingVerdictPromptedForIdRef.current === pendingId) {
          setIsPanicVerdictVisible(true);
          return;
        }

        pendingVerdictPromptedForIdRef.current = pendingId;
        setIsPanicVerdictVisible(true);
      };
      syncPendingVerdictModal();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        // Reset check-in / relapse modals on focus (do not touch panic verdict — handled above)
        setIsCheckInVisible(false);
        setIsRelapseVisible(false);
        setCheckInStep(1);
        setRelapseStep(1);
        setSelectedMood(null);
        setSelectedTrigger(null);

        const progress = await loadUserProgress();

        setCurrentChapterDisplay(
          getChapterDisplayName(progress.currentChapterIndex),
        );

        let streakStartDate = await AsyncStorage.getItem("streakStartDate");
        if (!streakStartDate) {
          const lastRelapse = await AsyncStorage.getItem("lastRelapseDate");
          const memberSince = await AsyncStorage.getItem("memberSinceDate");
          if (lastRelapse) {
            const relapseDate = new Date(lastRelapse);
            if (!isNaN(relapseDate.getTime())) {
              relapseDate.setDate(relapseDate.getDate() + 1);
              relapseDate.setHours(0, 0, 0, 0);
              streakStartDate = relapseDate.toISOString();
            } else {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              streakStartDate = today.toISOString();
            }
          } else if (memberSince) {
            const memberSinceDate = new Date(memberSince);
            if (!isNaN(memberSinceDate.getTime())) {
              streakStartDate = memberSinceDate.toISOString();
            } else {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              streakStartDate = today.toISOString();
            }
          } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            streakStartDate = today.toISOString();
          }
          await AsyncStorage.setItem("streakStartDate", streakStartDate);
        }

        const streakDays = calculateStreakDays(streakStartDate);
        setCurrentStreak(streakDays);
        await AsyncStorage.setItem("currentStreak", streakDays.toString());
syncStreakToSupabase();
        // Track milestone if this is a milestone day
        if (STREAK_MILESTONES.includes(streakDays)) {
          const milestoneKey = `@reclaim_milestone_tracked_${streakDays}`;
          const alreadyTracked = await AsyncStorage.getItem(milestoneKey);
          if (!alreadyTracked) {
            trackStreakMilestone(streakDays);
            await AsyncStorage.setItem(milestoneKey, "1");
          }
        }

        startTimer(streakStartDate);
        refresh();
      };
      loadProgress();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsCheckInVisible(false);
        setIsRelapseVisible(false);
      };
    }, [refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      const loadSummaryStats = async () => {
        const now = new Date();
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((day + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const [
          panicHistoryStr,
          totalRelapseStr,
          blockEventLogStr,
          defaultPanicDurationStr,
          blockerEnabledStr,
        ] = await Promise.all([
          AsyncStorage.getItem("@reclaim_panic_history"),
          AsyncStorage.getItem("@reclaim_total_relapse_count"),
          AsyncStorage.getItem("@reclaim_blocker_event_log"),
          AsyncStorage.getItem("defaultPanicDuration"),
          AsyncStorage.getItem("@reclaim_blocker_enabled"),
        ]);

        const panicHistory = panicHistoryStr
          ? JSON.parse(panicHistoryStr).map((p: any) => p.timestamp || p)
          : [];
        const blockEventLog = blockEventLogStr
          ? JSON.parse(blockEventLogStr)
          : [];

        const defaultPanicDurationSec = defaultPanicDurationStr
          ? parseInt(defaultPanicDurationStr, 10)
          : 15 * 60;

        const totalRelapseCount = totalRelapseStr
          ? parseInt(totalRelapseStr, 10)
          : 0;
        const blockerEnabled = blockerEnabledStr !== "false";

        const panicThisWeek = panicHistory.filter((ts: number) => {
          const d = new Date(ts);
          return d >= monday && d <= sunday;
        });

        const protectionActiveDays = blockerEnabled
          ? new Set(
              blockEventLog
                .filter((e: { timestamp: number }) => {
                  const d = new Date(e.timestamp);
                  const comp = new Date(
                    d.getFullYear(),
                    d.getMonth(),
                    d.getDate(),
                  );
                  return comp >= monday && comp <= sunday;
                })
                .map(
                  (e: { timestamp: number }) =>
                    new Date(e.timestamp).toISOString().split("T")[0],
                ),
            ).size
          : 0;

        setSummaryStats({
          protectionActiveDays,
          timeReclaimedMinutes: Math.round(
            panicThisWeek.length * (defaultPanicDurationSec / 60),
          ),
          panicHelpUsedThisWeek: panicThisWeek.length,
          totalRelapseCount,
        });
      };
      loadSummaryStats();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const loadAllTimeReclaimed = async () => {
        const allSessions = await getPanicSessions();
        const totalMinutes = allSessions
          .filter(s => s.wasSuccessful && s.endTimestamp !== null)
          .reduce((sum, s) => {
            if (s.panicDurationMinutes != null) return sum + s.panicDurationMinutes;
            if (s.endTimestamp && s.startTimestamp) {
              return sum + Math.round((s.endTimestamp - s.startTimestamp) / 60000);
            }
            return sum;
          }, 0);
        setAllTimeReclaimedMinutes(totalMinutes);
        setAllTimeUrgesDefeated(allSessions.filter(s => s.wasSuccessful).length);
        refreshWeeklyStats();
      };
      loadAllTimeReclaimed();
    }, []),
  );

  const refreshWeeklyStats = useCallback(async () => {
    const now = new Date();
    const day = now.getDay();

    // Monday to Sunday range
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Get all raw data
    const [checkInHistory, relapseHistory, panicSessions] = await Promise.all([
      getCheckInHistory(),
      getRelapseHistory(),
      getPanicSessions(),
    ]);

    // Check-ins this week
    const checkIns = checkInHistory.filter((c) => {
      const d = new Date(c.timestamp);
      return d >= monday && d <= sunday;
    }).length;

    // Get member since date to avoid counting days before signup
    const memberSinceStr = await AsyncStorage.getItem("memberSinceDate");
    const memberSince = memberSinceStr && !isNaN(new Date(memberSinceStr).getTime())
      ? new Date(memberSinceStr)
      : monday;
    memberSince.setHours(0, 0, 0, 0);

    // Build a set of all dates this week that had a relapse
    const relapseDatesThisWeek = new Set(
      relapseHistory
        .filter((r) => {
          const d = new Date(r.date + 'T00:00:00');
          return d >= monday && d <= sunday;
        })
        .map((r) => r.date)
    );

    // Today at midnight — used as the boundary for what has happened
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // Count safe days — iterate every day of the week
    let safeDays = 0;
    for (let i = 0; i < 7; i++) {
      const loopDay = new Date(monday.getTime());
      loopDay.setDate(monday.getDate() + i);
      loopDay.setHours(0, 0, 0, 0);

      // Skip future days — not yet lived
      if (loopDay.getTime() > todayMidnight.getTime()) continue;

      // Skip days before the user signed up — they do not count
      if (loopDay.getTime() < memberSince.getTime()) continue;

      // If no relapse on this day — it is safe
      const year = loopDay.getFullYear();
      const month = String(loopDay.getMonth() + 1).padStart(2, '0');
      const day = String(loopDay.getDate()).padStart(2, '0');
      const dayStr = `${year}-${month}-${day}`;
      if (!relapseDatesThisWeek.has(dayStr)) {
        safeDays++;
      }
    }

    // Urges this week
    const panicThisWeek = panicSessions.filter((s) => {
      const d = new Date(s.startTimestamp);
      return d >= monday && d <= sunday;
    });
    const totalUrges = panicThisWeek.length;
    const urgesDefeated = panicThisWeek.filter((s) => s.wasSuccessful).length;

    // ── Stability Score — Full Logic Specification ──
    // Uses effective_days to avoid penalizing new users with less than 7 days of data

    // Step 1 — Calculate days since tracking started
    const streakStartStr = await AsyncStorage.getItem("streakStartDate");

    // Use the earliest known date — either memberSince or start of this week
    let trackingStartDate: Date;
    if (memberSinceStr && !isNaN(new Date(memberSinceStr).getTime())) {
      trackingStartDate = new Date(memberSinceStr);
      trackingStartDate.setHours(0, 0, 0, 0);
    } else if (streakStartStr && !isNaN(new Date(streakStartStr).getTime())) {
      trackingStartDate = new Date(streakStartStr);
      trackingStartDate.setHours(0, 0, 0, 0);
    } else {
      trackingStartDate = new Date(monday); // fallback to start of week
    }

    // total_days = days since tracking started (capped at 7 for weekly window)
    const msPerDay = 86400000;
    const daysSinceStart = Math.floor((todayMidnight.getTime() - trackingStartDate.getTime()) / msPerDay) + 1;
    const totalDaysTracked = isNaN(daysSinceStart) ? 1 : Math.max(1, daysSinceStart); // at least 1 day

    // effective_days = min(total_days, 7) — never penalize for being new
    const effectiveDays = Math.min(totalDaysTracked, 7);

    // Step 2 — Ratios using effective_days
    const safeDaysRatio = safeDays / effectiveDays;
    const checkinRatio = checkIns / effectiveDays;

    // If no urges → perfect control (no division error)
    const urgeSuccessRatio = totalUrges === 0 ? 1 : urgesDefeated / totalUrges;

    // Step 3 — Weighted score
    // Safe Days = 50%, Check-ins = 25%, Urge Success = 25%
    const rawScore =
      safeDaysRatio * 50 +
      checkinRatio * 25 +
      urgeSuccessRatio * 25;

    const stabilityScore = Math.min(100, Math.round(rawScore));

    // Step 4 — Label based on score ranges from spec
    const stabilityLabel =
      stabilityScore >= 90
        ? 'Excellent stability'
        : stabilityScore >= 75
          ? 'Strong recovery'
          : stabilityScore >= 60
            ? 'Moderate stability'
            : stabilityScore >= 40
              ? 'Struggling'
              : 'High relapse risk';

    // Time reclaimed = sum of panicDurationMinutes for successful sessions this week
    const timeReclaimedMinutes = panicThisWeek
      .filter((s) => s.wasSuccessful && s.endTimestamp !== null)
      .reduce((sum, s) => {
        if (s.panicDurationMinutes != null) return sum + s.panicDurationMinutes;
        if (s.endTimestamp && s.startTimestamp) {
          return sum + Math.round((s.endTimestamp - s.startTimestamp) / 60000);
        }
        return sum;
      }, 0);

    setWeeklyStats({
      safeDays,
      checkIns,
      urgesDefeated,
      totalUrges,
      stabilityScore,
      stabilityLabel,
      timeReclaimedMinutes,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshWeeklyStats();
    }, [refreshWeeklyStats]),
  );

  useEffect(() => {
    const init = async () => {
      const loadUnreadCount = async () => {
        const stored = await AsyncStorage.getItem("appNotifications");
        if (stored) {
          const notifs = JSON.parse(stored);
          setUnreadCount(notifs.filter((n: { read: boolean }) => !n.read).length);
        }
      };
      await loadUnreadCount();

      // Seed correct memberSinceDate for existing users who have bad values
      const existingMemberSince = await AsyncStorage.getItem('memberSinceDate');
      if (!existingMemberSince || isNaN(new Date(existingMemberSince).getTime())) {
        await AsyncStorage.setItem('memberSinceDate', new Date().toISOString());
      }
    };
    init();
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const lastDate = await AsyncStorage.getItem("lastCheckInDate");
        const today = new Date().toISOString().split("T")[0];
        if (lastDate === today) setHasCheckedInTodayLocal(true);
      } catch (err) {
        console.error("Error checking check-in status", err);
      }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  const d = data || {
    streak: 0,
    streakStartDate: new Date().toISOString(),
    stabilityScore: 0,
    stabilityMessage: "Just starting out",
    checkInsLastWeek: 0,
    totalCleanDays: 0,
    urgesDefeated: 0,
    protectionHours: 0,
    timeReclaimedHours: 0,
    panicHelpUsed: 0,
    calendarDays: [] as any[],
    currentChapter: { id: 'chapter_01', title: "Chapter 01", subtitle: "Awareness", progress: 0 },
    currentChapterIndex: 1,
    currentChapterDay: 1,
    hasCheckedInToday: false,
    relapseHistory: [] as string[],
  };

  const checkedInToday = hasCheckedInTodayLocal || d.hasCheckedInToday;
  const stabilityScore = weeklyStats.stabilityScore;
  const stabilityLabel = weeklyStats.stabilityLabel;

  const handleStreakReset = async () => {
    const newStreakStart = new Date().toISOString();

    await AsyncStorage.setItem("streakStartDate", newStreakStart);
    await AsyncStorage.setItem("currentStreak", "0");
    setCurrentStreak(0);
    setTimerHours(0);
    setTimerMinutes(0);
    setTimerSeconds(0);
    startTimer(newStreakStart);
  };

  const openCheckIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lastDate = await AsyncStorage.getItem("lastCheckInDate");
    const today = new Date().toISOString().split("T")[0];
    if (lastDate === today) {
      Alert.alert(
        "Already Checked In",
        "You have already completed your check-in for today.",
      );
      return;
    }
    trackCheckInOpened();
    setCheckInStep(1);
    setSelectedMood(null);
    setSelectedTrigger(null);
    setIsCheckInVisible(true);
  };

  const handleCompleteCheckIn = async (
    mood: string | null,
    trigger: string | null,
  ) => {
    try {
      await recordCheckIn(mood, trigger);
      if (mood || trigger) {
        trackCheckInCompleted(mood, trigger);
      } else {
        trackCheckInSkipped();
      }
      setHasCheckedInTodayLocal(true);
      setCheckInStep(3);
      setTimeout(() => {
        setIsCheckInVisible(false);
        setCheckInStep(1);
        refresh();
        refreshWeeklyStats();
      }, 2000);
    } catch {
      setIsCheckInVisible(false);
    }
  };

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="auto">
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header} pointerEvents="auto">
          <View style={{ flex: 1 }} />
          <Image
            source={require("../assets/images/reclaim-header.png")}
            style={styles.logoImage}
          />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
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
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          pointerEvents="auto"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Streak Card */}
            <View style={styles.streakCard}>
              <View style={styles.streakLeftSection}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <View style={styles.streakDayRow}>
                  <Text style={styles.streakBigNumber}>
                    {String(currentStreak).padStart(2, "0")}
                  </Text>
                  <Text style={styles.streakDaysLabel}>days</Text>
                </View>
                <View style={styles.streakTimerRow}>
                  <Text style={styles.streakTimerNumber}>
                    {String(timerHours).padStart(2, "0")}
                  </Text>
                  <Text style={styles.streakTimerUnit}>hours</Text>
                  <Text style={styles.streakTimerNumber}>
                    {String(timerMinutes).padStart(2, "0")}
                  </Text>
                  <Text style={styles.streakTimerUnit}>min</Text>
                  <Text style={styles.streakTimerNumber}>
                    {String(timerSeconds).padStart(2, "0")}
                  </Text>
                  <Text style={styles.streakTimerUnit}>sec</Text>
                </View>
              </View>
              <View style={styles.streakRightSection}>
                <AnimatedFlame />
              </View>
            </View>

            {/* Calendar Card */}
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarMonth}>{currentMonth}</Text>
              </View>
              <View style={styles.calendarWeek}>
                {d.calendarDays.map((day, index) => (
                  <View key={index} style={styles.calendarDayContainer}>
                    <Text style={styles.calendarDayName}>{day.dayName}</Text>
                    <View
                      style={[
                        styles.calendarDay,
                        day.isToday && styles.calendarDayToday,
                        day.status === "relapse" && styles.calendarDayRelapse,
                        day.status === "future" && styles.calendarDayFuture,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          day.isToday && styles.calendarDayTextToday,
                          day.status === "relapse" &&
                            styles.calendarDayTextRelapse,
                          day.status === "future" &&
                            styles.calendarDayTextFuture,
                        ]}
                      >
                        {day.dayOfMonth.toString().padStart(2, "0")}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Chapter Card */}
            <TouchableOpacity
              style={styles.chapterCardNew}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("ChaptersScreen")}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.chapterSubtitle}>Current chapter</Text>
                <Text style={styles.chapterTitle}>{currentChapterDisplay}</Text>
              </View>
              <View
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "#FEE2E2",
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{ fontSize: 10, fontWeight: "700", color: "#DC2626" }}
                >
                  {d.currentChapter?.progress ?? 0}%
                </Text>
              </View>
            </TouchableOpacity>

            {/* Horizontal Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled={false}
              contentContainerStyle={styles.homeCardsRow}
              style={styles.homeCardsScroll}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(
                  offsetX / (CARD_WIDTH * VISIBLE_CARDS),
                );
                setActiveCardIndex(Math.min(index, TOTAL_DOTS - 1));
              }}
              scrollEventThrottle={16}
            >
              <HomeCard
                iconName="clipboard-outline"
                iconColor="#6366F1"
                iconBg="#EEF2FF"
                title="Check-In"
                subtitle="Track today's state"
                badgeLabel={checkedInToday ? "✓ Completed" : "Pending"}
                badgeBg={checkedInToday ? "#DCFCE7" : "#FEF3C7"}
                badgeColor={checkedInToday ? "#16A34A" : "#D97706"}
                onPress={openCheckIn}
              />
              <HomeCard
                iconName="rocket-outline"
                iconColor="#F97316"
                iconBg="#FFF4ED"
                title="Next Chapter"
                subtitle={
                  d.currentChapterIndex && d.currentChapterIndex < 7
                    ? `Next: Ch.${String(d.currentChapterIndex + 1).padStart(2, '0')} · ${CHAPTERS[d.currentChapterIndex].name}`
                    : "Final chapter"
                }
                badgeLabel={(() => {
                  const currentChapterData = CHAPTERS[Math.min((d.currentChapterIndex ?? 1) - 1, CHAPTERS.length - 1)];
                  const daysLeft = Math.max(0, currentChapterData.totalDays - (d.currentChapterDay ?? 0));
                  return daysLeft > 0 ? `${daysLeft} days left` : 'Complete';
                })()}
                badgeBg="#FFF4ED"
                badgeColor="#F97316"
                onPress={() => navigation.navigate("ChaptersScreen")}
              />
              <HomeCard
                iconName="shield-checkmark-outline"
                iconColor="#EF4444"
                iconBg="#FFF1F2"
                title="Urges Defeated"
                subtitle="All time · urges overcome"
                badgeLabel={
                  allTimeUrgesDefeated > 0 ? `${allTimeUrgesDefeated} times` : "—"
                }
                badgeBg="#FFF1F2"
                badgeColor="#EF4444"
                onPress={() => navigation.navigate("Stats")}
              />
              <HomeCard
                iconName="lock-closed-outline"
                iconColor="#3B82F6"
                iconBg="#EFF6FF"
                title="Protection"
                subtitle="DNS Shield status"
                badgeLabel={
                  summaryStats.protectionActiveDays > 0 ? "Active" : "Inactive"
                }
                badgeBg={
                  summaryStats.protectionActiveDays > 0 ? "#DCFCE7" : "#FEE2E2"
                }
                badgeColor={
                  summaryStats.protectionActiveDays > 0 ? "#16A34A" : "#DC2626"
                }
                onPress={() => navigation.navigate("Blocker")}
              />
              <HomeCard
                iconName="warning-outline"
                iconColor="#F59E0B"
                iconBg="#FFFBEB"
                title="Risk Time"
                subtitle="Highest relapse hour"
                badgeLabel={d.panicHelpUsed > 0 ? "9 PM" : "—"}
                badgeBg="#FFFBEB"
                badgeColor="#D97706"
                onPress={() =>
                  navigation.navigate("Stats", { scrollTo: "riskTime" })
                }
              />
              <HomeCard
                iconName="trending-up-outline"
                iconColor="#22C55E"
                iconBg="#F0FDF4"
                title="Time Reclaimed"
                subtitle="All time · saved from urges"
                badgeLabel={
                  allTimeReclaimedMinutes > 0
                    ? formatTimeReclaimed(allTimeReclaimedMinutes) + ' saved'
                    : "—"
                }
                badgeBg="#F0FDF4"
                badgeColor="#16A34A"
                onPress={() =>
                  navigation.navigate("Stats", { scrollTo: "timeReclaimed" })
                }
              />
            </ScrollView>

            <View style={styles.homeCardsDots}>
              {Array.from({ length: TOTAL_DOTS }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.homeCardDot,
                    index === activeCardIndex
                      ? styles.homeCardDotActive
                      : styles.homeCardDotInactive,
                  ]}
                />
              ))}
            </View>

            {/* Panic Button */}
            <TouchableOpacity
              style={styles.redPanicButton}
              onPress={() => {
                const defaultDurationSec = 15 * 60;
                trackPanicButtonPressed({
                  currentStreak,
                  timeOfDay: getTimeOfDay(),
                  durationMinutes: Math.round(defaultDurationSec / 60),
                });
                navigation.navigate("PanicShield");
              }}
              activeOpacity={0.9}
            >
              <WarningIcon />
              <Text style={styles.panicButtonText}>Panic Button</Text>
            </TouchableOpacity>

            {/* Relapse Button */}
            <TouchableOpacity
              style={styles.whiteRelapseButton}
              onPress={() => {
                trackRelapseModalOpened();
                setRelapseStep(1);
                setRelapseReason(null);
                setRelapseCommitment("");
                setIsRelapseVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.relapseButtonText}>I Relapsed</Text>
            </TouchableOpacity>

            <View
              style={{
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                Scroll for details ↓
              </Text>
            </View>

            {/* Stats Summary Card */}
            <View style={styles.statsSummaryCard}>
              <View style={styles.statsSummaryHeader}>
                <Text style={styles.statsSummaryTitle}>Stats Summary</Text>
                <Text style={styles.statsSummaryDateRange}>
                  {getWeekRange()}
                </Text>
              </View>
              <Text style={styles.statsSummarySubtitle}>
                Your overall stability this week
              </Text>
              <SemiCircleGauge
                percentage={stabilityScore}
                label={stabilityLabel}
              />

              <View style={styles.statsSummaryList}>
                {([
                  {
                    icon: "checkmark-circle-outline",
                    label: "Check-ins",
                    value: weeklyStats.checkIns > 0 ? `${weeklyStats.checkIns} days` : "—",
                    onPress: openCheckIn,
                  },
                  {
                    icon: "shield-checkmark-outline",
                    label: "Safe days",
                    value: weeklyStats.safeDays > 0 ? `${weeklyStats.safeDays} days` : "—",
                    onPress: null,
                  },
                  {
                    icon: "trending-up-outline",
                    label: "Urges overcome",
                    value: weeklyStats.urgesDefeated > 0 ? `${weeklyStats.urgesDefeated} times` : "—",
                    onPress: () => navigation.navigate("Stats", { scrollTo: "urges" }),
                  },
                  {
                    icon: "time-outline",
                    label: "Time reclaimed",
                    value: formatTimeReclaimed(weeklyStats.timeReclaimedMinutes),
                    onPress: () => navigation.navigate("Stats", { scrollTo: "timeReclaimed" }),
                  },
                  {
                    icon: "warning-outline",
                    label: "Panic help used",
                    value: weeklyStats.totalUrges > 0 ? `${weeklyStats.totalUrges} times` : "—",
                    onPress: () => navigation.navigate("Stats", { scrollTo: "riskTime" }),
                  },
                ] as { icon: string; label: string; value: string; onPress: (() => void) | null }[]).map((row, i, arr) => (
                  <React.Fragment key={row.label}>
                    <TouchableOpacity
                      style={styles.statsSummaryRow}
                      onPress={typeof row.onPress === 'function' ? row.onPress : undefined}
                      activeOpacity={typeof row.onPress === 'function' ? 0.7 : 1}
                      disabled={typeof row.onPress !== 'function'}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={styles.statsSummaryIconCircle}>
                          <Ionicons name={row.icon as any} size={16} color="#555555" />
                        </View>
                        <Text style={styles.statsSummaryLabel}>{row.label}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={styles.statsSummaryValue}>{row.value}</Text>
                        <Ionicons name="chevron-forward" size={14} color="#AAAAAA" />
                      </View>
                    </TouchableOpacity>
                    {i < arr.length - 1 && <View style={styles.statsSummaryDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Bottom Buttons */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#000000",
                  borderRadius: 999,
                  height: 54,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => Linking.openURL("mailto:support@reclaimapp.com")}
                activeOpacity={0.8}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}
                >
                  contact us
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#000000",
                  borderRadius: 999,
                  height: 54,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => navigation.navigate("FAQs")}
                activeOpacity={0.8}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}
                >
                  FAQs
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Check-In Modal — mount only when open so RN never leaves a hidden Modal in a blocking state */}
      {isCheckInVisible ? (
      <Modal
        visible
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCheckInVisible(false)}
        pointerEvents="auto"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {checkInStep < 3 ? (
              <>
                <View style={{ paddingTop: 16 }}>
                  <Text style={styles.stepCounter}>{checkInStep} of 2</Text>
                  <Text style={styles.modalHeaderTitle}>Daily Check-In</Text>
                </View>
                {checkInStep === 1 ? (
                  <View style={styles.stepContent}>
                    <Text style={styles.questionText}>How was your day?</Text>
                    <View style={styles.optionsContainer}>
                      {["😤 Hard", "🙂 Okay", "😊 Good"].map((mood) => (
                        <TouchableOpacity
                          key={mood}
                          style={[
                            styles.optionRow,
                            selectedMood === mood && styles.optionRowSelected,
                          ]}
                          onPress={() => setSelectedMood(mood)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              selectedMood === mood &&
                                styles.optionTextSelected,
                            ]}
                          >
                            {mood}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.continueButton,
                        !selectedMood && styles.continueButtonDisabled,
                      ]}
                      disabled={!selectedMood}
                      onPress={() => setCheckInStep(2)}
                    >
                      <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.skipLink}
                      onPress={() => handleCompleteCheckIn(null, null)}
                    >
                      <Text style={styles.skipLinkText}>Skip for today</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerMantra}>
                      Just being honest is progress.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.stepContent}>
                    <Text style={styles.questionText}>
                      What affected you most today?
                    </Text>
                    <View style={styles.optionsContainer}>
                      {[
                        "😩 Stress",
                        "😐 Boredom",
                        "📱 Too much phone",
                        "😔 Loneliness",
                        "💪 Felt in control",
                        "🌱 Productive",
                      ].map((trigger) => (
                        <TouchableOpacity
                          key={trigger}
                          style={[
                            styles.optionRow,
                            selectedTrigger === trigger &&
                              styles.optionRowSelected,
                          ]}
                          onPress={() => setSelectedTrigger(trigger)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              selectedTrigger === trigger &&
                                styles.optionTextSelected,
                            ]}
                          >
                            {trigger}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.continueButton,
                        !selectedTrigger && styles.continueButtonDisabled,
                      ]}
                      disabled={!selectedTrigger}
                      onPress={() =>
                        handleCompleteCheckIn(selectedMood, selectedTrigger)
                      }
                    >
                      <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.skipLink}
                      onPress={() => handleCompleteCheckIn(selectedMood, null)}
                    >
                      <Text style={styles.skipLinkText}>Skip for today</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerMantra}>
                      Just noticing is enough
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.completionContent}>
                <View style={styles.completionIconRow}>
                  <Text style={{ fontSize: 48 }}>📅</Text>
                  <Ionicons name="shield-checkmark" size={48} color="#22C55E" />
                </View>
                <Text style={styles.completionHeading}>Check-in complete.</Text>
                <Text style={styles.completionSubtext}>
                  It helps you stay aware and in control.
                </Text>
                <View style={styles.completionSpacer} />
                <Text style={styles.completionLabel}>Progress noted</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
      ) : null}

      {/* Relapse Modal */}
      {isRelapseVisible ? (
      <Modal
        visible
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsRelapseVisible(false)}
        pointerEvents="auto"
      >
        <View style={styles.relapseModalOverlay}>
          <View style={styles.relapseModalCard}>
            {relapseStep === 1 && (
              <View style={styles.relapseStepContent}>
                <Text style={styles.relapseQuestion}>Did you relapse?</Text>
                <TouchableOpacity
                  style={styles.relapseYesButton}
                  onPress={() => setRelapseStep(2)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.relapseYesButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.relapseNoButton}
                  onPress={() => {
                    trackRelapseDenied();
                    setIsRelapseVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.relapseNoButtonText}>No</Text>
                </TouchableOpacity>
              </View>
            )}

            {relapseStep === 2 && (
              <View style={styles.relapseStepContent}>
                <Text style={styles.relapseStep2Heading}>
                  You{"'"}re still here.
                </Text>
                <View style={styles.relapseStep2Body}>
                  <Text style={styles.relapseStep2Text}>
                    A relapse doesn{"'"}t erase your progress.{"\n"}It just
                    means you{"'"}re human.
                  </Text>
                  <View style={{ height: 16 }} />
                  <Text style={styles.relapseStep2Text}>
                    Pause for a second.{"\n"}You{"'"}re safe. You{"'"}re aware.
                    You{"'"}re back.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.relapseContinueButton}
                  onPress={() => setRelapseStep(3)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.relapseContinueButtonText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.relapseSkipLink}
                  onPress={() => setIsRelapseVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.relapseSkipLinkText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            )}

            {relapseStep === 3 && (
              <View style={styles.relapseStep3Content}>
                <Text style={styles.relapseStep3Question}>
                  What led to this moment?
                </Text>
                <View style={styles.relapseChipsContainer}>
                  {[
                    "Stress",
                    "Boredom",
                    "Loneliness",
                    "Late night",
                    "Social media",
                    "Emotional spike",
                    "No clear reason",
                  ].map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.relapseChip,
                        relapseReason === reason && styles.relapseChipSelected,
                      ]}
                      onPress={() => setRelapseReason(reason)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.relapseChipText,
                          relapseReason === reason &&
                            styles.relapseChipTextSelected,
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.relapseStep3Subtitle}>
                  This isn{"'"}t blame. It{"'"}s awareness.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.relapseContinueButton,
                    !relapseReason && styles.relapseContinueButtonDisabled,
                  ]}
                  disabled={!relapseReason}
                  onPress={() => setRelapseStep(4)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.relapseContinueButtonText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.relapseSkipLink}
                  onPress={() => setRelapseStep(5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.relapseSkipLinkText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            )}

            {relapseStep === 4 && (
              <View style={styles.relapseStepContent}>
                <Text style={styles.relapseStep4Heading}>
                  One moment doesn{"'"}t{"\n"}define you.
                </Text>
                <View style={styles.relapseStep4Body}>
                  <Text style={styles.relapseStep4Text}>
                    Progress isn{"'"}t perfection.
                  </Text>
                  <View style={{ height: 12 }} />
                  <Text style={styles.relapseStep4Text}>
                    What matters is that you noticed —{"\n"}and chose to come
                    back.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.relapseContinueButton}
                  onPress={() => setRelapseStep(5)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.relapseContinueButtonText}>
                    Reset and move forward
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {relapseStep === 5 && (
              <View style={styles.relapseStep5Content}>
                <Text style={styles.relapseStep5Question}>
                  When the urge hits again,{"\n"}what will you do differently?
                </Text>
                <TextInput
                  style={styles.relapseTextInput}
                  placeholder="I will pause and choose control."
                  placeholderTextColor="#AAAAAA"
                  value={relapseCommitment}
                  onChangeText={setRelapseCommitment}
                  multiline={false}
                  numberOfLines={1}
                />
                <Text style={styles.relapseStep5Subtitle}>
                  Small promises, kept consistently, change everything.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.relapseContinueButton,
                    relapseCommitment.trim().length === 0 &&
                      styles.relapseContinueButtonDisabled,
                  ]}
                  disabled={relapseCommitment.trim().length === 0}
                  onPress={async () => {
                    const today = new Date().toISOString().split("T")[0];
                    const timestamp = new Date().toISOString();

                    await AsyncStorage.setItem(
                      "@reclaim_last_relapse_date",
                      today,
                    );
                    await AsyncStorage.setItem(
                      "@reclaim_last_relapse_reason",
                      relapseReason ?? "skipped",
                    );
                    await AsyncStorage.setItem(
                      "@reclaim_last_relapse_commitment",
                      relapseCommitment.trim(),
                    );
                    await AsyncStorage.setItem(
                      "@reclaim_last_relapse_timestamp",
                      timestamp,
                    );

                    const progress = await loadUserProgress();
                    await recordRelapse(progress);
                    await recordRelapseEvent(relapseReason);

                    // Track in PostHog
                    trackRelapseRecorded({
                      reason: relapseReason,
                      previousStreakDays: currentStreak,
                      commitment: relapseCommitment.trim(),
                    });

                    // Use handleStreakReset so streak goes to
                    // chapter-aware value not zero
                    await handleStreakReset();

                    setIsRelapseVisible(false);
                    setRelapseStep(1);
                    setRelapseReason(null);
                    setRelapseCommitment("");
                    setTimeout(() => { refresh(); refreshWeeklyStats(); }, 300);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.relapseContinueButtonText}>
                    Save and continue
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      ) : null}

      {/* Panic Verdict Modal */}
      {isPanicVerdictVisible ? (
      <Modal
        visible
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}} // intentionally empty — user MUST answer
        pointerEvents="auto"
      >
        <View style={styles.relapseModalOverlay}>
          <View style={styles.relapseModalCard}>
            <View style={{ alignItems: 'center', paddingTop: 8 }}>

              {/* Shield emoji */}
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🛡️</Text>

              {/* Heading */}
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#000000',
                textAlign: 'center',
                marginBottom: 8,
                lineHeight: 30,
              }}>
                Your panic session{'\n'}just ended.
              </Text>

              {/* Subtext */}
              <Text style={{
                fontSize: 14,
                color: '#888888',
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 20,
              }}>
                Be honest with yourself.{'\n'}Your progress depends on it.
              </Text>

              {/* Yes — stayed strong */}
              <TouchableOpacity
                style={{
                  width: '100%',
                  height: 56,
                  backgroundColor: '#000000',
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
                activeOpacity={0.85}
                onPress={async () => {
                  await resolvePendingVerdict(true);
                  pendingVerdictPromptedForIdRef.current = null;
                  setIsPanicVerdictVisible(false);
                  // Small delay before refresh so Modal fully unmounts
                  // before triggering re-renders that could block touches
                  setTimeout(() => { refresh(); refreshWeeklyStats(); }, 100);
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                  ✊ Yes, I stayed strong
                </Text>
              </TouchableOpacity>

              {/* No — I relapsed */}
              <TouchableOpacity
                style={{
                  width: '100%',
                  height: 56,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.85}
                onPress={async () => {
                  // Mark panic session as failed
                  await resolvePendingVerdict(false);

                  // Record the relapse event and reset streak
                  const today = new Date().toISOString().split('T')[0];
                  const timestamp = new Date().toISOString();
                  await AsyncStorage.setItem('@reclaim_last_relapse_date', today);
                  await AsyncStorage.setItem('@reclaim_last_relapse_reason', 'after_panic');
                  await AsyncStorage.setItem('@reclaim_last_relapse_timestamp', timestamp);

                  const progress = await loadUserProgress();
                  await recordRelapse(progress);
                  await recordRelapseEvent('after_panic');

                  trackRelapseRecorded({
                    reason: 'after_panic',
                    previousStreakDays: currentStreak,
                    commitment: '',
                  });

                  await handleStreakReset();
                  pendingVerdictPromptedForIdRef.current = null;
                  setIsPanicVerdictVisible(false);
                  // Small delay before refresh so Modal fully unmounts
                  // before triggering re-renders that could block touches
                  setTimeout(() => { refresh(); refreshWeeklyStats(); }, 100);
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>
                  I relapsed
                </Text>
              </TouchableOpacity>

              {/* Disclaimer */}
              <Text style={{
                fontSize: 11,
                color: '#AAAAAA',
                textAlign: 'center',
                marginTop: 16,
                lineHeight: 16,
              }}>
                This modal cannot be dismissed.{'\n'}Your honest answer keeps your stats accurate.
              </Text>

            </View>
          </View>
        </View>
      </Modal>
      ) : null}
    </View>
  );
};

export default MainDashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: { color: "#6B7280", marginTop: 10 },
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
  logoImage: { width: 160, height: 36, resizeMode: "contain" },
  notificationButton: { padding: 5 },
  bellContainer: { position: "relative" },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  scrollView: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  streakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 16,
  },
  streakLeftSection: { flex: 1 },
  streakRightSection: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  streakLabel: {
    fontSize: 13,
    color: "#888888",
    fontWeight: "400",
    marginBottom: 4,
  },
  streakDayRow: { flexDirection: "row", alignItems: "flex-end" },
  streakBigNumber: {
    fontSize: 52,
    fontWeight: "800",
    color: "#000000",
    lineHeight: 58,
    fontVariant: ["tabular-nums"],
  },
  streakDaysLabel: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "400",
    marginLeft: 6,
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  streakTimerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
    gap: 2,
  },
  streakTimerNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    fontVariant: ["tabular-nums"],
  },
  streakTimerUnit: {
    fontSize: 11,
    color: "#888888",
    marginRight: 6,
    marginLeft: 1,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  calendarHeader: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarMonth: { fontSize: 15, fontWeight: "600", color: "#374151" },
  calendarWeek: { flexDirection: "row", justifyContent: "space-between" },
  calendarDayContainer: { alignItems: "center" },
  calendarDayName: {
    fontSize: 10,
    color: "#9CA3AF",
    marginBottom: 6,
    textTransform: "lowercase",
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  calendarDayToday: { backgroundColor: "#111827" },
  calendarDayRelapse: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  calendarDayFuture: { backgroundColor: "#F3F4F6", opacity: 0.5 },
  calendarDayText: { fontSize: 14, fontWeight: "500", color: "#374151" },
  calendarDayTextToday: { color: "#FFFFFF", fontWeight: "700" },
  calendarDayTextRelapse: { color: "#DC2626" },
  calendarDayTextFuture: { color: "#9CA3AF" },
  chapterCardNew: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  chapterSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  chapterTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  homeCardsScroll: { marginTop: 12 },
  homeCardsRow: { paddingHorizontal: 0, gap: 10 },
  homeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    width: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  homeCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  homeCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  homeCardSubtitle: { fontSize: 11, color: "#6B7280", marginBottom: 10 },
  homeCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  homeCardBadgeText: { fontSize: 10, fontWeight: "600" },
  homeCardsDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 16,
    gap: 6,
  },
  homeCardDot: { width: 6, height: 6, borderRadius: 3 },
  homeCardDotActive: { backgroundColor: "#111827", width: 18, borderRadius: 3 },
  homeCardDotInactive: { backgroundColor: "#D1D5DB", width: 6 },
  redPanicButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 8,
  },
  panicButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  whiteRelapseButton: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  relapseButtonText: { color: "#6B7280", fontWeight: "600", fontSize: 16 },
  statsSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statsSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statsSummaryTitle: { fontSize: 17, fontWeight: "700", color: "#000000" },
  statsSummaryDateRange: { fontSize: 12, fontWeight: "400", color: "#888888" },
  statsSummarySubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    marginBottom: 4,
  },
  statsSummaryList: { marginTop: 8 },
  statsSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  statsSummaryIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  statsSummaryLabel: { fontSize: 14, fontWeight: "400", color: "#000000" },
  statsSummaryValue: { fontSize: 14, fontWeight: "600", color: "#000000" },
  statsSummaryDivider: { height: 1, backgroundColor: "#F3F4F6" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  stepCounter: { fontSize: 11, color: "#888888", textAlign: "center" },
  modalHeaderTitle: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    marginTop: 2,
  },
  stepContent: { paddingHorizontal: 20, marginTop: 12 },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  optionsContainer: { gap: 8, marginBottom: 16 },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  optionRowSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  optionText: { fontSize: 15, color: "#374151", textAlign: "center" },
  optionTextSelected: { color: "#FFFFFF", fontWeight: "600" },
  continueButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonDisabled: { opacity: 0.4 },
  continueButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  skipLink: { alignItems: "center", marginTop: 12, paddingVertical: 8 },
  skipLinkText: { fontSize: 14, color: "#9CA3AF" },
  footerMantra: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
  },
  completionContent: { alignItems: "center", padding: 24 },
  completionIconRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  completionHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  completionSubtext: { fontSize: 14, color: "#6B7280" },
  completionSpacer: { height: 20 },
  completionLabel: { fontSize: 13, color: "#22C55E", fontWeight: "600" },
  relapseModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  relapseModalCard: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  relapseStepContent: { alignItems: "center" },
  relapseQuestion: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 24,
  },
  relapseYesButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#000000",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  relapseYesButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  relapseNoButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  relapseNoButtonText: { fontSize: 16, fontWeight: "700", color: "#000000" },
  relapseContinueButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#000000",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  relapseContinueButtonDisabled: { opacity: 0.4 },
  relapseContinueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  relapseSkipLink: { paddingVertical: 8 },
  relapseSkipLinkText: { fontSize: 14, color: "#888888" },
  relapseStep2Heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  relapseStep2Body: { alignItems: "center", marginBottom: 24 },
  relapseStep2Text: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    lineHeight: 22,
  },
  relapseStep3Content: { alignItems: "center", paddingTop: 8 },
  relapseStep3Question: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  relapseChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  relapseChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    margin: 4,
  },
  relapseChipSelected: { backgroundColor: "#000000", borderColor: "#000000" },
  relapseChipText: { fontSize: 14, color: "#000000" },
  relapseChipTextSelected: { color: "#FFFFFF", fontWeight: "500" },
  relapseStep3Subtitle: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#888888",
    textAlign: "center",
    marginBottom: 16,
  },
  relapseStep4Heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 16,
  },
  relapseStep4Body: { alignItems: "center", marginBottom: 28 },
  relapseStep4Text: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    lineHeight: 22,
  },
  relapseStep5Content: { alignItems: "center", paddingTop: 0 },
  relapseStep5Question: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 20,
  },
  relapseTextInput: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#000000",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  relapseStep5Subtitle: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#888888",
    textAlign: "center",
    marginBottom: 20,
  },
});
