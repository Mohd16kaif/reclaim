import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  SetupComplete: any;
  OnboardingResult: undefined;
  MainDashboard: undefined;
  Home: any;
};

type ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SetupComplete"
>;

const FEATURES = [
  {
    icon: "🛡️",
    title: "24/7 Protection",
    description: "Blocks triggering content automatically",
    color: "#EFF6FF",
  },
  {
    icon: "🚨",
    title: "Panic Button",
    description: "Instant help when urges strike",
    color: "#FEF2F2",
  },
  {
    icon: "🤖",
    title: "AI Coach",
    description: "Personalized support and motivation",
    color: "#F5F3FF",
  },
  {
    icon: "📊",
    title: "Track Progress",
    description: "See your growth over time",
    color: "#ECFDF5",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    description: "Your data stays confidential",
    color: "#F9FAFB",
  },
];

const SetupCompleteScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "SetupComplete">>();
  const params = route.params || {};

  const handleActivate = async () => {
    try {
      if (params && Object.keys(params).length > 0) {
        await AsyncStorage.setItem("userProfile", JSON.stringify(params));
      }

      const existingMemberSince = await AsyncStorage.getItem("memberSinceDate");
      if (!existingMemberSince) {
        const now = new Date();
        await AsyncStorage.setItem("memberSinceDate", now.toISOString());
      }
    } catch {
      // ignore storage failures and continue navigation
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "OnboardingResult" as never }],
    });
  };

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Setup Is Complete</Text>
          <Text style={styles.subtitle}>
            Reclaim is now active based on your answers and permissions.
          </Text>
          <Text style={styles.secondaryText}>
            It&apos;s ready to protect you when urges appear.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.featuresContainer}>
            {FEATURES.map((feature, index) => (
              <View
                key={index}
                style={[styles.featureCard, { backgroundColor: "#FFFFFF" }]}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: feature.color }]}
                >
                  <Text style={styles.iconText}>{feature.icon}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleActivate}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Activate protection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default SetupCompleteScreen;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 26,
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    lineHeight: 20,
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
  ctaButton: {
    backgroundColor: "#000000",
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
