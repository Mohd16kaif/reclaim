import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  EducationScreen1: any;
  EducationScreen2: any;
};

type EducationScreen1NavigationProp = StackNavigationProp<RootStackParamList>;

const EducationScreen1: React.FC = () => {
  const navigation = useNavigation<EducationScreen1NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "EducationScreen1">>();
  const params = route.params || {};

  // Create animated values for each dot
  const dotAnimations = useRef([0, 1, 2, 3, 4].map(() => ({
    width: new Animated.Value(8),
    opacity: new Animated.Value(0.4),
  }))).current;

  useEffect(() => {
    // Animate the active dot (index 0)
    Animated.parallel([
      Animated.timing(dotAnimations[0].width, {
        toValue: 24,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(dotAnimations[0].opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    navigation.navigate("EducationScreen2" as any, params);
  };

  return (
    <View style={styles.container}>
<LinearGradient
  colors={["#F5F5F5", "#E0E0E0"] as const}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={styles.gradientBackground}
>

        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.content}>
            {/* Logo Header */}
            <View style={styles.logoContainer}>
              <Image 
                source={require("../assets/images/reclaim-header-logo.png")} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
            </View>

            {/* Illustration Placeholder */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationPlaceholder}>
                <Image 
                  source={require("../assets/images/brain.png")} 
                  style={styles.illustrationImage} 
                  resizeMode="contain" 
                />
              </View>
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.heading}>Porn Affects the Brain</Text>
              <Text style={styles.body}>
                Frequent porn use trains the brain to expect intense pleasure. Over time, normal activities may feel less rewarding, affecting focus and self-control.
              </Text>
            </View>

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {[0, 1, 2, 3, 4].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotAnimations[index].width,
                      opacity: dotAnimations[index].opacity,
                      backgroundColor: "#212121",
                    },
                  ]}
                />
              ))}
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>


          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default EducationScreen1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF1744",
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
logoContainer: {
    paddingTop: 0,
    marginTop: -50,
    alignItems: "center",
  },
  logoImage: {
    width: 720,
    height: 240,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 100,
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  illustrationImage: {
    width: 140,
    height: 140,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#212121",
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: "#424242",
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.95,
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#212121",
  },
  nextButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "700",
  },

});