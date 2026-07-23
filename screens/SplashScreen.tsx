import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
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
  PanicLock: { remainingSeconds: number } | undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const SPLASH_DURATION_MS = 2000;
const ONBOARDING_COMPLETE_KEY = "@reclaim_onboarding_complete";

const logoImage = require("../assets/images/reclaim-logo-app.png");

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const [reduceMotion, setReduceMotion] = useState(false);
  const superwall = useSuperwall();

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
      try {
        const entitlements = await superwall.getEntitlements();
        const proActive = entitlements.active.some((e) => e.id === "pro");
        console.log("SPLASH_ENTITLEMENTS_DEBUG:", JSON.stringify(entitlements, null, 2));
        if (proActive) {
          Sentry.captureMessage("SUPERWALL_DEBUG SplashScreen — returning subscriber detected, routing to MainDashboard", "info");
          navigation.reset({
            index: 0,
            routes: [{ name: "MainDashboard" }],
          });
          return;
        }
      } catch (err) {
        Sentry.captureMessage("SUPERWALL_DEBUG SplashScreen — entitlement check failed: " + JSON.stringify(err), "error");
      }

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

        navigation.reset({
          index: 0,
          routes: [
            { name: completed === "true" ? "MainDashboard" : "Welcome" },
          ],
        });
      } catch {
        // If AsyncStorage fails, default to Welcome
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      }
    }, reduceMotion ? 0 : SPLASH_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [navigation, reduceMotion, superwall]);

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
