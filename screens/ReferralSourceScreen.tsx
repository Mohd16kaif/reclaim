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
  Home: undefined;
  SignIn: undefined;
};

type ReferralSourceNavigationProp = StackNavigationProp<RootStackParamList>;

type ReferralSourceRouteProp = RouteProp<RootStackParamList, "ReferralSource">;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;

type PlatformOption =
  | "Twitter"
  | "Instagram"
  | "Reddit"
  | "Facebook"
  | "Google"
  | "Tik Tok"
  | "You Tube";

interface PlatformConfig {
  name: PlatformOption;
}

const platformOptions: PlatformConfig[] = [
  { name: "Twitter" },
  { name: "Instagram" },
  { name: "Reddit" },
  { name: "Facebook" },
  { name: "Google" },
  { name: "Tik Tok" },
  { name: "You Tube" },
];

const ReferralSourceScreen: React.FC = () => {
  const navigation = useNavigation<ReferralSourceNavigationProp>();
  const route = useRoute<ReferralSourceRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformOption | null>(null);

  const questionNumber = route.params?.questionNumber ?? 4;
  const totalQuestions =
    route.params?.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;
  const userName = route.params?.userName ?? "";
  const selectedGender = route.params?.selectedGender ?? "";
  const dateOfBirth = route.params?.dateOfBirth ?? "";

  const progress = Math.min(
    1,
    Math.max(0, questionNumber / totalQuestions || 0)
  );

  const isValid = selectedPlatform !== null;

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

  const handlePlatformSelect = (platform: PlatformOption) => {
    setSelectedPlatform(platform);
  };

  const handleContinue = () => {
    if (!isValid) return;

    // Navigate to life status screen (question 5)
    navigation.navigate("LifeStatus", {
      questionNumber: 5,
      totalQuestions: totalQuestions,
      userName: userName,
      selectedGender: selectedGender,
      dateOfBirth: dateOfBirth,
      selectedPlatform: selectedPlatform,
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
          <Text style={styles.heading}>How did you hear about this app?</Text>

          <View style={styles.optionsContainer}>
            {platformOptions.map((platform) => {
              const isSelected = selectedPlatform === platform.name;
              return (
                <TouchableOpacity
                  key={platform.name}
                  style={[
                    styles.platformButton,
                    isSelected && styles.platformButtonSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePlatformSelect(platform.name)}
                >
                  <Text
                    style={[
                      styles.platformButtonText,
                      isSelected && styles.platformButtonTextSelected,
                    ]}
                  >
                    {platform.name}
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
              !isValid && styles.continueButtonDisabled,
            ]}
            activeOpacity={isValid ? 0.85 : 1}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ReferralSourceScreen;

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
    alignSelf: "center",
    fontWeight: "700",
    color: "#000000",
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  platformButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 0,
  },
  platformButtonSelected: {
    backgroundColor: "#000000",
  },
  platformButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  platformButtonTextSelected: {
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
    backgroundColor: "#000000",
    opacity: 0.4,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});