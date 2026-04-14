import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  OnboardingQuestion: {
    questionNumber?: number;
    totalQuestions?: number;
  };
  GenderSelection: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
  };
  DateOfBirthPicker: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
  };
  ReferralSource: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
  };
  LifeStatus: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
  };
  QuittingReason: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
  };
  PreviousAttempt: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
  };
  FirstExposureAge: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
  };
  BoredomFrequency: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
  };
  StressFrequency: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
    boredomFrequency?: string;
  };
  SessionDuration: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
    boredomFrequency?: string;
    stressFrequency?: string;
  };
  ReclaimResultsInfo: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
    boredomFrequency?: string;
    stressFrequency?: string;
    sessionDuration?: string;
  };
  ContentEscalation: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
    boredomFrequency?: string;
    stressFrequency?: string;
    sessionDuration?: string;
  };
  SexualFantasy: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
    boredomFrequency?: string;
    stressFrequency?: string;
    sessionDuration?: string;
    selectedEscalation?: string;
  };
  RelationshipImpact: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
    boredomFrequency?: string;
    stressFrequency?: string;
    sessionDuration?: string;
    selectedEscalation?: string;
    selectedFantasy?: string;
  };
  RelationshipBenefitsInfo: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
    boredomFrequency?: string;
    stressFrequency?: string;
    sessionDuration?: string;
    selectedEscalation?: string;
    selectedFantasy?: string;
    selectedImpact?: string;
  };
  MentalImpactInfo: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
    selectedPlatform?: string;
    selectedMood?: string;
    selectedReason?: string;
    selectedAttempt?: string;
    selectedAge?: string;
    boredomFrequency?: string;
    stressFrequency?: string;
    sessionDuration?: string;
    selectedEscalation?: string;
    selectedFantasy?: string;
    selectedImpact?: string;
  };
  Home: undefined;
  SignIn: undefined;
};

type RelationshipBenefitsInfoNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RelationshipBenefitsInfo"
>;

type RelationshipBenefitsInfoRouteProp = RouteProp<
  RootStackParamList,
  "RelationshipBenefitsInfo"
>;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;

const comparisonData = [
  {
    beforeEmoji: "😶",
    beforeText: "Difficulty opening up emotionally",
    afterEmoji: "💬",
    afterText: "More authentic conversations",
  },
  {
    beforeEmoji: "😔",
    beforeText: "Unrealistic expectations",
    afterEmoji: "❤️",
    afterText: "Deeper emotional connection",
  },
  {
    beforeEmoji: "🤐",
    beforeText: "Secrets and shame",
    afterEmoji: "🤝",
    afterText: "Honest and transparent",
  },
];

const RelationshipBenefitsInfoScreen: React.FC = () => {
  const navigation = useNavigation<RelationshipBenefitsInfoNavigationProp>();
  const route = useRoute<RelationshipBenefitsInfoRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const questionNumber = route.params?.questionNumber ?? 16;
  const totalQuestions =
    route.params?.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;
  const userName = route.params?.userName ?? "";
  const selectedGender = route.params?.selectedGender ?? "";
  const dateOfBirth = route.params?.dateOfBirth ?? "";
  const selectedPlatform = route.params?.selectedPlatform ?? "";
  const selectedMood = route.params?.selectedMood ?? "";
  const selectedReason = route.params?.selectedReason ?? "";
  const selectedAttempt = route.params?.selectedAttempt ?? "";
  const selectedAge = route.params?.selectedAge ?? "";
  const boredomFrequency = route.params?.boredomFrequency ?? "";
  const stressFrequency = route.params?.stressFrequency ?? "";
  const sessionDuration = route.params?.sessionDuration ?? "";
  const selectedEscalation = route.params?.selectedEscalation ?? "";
  const selectedFantasy = route.params?.selectedFantasy ?? "";
  const selectedImpact = route.params?.selectedImpact ?? "";

  const progress = Math.min(
    1,
    Math.max(0, questionNumber / totalQuestions || 0)
  );

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    // Navigate to MentalImpactInfo screen (question 17)
    navigation.navigate("MentalImpactInfo", {
      questionNumber: 17,
      totalQuestions: totalQuestions,
      userName: userName,
      selectedGender: selectedGender,
      dateOfBirth: dateOfBirth,
      selectedPlatform: selectedPlatform,
      selectedMood: selectedMood,
      selectedReason: selectedReason,
      selectedAttempt: selectedAttempt,
      selectedAge: selectedAge,
      boredomFrequency: boredomFrequency,
      stressFrequency: stressFrequency,
      sessionDuration: sessionDuration,
      selectedEscalation: selectedEscalation,
      selectedFantasy: selectedFantasy,
      selectedImpact: selectedImpact,
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header with back button + progress bar on one line */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <Text style={styles.backArrow}>{"←"}</Text>
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
        </View>

        {/* Main content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.heading}>
            Overcoming porn helps{"\n"}You have better
          </Text>
          <Text style={styles.headingHighlight}>Relationships</Text>

          {/* Subtitle */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>
              See the transformation in your relationships
            </Text>
          </View>

          {/* Comparison Cards */}
          <View style={styles.cardsContainer}>
            {comparisonData.map((item, index) => (
              <View key={index} style={styles.comparisonCard}>
                {/* Before Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.labelBadge}>
                      <Text style={styles.labelText}>Before</Text>
                    </View>
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.emoji}>{item.beforeEmoji}</Text>
                    <Text style={styles.sectionText}>{item.beforeText}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
                </View>

                {/* After Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.labelBadge, styles.labelBadgeAfter]}>
                      <Text style={[styles.labelText, styles.labelTextAfter]}>After</Text>
                    </View>
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.emoji}>{item.afterEmoji}</Text>
                    <Text style={[styles.sectionText, styles.sectionTextAfter]}>
                      {item.afterText}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RelationshipBenefitsInfoScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 20,
    color: "#000000",
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "#E5E5E5",
    marginLeft: 12,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 0,
    textAlign: "left",
    lineHeight: 36,
  },
  headingHighlight: {
    fontSize: 28,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 8,
    textAlign: "left",
  },
  subtitleContainer: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 15,
    color: "#666666",
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
  },
  comparisonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  labelBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelBadgeAfter: {
    backgroundColor: "#E8F5E9",
  },
  labelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelTextAfter: {
    color: "#2E7D32",
  },
  sectionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  sectionTextAfter: {
    color: "#000000",
    fontWeight: "600",
  },
  divider: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowIcon: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: "#000000",
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});