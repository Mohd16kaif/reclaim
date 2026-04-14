import { Picker } from "@react-native-picker/picker";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Haptics from "expo-haptics";
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
  Home: undefined;
  SignIn: undefined;
};

type FirstExposureAgeNavigationProp = StackNavigationProp<
  RootStackParamList,
  "FirstExposureAge"
>;

type FirstExposureAgeRouteProp = RouteProp<
  RootStackParamList,
  "FirstExposureAge"
>;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;

// Generate ages array
const AGES_ARRAY: string[] = (() => {
  const ages: string[] = [];
  for (let i = 4; i <= 30; i++) {
    ages.push(`${i} Year old`);
  }
  ages.push("30+ Year old");
  return ages;
})();

const FirstExposureAgeScreen: React.FC = () => {
  const navigation = useNavigation<FirstExposureAgeNavigationProp>();
  const route = useRoute<FirstExposureAgeRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const questionNumber = route.params?.questionNumber ?? 8;
  const totalQuestions =
    route.params?.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;
  const userName = route.params?.userName ?? "";
  const selectedGender = route.params?.selectedGender ?? "";
  const dateOfBirth = route.params?.dateOfBirth ?? "";
  const selectedPlatform = route.params?.selectedPlatform ?? "";
  const selectedMood = route.params?.selectedMood ?? "";
  const selectedReason = route.params?.selectedReason ?? "";
  const selectedAttempt = route.params?.selectedAttempt ?? "";

  // Default: "12 Year old" (index 8)
  const [selectedAgeIndex, setSelectedAgeIndex] = useState<number>(8);

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
    const selectedAge = AGES_ARRAY[selectedAgeIndex];

    // Navigate to boredom frequency screen (question 9)
    navigation.navigate("BoredomFrequency", {
      questionNumber: 9,
      totalQuestions: totalQuestions,
      userName: userName,
      selectedGender: selectedGender,
      dateOfBirth: dateOfBirth,
      selectedPlatform: selectedPlatform,
      selectedMood: selectedMood,
      selectedReason: selectedReason,
      selectedAttempt: selectedAttempt,
      selectedAge: selectedAge,
    });
  };

  const handleAgeChange = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAgeIndex(value);
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
          <Text style={styles.heading}>
            When did you first start watching porn?
          </Text>

          {/* Age Picker */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedAgeIndex}
              onValueChange={handleAgeChange}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {AGES_ARRAY.map((age, index) => (
                <Picker.Item key={index} label={age} value={index} />
              ))}
            </Picker>
          </View>
        </View>

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

export default FirstExposureAgeScreen;

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
    paddingTop: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 32,
  },
  pickerContainer: {
    height: 200,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  picker: {
    width: "100%",
    height: "100%",
  },
  pickerItem: {
    height: 200,
    fontSize: 18,
    color: "#000000",
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
