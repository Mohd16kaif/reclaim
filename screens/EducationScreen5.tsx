import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RootStackParamList = {
  EducationScreen5: any;
  CompanionScreen: any;
};

type EducationScreen5NavigationProp = StackNavigationProp<
  RootStackParamList,
  "EducationScreen5"
>;

const EducationScreen5: React.FC = () => {
  const navigation = useNavigation<EducationScreen5NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "EducationScreen5">>();
  const params = route.params || {};

  // Pagination animation
  const dotAnimations = useRef(
    [0, 1, 2, 3, 4].map((index) => ({
      width: new Animated.Value(index === 3 ? 28 : 10),
      opacity: new Animated.Value(index === 3 ? 1 : 0.4),
    }))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dotAnimations[4].width, {
        toValue: 28,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(dotAnimations[4].opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(dotAnimations[3].width, {
        toValue: 10,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(dotAnimations[3].opacity, {
        toValue: 0.4,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    navigation.navigate("CompanionScreen" as any, params);
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

            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../assets/images/breaking_chains.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.heading}>Control Can Be Rebuilt</Text>
              <Text style={styles.body}>
                With the right tools and boundaries, it becomes easier to manage
                urges. Small changes over time can restore balance and
                self-control.
              </Text>
            </View>

            {/* Pagination */}
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

export default EducationScreen5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
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

  /* Header (same as Screen 4) */
  logoContainer: {
    paddingTop: 0,
    marginTop: -50,
    alignItems: "center",
  },
  logoImage: {
    width: 720,
    height: 240,
  },

  illustrationContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  illustration: {
    width: SCREEN_WIDTH * 0.85,
    height: "100%",
  },

  textContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 24,
  },

  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  nextButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonText: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
});
