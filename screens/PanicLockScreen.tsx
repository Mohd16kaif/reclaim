import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  AppState,
  BackHandler,
  Image,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { completePanicSessionWithGrace } from '../utils/statsStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { FamilyControlsBridge } = NativeModules;

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  PanicLock: { remainingSeconds: number };
  MainDashboard: { _panicResume?: number } | undefined;
};

type PanicLockNavigationProp = StackNavigationProp<RootStackParamList, 'PanicLock'>;
type PanicLockRouteProp = RouteProp<RootStackParamList, 'PanicLock'>;

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DURATION_SECONDS = 1800; // 30 minutes
const TIMER_INTERVAL_MS = 1000;

// ============================================================================
// ICONS
// ============================================================================

const BackArrowIcon = (): React.ReactElement => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="#000000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============================================================================
// HELPERS
// ============================================================================

const formatTime = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PanicLockScreen = (): React.ReactElement => {
  const navigation = useNavigation<PanicLockNavigationProp>();
  const route = useRoute<PanicLockRouteProp>();
  const initialRemaining: number = route.params?.remainingSeconds ?? DEFAULT_DURATION_SECONDS;

  const [remaining, setRemaining] = useState(initialRemaining);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Announce panic mode for assistive tech ────────────────────────────
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      'Panic mode active. Triple-tap home button to exit if needed.'
    );
  }, []);

  // ── Countdown timer (continuous from previous screens) ────────────────
  useEffect(() => {
    if (initialRemaining <= 0) {
      // Timer already expired — go home immediately
      Promise.all([
        completePanicSessionWithGrace(),
        FamilyControlsBridge.stopPanicSession().catch(() => {}),
      ]).then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDashboard', params: { _panicResume: Date.now() } }],
        });
      });
      return;
    }

    intervalRef.current = setInterval(() => {
      void (async () => {
        const endTsRaw = await AsyncStorage.getItem("@reclaim_panic_end_timestamp");
        if (endTsRaw) {
          // Always recompute from the durable end timestamp rather than
          // decrementing a counter, so the displayed time can never drift
          // from the OS-driven Live Activity countdown, regardless of any
          // backgrounding/foregrounding timing quirks with JS timers.
          const endTs = parseInt(endTsRaw, 10);
          const r = Math.max(0, Math.floor((endTs - Date.now()) / 1000));
          setRemaining(r);
          if (r <= 0 && intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        } else {
          setRemaining((prev) => {
            if (prev <= 1) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }
      })();
    }, TIMER_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [initialRemaining, navigation]);

  // Navigate home when timer hits 0
  useEffect(() => {
    if (remaining === 0 && initialRemaining > 0) {
      Promise.all([
        completePanicSessionWithGrace(),
        FamilyControlsBridge.stopPanicSession().catch(() => {}),
      ]).then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDashboard', params: { _panicResume: Date.now() } }],
        });
      });
    }
  }, [remaining, initialRemaining, navigation]);

  // Sync remaining time from durable end timestamp on mount (survives force-quit)
  useEffect(() => {
    const syncFromEndTimestamp = async (): Promise<void> => {
      const endTsRaw = await AsyncStorage.getItem("@reclaim_panic_end_timestamp");
      if (endTsRaw) {
        const endTs = parseInt(endTsRaw, 10);
        const r = Math.max(0, Math.floor((endTs - Date.now()) / 1000));
        setRemaining(r);
      }
    };
    void syncFromEndTimestamp();
  }, []);

  // Re-sync remaining time from the durable end timestamp whenever the app
  // returns to the foreground, so backgrounding doesn't cause JS-timer drift
  // relative to the OS-driven Live Activity countdown.
  useEffect(() => {
    const syncFromEndTimestamp = async (): Promise<void> => {
      const endTsRaw = await AsyncStorage.getItem("@reclaim_panic_end_timestamp");
      if (endTsRaw) {
        const endTs = parseInt(endTsRaw, 10);
        const r = Math.max(0, Math.floor((endTs - Date.now()) / 1000));
        setRemaining(r);
      }
    };

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void syncFromEndTimestamp();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ── Disable hardware back button (Android) ────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert('', 'Complete your session first');
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  // ── Derived values ────────────────────────────────────────────────────
  const timerDisplay = formatTime(remaining);

  const handleBackPress = useCallback((): void => {
    Alert.alert('', 'Complete your session first');
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={handleBackPress}
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <Image
            source={require('../assets/images/reclaim-header.png')}
            style={styles.headerLogo}
          />

          {/* Empty spacer to balance the back arrow */}
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Center content ─────────────────────────────────────────── */}
        <View style={styles.centerContent}>
          {/* Heading */}
          <Text style={styles.heading}>
            <Text style={styles.headingUnderline}>Leave Your Phone</Text>
            {'\n'}
            <Text style={styles.headingUnderline}>Step Outside</Text>
          </Text>
          <Text style={styles.subtext}>
            95% Urges die when environment changes
          </Text>

          {/* Massive timer */}
          <Text style={styles.timerText}>{timerDisplay}</Text>

          {/* Pagination dots */}
          <View style={styles.dotsRow}>
            <View style={styles.dotActive} />
            <View style={styles.dotInactive} />
            <View style={styles.dotInactive} />
          </View>
        </View>

        {/* ── Locked until zero badge ────────────────────────────────── */}
        <View style={styles.bottomBadgeContainer}>
          <View style={styles.lockedBadge}>
            <View style={styles.lockedDot} />
            <Text style={styles.lockedText}>Locked Until Zero</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default PanicLockScreen;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 140,
    height: 40,
    resizeMode: 'contain',
  },
  headerSpacer: {
    width: 40,
  },

  // ── Center content ──────────────────────────────────────────────────
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: -40, // slight top bias
  },

  // ── Heading ─────────────────────────────────────────────────────────
  heading: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 42,
  },
  // Intentionally empty — underline styling applied via parent Text component
  headingUnderline: {},
  subtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 10,
  },

  // ── Timer ───────────────────────────────────────────────────────────
  timerText: {
    fontSize: 86,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    marginTop: 40,
    letterSpacing: 2,
  },

  // ── Pagination dots ─────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  dotActive: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D1D1',
  },

  // ── Bottom badge ────────────────────────────────────────────────────
  bottomBadgeContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  lockedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888888',
    marginRight: 8,
  },
  lockedText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '400',
  },
});
