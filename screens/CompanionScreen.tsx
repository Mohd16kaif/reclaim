import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  CompanionScreen: any;
  MainRecoveryFlow: any;
};

type CompanionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CompanionScreen"
>;

const { width } = Dimensions.get("window");

const CompanionScreen: React.FC = () => {
  const navigation = useNavigation<CompanionScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "CompanionScreen">>();
  const params = route.params || {};
  // Animation values
  const headerOpacity = useSharedValue(0);
  const subheaderOpacity = useSharedValue(0);
  const phoneScale = useSharedValue(0.95);
  const phoneOpacity = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Fade in sequence
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    subheaderOpacity.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    
    phoneScale.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.1)) }));
    phoneOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    
    bodyOpacity.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const subheaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subheaderOpacity.value,
  }));

  const phoneAnimatedStyle = useAnimatedStyle(() => ({
    opacity: phoneOpacity.value,
    transform: [{ scale: phoneScale.value }],
  }));

  const bodyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPress = () => {
    (navigation as any).navigate("AlwaysOnBlocking", {
      ...params,
    });
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withTiming(0.96, { duration: 100 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Animated.Text style={[styles.heading, headerAnimatedStyle]}>
              A Companion on Your Journey
            </Animated.Text>
            <Animated.Text style={[styles.subheading, subheaderAnimatedStyle]}>
              Support that stays with you through difficult moments
            </Animated.Text>
          </View>

          {/* Illustration */}
          <View style={styles.phoneSection}>
            <Animated.View style={[styles.phoneContainer, phoneAnimatedStyle]}>
              <Image
                source={require("../assets/images/companion-on-your-journey.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Footer Section (Body + Button) */}
          <View style={styles.footerSection}>
            {/* Body Text Section */}
            <Animated.View style={[styles.bodySection, bodyAnimatedStyle]}>
              <Text style={styles.bodyText}>
               Reclaim supports you as you regain control.
              </Text>
            </Animated.View>

            {/* CTA Button */}
            <View style={styles.buttonContainer}>
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={handleButtonPress}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.9}
                >
                  <Text style={styles.buttonText}>Start my journey</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default CompanionScreen;

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
    paddingTop: 20,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  headerSection: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000000",
    fontFamily: "System",
    marginBottom: 8,
    lineHeight: 38,
    textAlign: "left",
  },
  subheading: {
    fontSize: 17,
    fontWeight: "400",
    color: "#666666",
    fontFamily: "System",
    lineHeight: 24,
    textAlign: "left",
  },
  phoneSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  phoneContainer: {
    width: width * 0.54,
    aspectRatio: 0.5,
  },
  footerSection: {
    width: "100%",
    paddingBottom: 8,
  },
  bodySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#333333",
    fontFamily: "System",
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: 8,
  },
  ctaButton: {
    backgroundColor: "#000000",
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "System",
  },
});
