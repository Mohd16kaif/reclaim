import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationContainer,
  NavigationIndependentTree,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "react-native-gesture-handler";
import { BlockerProvider } from "./context/BlockerContext";
import {
  getTimeOfDay,
  identifyUser,
  initAnalytics,
  trackAppOpened,
  trackScreenViewed,
} from "./utils/analytics";
import { syncUserToSupabase, restoreFromSupabase, shouldRestore } from "./utils/supabase";
import { loadUserProgress } from "./utils/userProgress";

// ── Screen imports ──────────────────────────────────────────────────────────
import AICoachModeScreen from "./screens/AICoachModeScreen";
import AlwaysOnBlockingScreen from "./screens/AlwaysOnBlockingScreen";
import BlockerScreen from "./screens/BlockerScreen";
import BoredomFrequencyScreen from "./screens/BoredomFrequencyScreen";
import BuiltForConsistencyScreen from "./screens/BuiltForConsistencyScreen";
import ChapterDetailScreen from "./screens/ChapterDetailScreen";
import ChaptersScreen from "./screens/ChaptersScreen";
import CoachScreen from "./screens/CoachScreen";
import CompanionScreen from "./screens/CompanionScreen";
import ContactSupportScreen from "./screens/ContactSupportScreen";
import ContentEscalationScreen from "./screens/ContentEscalationScreen";
import DateOfBirthPickerScreen from "./screens/DateOfBirthPickerScreen";
import DefaultPanicDurationScreen from "./screens/DefaultPanicDurationScreen";
import EducationScreen1 from "./screens/EducationScreen1";
import EducationScreen2 from "./screens/EducationScreen2";
import EducationScreen3 from "./screens/EducationScreen3";
import EducationScreen4 from "./screens/EducationScreen4";
import EducationScreen5 from "./screens/EducationScreen5";
import FAQsScreen from "./screens/FAQsScreen";
import FirstExposureAgeScreen from "./screens/FirstExposureAgeScreen";
import GenderSelectionScreen from "./screens/GenderSelectionScreen";
import GrantPermissionsScreen from "./screens/GrantPermissionsScreen";
import HelpCenterScreen from "./screens/HelpCenterScreen";
import HomeScreen from "./screens/HomeScreen";
import InstantUrgeProtectionScreen from "./screens/InstantUrgeProtectionScreen";
import LeaveRatingScreen from "./screens/LeaveRatingScreen";
import LifeStatusScreen from "./screens/LifeStatusScreen";
import MainDashboardScreen from "./screens/MainDashboardScreen";
import MasturbationRelationshipScreen from "./screens/MasturbationRelationshipScreen";
import MentalImpactInfoScreen from "./screens/MentalImpactInfoScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import OnboardingCarouselScreen from "./screens/OnboardingCarouselScreen";
import OnboardingQuestionScreen from "./screens/OnboardingQuestionScreen";
import OnboardingResultScreen from "./screens/OnboardingResultScreen";
import PanicActivatedScreen from "./screens/PanicActivatedScreen";
import PanicButtonInfoScreen from "./screens/PanicButtonInfoScreen";
import PanicCoachScreen from "./screens/PanicCoachScreen";
import PanicLockScreen from "./screens/PanicLockScreen";
import PanicShieldScreen from "./screens/PanicShieldScreen";
import PersonalizedPlanScreen from "./screens/PersonalizedPlanScreen";
import PreviousAttemptScreen from "./screens/PreviousAttemptScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import ProfileView from "./screens/ProfileView";
import QuittingReasonScreen from "./screens/QuittingReasonScreen";
import ReclaimResultsInfoScreen from "./screens/ReclaimResultsInfoScreen";
import ReducedContentExposureScreen from "./screens/ReducedContentExposureScreen";
import ReferralSourceScreen from "./screens/ReferralSourceScreen";
import RelationshipBenefitsInfoScreen from "./screens/RelationshipBenefitsInfoScreen";
import RelationshipImpactScreen from "./screens/RelationshipImpactScreen";
import RequestFeatureScreen from "./screens/RequestFeatureScreen";
import ResultsAnalysisScreen from "./screens/ResultsAnalysisScreen";
import SelfHealScreen from "./screens/SelfHealScreen";
import SessionDurationScreen from "./screens/SessionDurationScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SetupCompleteScreen from "./screens/SetupCompleteScreen";
import SexualFantasyScreen from "./screens/SexualFantasyScreen";
import ShieldStatusScreen from "./screens/ShieldStatusScreen";
import SignInScreen from "./screens/SignInScreen";
import SocialMediaTriggerScreen from "./screens/SocialMediaTriggerScreen";
import SplashScreen from "./screens/SplashScreen";
import StatsScreen from "./screens/StatsScreen";
import StressFrequencyScreen from "./screens/StressFrequencyScreen";
import SuggestiveImagesFilterScreen from "./screens/SuggestiveImagesFilterScreen";
import SupportWhenNeededScreen from "./screens/SupportWhenNeededScreen";
import TemptingAppsScreen from "./screens/TemptingAppsScreen";
import TermsOfServiceScreen from "./screens/TermsOfServiceScreen";
import UrgeIntensityScreen from "./screens/UrgeIntensityScreen";
import UrgeLoopScreen from "./screens/UrgeLoopScreen";
import UrgeResponseScreen from "./screens/UrgeResponseScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://65ec470b0a740d1f87e6167dad540946@o4511331120447488.ingest.us.sentry.io/4511331122413568',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  
  
  

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// ── Types ────────────────────────────────────────────────────────────────────

type TabName = "Home" | "Stats" | "Blocker" | "AICoach" | "Profile";

interface NavbarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  navigation: any;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const Stack = createStackNavigator();

const TABS: TabName[] = ["Home", "Stats", "Blocker", "AICoach", "Profile"];

const NAVBAR_VISIBLE_SCREENS = [
  "MainDashboard",
  "Stats",
  "Blocker",
  "AICoach",
  "Profile",
];

const SKIP_TRACKING_SCREENS = ["Splash"];

// ── Transition ────────────────────────────────────────────────────────────────

const liquidGlassTransition = {
  cardStyleInterpolator: ({ current }: any) => ({
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    },
  }),
  transitionSpec: {
    open: {
      animation: 'timing' as const,
      config: { duration: 250 },
    },
    close: {
      animation: 'timing' as const,
      config: { duration: 200 },
    },
  },
};

// ── Navbar ─────────────────────────────────────────────────────────────────────

const LiquidGlassNavbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  navigation,
}) => {
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      const avatar = await AsyncStorage.getItem("userAvatarImageData");
      if (avatar) setProfileAvatar(avatar);
    };
    loadAvatar();
  }, []);

  const scaleAnims = useRef(
    TABS.reduce(
      (acc, tab) => {
        acc[tab] = new Animated.Value(1);
        return acc;
      },
      {} as Record<TabName, Animated.Value>,
    ),
  ).current;

  const handleTabPress = (tab: TabName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnims[tab], {
        toValue: 0.82,
        useNativeDriver: true,
        speed: 60,
        bounciness: 8,
      }),
      Animated.spring(scaleAnims[tab], {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 18,
      }),
    ]).start();
    onTabChange(tab);
    const routeMap: Record<TabName, string> = {
      Home: "MainDashboard",
      Stats: "Stats",
      Blocker: "Blocker",
      AICoach: "AICoach",
      Profile: "Profile",
    };
    navigation.navigate(routeMap[tab] as never);
  };

  const getIconName = (tab: TabName, isActive: boolean): any => {
    switch (tab) {
      case "Home":
        return isActive ? "home" : "home-outline";
      case "Stats":
        return isActive ? "bar-chart" : "bar-chart-outline";
      case "Blocker":
        return isActive ? "ban" : "ban-outline";
      case "AICoach":
        return isActive ? "chatbubble" : "chatbubble-outline";
      case "Profile":
        return "person";
      default:
        return "home-outline";
    }
  };

  return (
    <View style={navStyles.outerWrapper}>
      <View style={navStyles.pillShadow}>
        <BlurView intensity={80} tint="light" style={navStyles.blurPill}>
          <View style={navStyles.warmTint} />
          <View style={navStyles.specularHighlight} />
          <View style={navStyles.innerBorder} />

          <View style={navStyles.tabRow}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const isProfile = tab === "Profile";

              return (
                <TouchableOpacity
                  key={tab}
                  style={navStyles.tabItem}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={1}
                >
                  <Animated.View
                    style={[
                      navStyles.tabInner,
                      { transform: [{ scale: scaleAnims[tab] }] },
                    ]}
                  >
                    {isActive && <View style={navStyles.activeCircle} />}

                    {isProfile ? (
                      <View
                        style={[
                          navStyles.profileCircle,
                          isActive && navStyles.profileCircleActive,
                        ]}
                      >
                        {profileAvatar ? (
                          <Image
                            source={{
                              uri: `data:image/jpeg;base64,${profileAvatar}`,
                            }}
                            style={navStyles.profileCircleImage}
                          />
                        ) : (
                          <Ionicons name="person" size={22} color="#FFFFFF" />
                        )}
                      </View>
                    ) : (
                      <>
                        <Ionicons
                          name={getIconName(tab, isActive)}
                          size={26}
                          color={isActive ? "#000000" : "rgba(0,0,0,0.4)"}
                        />
                        <Text
                          style={[
                            navStyles.tabLabel,
                            isActive && navStyles.tabLabelActive,
                          ]}
                        >
                          {tab === "AICoach" ? "AI Coach" : tab}
                        </Text>
                      </>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
};

// ── App ────────────────────────────────────────────────────────────────────────

const appLayoutStyles = StyleSheet.create({
  root: { flex: 1 },
  /** Bottom anchor only — do NOT use absoluteFill (full-screen overlay blocks touches after modal stack transitions). */
  navbarOverlaySlot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    pointerEvents: "box-none" as const,
  },
});


class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{flex:1,backgroundColor:'red',padding:40,justifyContent:'center'}}>
          <Text style={{color:'white',fontSize:18,fontWeight:'bold',marginTop:60}}>CRASH CAUGHT</Text>
          <Text style={{color:'white',fontSize:14,marginTop:20}}>{this.state.error.toString()}</Text>
          <Text style={{color:'white',fontSize:12,marginTop:20}}>{this.state.error.stack}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default Sentry.wrap(function App() {
  const navigationRef = useNavigationContainerRef();
  const [activeTab, setActiveTab] = useState<TabName>("Home");
  const [currentRoute, setCurrentRoute] = useState<string>("Splash");

  const showNavbar = NAVBAR_VISIBLE_SCREENS.includes(currentRoute);

  useEffect(() => {
    const routeToTab: Record<string, TabName> = {
      MainDashboard: "Home",
      Stats: "Stats",
      Blocker: "Blocker",
      AICoach: "AICoach",
      Profile: "Profile",
    };
    const mapped = routeToTab[currentRoute];
    if (mapped) setActiveTab(mapped);
  }, [currentRoute]);

  useEffect(() => {
      const startup = async () => {
        try {
          initAnalytics();

          // Always sync user to ensure the row exists and is updated
          await syncUserToSupabase();

          // Restore data if it's a fresh install
          if (await shouldRestore()) {
            await restoreFromSupabase();
          }

          const progress = await loadUserProgress();

      const [deviceId, userName, memberSinceDate, gender, coachMode] =
        await Promise.all([
          AsyncStorage.getItem("deviceId"),
          AsyncStorage.getItem("userName"),
          AsyncStorage.getItem("memberSinceDate"),
          AsyncStorage.getItem("selectedGender"),
          AsyncStorage.getItem("aiCoachMode"),
        ]);

      if (deviceId) {
        identifyUser(deviceId, {
          name: userName ?? undefined,
          memberSinceDate: memberSinceDate ?? undefined,
          gender: gender ?? undefined,
          coachMode: coachMode ?? undefined,
        });
      }

      const currentStreak = parseInt(
        (await AsyncStorage.getItem("currentStreak")) ?? "0",
        10,
      );
      const lastCheckIn = await AsyncStorage.getItem("lastCheckInDate");
      const today = new Date().toISOString().split("T")[0];

      trackAppOpened({
        currentStreak,
        hasCheckedInToday: lastCheckIn === today,
      });
    } catch (e) {
      console.error("App startup error:", e);
    }

      // No longer need to call here, it's handled at the start of startup()
      // syncUserToSupabase();
    };

    startup();
  }, []);

  return (
    <ErrorBoundary>
    <BlockerProvider>
      <NavigationIndependentTree>
        <NavigationContainer
          ref={navigationRef}
          onStateChange={(state) => {
            const route = state?.routes[state?.index];
            if (route?.name) {
              setCurrentRoute(route.name);
              if (!SKIP_TRACKING_SCREENS.includes(route.name)) {
                trackScreenViewed(route.name, {
                  time_of_day: getTimeOfDay(),
                });
              }
            }
          }}
        >
          <View style={appLayoutStyles.root}>
          <Stack.Navigator
            initialRouteName="Splash"
            detachInactiveScreens={true}
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#FFFFFF' },
              ...liquidGlassTransition,
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="OnboardingQuestion" component={OnboardingQuestionScreen} />
            <Stack.Screen name="GenderSelection" component={GenderSelectionScreen} />
            <Stack.Screen name="DateOfBirthPicker" component={DateOfBirthPickerScreen} />
            <Stack.Screen name="ReferralSource" component={ReferralSourceScreen} />
            <Stack.Screen name="LifeStatus" component={LifeStatusScreen} />
            <Stack.Screen name="QuittingReason" component={QuittingReasonScreen} />
            <Stack.Screen name="PreviousAttempt" component={PreviousAttemptScreen} />
            <Stack.Screen name="FirstExposureAge" component={FirstExposureAgeScreen} />
            <Stack.Screen name="BoredomFrequency" component={BoredomFrequencyScreen} />
            <Stack.Screen name="StressFrequency" component={StressFrequencyScreen} />
            <Stack.Screen name="SessionDuration" component={SessionDurationScreen} />
            <Stack.Screen name="ReclaimResultsInfo" component={ReclaimResultsInfoScreen} />
            <Stack.Screen name="ContentEscalation" component={ContentEscalationScreen} />
            <Stack.Screen name="SexualFantasy" component={SexualFantasyScreen} />
            <Stack.Screen name="RelationshipImpact" component={RelationshipImpactScreen} />
            <Stack.Screen name="RelationshipBenefitsInfo" component={RelationshipBenefitsInfoScreen} />
            <Stack.Screen name="MentalImpactInfo" component={MentalImpactInfoScreen} />
            <Stack.Screen name="UrgeResponse" component={UrgeResponseScreen} />
            <Stack.Screen name="UrgeIntensity" component={UrgeIntensityScreen} />
            <Stack.Screen name="UrgeLoop" component={UrgeLoopScreen} />
            <Stack.Screen name="PanicButtonInfo" component={PanicButtonInfoScreen} />
            <Stack.Screen name="SocialMediaTrigger" component={SocialMediaTriggerScreen} />
            <Stack.Screen name="TemptingApps" component={TemptingAppsScreen} />
            <Stack.Screen name="SuggestiveImagesFilter" component={SuggestiveImagesFilterScreen} />
            <Stack.Screen name="MasturbationRelationship" component={MasturbationRelationshipScreen} />
            <Stack.Screen name="ResultsAnalysis" component={ResultsAnalysisScreen} />
            <Stack.Screen name="PersonalizedPlan" component={PersonalizedPlanScreen} />
            <Stack.Screen name="EducationScreen1" component={EducationScreen1} />
            <Stack.Screen name="EducationScreen2" component={EducationScreen2} />
            <Stack.Screen name="EducationScreen3" component={EducationScreen3} />
            <Stack.Screen name="EducationScreen4" component={EducationScreen4} />
            <Stack.Screen name="EducationScreen5" component={EducationScreen5} />
            <Stack.Screen name="CompanionScreen" component={CompanionScreen} />
            <Stack.Screen name="AlwaysOnBlocking" component={AlwaysOnBlockingScreen} />
            <Stack.Screen name="ReducedContentExposure" component={ReducedContentExposureScreen} />
            <Stack.Screen name="InstantUrgeProtection" component={InstantUrgeProtectionScreen} />
            <Stack.Screen name="LeaveRating" component={LeaveRatingScreen} />
            <Stack.Screen name="GrantPermissions" component={GrantPermissionsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SetupComplete" component={SetupCompleteScreen} />
            <Stack.Screen name="OnboardingResult" component={OnboardingResultScreen} />
            <Stack.Screen name="MainDashboard" component={MainDashboardScreen} options={{ headerShown: false, animation: "none" }} />
            <Stack.Screen name="ChaptersScreen" component={ChaptersScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ChapterDetail" component={ChapterDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Blocker" component={BlockerScreen} />
            <Stack.Screen name="AICoach" component={CoachScreen} />
            <Stack.Screen name="AICoachMode" component={AICoachModeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="FAQs" component={FAQsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ContactSupport" component={ContactSupportScreen} options={{ headerShown: false }} />
            <Stack.Screen name="RequestFeature" component={RequestFeatureScreen} options={{ headerShown: false }} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={SettingsScreen} />
            <Stack.Screen name="DefaultPanicDuration" component={DefaultPanicDurationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProfileView" component={ProfileView} />
            <Stack.Screen name="PanicActivated" component={PanicActivatedScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="PanicShield" component={PanicShieldScreen} options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="PanicCoach" component={PanicCoachScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="PanicLock" component={PanicLockScreen} options={{ gestureEnabled: false, headerShown: false }} />
            <Stack.Screen name="SupportWhenNeeded" component={SupportWhenNeededScreen} />
            <Stack.Screen name="BuiltForConsistency" component={BuiltForConsistencyScreen} />
            <Stack.Screen name="OnboardingCarousel" component={OnboardingCarouselScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />

            {/* ── NEW SCREENS ─────────────────────────────────────────── */}
            <Stack.Screen
              name="ShieldStatus"
              component={ShieldStatusScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SelfHeal"
              component={SelfHealScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>

          {showNavbar && (
            <View
              pointerEvents="box-none"
              style={appLayoutStyles.navbarOverlaySlot}
            >
              <LiquidGlassNavbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                navigation={navigationRef}
              />
            </View>
          )}
        </View>
        </NavigationContainer>
      </NavigationIndependentTree>
    </BlockerProvider>
    </ErrorBoundary>
  );
});

// ── Styles ─────────────────────────────────────────────────────────────────────

const navStyles = StyleSheet.create({
  outerWrapper: {
    position: "absolute", bottom: 28, left: 0, right: 0,
    alignItems: "center", zIndex: 100,
  },
  pillShadow: {
    borderRadius: 999, shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 32, elevation: 24,
  },
  blurPill: {
    borderRadius: 999, overflow: "hidden",
    ...Platform.select({ android: { backgroundColor: "rgba(245,245,245,0.96)" } }),
  },
  warmTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 999,
  },
  specularHighlight: {
    position: "absolute", top: 0, left: 16, right: 16,
    height: 1.5, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 999,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.55)",
  },
  tabRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10, gap: 0,
  },
  tabItem: { width: 66, alignItems: "center", justifyContent: "center" },
  tabInner: {
    alignItems: "center", justifyContent: "center",
    width: 56, height: 56, borderRadius: 28, position: "relative",
  },
  activeCircle: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 28,
  },
  tabLabel: { fontSize: 10, fontWeight: "500", color: "rgba(0,0,0,0.4)", marginTop: 1 },
  tabLabelActive: { color: "#000000", fontWeight: "600" },
  profileCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#2C2C2C", alignItems: "center",
    justifyContent: "center", overflow: "hidden",
  },
  profileCircleActive: { borderWidth: 2.5, borderColor: "rgba(0,0,0,0.7)" },
  profileCircleImage: { width: 40, height: 40, borderRadius: 20 },
});