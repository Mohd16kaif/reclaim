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

// TypeScript types for navigation
type RootStackParamList = {
  AlwaysOnBlocking: any;
  Home: any;
};

type ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AlwaysOnBlocking"
>;

const { width } = Dimensions.get("window");

const AlwaysOnBlockingScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "AlwaysOnBlocking">>();
  const params = route.params || {};
  
  // Animation values
  const headerOpacity = useSharedValue(0); // For back button
  const phoneScale = useSharedValue(0.95);
  const phoneOpacity = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Fade in sequence
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    
    phoneScale.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.1)) }));
    phoneOpacity.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    
    bodyOpacity.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [headerOpacity, phoneScale, phoneOpacity, bodyOpacity]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
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

  const handleNextPress = () => {
    (navigation as any).navigate("ReducedContentExposure", { ...params });
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withTiming(0.96, { duration: 100 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          {/* 1. Back Arrow Button - standalone top-left */}
          <Animated.View style={[headerAnimatedStyle]}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* 2. Illustration */}
          <View style={styles.phoneSection}>
            <Animated.View style={[styles.phoneContainer, phoneAnimatedStyle]}>
              <Image
                source={require("../assets/images/always-on-blocking.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* 3 & 4. Heading and Body Text - below phone, centered */}
          <Animated.View style={[styles.footerSection, bodyAnimatedStyle]}>
            <Text style={styles.heading}>Always-On Blocking</Text>
            <View style={styles.bodySection}>
              <Text style={styles.bodyText}>
                Porn sites, explicit images, and adult content are rigorously blocked across browsers and apps.
              </Text>
            </View>

            {/* 5. NEXT Button - at bottom */}
            <View style={styles.buttonContainer}>
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={handleNextPress}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.9}
                >
                  <Text style={styles.buttonText}>NEXT</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default AlwaysOnBlockingScreen;

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
    paddingTop: 10,
    paddingBottom: 16,
    // Removed justifyContent: "space-between" to use natural flow
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  backArrow: {
    fontSize: 20,
    color: "#000000",
    fontWeight: "600",
  },
  phoneSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20, // Space between phone and heading
  },
  phoneContainer: {
    width: width * 0.54, // Changed from 0.7 to 0.54
    aspectRatio: 0.5,
  },
  footerSection: {
    width: "100%",
    paddingBottom: 8,
    alignItems: "center", // Center heading and body text
  },
heading: {
  fontSize: 28,
  fontWeight: "800",
  color: "#000000",
  fontFamily: "System",
  lineHeight: 34,
  textAlign: "center",
  marginBottom: 12,
},
  bodySection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#666666",
    fontFamily: "System",
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
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
