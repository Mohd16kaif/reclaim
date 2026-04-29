import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, BackHandler, Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type RootStackParamList = { ResultsAnalysis: any; PersonalizedPlan: any; };
type ResultsAnalysisNavigationProp = StackNavigationProp<RootStackParamList, "ResultsAnalysis">;
const { width } = Dimensions.get("window");
const analysisSteps = ["Reviewing your responses level","Optimizing your protection level","Applying behavioral models (Stanford reference)","Examining dependency signals","Preparing your quitting setup"];
const ProgressBar = ({ label, delay }: { label: string; delay: number }) => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 1500, delay, useNativeDriver: false }).start();
  }, []);
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.stepText}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.barContainer, { width: barWidth }]}>
          <LinearGradient colors={["#007AFF", "#FF9500"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBar} />
        </Animated.View>
      </View>
    </View>
  );
};
const PulsingDots = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.Text style={[styles.pulsingDots, { opacity }]}>...</Animated.Text>;
};
const ResultsAnalysisScreen: React.FC = () => {
  const navigation = useNavigation<ResultsAnalysisNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "ResultsAnalysis">>();
  const params = route.params || {};
  useEffect(() => {
    const onBackPress = () => true;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    const timer = setTimeout(() => { (navigation as any).replace("PersonalizedPlan", { ...params }); }, 7000);
    return () => { clearTimeout(timer); backHandler.remove(); };
  }, []);
  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.heading}>Analyzing Your Results</Text>
            <PulsingDots />
          </View>
          <View style={styles.stepsContainer}>
            {analysisSteps.map((step, index) => <ProgressBar key={index} label={step} delay={index * 500} />)}
          </View>
          <View style={styles.expertSection}>
            <View style={styles.quoteCard}>
              <View style={styles.expertHeader}>
                <Image source={require("../assets/images/dr-gabor-mate.jpg")} style={styles.photoPlaceholder} />
                <View style={styles.expertInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.expertName}>Dr. Gabor Mat&#233;</Text>
                    <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>&#10003;</Text></View>
                  </View>
                  <Text style={styles.expertTitleSecondary}>Canadian Physician &amp; Addiction Expert</Text>
                  <Text style={styles.twitterHandle}>@drgabormate</Text>
                </View>
              </View>
              <Text style={styles.quoteText}>{'"'}Addiction, including pornography, is not about the pleasure, but discomfort and the more we escape, the less free we become.{'"'}</Text>
            </View>
            <View style={styles.quoteCard}>
              <View style={styles.expertHeader}>
                <Image source={require("../assets/images/dr-philip-zimbardo.jpg")} style={styles.photoPlaceholder} />
                <View style={styles.expertInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.expertName}>Dr. Philip Zimbardo</Text>
                    <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>&#10003;</Text></View>
                  </View>
                  <Text style={styles.expertTitleSecondary}>American Psychologist</Text>
                </View>
              </View>
              <Text style={styles.quoteText}>{'"'}Excess use of pornography can rewire the brain{"'"}s reward system, weaken self-control{'"'}</Text>
            </View>
          </View>
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>We{"'"}re measuring using science and addiction research to build your self-control</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};
export default ResultsAnalysisScreen;
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16, justifyContent: "space-between" },
  header: { flexDirection: "column", marginBottom: 20 },
  heading: { fontSize: 28, fontWeight: "800", color: "#000000" },
  pulsingDots: { fontSize: 28, fontWeight: "800", color: "#000000", marginTop: -8 },
  stepsContainer: { marginBottom: 16 },
  stepWrapper: { marginBottom: 16 },
  stepText: { fontSize: 15, fontWeight: "600", color: "#000000", marginBottom: 8 },
  track: { height: 8, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden" },
  barContainer: { height: "100%" },
  gradientBar: { flex: 1, borderRadius: 4 },
  expertSection: { gap: 12, marginBottom: 16 },
  quoteCard: { backgroundColor: "#F3F3F3", borderRadius: 8, padding: 16 },
  expertHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  photoPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F2F2F7" },
  expertInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  expertName: { fontSize: 17, fontWeight: "700", color: "#000000" },
  verifiedBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#007AFF", alignItems: "center", justifyContent: "center" },
  verifiedText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  expertTitleSecondary: { fontSize: 13, color: "#666666", fontWeight: "500" },
  twitterHandle: { fontSize: 11, color: "#007AFF", marginTop: 1 },
  quoteText: { fontSize: 14, lineHeight: 20, color: "#333333", fontStyle: "italic" },
  footerContainer: { alignItems: "center", paddingBottom: 12 },
  footerText: { fontSize: 13, color: "#666666", textAlign: "center", lineHeight: 18, width: "90%" },
});
