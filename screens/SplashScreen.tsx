import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router/react-navigation";
import { StackNavigationProp } from "expo-router/js-stack";
import { useSuperwall } from "expo-superwall";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getActivePanicSessionRemaining } from "../utils/familyControls";

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  MainDashboard: undefined;
  OnboardingResult: undefined;
  PanicLock: { remainingSeconds: number } | undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const SPLASH_DURATION_MS = 2000;
const ONBOARDING_COMPLETE_KEY = "@reclaim_onboarding_complete";
const superwallEnabled = Boolean(
  process.env.EXPO_PUBLIC_SUPERWALL_API_KEY_IOS?.trim(),
);

const logoImage = require("../assets/images/reclaim-logo-app.png");

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const [reduceMotion, setReduceMotion] = useState(false);
  // Selecting the method, rather than the full store, keeps this effect from
  // restarting when Superwall updates its internal state during app startup.
  const getEntitlements = useSuperwall((state) => state.getEntitlements);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      // Panic protection is a safety-critical, time-bound state. Restore it
      // before evaluating entitlements or the normal post-launch destination.
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

        if (completed === "true") {
          const remaining = await getActivePanicSessionRemaining();
          if (remaining !== null) {
            navigation.reset({
              index: 0,
              routes: [{ name: "PanicLock", params: { remainingSeconds: remaining } } as never],
            });
            return;
          }
        }

        // A returning subscriber should go to the dashboard only when there
        // is no active panic session to resume.
        try {
          if (superwallEnabled) {
            // An unavailable purchase service must never hold the user on the
            // splash screen. Fall through to the normal onboarding flow after a
            // short timeout.
            const entitlements = await Promise.race([
              getEntitlements(),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () =>
                    reject(new Error("Superwall entitlement request timed out")),
                  1500,
                ),
              ),
            ]);
            const proActive = entitlements.active.some((e) => e.id === "pro");
            if (proActive) {
              navigation.reset({
                index: 0,
                routes: [{ name: "MainDashboard" }],
              });
              return;
            }
          }
        } catch (err) {
          Sentry.captureException(err);
        }

        navigation.reset({
          index: 0,
          routes: [
            { name: completed === "true" ? "OnboardingResult" : "Welcome" },
          ],
        });
      } catch (err) {
        Sentry.captureException(err);
        // If AsyncStorage fails, default to Welcome
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      }
    }, reduceMotion ? 0 : SPLASH_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [getEntitlements, navigation, reduceMotion]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
});
