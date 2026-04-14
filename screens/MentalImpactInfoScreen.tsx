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
  UrgeResponse: {
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
    selectedMentalImpact?: string;
  };

  Home: undefined;
  SignIn: undefined;
};

type MentalImpactInfoNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MentalImpactInfo"
>;

type MentalImpactInfoRouteProp = RouteProp<
  RootStackParamList,
  "MentalImpactInfo"
>;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;

const impactPoints = [
  "It rewires attraction",
  "Lowers intimacy confidence",
  "Makes real connection harder",
];

const MentalImpactInfoScreen: React.FC = () => {
  const navigation = useNavigation<MentalImpactInfoNavigationProp>();
  const route = useRoute<MentalImpactInfoRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [selectedMentalImpact, setSelectedMentalImpact] = React.useState<string | null>(null);

  const questionNumber = route.params?.questionNumber ?? 17;
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

  const handleOptionSelect = (point: string) => {
    setSelectedMentalImpact(point);
  };

  const handleContinue = () => {
    if (!selectedMentalImpact) return;

    // Navigate to UrgeResponse screen (question 18)
    navigation.navigate("UrgeResponse", {
      questionNumber: 18,
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
      selectedMentalImpact: selectedMentalImpact,
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>
            Porn Can Quietly Affect Your Mind
          </Text>

          <View style={styles.cardsContainer}>
            {impactPoints.map((point, index) => {
              const isSelected = selectedMentalImpact === point;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.impactCard,
                    isSelected && styles.impactCardSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleOptionSelect(point)}
                >
                  <Text
                    style={[
                      styles.impactText,
                      isSelected && styles.impactTextSelected,
                    ]}
                  >
                    {point}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedMentalImpact && styles.continueButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={!selectedMentalImpact}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MentalImpactInfoScreen;

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
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 32,
    textAlign: "left",
  },
  cardsContainer: {
    gap: 0,
  },
  impactCard: {
    height: 56,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  impactText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  impactCardSelected: {
    backgroundColor: "#000000",
  },
  impactTextSelected: {
    color: "#FFFFFF",
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
  continueButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
});
