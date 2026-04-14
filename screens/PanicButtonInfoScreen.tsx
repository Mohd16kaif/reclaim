import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
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
    selectedReason?: string;
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
    selectedAge?: string;
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
    boredomFrequency?: string;
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
    sessionDuration?: string;
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
  UrgeIntensity: {
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
    selectedResponse?: string;
  };
  UrgeLoop: {
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
    selectedResponse?: string;
    selectedIntensity?: string;
  };
  PanicButtonInfo: {
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
    selectedResponse?: string;
    selectedIntensity?: string;
    selectedLoop?: string;
  };
  SocialMediaTrigger: {
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
    selectedResponse?: string;
    selectedIntensity?: string;
    selectedLoop?: string;
  };
  Home: undefined;
  SignIn: undefined;
};

type PanicButtonInfoNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PanicButtonInfo"
>;

type PanicButtonInfoRouteProp = RouteProp<
  RootStackParamList,
  "PanicButtonInfo"
>;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;

const PanicButtonInfoScreen: React.FC = () => {
  const navigation = useNavigation<PanicButtonInfoNavigationProp>();
  const route = useRoute<PanicButtonInfoRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const questionNumber = route.params?.questionNumber ?? 21;
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
  const selectedMentalImpact = route.params?.selectedMentalImpact ?? "";
  const selectedResponse = route.params?.selectedResponse ?? "";
  const selectedIntensity = route.params?.selectedIntensity ?? "";
  const selectedLoop = route.params?.selectedLoop ?? "";

  const progress = Math.min(
    1,
    Math.max(0, questionNumber / totalQuestions || 0),
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
    // Navigate to SocialMediaTrigger screen (question 22)
    navigation.navigate("SocialMediaTrigger", {
      questionNumber: 22,
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
      selectedResponse: selectedResponse,
      selectedIntensity: selectedIntensity,
      selectedLoop: selectedLoop,
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
        <View style={styles.content}>
          <Text style={styles.heading}>Best In-App Panic Button</Text>
          <Text style={styles.subHeading}>
            For moments when the urge takes over.
          </Text>

          {/* Placeholder for home screen screenshot */}
          <View style={styles.screenshotPlaceholder}>
            <Image
              source={require("../assets/images/best-in-app-panic-button.png")}
              style={styles.screenshotImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Bottom button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PanicButtonInfoScreen;

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
    backgroundColor: "#FFFFFF",
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
    textAlign: "left",
  },
  subHeading: {
    fontSize: 14,
    color: "#999999",
    marginBottom: 0,
    textAlign: "left",
  },
  screenshotPlaceholder: {
    marginVertical: 8,
    marginHorizontal: -24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  screenshotImage: {
    width: "100%",
    height: "90%",
    borderRadius: 16,
  },
  placeholderText: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: -2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 5,
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
