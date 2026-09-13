import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router/react-navigation";
import { StackNavigationProp } from "expo-router/js-stack";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  PaywallPreview: undefined;
  MainDashboard: undefined;
};

type PaywallNavigationProp = StackNavigationProp<RootStackParamList>;

const ONBOARDING_COMPLETE_KEY = "@reclaim_onboarding_complete";

/**
 * Local preview used only when Superwall has not been configured. It gives
 * development builds a visible paywall step without pretending to process a
 * purchase. Production uses the Superwall placement instead.
 */
export default function PaywallPreviewScreen() {
  const navigation = useNavigation<PaywallNavigationProp>();

  const continueToApp = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    navigation.reset({
      index: 0,
      routes: [{ name: "MainDashboard" }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>RECLAIM PREMIUM</Text>
        <Text style={styles.title}>Build a life you control.</Text>
        <Text style={styles.subtitle}>
          Unlock the complete Reclaim experience and stay supported every day.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Everything in Reclaim Premium</Text>
          <Text style={styles.benefit}>✓ Personalized recovery plan</Text>
          <Text style={styles.benefit}>✓ Panic-button support</Text>
          <Text style={styles.benefit}>✓ Progress and streak insights</Text>
          <Text style={styles.benefit}>✓ Always-on protection tools</Text>
        </View>

        <Text style={styles.previewNotice}>
          Paywall preview — configure Superwall to enable purchases.
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continue to Reclaim"
          activeOpacity={0.85}
          onPress={continueToApp}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Continue to Reclaim</Text>
        </TouchableOpacity>
        <Text style={styles.caption}>No payment is processed in this preview.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#101010" },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  eyebrow: {
    color: "#BBA5FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: 14,
    textAlign: "center",
  },
  subtitle: {
    color: "#C9C9CF",
    fontSize: 17,
    lineHeight: 24,
    marginTop: 14,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#222225",
    borderColor: "#4B3B7A",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 36,
    padding: 22,
  },
  cardTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 14 },
  benefit: { color: "#E3DDF5", fontSize: 16, lineHeight: 30 },
  previewNotice: {
    color: "#B8B8BF",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 22,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 17,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  caption: { color: "#85858E", fontSize: 12, marginTop: 13, textAlign: "center" },
});
