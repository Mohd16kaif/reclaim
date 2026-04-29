import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type RootStackParamList = { CompanionScreen: any; AlwaysOnBlocking: any; };
type CompanionScreenNavigationProp = StackNavigationProp<RootStackParamList, "CompanionScreen">;
const { width } = Dimensions.get("window");
const CompanionScreen: React.FC = () => {
  const navigation = useNavigation<CompanionScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "CompanionScreen">>();
  const params = route.params || {};
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const subheaderOpacity = useRef(new Animated.Value(0)).current;
  const phoneScale = useRef(new Animated.Value(0.95)).current;
  const phoneOpacity = useRef(new Animated.Value(0)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(subheaderOpacity, { toValue: 1, duration: 600, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([Animated.delay(400), Animated.parallel([
        Animated.timing(phoneScale, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
        Animated.timing(phoneOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ])]),
      Animated.sequence([Animated.delay(800), Animated.timing(bodyOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
    ]).start();
  }, []);
  const handleButtonPress = () => { (navigation as any).navigate("AlwaysOnBlocking", { ...params }); };
  const handleButtonPressIn = () => { Animated.timing(buttonScale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start(); };
  const handleButtonPressOut = () => { Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }).start(); };
  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Animated.Text style={[styles.heading, { opacity: headerOpacity }]}>A Companion on Your Journey</Animated.Text>
            <Animated.Text style={[styles.subheading, { opacity: subheaderOpacity }]}>Support that stays with you through difficult moments</Animated.Text>
          </View>
          <View style={styles.phoneSection}>
            <Animated.View style={[styles.phoneContainer, { opacity: phoneOpacity, transform: [{ scale: phoneScale }] }]}>
              <Image source={require("../assets/images/companion-on-your-journey.png")} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
            </Animated.View>
          </View>
          <View style={styles.footerSection}>
            <Animated.View style={[styles.bodySection, { opacity: bodyOpacity }]}>
              <Text style={styles.bodyText}>Reclaim supports you as you regain control.</Text>
            </Animated.View>
            <View style={styles.buttonContainer}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity style={styles.ctaButton} onPress={handleButtonPress} onPressIn={handleButtonPressIn} onPressOut={handleButtonPressOut} activeOpacity={0.9}>
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
  fullScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, justifyContent: "space-between" },
  headerSection: { marginBottom: 32 },
  heading: { fontSize: 32, fontWeight: "800", color: "#000000", marginBottom: 8, lineHeight: 38, textAlign: "left" },
  subheading: { fontSize: 17, fontWeight: "400", color: "#666666", lineHeight: 24, textAlign: "left" },
  phoneSection: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 24 },
  phoneContainer: { width: width * 0.54, aspectRatio: 0.5 },
  footerSection: { width: "100%", paddingBottom: 8 },
  bodySection: { marginBottom: 24, paddingHorizontal: 20 },
  bodyText: { fontSize: 15, fontWeight: "400", color: "#333333", textAlign: "center", lineHeight: 22 },
  buttonContainer: { marginBottom: 8 },
  ctaButton: { backgroundColor: "#000000", paddingVertical: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 20, fontWeight: "600" },
});
