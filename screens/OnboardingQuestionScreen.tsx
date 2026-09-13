import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "expo-router/react-navigation";
import { StackNavigationProp } from "expo-router/js-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { setUserName as saveUserNameToProfile } from "../utils/profileStorage";
import { syncUserToSupabase } from "../utils/supabase";

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
  Home: undefined;
  SignIn: undefined;
};

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList>;

type OnboardingRouteProp = RouteProp<RootStackParamList, "OnboardingQuestion">;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;

const OnboardingQuestionScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const route = useRoute<OnboardingRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [userName, setUserName] = useState<string>("");
  const [nameError, setNameError] = useState<string | null>(null);

  const questionNumber = route.params?.questionNumber ?? 1;
  const totalQuestions =
    route.params?.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;

  const progress = Math.min(
    1,
    Math.max(0, questionNumber / totalQuestions || 0)
  );

  // Check if Continue button should be enabled
  const isNameValid = userName.trim().length > 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const handleBack = () => {
    // Local onboarding enters this screen with `replace`, so there is no
    // previous route in that flow. Guarding prevents React Navigation's
    // unhandled GO_BACK warning and still gives the user a way to return.
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  };

  const handleContinue = () => {
    if (!isNameValid) {
      setNameError("Enter a name to continue.");
      return;
    }

    const name = userName.trim();
    // Persisting/syncing must not hold up navigation. Both operations are
    // best-effort and the app remains local-first when cloud sync is absent.
    saveUserNameToProfile(name).catch((e) =>
      console.error("saveUserNameToProfile failed:", e),
    );
    syncUserToSupabase().catch((e) =>
      console.error("syncUserToSupabase failed:", e),
    );

    // Navigate to gender selection screen (question 2)
    navigation.navigate("GenderSelection", {
      questionNumber: 2,
      totalQuestions: totalQuestions,
      userName: name,
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
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>{"←"}</Text>
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
        </View>

        {/* Question content */}
        <View style={styles.content}>
          <Text style={styles.heading}>What should we call you?</Text>

          <TextInput
            style={styles.input}
            placeholder="Type Here"
            placeholderTextColor="#A1A1AA"
            textAlign="center"
            value={userName}
            onChangeText={(value) => {
              setUserName(value);
              if (value.trim()) setNameError(null);
            }}
            onSubmitEditing={handleContinue}
            accessibilityLabel="Your name"
          />
          {nameError && <Text style={styles.errorText}>{nameError}</Text>}
        </View>

        {/* Bottom button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isNameValid && styles.continueButtonInactive,
            ]}
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

export default OnboardingQuestionScreen;

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
  input: {
    height: 56,
    width: "100%",
    alignSelf: "center",
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000000",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
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
  continueButtonInactive: {
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
