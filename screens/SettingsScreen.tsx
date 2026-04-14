import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { IconSymbol } from '../components/ui/icon-symbol';
import { useUserProfile } from '../hooks/useUserProfile';
import { getAvatarBase64Jpeg } from '../utils/profileStorage';

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  MainDashboard: undefined;
  Home: any;
  Stats: undefined;
  Blocker: undefined;
  AICoach: undefined;
  AICoachMode: undefined;
  Profile: undefined;
  TermsOfService: undefined;
  ProfileView: undefined;
  DefaultPanicDuration: undefined;
  Notifications: undefined;
  ContactSupport: undefined;
  RequestFeature: undefined;
  HelpCenter: undefined;
  FAQs: undefined;
};

type SettingsNavigationProp = StackNavigationProp<RootStackParamList>;

// ============================================================================
// SVG ICON COMPONENTS
// ============================================================================

// --- Notification bell icon ---
const NotificationBellIcon = ({ unreadCount = 0 }: { unreadCount?: number }) => (
  <View style={{ position: 'relative' }}>
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
      <View style={{
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </Text>
      </View>
    )}
  </View>
);

// --- Chevron right ---
const ChevronRight = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke="#8E8E93"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// --- CPU / Brain icon (AI Model) ---
const CpuIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} strokeWidth={2} />
    <Rect x={9} y={9} width={6} height={6} rx={1} stroke={color} strokeWidth={2} />
    <Path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// --- Bolt / Lightning icon (Panic Protection) ---
const BoltIcon = ({ color = '#000000' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
);

// --- Sun icon (Daily Check-in) ---
const SunIcon = ({ color = '#000000' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={2} />
    <Path
      d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// --- Star icon (Motivation Reminder) ---
const StarIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
);

// --- Warning/Triangle icon (Risk Alert) ---
const WarningTriangleIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// --- Trophy icon (Milestone Alert) ---
const TrophyIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M6 3h12v7a6 6 0 0 1-12 0V3zM9 21h6M12 17v4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// --- Credit Card icon (Subscription) ---
const CreditCardIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x={1} y={4} width={22} height={16} rx={2} stroke={color} strokeWidth={2} />
    <Path d="M1 10h22" stroke={color} strokeWidth={2} />
  </Svg>
);

// --- Envelope icon (Contact Support) ---
const EnvelopeIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// --- Lightbulb icon (Request a Feature) ---
const LightbulbIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.72V17h8v-2.28A7 7 0 0 0 12 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// --- Question Circle icon (Help Center) ---
const QuestionIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// --- Lock icon (Privacy Policy) ---
const LockIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={2} />
    <Path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// --- Document icon (Terms of Service) ---
const DocIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

// -- Section Header --
const SectionHeader = ({ title, trailing }: { title: string; trailing?: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
    {trailing && <Text style={styles.sectionHeaderTrailing}>{trailing}</Text>}
  </View>
);

// -- Settings Row (non-toggle) --
const SettingsRow = ({
  icon,
  iconBackground,
  title,
  rightLabel,
  hasChevron = true,
  onPress,
}: {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  rightLabel?: string;
  hasChevron?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.6}>
    <View style={[styles.rowIconCircle, { backgroundColor: iconBackground }]}>{icon}</View>
    <Text style={styles.rowTitle}>{title}</Text>
    <View style={styles.rowRight}>
      {rightLabel && <Text style={styles.rowRightLabel}>{rightLabel}</Text>}
      {hasChevron && <ChevronRight />}
    </View>
  </TouchableOpacity>
);

// -- Settings Toggle Row --
const SettingsToggleRow = ({
  icon,
  iconBackground,
  title,
  value,
  onValueChange,
}: {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => (
  <View style={styles.settingsRow}>
    <View style={[styles.rowIconCircle, { backgroundColor: iconBackground }]}>{icon}</View>
    <Text style={styles.rowTitle}>{title}</Text>
    <Switch
      value={value}
      onValueChange={(val) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(val);
      }}
      trackColor={{ false: '#E5E5EA', true: '#000000' }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#E5E5EA"
      style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] } : {}}
    />
  </View>
);

// -- Divider (inset) --
const InsetDivider = () => <View style={styles.insetDivider} />;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { userName, loadProfile } = useUserProfile();
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  // Toggle states
  const [dailyCheckIn, setDailyCheckIn] = useState(true);
  const [motivationReminder, setMotivationReminder] = useState(true);
  const [riskAlert, setRiskAlert] = useState(true);
  const [milestoneAlert, setMilestoneAlert] = useState(true);

  // Panic Duration label
  const [panicDurationLabel, setPanicDurationLabel] = useState<string>('30 min');

  // AI Model label
  const [aiModelLabel, setAiModelLabel] = useState<string>('Calm Mode');

  // Fade in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const loadProfileRow = async () => {
        await loadProfile();
        const avatar = await getAvatarBase64Jpeg();
        if (!mounted) return;
        setAvatarBase64(avatar);
      };
      loadProfileRow();
      return () => {
        mounted = false;
      };
    }, [])
  );

  // Load panic duration label when screen is focused
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const loadPanicDuration = async () => {
        const saved = await AsyncStorage.getItem('defaultPanicDuration');
        const seconds = saved ? parseInt(saved, 10) : 1800;
        const labels: Record<number, string> = {
          60: '1 min (Test)', // 🧪 TEST MODE
          900: '15 min',
          1800: '30 min',
          2700: '45 min',
          3600: '1 hr',
          5400: '1 hr 30 min',
          7200: '2 hrs',
        };
        if (!mounted) return;
        setPanicDurationLabel(labels[seconds] ?? '30 min');
      };
      loadPanicDuration();
      return () => {
        mounted = false;
      };
    }, [])
  );

  // Load AI Model label when screen is focused
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const loadAiModel = async () => {
        const saved = await AsyncStorage.getItem('aiCoachMode') ?? 'calm';
        const modeLabels: Record<string, string> = {
          calm: 'Calm Mode',
          strict: 'Strict Mode',
          distractor: 'Distractor Mode',
        };
        if (!mounted) return;
        setAiModelLabel(modeLabels[saved] ?? 'Calm Mode');
      };
      loadAiModel();
      return () => {
        mounted = false;
      };
    }, [])
  );

  // Stub action
  const stubAction = useCallback((label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(label, 'Coming soon in production build!');
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <Image
            source={require('../assets/images/reclaim-header.png')}
            style={styles.logoImage}
          />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <NotificationBellIcon unreadCount={0} />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ============================================================ */}
            {/* PAGE TITLE */}
            {/* ============================================================ */}
            <Text style={styles.pageTitle}>Settings</Text>

            {/* ============================================================ */}
            {/* PROFILE ROW */}
            {/* ============================================================ */}
            <TouchableOpacity
              style={styles.profileRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('ProfileView');
              }}
              activeOpacity={0.6}
            >
              <View style={styles.profileAvatar}>
                {avatarBase64 ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${avatarBase64}` }}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  <IconSymbol name="person.fill" size={22} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName || '—'}</Text>
                <Text style={styles.profileSubtitle}>Profile</Text>
              </View>
              <ChevronRight />
            </TouchableOpacity>
            <InsetDivider />

            {/* ============================================================ */}
            {/* AI COACH SECTION */}
            {/* ============================================================ */}
            <SectionHeader title="AI COACH" />
            <SettingsRow
              icon={<CpuIcon color="#FFFFFF" />}
              iconBackground="#F5A623"
              title="AI Model"
              rightLabel={aiModelLabel}
              onPress={() => navigation.navigate('AICoachMode')}
            />
            <InsetDivider />

            {/* ============================================================ */}
            {/* PANIC PROTECTION SECTION */}
            {/* ============================================================ */}
            <SectionHeader title="PANIC PROTECTION" />
            <SettingsRow
              icon={<BoltIcon color="#000000" />}
              iconBackground="#FFD60A"
              title="Default Panic Duration"
              rightLabel={panicDurationLabel}
              onPress={() => navigation.navigate('DefaultPanicDuration')}
            />
            <InsetDivider />

            {/* ============================================================ */}
            {/* NOTIFICATIONS SECTION */}
            {/* ============================================================ */}
            <SectionHeader title="NOTIFICATIONS" />
            <SettingsToggleRow
              icon={<SunIcon color="#000000" />}
              iconBackground="#FFD60A"
              title="Daily Check-in"
              value={dailyCheckIn}
              onValueChange={setDailyCheckIn}
            />
            <InsetDivider />
            <SettingsToggleRow
              icon={<StarIcon color="#FFFFFF" />}
              iconBackground="#007AFF"
              title="Motivation Reminder"
              value={motivationReminder}
              onValueChange={setMotivationReminder}
            />
            <InsetDivider />
            <SettingsToggleRow
              icon={<WarningTriangleIcon color="#FFFFFF" />}
              iconBackground="#FF3B30"
              title="Risk Alert"
              value={riskAlert}
              onValueChange={setRiskAlert}
            />
            <InsetDivider />
            <SettingsToggleRow
              icon={<TrophyIcon color="#FFFFFF" />}
              iconBackground="#FF9500"
              title="Milestone Alert"
              value={milestoneAlert}
              onValueChange={setMilestoneAlert}
            />
            <InsetDivider />

            {/* ============================================================ */}
            {/* SUBSCRIPTION SECTION */}
            {/* ============================================================ */}
            <SectionHeader title="SUBSCRIPTION" />
            <SettingsRow
              icon={<CreditCardIcon color="#FFFFFF" />}
              iconBackground="#30D158"
              title="Manage Subscription"
              onPress={() => stubAction('Manage Subscription')}
            />
            <InsetDivider />

            {/* ============================================================ */}
            {/* SUPPORT SECTION */}
            {/* ============================================================ */}
            <SectionHeader title="SUPPORT" />
            <SettingsRow
              icon={<EnvelopeIcon color="#FFFFFF" />}
              iconBackground="#007AFF"
              title="Contact Support"
              onPress={() => navigation.navigate('ContactSupport')}
            />
            <InsetDivider />
            <SettingsRow
              icon={<LightbulbIcon color="#FFFFFF" />}
              iconBackground="#FF9500"
              title="Request a Feature"
              onPress={() => navigation.navigate('RequestFeature')}
            />
            <InsetDivider />
            <SettingsRow
              icon={<QuestionIcon color="#FFFFFF" />}
              iconBackground="#30D158"
              title="Help Center"
              onPress={() => navigation.navigate('HelpCenter')}
            />
            <InsetDivider />

            {/* ============================================================ */}
            {/* LEGAL SECTION */}
            {/* ============================================================ */}
            <SectionHeader title="LEGAL" trailing="v1.0.0" />
            <SettingsRow
              icon={<LockIcon color="#FFFFFF" />}
              iconBackground="#8E8E93"
              title="Privacy Policy"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL('https://mohd16kaif.github.io/reclaim-privacy-policy/');
              }}
            />
            <InsetDivider />
            <SettingsRow
              icon={<DocIcon color="#FFFFFF" />}
              iconBackground="#8E8E93"
              title="Terms of Service"
             onPress={() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  navigation.navigate('TermsOfService');
}}
            />

            {/* Bottom spacing */}
            <View style={{ height: 32 }} />
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
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  logoImage: {
    width: 160,
    height: 36,
    resizeMode: 'contain',
  },
  notificationButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 24,
  },

  // ---- PROFILE ROW ----
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  profileSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#888888',
    marginTop: 2,
  },

  // ---- SECTION HEADER ----
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionHeaderTrailing: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
  },

  // ---- SETTINGS ROW ----
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 50,
  },
  rowIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowRightLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },

  // ---- DIVIDER ----
  insetDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 44,
  },
});

export default SettingsScreen;
