import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useRef, useState } from "react";
import { Alert, Animated, Dimensions, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type RootStackParamList = { LeaveRating: any; GrantPermissions: any; };
type ScreenNavigationProp = StackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get("window");
const REVIEWS = [
  { id: 1, name: "Michael R.", initials: "MR", color: "#E0F2FE", textColor: "#0369A1", text: "The panic button feature is a game changer. It really helps de-escalate the urge significantly." },
  { id: 2, name: "Sarah Jenkins", initials: "SJ", color: "#FCE7F3", textColor: "#BE185D", text: "Finally an app that understands the science behind addiction. The educational content is superb." },
  { id: 3, name: "David K.", initials: "DK", color: "#DCFCE7", textColor: "#15803D", text: "30 days clean thanks to Reclaim. The daily check-ins keep me accountable." },
];
const ReviewCard = ({ review }: { review: typeof REVIEWS[0] }) => (
  <View style={styles.cardContainer}>
    <View style={styles.cardHeader}>
      <View style={[styles.avatar, { backgroundColor: review.color }]}>
        <Text style={[styles.avatarText, { color: review.textColor }]}>{review.initials}</Text>
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{review.name}</Text>
          <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
        </View>
        <Text style={styles.stars}>★★★★★</Text>
      </View>
    </View>
    <Text style={styles.reviewText}>"{review.text}"</Text>
  </View>
);
const LeaveRatingScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "LeaveRating">>();
  const params = route.params || {};
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const starScales = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];
  const animateStar = (index: number, toValue: number) => {
    Animated.spring(starScales[index], { toValue, useNativeDriver: true, damping: 10, stiffness: 100 }).start();
  };
  const handleMaybeLaterPress = () => { navigation.navigate("GrantPermissions" as any, params); };
  const handleBackPress = () => { navigation.goBack(); };
  const handleStarPress = (rating: number) => {
    setSelectedRating(rating);
    setTimeout(() => {
      Alert.alert("Thank You! 🙏", "We're redirecting you to leave a review on the App Store.", [
        { text: "Cancel", style: "cancel", onPress: () => navigation.navigate("GrantPermissions" as any, params) },
        { text: "Continue", onPress: () => {
          Linking.openURL('https://apps.apple.com/app/your-app-id').catch(() => Alert.alert("Error", "Could not open App Store"));
          setTimeout(() => { navigation.navigate("GrantPermissions" as any, params); }, 1000);
        }},
      ]);
    }, 500);
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Leave us a rating</Text>
          <Text style={styles.subtitle}>Your feedback helps us improve and support others starting their journey.</Text>
        </View>
        <View style={styles.starRatingContainer}>
          <Text style={styles.ratingPrompt}>Tap to rate your experience</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoveredStar || selectedRating);
              return (
                <TouchableOpacity key={star} onPress={() => handleStarPress(star)}
                  onPressIn={() => { setHoveredStar(star); animateStar(star - 1, 1.3); }}
                  onPressOut={() => { setHoveredStar(0); animateStar(star - 1, 1); }}
                  activeOpacity={0.7} style={styles.starButton}>
                  <Animated.Text style={[styles.starIcon, { transform: [{ scale: starScales[star - 1] }] }]}>
                    {isFilled ? "★" : "☆"}
                  </Animated.Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedRating > 0 && (
            <Text style={styles.ratingFeedback}>
              {selectedRating === 5 ? "Amazing! Thank you! 🎉" : selectedRating === 4 ? "Great! We appreciate it! 💙" : selectedRating === 3 ? "Thanks for your feedback! 🙏" : "We'd love to improve. Contact us! 💬"}
            </Text>
          )}
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.reviewsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>What others are saying</Text>
          {REVIEWS.map((review) => <ReviewCard key={review.id} review={review} />)}
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Every shared experience helps improve Reclaim.</Text>
          <TouchableOpacity style={styles.maybeLaterButton} onPress={handleMaybeLaterPress} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};
export default LeaveRatingScreen;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, alignItems: "center", marginBottom: 12 },
  backButton: { alignSelf: "flex-start", width: 44, height: 44, justifyContent: "center", marginBottom: 12 },
  backArrow: { fontSize: 24, color: "#000000", fontWeight: "600" },
  heading: { fontSize: 28, fontWeight: "800", color: "#000000", textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#666666", textAlign: "center", lineHeight: 24, maxWidth: "90%" },
  starRatingContainer: { paddingVertical: 24, paddingHorizontal: 24, alignItems: "center", backgroundColor: "#F9FAFB", marginHorizontal: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: "#F3F4F6" },
  ratingPrompt: { fontSize: 14, color: "#6B7280", marginBottom: 16, fontWeight: "500" },
  starsRow: { flexDirection: "row", gap: 12 },
  starButton: { padding: 4 },
  starIcon: { fontSize: 40, color: "#F59E0B" },
  ratingFeedback: { marginTop: 16, fontSize: 15, fontWeight: "600", color: "#111827" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 16, paddingHorizontal: 4 },
  scrollView: { flex: 1 },
  reviewsContainer: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  cardContainer: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: "#F3F4F6" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: "700" },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 6 },
  userName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  verifiedBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  verifiedText: { fontSize: 10, fontWeight: "600", color: "#15803D" },
  stars: { fontSize: 14, color: "#F59E0B" },
  reviewText: { fontSize: 14, color: "#4B5563", lineHeight: 20, fontStyle: "italic" },
  footer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32, backgroundColor: "#FFFFFF" },
  footerText: { fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 16 },
  maybeLaterButton: { backgroundColor: "#000000", paddingVertical: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
