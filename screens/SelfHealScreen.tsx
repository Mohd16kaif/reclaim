import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { SHIELD_STATE_COLORS } from "../utils/shieldLayers";
import {
  clearSelfHealPending,
  getFullShieldStatus,
  markOSLevelEnabled,
  selfHealShield,
} from "../utils/shieldManager";
import { triggerManualCheck } from "../utils/watchdog";

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  SelfHeal: undefined;
  Blocker: undefined;
  ShieldStatus: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "SelfHeal">;

// ============================================================================
// FRICTION TIMER DURATION (seconds)
// The pause before the re-enable button activates.
// This intentional delay reduces impulsive disabling/re-enabling.
// ============================================================================

const FRICTION_DELAY_SECONDS = 5;

// ============================================================================
// ICONS
// ============================================================================

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="#000000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({ color = "#22C55E" }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============================================================================
// STEP STATE TYPE
// ============================================================================

type StepStatus = "pending" | "in_progress" | "done" | "skipped";

interface HealStep {
  id: string;
  title: string;
  description: string;
  action: string;
  actionType: "button" | "link" | "confirm";
  status: StepStatus;
}

// ============================================================================
// FRICTION TIMER BUTTON
// The re-enable button is locked for FRICTION_DELAY_SECONDS.
// After that it becomes pressable.
// ============================================================================

const FrictionButton = ({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) => {
  const [secondsLeft, setSecondsLeft] = useState(FRICTION_DELAY_SECONDS);
  const [unlocked, setUnlocked] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar from 0 to 1 over FRICTION_DELAY_SECONDS
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: FRICTION_DELAY_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={frictionStyles.container}>
      {!unlocked ? (
        <>
          <View style={frictionStyles.progressBarBg}>
            <Animated.View
              style={[frictionStyles.progressBarFill, { width: barWidth }]}
            />
          </View>
          <View style={frictionStyles.lockedButton}>
            <Text style={frictionStyles.lockedText}>
              Available in {secondsLeft}s
            </Text>
          </View>
          <Text style={frictionStyles.frictionHint}>
            This pause is intentional — take a breath before re-enabling.
          </Text>
        </>
      ) : (
        <TouchableOpacity
          style={frictionStyles.unlockedButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }}
          activeOpacity={0.85}
        >
          <Text style={frictionStyles.unlockedText}>{label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const frictionStyles = StyleSheet.create({
  container: { marginTop: 8 },
  progressBarBg: {
    height: 4, backgroundColor: "#F3F4F6",
    borderRadius: 2, marginBottom: 10, overflow: "hidden",
  },
  progressBarFill: { height: 4, backgroundColor: "#000000", borderRadius: 2 },
  lockedButton: {
    backgroundColor: "#F3F4F6", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  lockedText: { fontSize: 15, fontWeight: "600", color: "#C7C7CC" },
  frictionHint: {
    fontSize: 12, color: "#8E8E93", textAlign: "center",
    marginTop: 8, fontStyle: "italic",
  },
  unlockedButton: {
    backgroundColor: "#000000", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  unlockedText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

const SelfHealScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [steps, setSteps] = useState<HealStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [healed, setHealed] = useState(false);
  const [healScore, setHealScore] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    buildSteps();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [loading]);

  const buildSteps = async () => {
    setLoading(true);
    await clearSelfHealPending();

    const snapshot = await getFullShieldStatus();
    const builtSteps: HealStep[] = [];

    // Step 1 — DNS shield re-enable (always shown in self-heal)
    builtSteps.push({
      id: "dns",
      title: "Re-enable DNS Shield",
      description:
        "Your DNS protection has been disabled or broken. Re-installing it restores Layers 1–4 including Safe Search, Social Media filtering, and Bypass Resistance.",
      action: "Re-enable Shield",
      actionType: "button",
      status: snapshot.dnsProfileStatus === "installed" ? "done" : "pending",
    });

    // Step 2 — OS Level (if not enabled)
    if (snapshot.layerStatuses.os_level !== "active") {
      builtSteps.push({
        id: "os_level",
        title: "Enable iOS Screen Time Filter",
        description:
          "Go to Settings → Screen Time → Content & Privacy Restrictions → Content Restrictions → Web Content → set to 'Limit Adult Websites'. This adds a second layer of OS-level protection.",
        action: "Open Settings",
        actionType: "link",
        status: "pending",
      });
    }

    // Step 3 — Verify everything
    builtSteps.push({
      id: "verify",
      title: "Verify Protection",
      description:
        "Run a full shield check to confirm all layers are active and working correctly.",
      action: "Run Verification",
      actionType: "confirm",
      status: "pending",
    });

    setSteps(builtSteps);
    setLoading(false);

    // Find first incomplete step
    const firstPending = builtSteps.findIndex((s) => s.status === "pending");
    setCurrentStepIndex(firstPending >= 0 ? firstPending : 0);
  };

  const markStepDone = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status: "done" } : s))
    );
    // Move to next pending step
    const nextIndex = steps.findIndex(
      (s, i) => i > currentStepIndex && s.status === "pending"
    );
    if (nextIndex >= 0) {
      setCurrentStepIndex(nextIndex);
    }
  };

  const handleDNSReEnable = async () => {
    await selfHealShield();
    markStepDone("dns");
  };

  const handleOpenSettings = async () => {
    await Linking.openURL("App-prefs:SCREEN_TIME");
    // Give user time to go to settings and come back
    setTimeout(async () => {
      await markOSLevelEnabled();
      markStepDone("os_level");
    }, 3000);
  };

  const handleVerify = async () => {
    const result = await triggerManualCheck();
    setHealScore(result.currentScore);
    markStepDone("verify");
    setHealed(true);
  };

  const allDone = steps.length > 0 && steps.every((s) => s.status === "done");

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  if (healed || allDone) {
    const color = SHIELD_STATE_COLORS[healScore >= 70 ? "protected" : healScore >= 35 ? "partial" : "vulnerable"];
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: color + "20" }]}>
              <CheckIcon color={color} />
            </View>
            <Text style={styles.successTitle}>Shield Restored</Text>
            <Text style={styles.successScore}>
              <Text style={[styles.successScoreNum, { color }]}>{healScore}</Text>
              <Text style={styles.successScoreMax}>/100</Text>
            </Text>
            <Text style={styles.successDesc}>
              {healScore >= 70
                ? "All layers are active. You're fully protected."
                : healScore >= 35
                ? "Most layers are active. Some optional layers can still be set up."
                : "Shield partially restored. Return to Blocker to complete setup."}
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => navigation.navigate("Blocker")}
              activeOpacity={0.85}
            >
              <Text style={styles.successButtonText}>Back to Shield</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successSecondaryButton}
              onPress={() => navigation.navigate("ShieldStatus")}
              activeOpacity={0.7}
            >
              <Text style={styles.successSecondaryText}>View All Layers</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Restore Shield</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Diagnosing your shield...</Text>
          </View>
        ) : (
          <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Intro */}
              <View style={styles.introCard}>
                <Text style={styles.introTitle}>Your protection needs attention</Text>
                <Text style={styles.introDesc}>
                  Follow the steps below to restore your shield. Each step
                  strengthens a specific layer of protection.
                </Text>
              </View>

              {/* Progress indicator */}
              <View style={styles.progressRow}>
                {steps.map((step, i) => (
                  <View key={step.id} style={styles.progressItem}>
                    <View
                      style={[
                        styles.progressDot,
                        step.status === "done" && styles.progressDotDone,
                        i === currentStepIndex &&
                          step.status !== "done" &&
                          styles.progressDotActive,
                      ]}
                    >
                      {step.status === "done" && (
                        <CheckIcon color="#FFFFFF" />
                      )}
                      {step.status !== "done" && (
                        <Text
                          style={[
                            styles.progressDotNum,
                            i === currentStepIndex && styles.progressDotNumActive,
                          ]}
                        >
                          {i + 1}
                        </Text>
                      )}
                    </View>
                    {i < steps.length - 1 && (
                      <View
                        style={[
                          styles.progressLine,
                          step.status === "done" && styles.progressLineDone,
                        ]}
                      />
                    )}
                  </View>
                ))}
              </View>

              {/* Steps */}
              {steps.map((step, i) => {
                const isActive = i === currentStepIndex;
                const isDone = step.status === "done";
                const isLocked = i > currentStepIndex && !isDone;

                return (
                  <View
                    key={step.id}
                    style={[
                      styles.stepCard,
                      isDone && styles.stepCardDone,
                      isActive && styles.stepCardActive,
                      isLocked && styles.stepCardLocked,
                    ]}
                  >
                    <View style={styles.stepHeader}>
                      <View style={styles.stepHeaderLeft}>
                        <View
                          style={[
                            styles.stepNumBadge,
                            isDone && styles.stepNumBadgeDone,
                            isActive && styles.stepNumBadgeActive,
                          ]}
                        >
                          {isDone ? (
                            <CheckIcon color="#FFFFFF" />
                          ) : (
                            <Text
                              style={[
                                styles.stepNum,
                                isActive && styles.stepNumActive,
                              ]}
                            >
                              {i + 1}
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.stepTitle,
                            isDone && styles.stepTitleDone,
                            isLocked && styles.stepTitleLocked,
                          ]}
                        >
                          {step.title}
                        </Text>
                      </View>
                      {isDone && (
                        <View style={styles.donePill}>
                          <Text style={styles.donePillText}>Done</Text>
                        </View>
                      )}
                    </View>

                    {(isActive || isDone) && (
                      <Text style={[styles.stepDesc, isDone && styles.stepDescDone]}>
                        {step.description}
                      </Text>
                    )}

                    {/* Action */}
                    {isActive && !isDone && (
                      <>
                        {step.actionType === "button" && (
                          <FrictionButton
                            onPress={handleDNSReEnable}
                            label={step.action}
                          />
                        )}
                        {step.actionType === "link" && (
                          <View style={styles.actionRow}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={handleOpenSettings}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.actionButtonText}>{step.action}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.skipStepButton}
                              onPress={() => markStepDone(step.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.skipStepText}>Already done</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {step.actionType === "confirm" && (
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleVerify}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.actionButtonText}>{step.action}</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                );
              })}

              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
};

export default SelfHealScreen;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#000000" },

  // Loading
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 15, color: "#8E8E93" },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Intro card
  introCard: {
    backgroundColor: "#F9FAFB", borderRadius: 14, padding: 16, marginBottom: 20,
  },
  introTitle: { fontSize: 16, fontWeight: "700", color: "#000000", marginBottom: 6 },
  introDesc: { fontSize: 14, color: "#6B7280", lineHeight: 20 },

  // Progress row
  progressRow: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 20, paddingHorizontal: 8,
  },
  progressItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  progressDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#E5E5EA",
  },
  progressDotActive: { borderColor: "#000000", backgroundColor: "#FFFFFF" },
  progressDotDone: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  progressDotNum: { fontSize: 13, fontWeight: "700", color: "#C7C7CC" },
  progressDotNumActive: { color: "#000000" },
  progressLine: { flex: 1, height: 2, backgroundColor: "#E5E5EA", marginHorizontal: 4 },
  progressLineDone: { backgroundColor: "#22C55E" },

  // Step card
  stepCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  stepCardActive: { borderColor: "#000000" },
  stepCardDone: { borderColor: "#D1FAE5", backgroundColor: "#F0FDF4" },
  stepCardLocked: { opacity: 0.5 },

  stepHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 4,
  },
  stepHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },

  stepNumBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  stepNumBadgeActive: { backgroundColor: "#000000" },
  stepNumBadgeDone: { backgroundColor: "#22C55E" },
  stepNum: { fontSize: 13, fontWeight: "700", color: "#C7C7CC" },
  stepNumActive: { color: "#FFFFFF" },

  stepTitle: { fontSize: 15, fontWeight: "700", color: "#000000", flex: 1 },
  stepTitleDone: { color: "#16A34A" },
  stepTitleLocked: { color: "#C7C7CC" },

  donePill: {
    backgroundColor: "#D1FAE5", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  donePillText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },

  stepDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginTop: 8, marginBottom: 12 },
  stepDescDone: { color: "#4ADE80" },

  // Action buttons
  actionRow: { gap: 8 },
  actionButton: {
    backgroundColor: "#000000", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  actionButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  skipStepButton: {
    backgroundColor: "#F9FAFB", borderRadius: 12,
    paddingVertical: 12, alignItems: "center",
  },
  skipStepText: { fontSize: 14, color: "#8E8E93", fontWeight: "500" },

  // Success state
  successContainer: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32,
  },
  successIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  successTitle: {
    fontSize: 24, fontWeight: "800", color: "#000000",
    textAlign: "center", marginBottom: 12,
  },
  successScore: { flexDirection: "row", alignItems: "baseline", marginBottom: 12 },
  successScoreNum: { fontSize: 48, fontWeight: "800" },
  successScoreMax: { fontSize: 18, color: "#8E8E93", fontWeight: "500" },
  successDesc: {
    fontSize: 15, color: "#6B7280", textAlign: "center",
    lineHeight: 22, marginBottom: 32,
  },
  successButton: {
    backgroundColor: "#000000", borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 40,
    alignItems: "center", width: "100%", marginBottom: 10,
  },
  successButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  successSecondaryButton: { paddingVertical: 12, alignItems: "center" },
  successSecondaryText: { fontSize: 14, color: "#8E8E93", fontWeight: "500" },
});