import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CHAPTERS, type ChapterData } from '../constants/chapters';
import { loadUserProgress, type ChapterProgressItem, type ChapterStatus } from '../utils/userProgress';

type RootStackParamList = {
  ChaptersScreen: undefined;
  ChapterDetail: {
    chapterIndex: number;
  };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'ChaptersScreen'>;

const ChaptersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [progress, setProgress] = useState<ChapterProgressItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Determine if a chapter is unlocked based on the global streak
  const isChapterUnlocked = useCallback((chapterIndex: number): boolean => {
    if (chapterIndex === 1) return true; // Chapter 1 always unlocked
    const chapter = CHAPTERS.find((c) => c.index === chapterIndex);
    if (!chapter) return false;
    return currentStreak >= chapter.startDay;
  }, [currentStreak]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadUserProgress().then((data) => {
        if (!mounted) return;
        setProgress(data.chapterProgress);
        setCurrentIndex(data.currentChapterIndex);
        setCurrentStreak(data.currentStreak);
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  const handleChapterPress = useCallback(
    (item: ChapterProgressItem) => {
      const isUnlocked = isChapterUnlocked(item.chapter);
      if (!isUnlocked) {
        const previousChapter = CHAPTERS[item.chapter - 2];
        Alert.alert(
          'Locked',
          `Complete Chapter ${previousChapter.index} - ${previousChapter.name} first to unlock this chapter.`
        );
        return;
      }
      const ch = CHAPTERS.find((c: ChapterData) => c.index === item.chapter);
      if (!ch) return;
      navigation.navigate('ChapterDetail', {
        chapterIndex: ch.index,
      });
    },
    [navigation, isChapterUnlocked]
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Chapters</Text>
          <View style={styles.notesButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Every chapter brings you closer to reclaiming control
          </Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>110-day journey · 7 chapters</Text>
          </View>

          {/* Chapter List Card */}
          <View style={styles.card}>
            {CHAPTERS.map((ch, idx) => {
              const item = progress.find((p) => p.chapter === ch.index);
              const isUnlocked = isChapterUnlocked(ch.index);
              const isActive = item?.status === 'active';
              const isCompleted = item?.status === 'completed';

              const statusText = isCompleted
                ? `Completed · ${ch.totalDays} days`
                : isActive
                  ? `Day ${item?.daysCompleted ?? 0} of ${ch.totalDays}`
                  : '';

              return (
                <TouchableOpacity
                  key={ch.index}
                  style={[
                    styles.row,
                    !isUnlocked && styles.rowLocked,
                    idx < CHAPTERS.length - 1 && styles.rowWithDivider,
                  ]}
                  onPress={() => handleChapterPress(item ?? { chapter: ch.index, status: 'locked', daysCompleted: 0 })}
                  activeOpacity={isUnlocked ? 0.7 : 1}
                >
                  <View
                    style={[
                      styles.circle,
                      !isUnlocked ? styles.circleLocked : styles.circleBlack,
                    ]}
                  >
                    {!isUnlocked ? (
                      <Ionicons
                        name="lock-closed"
                        size={20}
                        color="#AAAAAA"
                      />
                    ) : (
                      <Text style={styles.circleText}>{ch.index}</Text>
                    )}
                  </View>
                  <View style={styles.rowCenter}>
                    <Text
                      style={[
                        styles.rowTitle,
                        !isUnlocked && styles.rowTitleLocked,
                      ]}
                    >
                      Chapter {ch.index} · {ch.name}
                    </Text>
                    {isUnlocked && (
                      <Text style={styles.rowSubtitle}>{statusText}</Text>
                    )}
                  </View>
                  {!isUnlocked ? (
                    <Text style={styles.lockedLabel}>Locked</Text>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#8E8E93"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.motivational}>
            Progress is fragile. Consistency protects it.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ChaptersScreen;

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  notesButton: {
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
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 12,
  },
  pill: {
    alignSelf: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 24,
  },
  pillText: {
    fontSize: 12,
    color: '#888888',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 64,
    backgroundColor: '#FFFFFF',
  },
  rowLocked: {
    backgroundColor: '#FAFAFA',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  circleBlack: {
    backgroundColor: '#000000',
  },
  circleLocked: {
    backgroundColor: '#F0F0F0',
  },
  circleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rowCenter: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  rowTitleLocked: {
    fontWeight: '400',
    color: '#AAAAAA',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  lockedLabel: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  rowWithDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  motivational: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
  },
});
