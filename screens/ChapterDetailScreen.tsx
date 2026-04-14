import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CHAPTERS } from '../constants/chapters';
import { loadUserProgress } from '../utils/userProgress';

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  ChapterDetail: {
    chapterIndex: number;
  };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'ChapterDetail'>;
type RoutePropType = RouteProp<RootStackParamList, 'ChapterDetail'>;

// ============================================================================
// HELPERS
// ============================================================================

// Total days across all chapters combined — used for "X / 120 days"
const TOTAL_JOURNEY_DAYS = CHAPTERS.reduce((sum, ch) => sum + ch.totalDays, 0);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ChapterDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { chapterIndex } = route.params ?? {};

  const daysScrollRef = useRef<ScrollView>(null);

  // ── State ─────────────────────────────────────────────────────────────
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalRelapseCount, setTotalRelapseCount] = useState(0);
  const [chapterDay, setChapterDay] = useState(1);
  const [totalDaysCompleted, setTotalDaysCompleted] = useState(0);
  const [chapterStatus, setChapterStatus] = useState<
    'active' | 'completed' | 'locked'
  >('locked');

  // ── Static chapter data ───────────────────────────────────────────────
  // Safe lookup — falls back to first chapter if index is missing
  const chapterData = CHAPTERS.find((c) => c.index === chapterIndex)
    ?? CHAPTERS[0];
  const totalDays = chapterData.totalDays;

  // ── Derived values ────────────────────────────────────────────────────
  const progressPercent = totalDays > 0
    ? Math.min(1, chapterDay / totalDays)
    : 0;
  const daysRemaining = Math.max(0, totalDays - chapterDay);

  // Streak status label
  const streakStatusLabel =
    currentStreak >= 14
      ? "You're thriving"
      : currentStreak >= 7
      ? "You're steady"
      : currentStreak >= 3
      ? 'Building momentum'
      : currentStreak > 0
      ? 'Just started'
      : 'Start your streak';

  // ── Load all data on focus ────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const progress = await loadUserProgress();

        setCurrentStreak(progress.currentStreak);
        setTotalRelapseCount(progress.totalRelapseCount);

        // Find this chapter's progress entry
        const thisChapterProgress = progress.chapterProgress.find(
          (p) => p.chapter === chapterIndex,
        );

        const status = thisChapterProgress?.status ?? 'locked';
        setChapterStatus(status);

        if (progress.currentChapterIndex === chapterIndex) {
          // Active chapter — show live day
          setChapterDay(progress.currentChapterDay);
        } else if (status === 'completed') {
          // Completed chapter — show full days
          setChapterDay(chapterData.totalDays);
        } else {
          // Locked — show 0
          setChapterDay(0);
        }

        // Total days completed across entire journey
        const completed = progress.chapterProgress.reduce((sum, p) => {
          const ch = CHAPTERS.find((c) => c.index === p.chapter);
          if (!ch) return sum;
          if (p.chapter < progress.currentChapterIndex) {
            return sum + ch.totalDays;
          }
          if (p.chapter === progress.currentChapterIndex) {
            return sum + progress.currentChapterDay;
          }
          return sum;
        }, 0);
        setTotalDaysCompleted(completed);
      };

      loadData();
    }, [chapterIndex, chapterData.totalDays]),
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Chapter heading ── */}
          <Text style={styles.chapterTitle}>
            Chapter {chapterIndex}
          </Text>
          <Text style={styles.chapterName}>{chapterData.name}</Text>
          <Text style={styles.pill}>
            {TOTAL_JOURNEY_DAYS}-day journey · {CHAPTERS.length} chapters
          </Text>

          {/* ── Day Progress Card ── */}
          <View style={styles.card}>
            <Text style={styles.dayProgressTitle}>
              Day {chapterDay} of {totalDays}
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progressPercent * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.daysRemaining}>
              {daysRemaining} days remaining
            </Text>
          </View>

          {/* ── Current Streak Card ── */}
          <View style={styles.card}>
            <View style={styles.streakHeader}>
              <Ionicons name="flame" size={20} color="#000000" />
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
            <View style={styles.streakRow}>
              <Text style={styles.streakDays}>
                {currentStreak} Days
              </Text>
              {currentStreak > 0 && (
                <View style={styles.steadyBadge}>
                  <Text style={styles.steadyText}>
                    {streakStatusLabel}
                  </Text>
                </View>
              )}
              <View style={styles.setbacksBadge}>
                <Text style={styles.setbacksText}>
                  {totalRelapseCount} setbacks
                </Text>
              </View>
            </View>
          </View>

          {/* ── If You Relapse Warning Card ── */}
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={20} color="#D97706" />
              <Text style={styles.warningTitle}>If you relapse</Text>
            </View>
            <Text style={styles.warningText}>
              One step back if you slip. Cannot go below zero.
            </Text>
          </View>

          {/* ── Overall Progress Card ── */}
          <View style={styles.card}>
            <Text style={styles.overallTitle}>Overall Progress</Text>
            <View style={styles.overallRow}>
              <Text style={styles.overallDays}>
                {totalDaysCompleted} / {TOTAL_JOURNEY_DAYS} days
              </Text>
            </View>

            {/* Horizontal day pills — scroll to current day */}
            <ScrollView
              ref={daysScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContent}
              onContentSizeChange={() => {
                // Scroll so the current day pill is visible
                const pillWidth = 72; // approx width + gap
                const offset = Math.max(0, (chapterDay - 2) * pillWidth);
                daysScrollRef.current?.scrollTo({ x: offset, animated: false });
              }}
            >
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(
                (dayNum) => {
                  const isActive = dayNum === chapterDay;
                  const isPast = dayNum < chapterDay;
                  return (
                    <View
                      key={dayNum}
                      style={[
                        styles.dayPill,
                        isActive && styles.dayPillActive,
                        isPast && styles.dayPillPast,
                        !isActive && !isPast && styles.dayPillFuture,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          isActive && styles.dayPillTextActive,
                          isPast && styles.dayPillTextPast,
                        ]}
                      >
                        Day {dayNum}
                      </Text>
                    </View>
                  );
                },
              )}
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ChapterDetailScreen;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  chapterTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  chapterName: {
    fontSize: 18,
    color: '#888888',
    marginBottom: 12,
  },
  pill: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // Day Progress
  dayProgressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 4,
  },
  daysRemaining: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
  },
  // Streak
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 8,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  streakDays: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginRight: 4,
  },
  steadyBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  steadyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16A34A',
  },
  setbacksBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  setbacksText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Warning
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 16,
    marginBottom: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
  },
  // Overall Progress
  overallTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  overallDays: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  daysScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  dayPill: {
    borderRadius: 999,
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {
    backgroundColor: '#000000',
  },
  dayPillPast: {
    backgroundColor: '#F0F0F0',
  },
  dayPillFuture: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dayPillText: {
    fontSize: 12,
    color: '#888888',
  },
  dayPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayPillTextPast: {
    color: '#AAAAAA',
  },
});
