import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  OnboardingQuestion: { questionNumber: number; totalQuestions: number };
  Home: undefined;
  SignIn: undefined;
};

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const ANIMATION_DURATION = 500;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const handleGetStarted = () => {
    navigation.navigate("OnboardingQuestion", {
      questionNumber: 1,
      totalQuestions: 23,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.spacer} />

          <View style={styles.bottomContent}>
            <Text style={styles.heading}>Quit Porn{"\n"}Addiction Easily</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={handleGetStarted}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  spacer: {
    flex: 1,
  },
  bottomContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#000000",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});