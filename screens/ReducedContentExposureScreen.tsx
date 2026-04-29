import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type RootStackParamList = { ReducedContentExposure: any; BuiltForConsistency: any; };
type ScreenNavigationProp = StackNavigationProp<RootStackParamList, "ReducedContentExposure">;
const { width } = Dimensions.get("window");
const ReducedContentExposureScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "ReducedContentExposure">>();
  const params = route.params || {};
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const phoneScale = useRef(new Animated.Value(0.95)).current;
  const phoneOpacity = useRef(new Animated.Value(0)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([Animated.delay(400), Animated.parallel([
        Animated.timing(phoneScale, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
        Animated.timing(phoneOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ])]),
      Animated.sequence([Animated.delay(800), Animated.timing(bodyOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
    ]).start();
  }, []);
  const handleNextPress = () => { (navigation as any).navigate("BuiltForConsistency", { ...params }); };
  const handleButtonPressIn = () => { Animated.timing(buttonScale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start(); };
  const handleButtonPressOut = () => { Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }).start(); };
  const handleBackPress = () => { navigation.goBack(); };
  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <Animated.View style={{ opacity: headerOpacity }}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
          </Animated.View>
          <View style={styles.phoneSection}>
            <Animated.View style={[styles.phoneContainer, { opacity: phoneOpacity, transform: [{ scale: phoneScale }] }]}>
              <Image source={require("../assets/images/reduced-content-exposure.png")} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
            </Animated.View>
          </View>
          <Animated.View style={[styles.footerSection, { opacity: bodyOpacity }]}>
            <Text style={styles.heading}>Reduced Content Exposure</Text>
            <View style={styles.bodySection}><Text style={styles.bodyText}>Filters limit adult and suggestive content inside social and media platforms.</Text></View>
            <View style={styles.buttonContainer}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity style={styles.ctaButton} onPress={handleNextPress} onPressIn={handleButtonPressIn} onPressOut={handleButtonPressOut} activeOpacity={0.9}>
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
export default ReducedContentExposureScreen;
const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F7F7F7", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  backArrow: { fontSize: 20, color: "#000000", fontWeight: "600" },
  phoneSection: { flex: 1, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  phoneContainer: { width: width * 0.54, aspectRatio: 0.5 },
  footerSection: { width: "100%", paddingBottom: 8, alignItems: "center" },
  heading: { fontSize: 28, fontWeight: "800", color: "#000000", lineHeight: 34, textAlign: "center", marginBottom: 12 },
  bodySection: { marginBottom: 32, paddingHorizontal: 20 },
  bodyText: { fontSize: 15, fontWeight: "400", color: "#666666", textAlign: "center", lineHeight: 22 },
  buttonContainer: { width: "100%", marginBottom: 8 },
  ctaButton: { backgroundColor: "#000000", paddingVertical: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 20, fontWeight: "600" },
});
