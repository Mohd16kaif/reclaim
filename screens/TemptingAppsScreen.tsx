import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  SocialMediaTrigger: undefined;
  TemptingApps: {
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
    selectedTrigger?: string;
  };
  SuggestiveImagesFilter: {
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
    selectedTrigger?: string;
    selectedApp?: string;
  };
  // Future screen placeholder
  Home: {
    questionNumber?: number;
    totalQuestions?: number;
    // ... all params
  };
};

type TemptingAppsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "TemptingApps"
>;

type TemptingAppsRouteProp = RouteProp<RootStackParamList, "TemptingApps">;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;

const appOptions = [
  "Instagram",
  "YouTube",
  "Reddit",
  "X",
  "Snapchat",
];

const TemptingAppsScreen: React.FC = () => {
  const navigation = useNavigation<TemptingAppsNavigationProp>();
  const route = useRoute<TemptingAppsRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const questionNumber = route.params?.questionNumber ?? 23;
  const totalQuestions =
    route.params?.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;

  // Extract all params to pass forward
  const {
    userName,
    selectedGender,
    dateOfBirth,
    selectedPlatform,
    selectedMood,
    selectedReason,
    selectedAttempt,
    selectedAge,
    boredomFrequency,
    stressFrequency,
    sessionDuration,
    selectedEscalation,
    selectedFantasy,
    selectedImpact,
    selectedMentalImpact,
    selectedResponse,
    selectedIntensity,
    selectedLoop,
    selectedTrigger,
  } = route.params || {};

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

  const handleAppSelect = (app: string) => {
    setSelectedApp(app);
  };

  const handleContinue = () => {
    if (!selectedApp) return;

    // Navigate to next screen (question 24)
    // Navigate to next screen (question 24)
    (navigation as any).navigate("SuggestiveImagesFilter", {
      questionNumber: 24,
      totalQuestions: totalQuestions,
      userName,
      selectedGender,
      dateOfBirth,
      selectedPlatform,
      selectedMood,
      selectedReason,
      selectedAttempt,
      selectedAge,
      boredomFrequency,
      stressFrequency,
      sessionDuration,
      selectedEscalation,
      selectedFantasy,
      selectedImpact,
      selectedMentalImpact,
      selectedResponse,
      selectedIntensity,
      selectedLoop,
      selectedTrigger,
      selectedApp,
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
          <Text style={styles.heading}>Which of these apps tempt you the most?</Text>

          <View style={styles.optionsContainer}>
            {appOptions.map((app) => {
              const isSelected = selectedApp === app;
              return (
                <TouchableOpacity
                  key={app}
                  style={[
                    styles.appButton,
                    isSelected && styles.appButtonSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleAppSelect(app)}
                >
                  <Text
                    style={[
                      styles.appButtonText,
                      isSelected && styles.appButtonTextSelected,
                    ]}
                  >
                    {app}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedApp && styles.continueButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={!selectedApp}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TemptingAppsScreen;

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
    marginBottom: 24,
    textAlign: "left",
  },
  optionsContainer: {
    gap: 0,
  },
  appButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  appButtonSelected: {
    backgroundColor: "#000000",
  },
  appButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  appButtonTextSelected: {
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
  continueButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
