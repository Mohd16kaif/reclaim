import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router/react-navigation";
import { StackNavigationProp } from "expo-router/js-stack";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PRIVACY_POLICY_URL,
  SUBSCRIPTION_PLANS,
  TERMS_OF_USE_URL,
} from "../constants/legal";

type RootStackParamList = {
  PaywallPreview: undefined;
  MainDashboard: undefined;
};

type PaywallNavigationProp = StackNavigationProp<RootStackParamList>;

const ONBOARDING_COMPLETE_KEY = "@reclaim_onboarding_complete";

/**
 * Subscription information fallback used when the purchase provider has not
 * been configured. Production never grants premium access from this screen.
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
      <ScrollView contentContainerStyle={styles.container}>
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

        <View style={styles.plansCard}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <View key={plan.title} style={styles.planRow}>
              <View style={styles.planCopy}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDuration}>{plan.duration}</Text>
              </View>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.renewalText}>
          Payment is charged to your Apple ID. Subscriptions automatically
          renew unless canceled at least 24 hours before the end of the current
          period. Your localized App Store price is shown before confirmation.
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_USE_URL)}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Continue in development mode"
            activeOpacity={0.85}
            onPress={continueToApp}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Continue in development</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.unavailableText}>
            Purchases are temporarily unavailable. Please try again later.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#101010" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
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
  plansCard: { marginTop: 18 },
  planRow: {
    alignItems: "center",
    borderBottomColor: "#34343A",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  planCopy: { flex: 1, paddingRight: 12 },
  planTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  planDuration: { color: "#A8A8B0", fontSize: 12, marginTop: 3 },
  planPrice: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  renewalText: {
    color: "#A8A8B0",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 18,
    textAlign: "center",
  },
  legalLinks: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  legalLink: { color: "#C4B5FD", fontSize: 13, textDecorationLine: "underline" },
  legalSeparator: { color: "#71717A", marginHorizontal: 10 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 17,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  unavailableText: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 24,
    textAlign: "center",
  },
});
