import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
  BackHandler,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  ResultsAnalysis: any;
  PersonalizedPlan: any;
};

type ResultsAnalysisNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ResultsAnalysis"
>;

const { width } = Dimensions.get("window");

const analysisSteps = [
  "Reviewing your responses level",
  "Optimizing your protection level",
  "Applying behavioral models (Stanford reference)",
  "Examining dependency signals",
  "Preparing your quitting setup",
];

const ProgressBar = ({ label, delay }: { label: string; delay: number }) => {
  const progress = useSharedValue(0);
  const shimmer = useSharedValue(-100);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 4500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );
    shimmer.value = withRepeat(
      withTiming(width, { duration: 2500, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value }],
  }));

  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.stepText}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.barContainer, animatedBarStyle]}>
          <LinearGradient
            colors={["#007AFF", "#FF9500"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBar}
          >
            <Animated.View style={[styles.shimmer, animatedShimmerStyle]}>
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.6)",
                  "rgba(255,255,255,0)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
};

const PulsingDots = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.pulsingDots, animatedStyle]}>
      ...
    </Animated.Text>
  );
};

const ResultsAnalysisScreen: React.FC = () => {
  const navigation = useNavigation<ResultsAnalysisNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "ResultsAnalysis">>();
  const params = route.params || {};

  useEffect(() => {
    const onBackPress = () => true;
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    const timer = setTimeout(() => {
      (navigation as any).replace("PersonalizedPlan", { ...params });
    }, 7000);

    return () => {
      clearTimeout(timer);
      backHandler.remove();
    };
  }, []);

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.heading}>Analyzing Your Results</Text>
            <PulsingDots />
          </View>

          {/* Progress Bars */}
          <View style={styles.stepsContainer}>
            {analysisSteps.map((step, index) => (
              <ProgressBar key={index} label={step} delay={index * 500} />
            ))}
          </View>

          {/* Expert Quotes */}
          <View style={styles.expertSection}>
            {/* Dr. Gabor Maté */}
            <View style={styles.quoteCard}>
              <View style={styles.expertHeader}>
                <Image
                  source={require("../assets/images/dr-gabor-mate.jpg")}
                  style={styles.photoPlaceholder}
                />
                <View style={styles.expertInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.expertName}>Dr. Gabor Mat&#233;</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>&#10003;</Text>
                    </View>
                  </View>
                  <Text style={styles.expertTitleSecondary}>
                    Canadian Physician &amp; Addiction Expert
                  </Text>
                  <Text style={styles.twitterHandle}>@drgabormate</Text>
                </View>
              </View>
              <Text style={styles.quoteText}>
                {'"'}Addiction, including pornography, is not about the
                pleasure, but discomfort and the more we escape, the less free
                we become.{'"'}
              </Text>
            </View>

            {/* Dr. Philip Zimbardo */}
            <View style={styles.quoteCard}>
              <View style={styles.expertHeader}>
                <Image
                  source={require("../assets/images/dr-philip-zimbardo.jpg")}
                  style={styles.photoPlaceholder}
                />
                <View style={styles.expertInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.expertName}>Dr. Philip Zimbardo</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>&#10003;</Text>
                    </View>
                  </View>
                  <Text style={styles.expertTitleSecondary}>
                    American Psychologist
                  </Text>
                </View>
              </View>
              <Text style={styles.quoteText}>
                {'"'}Excess use of pornography can rewire the brain{"'"}s reward
                system, weaken self-control{'"'}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              We{"'"}re measuring using science and addiction research to build
              your self-control
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ResultsAnalysisScreen;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "column",
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    fontFamily: "System",
  },
  pulsingDots: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    marginTop: -8,
  },
  stepsContainer: {
    marginBottom: 16,
  },
  stepWrapper: {
    marginBottom: 16,
  },
  stepText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  track: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barContainer: {
    height: "100%",
  },
  gradientBar: {
    flex: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: 200,
  },
  expertSection: {
    gap: 12,
    marginBottom: 16,
  },
  quoteCard: {
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  expertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  photoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  expertInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  expertName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  expertTitleSecondary: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },
  twitterHandle: {
    fontSize: 11,
    color: "#007AFF",
    marginTop: 1,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
    fontStyle: "italic",
    fontWeight: "400",
  },
  footerContainer: {
    alignItems: "center",
    paddingBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    lineHeight: 18,
    width: "90%",
  },
});
