import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef, useState } from "react";
import {
    AccessibilityInfo,
    Alert,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  getOrCreateUserId,
  signInWithApple,
  restoreFromSupabase,
  syncUserToSupabase,
  AppleSignInResult,
} from "../utils/supabase";

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  OnboardingQuestion: { questionNumber: number; totalQuestions: number };
  OnboardingResult: undefined;
  Home: undefined;
  SignIn: undefined;
  MainDashboard: undefined;
};

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const ANIMATION_DURATION = 500;
const VIDEO_FADE_DELAY = 0;
const VIDEO_FADE_DURATION = 200;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const opacity = useRef(new Animated.Value(0)).current;
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const player = useVideoPlayer(
    require("../assets/videos/first.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.currentTime = 0;
    }
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: reduceMotion ? 0 : ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [opacity, reduceMotion]);

  useEffect(() => {
    Animated.timing(videoOpacity, {
      toValue: 1,
      delay: reduceMotion ? 0 : VIDEO_FADE_DELAY,
      duration: reduceMotion ? 0 : VIDEO_FADE_DURATION,
      useNativeDriver: true,
    }).start();
  }, [videoOpacity, reduceMotion]);

  const { status } = useEvent(player, "statusChange", { status: player.status });

  useEffect(() => {
    // TEMP DEBUG
    console.log("WelcomeScreen video status:", status, "time:", Date.now());
    // TEMP DEBUG
    if (status === "readyToPlay") {
      player.play();
    }
  }, [status, player]);

  const handleGetStarted = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);

    // Ensure an anonymous session exists before linking Apple identity —
    // linkIdentity requires an active session's JWT to attach to.
    await getOrCreateUserId();

    const result: AppleSignInResult = await signInWithApple();

    if (result.status === "linked") {
      syncUserToSupabase().catch((e) => console.error("syncUserToSupabase failed:", e));
      navigation.replace("OnboardingQuestion", {
        questionNumber: 1,
        totalQuestions: 23,
      });
    } else if (result.status === "signed_in_existing_account") {
      await restoreFromSupabase();
      await AsyncStorage.setItem("@reclaim_onboarding_complete", "true");
      navigation.replace("OnboardingResult");
    } else if (result.status === "error") {
      setIsSigningIn(false);
      const message =
        result.message === "User canceled sign in"
          ? "Sign in was canceled."
          : result.message;
      Alert.alert("Sign In", message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity }]}>
        <Animated.View style={[styles.spacer, { opacity: videoOpacity }]}>
          <VideoView
            style={styles.video}
            player={player}
            contentFit="contain"
            nativeControls={false}
          />
        </Animated.View>

        <View style={styles.bottomContent}>
          <Text style={styles.heading}>Quit Porn{"\n"}Addiction Easily</Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              isSigningIn && styles.primaryButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleGetStarted}
            disabled={isSigningIn}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  spacer: {
    flex: 1,
    maxHeight: 530,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 95,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  bottomContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#000000",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
