import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  OnboardingCarousel: any;
  Home: any;
};

type OnboardingCarouselNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OnboardingCarousel"
>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  heading: string;
  body: string;
  emoji: string;
  image?: any; // Added optional image support
  gradientColors: readonly [string, string, ...string[]];
}

const onboardingData: OnboardingSlide[] = [
  {
    id: "1",
    heading: "Porn Affects the Brain",
    body: "Frequent porn use trains the brain to expect intense pleasure. Over time, normal activities may feel less rewarding, affecting focus and self-control.",
    emoji: "🧠",
    image: require("../assets/images/brain.png"),
    gradientColors: ["#FF1744", "#D50000"] as const, // Added 'as const'
  },
  {
    id: "2",
    heading: "Porn Impacts Relationships",
    body: "Porn can change how intimacy and connection are viewed. This may reduce emotional closeness and make real relationships feel less satisfying.",
    emoji: "💔",
    gradientColors: ["#FF1744", "#D50000"] as const,
  },
  {
    id: "3",
    heading: "Porn Can Lower Sexual Drive",
    body: "Constant artificial stimulation can weaken natural desire. Real-life intimacy may start to feel less engaging or harder to enjoy.",
    emoji: "🔋",
    gradientColors: ["#FF1744", "#D50000"] as const,
  },
  {
    id: "4",
    heading: "Porn lead to unhappiness",
    body: "Porn offer short-term relief but not lasting happiness. Many people feel less motivated or emotionally low afterward.",
    emoji: "😔",
    gradientColors: ["#FF1744", "#D50000"] as const,
  },
  {
    id: "5",
    heading: "Control Can Be Rebuilt",
    body: "With the right tools and boundaries, it becomes easier to manage urges. Small changes over time can restore balance and self-control.",
    emoji: "⛓️‍💥",
    gradientColors: ["#1976D2", "#0D47A1"] as const,
  },
];

const OnboardingCarouselScreen = () => {
  const navigation = useNavigation<OnboardingCarouselNavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Navigate to the next screen after onboarding
      navigation.navigate("Home" as any);
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradientColors}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={styles.content}>
            {/* Logo Header */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>RECLAIM</Text>
            </View>

            {/* Illustration Placeholder */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationPlaceholder}>
                {item.image ? (
                  <Image 
                    source={item.image} 
                    style={styles.illustrationImage} 
                    resizeMode="contain" 
                  />
                ) : (
                  <Text style={styles.placeholderEmoji}>{item.emoji}</Text>
                )}
              </View>
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.heading}>{item.heading}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {onboardingData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.activeDot,
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
              <Text style={styles.nextButtonText}>
                {currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
              </Text>
            </TouchableOpacity>

            {/* Bottom Safe Area Indicator */}
            <View style={styles.bottomIndicator} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />
    </View>
  );
};

export default OnboardingCarouselScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF1744",
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
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
    paddingTop: 20,
    alignItems: "center",
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
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: "#FFFFFF",
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
  bottomIndicator: {
    width: 134,
    height: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    marginBottom: 8,
  },
});