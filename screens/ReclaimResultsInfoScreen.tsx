import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { G, Line, Path, Text as SvgText } from "react-native-svg";

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
  StressFrequency: {
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
    selectedFrequency?: string;
  };
  SessionDuration: {
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
    selectedFrequency?: string;
  };
  ReclaimResultsInfo: {
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
    selectedFrequency?: string;
    selectedDuration?: string;
  };
  ContentEscalation: {
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
    selectedFrequency?: string;
    selectedDuration?: string;
  };
  Home: undefined;
  SignIn: undefined;
};

type ReclaimResultsInfoNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReclaimResultsInfo"
>;

type ReclaimResultsInfoRouteProp = RouteProp<
  RootStackParamList,
  "ReclaimResultsInfo"
>;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;
const GRAPH_WIDTH = 300;
const GRAPH_HEIGHT = 150;
const GRAPH_PADDING = 20;
const GRAPH_INNER_WIDTH = GRAPH_WIDTH - GRAPH_PADDING * 2;
const GRAPH_INNER_HEIGHT = GRAPH_HEIGHT - GRAPH_PADDING * 2;

// Create animated path component
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ReclaimResultsInfoScreen: React.FC = () => {
  const navigation = useNavigation<ReclaimResultsInfoNavigationProp>();
  const route = useRoute<ReclaimResultsInfoRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Animation values for line drawing
  const redLineAnim = useRef(new Animated.Value(0)).current;
  const darkLineAnim = useRef(new Animated.Value(0)).current;

  const questionNumber = route.params?.questionNumber ?? 12;
  const totalQuestions =
    route.params?.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;
  const userName = route.params?.userName ?? "";
  const selectedGender = route.params?.selectedGender ?? "";
  const dateOfBirth = route.params?.dateOfBirth ?? "";
  const selectedPlatform = route.params?.selectedPlatform ?? "";
  const selectedMood = route.params?.selectedMood ?? "";
  const selectedReason = route.params?.selectedReason ?? "";
  const selectedAttempt = route.params?.selectedAttempt ?? "";
  const selectedAge = route.params?.selectedAge ?? "";
  const selectedFrequency = route.params?.selectedFrequency ?? "";
  const selectedDuration = route.params?.selectedDuration ?? "";

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

  // Generate path data for "Without Reclaim" (red line - dips down then curves up sharply)
  const generateRedLinePath = () => {
    const startX = GRAPH_PADDING;
    const startY = GRAPH_PADDING + 30; // Start position
    const endX = GRAPH_WIDTH - GRAPH_PADDING;
    const endY = GRAPH_PADDING + 10; // End HIGHER than start (shows increase)
    
    // Valley point in the middle (dips down)
    const valleyX = startX + GRAPH_INNER_WIDTH * 0.45;
    const valleyY = GRAPH_PADDING + 55; // Dips below starting point
    
    // Cubic Bézier: start -> valley (first curve going down)
    const cp1X = startX + GRAPH_INNER_WIDTH * 0.15;
    const cp1Y = startY + 5;
    const cp2X = valleyX - 30;
    const cp2Y = valleyY;
    
    // Cubic Bézier: valley -> end (second curve going up sharply)
    const cp3X = valleyX + 30;
    const cp3Y = valleyY;
    const cp4X = endX - 40;
    const cp4Y = endY - 5;
    
    return `M ${startX} ${startY} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${valleyX} ${valleyY} C ${cp3X} ${cp3Y} ${cp4X} ${cp4Y} ${endX} ${endY}`;
  };

  // Generate path data for "With Reclaim" (dark line - exponential decay curve)
  const generateDarkLinePath = () => {
    const startX = GRAPH_PADDING;
    const startY = GRAPH_PADDING + 30; // Same start position as red line
    const endX = GRAPH_WIDTH - GRAPH_PADDING;
    const endY = GRAPH_HEIGHT - GRAPH_PADDING - 5; // End near bottom
    
    // Cubic Bézier for exponential decay: steep decline that gradually flattens
    // Control points positioned to create steep initial drop then gradual flattening
    const cp1X = startX + GRAPH_INNER_WIDTH * 0.25;
    const cp1Y = startY + 60; // Pull down steeply at start
    const cp2X = startX + GRAPH_INNER_WIDTH * 0.4;
    const cp2Y = endY - 10; // Already near bottom by middle
    
    return `M ${startX} ${startY} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY}`;
  };

  const redLinePath = generateRedLinePath();
  const darkLinePath = generateDarkLinePath();

  // Calculate path lengths (approximate for Bézier curves)
  const redPathLength = 280; // Approximate length for wavy Bézier curve
  const darkPathLength = 320; // Approximate length for smooth decay curve

  useEffect(() => {
    // Animate red line first (strokeDashoffset from pathLength to 0)
    Animated.timing(redLineAnim, {
      toValue: redPathLength,
      duration: 1800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Animate dark line after delay
    setTimeout(() => {
      Animated.timing(darkLineAnim, {
        toValue: darkPathLength,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }, 300);
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    // Navigate to ContentEscalation screen (question 13)
    navigation.navigate("ContentEscalation", {
      questionNumber: 13,
      totalQuestions: totalQuestions,
      userName: userName,
      selectedGender: selectedGender,
      dateOfBirth: dateOfBirth,
      selectedPlatform: selectedPlatform,
      selectedMood: selectedMood,
      selectedReason: selectedReason,
      selectedAttempt: selectedAttempt,
      selectedAge: selectedAge,
      selectedFrequency: selectedFrequency,
      selectedDuration: selectedDuration,
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Calculate strokeDashoffset for animation (from pathLength to 0)
  const redLineDashoffset = redLineAnim.interpolate({
    inputRange: [0, redPathLength],
    outputRange: [redPathLength, 0],
  });

  const darkLineDashoffset = darkLineAnim.interpolate({
    inputRange: [0, darkPathLength],
    outputRange: [darkPathLength, 0],
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
            Reclaim Creates long term result
          </Text>

          {/* Graph Section */}
          <View style={styles.graphContainer}>
            <Text style={styles.graphTitle}>Porn watch time</Text>
            
            <View style={styles.graphWrapper}>
              <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
                {/* Grid lines */}
                <G>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Line
                      key={`grid-${i}`}
                      x1={GRAPH_PADDING}
                      y1={GRAPH_PADDING + (GRAPH_INNER_HEIGHT / 4) * i}
                      x2={GRAPH_WIDTH - GRAPH_PADDING}
                      y2={GRAPH_PADDING + (GRAPH_INNER_HEIGHT / 4) * i}
                      stroke="#E5E5E5"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  ))}
                </G>

                {/* Red line - "Without Reclaim" */}
                <AnimatedPath
                  d={redLinePath}
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={`${redPathLength}`}
                  strokeDashoffset={redLineDashoffset}
                  strokeLinecap="round"
                />

                {/* Dark line - "With Reclaim" */}
                <AnimatedPath
                  d={darkLinePath}
                  stroke="#000000"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={`${darkPathLength}`}
                  strokeDashoffset={darkLineDashoffset}
                  strokeLinecap="round"
                />

                {/* Label for "Without Reclaim" - positioned at end of red line (top right) */}
                <SvgText
                  x={GRAPH_WIDTH - GRAPH_PADDING - 260}
                  y={GRAPH_PADDING + 15}
                  fontSize="9"
                  fill="#EF4444"
                  textAnchor="start"
                >
                  Without Reclaim
                </SvgText>

                {/* Label for "With Reclaim" - positioned at start of black line (top left) */}
                <SvgText
                  x={GRAPH_PADDING}
                  y={GRAPH_HEIGHT - GRAPH_PADDING - 15}
                  fontSize="9"
                  fill="#000000"
                  textAnchor="start"
                >
                  With Reclaim
                </SvgText>

                {/* X-axis labels */}
                <SvgText
                  x={GRAPH_PADDING}
                  y={GRAPH_HEIGHT - 2}
                  fontSize="11"
                  fontWeight="500"
                  fill="#333333"
                >
                  Day 1
                </SvgText>
                <SvgText
                  x={GRAPH_WIDTH - GRAPH_PADDING - 35}
                  y={GRAPH_HEIGHT - 2}
                  fontSize="11"
                  fontWeight="500"
                  fill="#333333"
                >
                  Day 30
                </SvgText>
              </Svg>
            </View>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Many <Text style={styles.boldText}>Reclaim</Text> users experience up to a{" "}
            <Text style={styles.highlightedText}>90%</Text> reduction in porn urges within the{" "}
            <Text style={styles.highlightedText}>first 24 hours</Text>.
          </Text>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsText}>3,452 hours saved with Reclaim</Text>
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

export default ReclaimResultsInfoScreen;

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
    textAlign: "center",
  },
  graphContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 12,
  },
  graphWrapper: {
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: "#000000",
  },
  highlightedText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  statsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
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

