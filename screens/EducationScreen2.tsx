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
  EducationScreen2: any;
  EducationScreen3: any;
};

type EducationScreen2NavigationProp = StackNavigationProp<RootStackParamList>;

const EducationScreen2: React.FC = () => {
  const navigation = useNavigation<EducationScreen2NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "EducationScreen2">>();
  const params = route.params || {};

  // Animation Logic
  const dotAnimations = useRef([0, 1, 2, 3, 4].map((index) => ({
    width: new Animated.Value(index === 0 ? 28 : 10), // Dot 0 starts as Active
    opacity: new Animated.Value(index === 0 ? 1 : 0.4),
  }))).current;

  useEffect(() => {
    Animated.parallel([
      // Animate current dot (1) to active
      Animated.timing(dotAnimations[1].width, {
        toValue: 28,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(dotAnimations[1].opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      // Animate previous dot (0) to inactive
      Animated.timing(dotAnimations[0].width, {
        toValue: 10,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(dotAnimations[0].opacity, {
        toValue: 0.4,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    navigation.navigate("EducationScreen3" as any, params);
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
                source={require("../assets/images/arguing_couple.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.heading}>Porn Impacts Relationships</Text>
              <Text style={styles.body}>
                Porn can change how intimacy and connection are viewed. This may reduce emotional closeness and make real relationships feel less satisfying.
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

export default EducationScreen2;

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
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  activeDot: {
    width: 28,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
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