import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  MainDashboard: undefined;
  Stats: undefined;
  ChaptersScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

type NotificationType = 'streak' | 'checkin' | 'risk' | 'relapse' | 'chapter' | 'insight';

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  streak: '#000000',
  checkin: '#F59E0B',
  risk: '#EF4444',
  relapse: '#6366F1',
  chapter: '#000000',
  insight: '#3B82F6',
};

const NOTIFICATION_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  streak: 'trending-up',
  checkin: 'time-outline',
  risk: 'warning-outline',
  relapse: 'refresh-outline',
  chapter: 'book-outline',
  insight: 'bar-chart-outline',
};

const NOTIFICATION_ICON_BG: Record<NotificationType, string> = {
  streak: '#F0F0F0',
  checkin: '#FFFBEB',
  risk: '#FFF1F2',
  relapse: '#EEF2FF',
  chapter: '#F0F0F0',
  insight: '#EFF6FF',
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatTimeAgo = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const isToday = (isoString: string): boolean => {
  const date = new Date(isoString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate dynamic notifications
  const generateNotifications = useCallback(async (): Promise<AppNotification[]> => {
    const today = new Date().toISOString().split('T')[0];
    const newNotifications: AppNotification[] = [];

    // Load existing notifications to avoid duplicates
    const stored = await AsyncStorage.getItem('appNotifications');
    const existing: AppNotification[] = stored ? JSON.parse(stored) : [];

    // Type 1: Streak Milestone
    const currentStreakStr = await AsyncStorage.getItem('@reclaim_current_streak_start');
    const lastStreakNotifiedStr = await AsyncStorage.getItem('@reclaim_last_streak_notified');
    const lastStreakNotified = lastStreakNotifiedStr ? parseInt(lastStreakNotifiedStr, 10) : 0;

    if (currentStreakStr) {
      const streakStart = new Date(currentStreakStr);
      const streakDays = Math.floor((Date.now() - streakStart.getTime()) / (1000 * 60 * 60 * 24));

      const milestones = [3, 7, 14, 21, 30];
      const isMilestone = milestones.includes(streakDays) || (streakDays > 0 && streakDays % 5 === 0);

      if (streakDays > lastStreakNotified && isMilestone) {
        const motivationalLines: Record<number, string> = {
          3: "You're building momentum.",
          7: "Discipline is becoming habit.",
          14: "Two weeks strong. Keep going.",
          21: "Three weeks in. You're unstoppable.",
          30: "A month of freedom. Incredible.",
        };

        const subtitle = motivationalLines[streakDays] || "Another milestone reached.";

        newNotifications.push({
          id: generateUUID(),
          type: 'streak',
          title: `${streakDays}-day streak completed`,
          subtitle,
          timestamp: new Date().toISOString(),
          read: false,
        });

        await AsyncStorage.setItem('@reclaim_last_streak_notified', streakDays.toString());
      }
    }

    // Type 2: Daily Check-In Pending
    const lastCheckInDate = await AsyncStorage.getItem('lastCheckInDate');
    const alreadyHasCheckinNotif = existing.some(
      (n) => n.type === 'checkin' && isToday(n.timestamp)
    );

    if (lastCheckInDate !== today && !alreadyHasCheckinNotif) {
      newNotifications.push({
        id: generateUUID(),
        type: 'checkin',
        title: 'Daily check-in pending',
        subtitle: 'Just one tap, stay consistent.',
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    // Type 3: Risk Time Alert
    const riskHourStr = await AsyncStorage.getItem('@reclaim_risk_hour');
    const currentHour = new Date().getHours();
    const alreadyHasRiskNotif = existing.some(
      (n) => n.type === 'risk' && isToday(n.timestamp)
    );

    if (riskHourStr && parseInt(riskHourStr, 10) === currentHour && !alreadyHasRiskNotif) {
      newNotifications.push({
        id: generateUUID(),
        type: 'risk',
        title: 'Risk detected',
        subtitle: 'Activate Panic Protection',
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    // Type 4: Relapse Recovery
    const lastRelapseDate = await AsyncStorage.getItem('@reclaim_last_relapse_date');
    const alreadyHasRelapseNotif = existing.some(
      (n) => n.type === 'relapse' && n.timestamp.startsWith(lastRelapseDate || '')
    );

    if (lastRelapseDate === today && !alreadyHasRelapseNotif) {
      newNotifications.push({
        id: generateUUID(),
        type: 'relapse',
        title: 'You came back. That matters.',
        subtitle: 'Every reset is a choice to try again.',
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    // Type 5: Chapter Milestone
    const chapterProgressStr = await AsyncStorage.getItem('@reclaim_chapter_progress');
    const lastChapterNotified = await AsyncStorage.getItem('@reclaim_last_chapter_notified');

    if (chapterProgressStr) {
      const progress = JSON.parse(chapterProgressStr);
      const completedChapter = progress.find(
        (p: { status: string; chapter: number }) => p.status === 'completed'
      );

      if (completedChapter && completedChapter.chapter.toString() !== lastChapterNotified) {
        newNotifications.push({
          id: generateUUID(),
          type: 'chapter',
          title: `Chapter ${completedChapter.chapter} complete`,
          subtitle: 'Next chapter unlocked. Keep going.',
          timestamp: new Date().toISOString(),
          read: false,
        });

        await AsyncStorage.setItem('@reclaim_last_chapter_notified', completedChapter.chapter.toString());
      }
    }

    // Type 6: New Insight (once per week)
    const lastInsightDate = await AsyncStorage.getItem('@reclaim_last_insight_date');
    const daysSinceInsight = lastInsightDate
      ? Math.floor((Date.now() - new Date(lastInsightDate).getTime()) / 86400000)
      : 999;

    if (daysSinceInsight >= 7) {
      const riskHour = await AsyncStorage.getItem('@reclaim_risk_hour');
      const totalRelapseCount = await AsyncStorage.getItem('@reclaim_total_relapse_count');

      let subtitle = 'Your recovery data has updated.';
      if (riskHour) {
        const hour = parseInt(riskHour, 10);
        if (hour >= 20 && hour <= 23) {
          subtitle = "Nights are your toughest window.";
        } else if (hour >= 6 && hour <= 12) {
          subtitle = "Mornings seem to be your risk window.";
        }
      }
      if (totalRelapseCount && parseInt(totalRelapseCount, 10) > 3) {
        subtitle = "Patterns spotted. Check your stats.";
      }

      newNotifications.push({
        id: generateUUID(),
        type: 'insight',
        title: 'New insight available',
        subtitle,
        timestamp: new Date().toISOString(),
        read: false,
      });

      await AsyncStorage.setItem('@reclaim_last_insight_date', today);
    }

    // Merge new notifications with existing, avoiding duplicates
    const allNotifications = [...newNotifications, ...existing];

    // Remove duplicates by type + title + date (without time)
    const seen = new Set<string>();
    const unique = allNotifications.filter((n) => {
      const dateKey = new Date(n.timestamp).toDateString();
      const key = `${n.type}-${n.title}-${dateKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Cap at 50 notifications, remove oldest
    const capped = unique.slice(0, 50);

    // Sort by timestamp descending
    capped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Save back to storage
    await AsyncStorage.setItem('appNotifications', JSON.stringify(capped));

    return capped;
  }, []);

  // Load notifications on focus
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        setIsLoading(true);
        const notifs = await generateNotifications();
        if (!mounted) return;
        setNotifications(notifs);
        setIsLoading(false);
      };
      load();
      return () => {
        mounted = false;
      };
    }, [generateNotifications])
  );

  // Mark all as read
  const markAllAsRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await AsyncStorage.setItem('appNotifications', JSON.stringify(updated));
  };

  // Mark single as read and navigate
  const handleNotificationPress = async (notif: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read
    const updated = notifications.map((n) =>
      n.id === notif.id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await AsyncStorage.setItem('appNotifications', JSON.stringify(updated));

    // Navigate based on type
    switch (notif.type) {
      case 'streak':
      case 'insight':
        navigation.navigate('Stats');
        break;
      case 'chapter':
        navigation.navigate('ChaptersScreen');
        break;
      case 'checkin':
      case 'risk':
      case 'relapse':
      default:
        navigation.navigate('MainDashboard');
        break;
    }
  };

  // Split into sections
  const todayNotifications = notifications.filter((n) => isToday(n.timestamp));
  const earlierNotifications = notifications.filter((n) => !isToday(n.timestamp));

  const hasNotifications = notifications.length > 0;

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
            <Ionicons name="chevron-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!hasNotifications ? (
            // Empty State
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color="#888888" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Your activity and milestones will appear here
              </Text>
            </View>
          ) : (
            <>
              {/* TODAY Section */}
              {todayNotifications.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>TODAY</Text>
                  {todayNotifications.map((notif, index) => (
                    <NotificationRow
                      key={notif.id}
                      notification={notif}
                      isLast={index === todayNotifications.length - 1 && earlierNotifications.length === 0}
                      onPress={() => handleNotificationPress(notif)}
                    />
                  ))}
                </>
              )}

              {/* EARLIER Section */}
              {earlierNotifications.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>EARLIER</Text>
                  {earlierNotifications.map((notif, index) => (
                    <NotificationRow
                      key={notif.id}
                      notification={notif}
                      isLast={index === earlierNotifications.length - 1}
                      onPress={() => handleNotificationPress(notif)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Notification Row Component
interface NotificationRowProps {
  notification: AppNotification;
  isLast: boolean;
  onPress: () => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ notification, isLast, onPress }) => {
  const type = notification.type;
  const color = NOTIFICATION_COLORS[type];
  const icon = NOTIFICATION_ICONS[type];
  const iconBg = NOTIFICATION_ICON_BG[type];

  return (
    <TouchableOpacity
      style={[styles.row, !notification.read && styles.rowUnread, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Vertical Bar */}
      <View style={[styles.verticalBar, { backgroundColor: color }]} />

      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          {!notification.read && <View style={styles.unreadDot} />}
          <Text
            style={[
              styles.title,
              notification.read && styles.titleRead,
            ]}
          >
            {notification.title}
          </Text>
        </View>
        <Text style={styles.subtitle}>{notification.subtitle}</Text>
      </View>

      {/* Time */}
      <Text style={styles.time}>{formatTimeAgo(notification.timestamp)}</Text>
    </TouchableOpacity>
  );
};

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
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 13,
    color: '#888888',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 15,
    color: '#888888',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowUnread: {
    backgroundColor: '#FAFAFA',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  verticalBar: {
    width: 3,
    height: 40,
    borderRadius: 1.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  titleRead: {
    color: '#888888',
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: '#AAAAAA',
    marginLeft: 8,
  },
});

export default NotificationsScreen;
