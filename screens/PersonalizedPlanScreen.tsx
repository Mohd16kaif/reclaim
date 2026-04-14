import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  PersonalizedPlan: any;
  EducationScreen1: any;
  CompanionScreen: any;
  OnboardingCarousel: any;
};

type PersonalizedPlanNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PersonalizedPlan"
>;

const features = [
  {
    title: "24/7 Strong Protection",
    description: "Reduces exposure to triggering content around the clock with intelligent filtering.",
    icon: "🛡️",
    gradient: ["#FFB800", "#FF9500"],
  },
  {
    title: "Urge-Control Tools",
    description: "Evidence-based techniques to help you maintain control during challenging moments.",
    icon: "🎯",
    gradient: ["#FF9500", "#FF6B00"],
  },
  {
    title: "Break Glass Panic Button",
    description: "Instant emergency protection activated with a single tap when you need it most.",
    icon: "🚨",
    gradient: ["#FF3B30", "#FF1744"],
  },
  {
    title: "AI Motivator",
    description: "Personalized support with three modes—from warm encouragement to firm accountability.",
    icon: "🤖",
    gradient: ["#FFB800", "#FFA000"],
  },
  {
    title: "Trigger Awareness",
    description: "Track and understand your patterns to build lasting awareness and prevention.",
    icon: "📊",
    gradient: ["#FF9500", "#FF7B00"],
  },
  {
    title: "Daily Check-ins",
    description: "Consistent progress tracking with gentle reminders to keep you on course.",
    icon: "✓",
    gradient: ["#FFB800", "#FF9500"],
  },
];

const PersonalizedPlanScreen: React.FC = () => {
  const navigation = useNavigation<PersonalizedPlanNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "PersonalizedPlan">>();
  const params = route.params || {};

  const handleContinue = () => {
    navigation.navigate("EducationScreen1" as any, params);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PERSONALIZED FOR YOU</Text>
            </View>
            <Text style={styles.title}>Your Recovery Plan</Text>
            <Text style={styles.subtitle}>
              Tailored based on your unique needs and goals
            </Text>
          </View>

          {/* Introduction Card */}
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>What to Expect</Text>
            <Text style={styles.introText}>
              We've configured a comprehensive toolkit designed to support your journey. 
              Each feature works together to provide protection, awareness, and motivation.
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Your Tools</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureHeader}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{feature.icon}</Text>
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.featureAccent} />
              </View>
            ))}
          </View>

          {/* Trust Indicator */}
          <View style={styles.trustSection}>
            <Text style={styles.trustText}>
              🔒 Your privacy is protected. All data is encrypted and confidential.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continue to Setup</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666666",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "400",
    lineHeight: 24,
  },
  introCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    fontWeight: "400",
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB800",
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF8E7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
    fontWeight: "400",
  },
  featureAccent: {
    height: 0,
  },
  trustSection: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E8FF",
  },
  trustText: {
    fontSize: 13,
    color: "#555555",
    textAlign: "center",
    lineHeight: 20,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButton: {
    backgroundColor: "#000000",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 8,
  },
  buttonArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
});

export default PersonalizedPlanScreen;