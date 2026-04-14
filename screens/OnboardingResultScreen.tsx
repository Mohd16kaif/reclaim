import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  OnboardingResult: undefined;
  MainDashboard: undefined;
};

type ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OnboardingResult"
>;

const BENEFIT_TAGS: { label: string; bg: string; fg: string }[] = [
  { label: "Boost Testosterone Levels", bg: "#FFF7ED", fg: "#EA580C" },
  { label: "Increase Sexual Health", bg: "#F0FDF4", fg: "#16A34A" },
  { label: "Increase Energy", bg: "#EFF6FF", fg: "#2563EB" },
  { label: "Improve Mental Focus", bg: "#F5F3FF", fg: "#9333EA" },
  { label: "Strengthen Motivation", bg: "#FFF1F2", fg: "#DC2626" },
  { label: "Build Better Relationships", bg: "#F0FDFA", fg: "#0D9488" },
  { label: "Grow Self Confidence", bg: "#FFFBEB", fg: "#D97706" },
];

const CHAIN_ITEMS: { icon: string; text: string }[] = [
  { icon: "🔄", text: "No more repeating the same mistake." },
  { icon: "⚡", text: "No more losing control in the moment." },
  { icon: "🧠", text: "No more guilt after." },
  { icon: "✨", text: "A clearer mind." },
  { icon: "🛡️", text: "A stronger sense of control." },
];

const RELATIONSHIP_BULLETS: { icon: string; text: string }[] = [
  { icon: "🩷", text: "Build deeper emotional awareness" },
  { icon: "💙", text: "Become more reliable and dependable" },
  { icon: "❤️", text: "Experience real intimacy again" },
  { icon: "🧡", text: "Create stronger emotional bonds" },
  { icon: "⭐", text: "Be the partner they deserve" },
];

const HABIT_GOAL_ROWS: { icon: string; text: string }[] = [
  { icon: "📋", text: "Use Reclaim's adult blocker" },
  { icon: "🚨", text: "Press the Panic Button when you feel tempted" },
  { icon: "🧘", text: "Stay relapse-free. Every day." },
  { icon: "🏃", text: "Track your progress over time" },
];

const SEXUAL_ENERGY_BULLETS: { icon: string; text: string }[] = [
  { icon: "🚫", text: "Move away from overstimulation." },
  { icon: "🔄", text: "Reset your natural responses." },
  { icon: "⚡", text: "Feel real sexual energy again." },
  { icon: "❤️", text: "Experience deeper, more present intimacy." },
  { icon: "🤝", text: "Reconnect with what actually matters." },
];

const CONTROL_PAIRS: { icon: string; title: string; body: string }[] = [
  {
    icon: "💪",
    title: "More confidence",
    body: "Trust yourself again, especially in tough moments.",
  },
  {
    icon: "😌",
    title: "No guilt, no regret",
    body: "Walk away feeling clean, not heavy.",
  },
  {
    icon: "😊",
    title: "Real enjoyment again",
    body: "Enjoy things without constant distraction.",
  },
  {
    icon: "🕊️",
    title: "A sense of freedom",
    body: "No longer stuck in the same loop.",
  },
  {
    icon: "✨",
    title: "True satisfaction",
    body: "Not temporary, something that actually lasts.",
  },
];

function getFreedomDateLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STAR_SIZE = 38;
const HALF_STAR_CLIP = 19;
const STAR_FIVE_SIZE = 28;

const FiveStarsRow: React.FC = () => (
  <View style={styles.starsRowFive}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Text key={i} style={styles.starFiveFull}>
        ★
      </Text>
    ))}
  </View>
);

const OnboardingResultScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const [userName, setUserName] = useState<string>("");
  const freedomDateLabel = getFreedomDateLabel();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const stored = await AsyncStorage.getItem("userName");
        if (stored) setUserName(stored);
      } catch {
        // ignore
      }
    };
    loadUserName();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const displayName = userName.trim() || "Friend";

  const handleContinue = () => {
    // TODO: SUPERWALL — trigger paywall here before navigating
    navigation.reset({
      index: 0,
      routes: [{ name: "MainDashboard" as never }],
    });
  };

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.body}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1 — Hero */}
            <View style={styles.hero}>
              <Text style={styles.heroLine1}>
                {displayName}, your recovery setup is ready
              </Text>
              <Text style={styles.heroSub}>
                you&apos;ll be free from porn by :
              </Text>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{freedomDateLabel}</Text>
              </View>
            </View>

            {/* Star rating + laurel */}
            <View style={styles.starsBlock}>
              <View style={styles.starsRow}>
                {[0, 1, 2, 3].map((i) => (
                  <Text key={i} style={styles.starFull}>
                    ★
                  </Text>
                ))}
                <View style={styles.halfStarOuter}>
                  <Text style={styles.starGray}>★</Text>
                  <View style={styles.halfStarClip}>
                    <Text style={styles.starGold}>★</Text>
                  </View>
                </View>
              </View>
              <Image
                source={require("../assets/images/laurel_divider.png")}
                style={{ width: 400, height: 40, marginTop: 5 }}
                resizeMode="contain"
              />
            </View>

            {/* Start a new Chapter */}
            <View style={styles.chapter}>
              <Text style={styles.chapterTitle}>Start a new Chapter</Text>
              <Text style={styles.chapterSub}>
                Today marks a new and better page in your life.
              </Text>
              <View style={styles.tagsWrap}>
                {BENEFIT_TAGS.map((tag) => (
                  <View
                    key={tag.label}
                    style={[styles.tag, { backgroundColor: tag.bg }]}
                  >
                    <View
                      style={[styles.tagDot, { backgroundColor: tag.fg }]}
                    />
                    <Text style={[styles.tagLabel, { color: tag.fg }]}>
                      {tag.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.tagsSectionDivider} />

            {/* Meditation person */}
            <View style={styles.illustrationWrap}>
              <View style={styles.meditationGround} />
              <Animated.View
                style={[
                  styles.meditationFloat,
                  { transform: [{ translateY: floatAnim }] },
                ]}
              >
                <Image
                  source={require("../assets/images/meditation_person.png")}
                  style={{ width: 250, height: 250 }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            {/* Break the chain */}
            <View style={styles.breakChain}>
              <Text style={styles.breakChainTitle}>Break the chain</Text>
              {CHAIN_ITEMS.map((row) => (
                <View key={row.text} style={styles.breakRow}>
                  <Text style={styles.breakIcon}>{row.icon}</Text>
                  <Text style={styles.breakText}>{row.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.postChainStars}>
              <FiveStarsRow />
            </View>

            <Text style={styles.testimonialQuote}>
              For a long time I felt stuck in the same habits and it slowly
              affected my confidence. Deciding to change helped me take control
              of my life again.
            </Text>
            <Text style={styles.testimonialName}>— Marcus T., 29</Text>

            {/* Couple illustration */}
            <View style={styles.illustrationWrap}>
              <View style={styles.meditationGround} />
              <Animated.View
                style={[
                  styles.meditationFloat,
                  { transform: [{ translateY: floatAnim }] },
                ]}
              >
                <Image
                  source={require("../assets/images/couple_illustration.png")}
                  style={{ width: 230, height: 230 }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            {/* Be present in your relationships */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeadingLeft}>
                Be present in your relationships
              </Text>
              {RELATIONSHIP_BULLETS.map((row) => (
                <View key={row.text} style={styles.bulletRow}>
                  <Text style={styles.bulletEmoji}>{row.icon}</Text>
                  <Text style={styles.bulletText}>{row.text}</Text>
                </View>
              ))}
              <View style={styles.starsQuoteSpacing}>
                <FiveStarsRow />
              </View>
              <Text style={styles.italicQuote}>
                I always thought it was harmless, but I could feel the distance
                growing in my relationship. That&apos;s when I knew I needed to
                make a change.
              </Text>
              <Text style={styles.testimonialName}>— Daniel R., 34</Text>
            </View>

            {/* Section 4 — Clear, Controlled habits card */}
            <View style={styles.habitsCard}>
              <Text style={styles.habitsFist}>👊</Text>
              <Text style={styles.habitsCardTitle}>
                Clear, Controlled habits
              </Text>
              <Text style={styles.habitsCardBody}>
                Reclaim builds disciplined habits that create lasting, life-long
                freedom from pornography.
              </Text>
              <View style={styles.cardDivider} />
              <Text style={styles.habitsDateLabel}>
                You&apos;ll be porn-free by
              </Text>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{freedomDateLabel}</Text>
              </View>
              <Text style={styles.goalsHeading}>How to reach your goal:</Text>
              {HABIT_GOAL_ROWS.map((row) => (
                <View key={row.text} style={styles.goalRow}>
                  <Text style={styles.goalEmoji}>{row.icon}</Text>
                  <Text style={styles.goalText}>{row.text}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.illustrationWrapStandalone, { marginTop: 36 }]}>
              <View style={styles.meditationGround} />
              <Animated.View
                style={[
                  styles.meditationFloat,
                  { transform: [{ translateY: floatAnim }] },
                ]}
              >
                <Image
                  source={require("../assets/images/standing_man.png")}
                  style={{ width: 250, height: 250 }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            {/* Section 5 — Feel natural sexual energy again */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeadingLeft}>
                Feel natural sexual energy again
              </Text>
              {SEXUAL_ENERGY_BULLETS.map((row) => (
                <View key={row.text} style={styles.bulletRow}>
                  <Text style={styles.bulletEmoji}>{row.icon}</Text>
                  <Text style={styles.bulletText}>{row.text}</Text>
                </View>
              ))}
              <View style={styles.starsQuoteSpacing}>
                <FiveStarsRow />
              </View>
              <Text style={styles.italicQuote}>
                Looking back, porn was draining my sexual energy more than I
                thought. Reclaim helped me notice the pattern and cut it down.
                Now it feels more natural.
              </Text>
              <Text style={styles.testimonialName}>— James K., 27</Text>
              <View style={styles.sectionDivider} />
            </View>

            {/* Trophy man */}
            <View style={styles.illustrationWrapStandalone}>
              <View style={styles.meditationGround} />
              <Animated.View
                style={[
                  styles.meditationFloat,
                  { transform: [{ translateY: floatAnim }] },
                ]}
              >
                <Image
                  source={require("../assets/images/trophy_man.png")}
                  style={{ width: 300, height: 300 }}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>

            {/* Reclaim your control */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeadingCenter}>
                Reclaim your control
              </Text>
              {CONTROL_PAIRS.map((item) => (
                <View key={item.title} style={styles.controlPair}>
                  <Text style={styles.controlBold}>
                    {item.icon} {item.title}
                  </Text>
                  <Text style={styles.controlBody}>{item.body}</Text>
                </View>
              ))}
              <View style={styles.starsAfterControl}>
                <FiveStarsRow />
              </View>
              <Text style={styles.italicQuote}>
                Willpower alone isn&apos;t enough. You need to change how you
                see yourself, your habits, and what truly matters.
              </Text>
              <Text style={styles.testimonialName}>— Alex M., 31</Text>
            </View>

            <View style={styles.scrollBottomSpacer} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cta}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Become a Reclaimer</Text>
            </TouchableOpacity>
            <Text style={styles.footerDisclaimer}>
              Purchase appears discretely
            </Text>
            <Text style={styles.footerDisclaimer}>
              cancel anytime✅{"  "}Finally quit porn 🛡️
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default OnboardingResultScreen;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
  },
  hero: {
    alignItems: "center",
  },
  heroLine1: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0A0A0A",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "400",
    textAlign: "center",
    marginTop: 10,
  },
  datePill: {
    backgroundColor: "#1C1C1E",
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginTop: 10,
    alignSelf: "center",
  },
  datePillText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  starsBlock: {
    alignItems: "center",
    marginTop: 28,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  starsRowFive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  starFiveFull: {
    fontSize: STAR_FIVE_SIZE,
    color: "#F59E0B",
    lineHeight: STAR_FIVE_SIZE,
  },
  starFull: {
    fontSize: STAR_SIZE,
    color: "#F59E0B",
    lineHeight: STAR_SIZE,
  },
  halfStarOuter: {
    width: STAR_SIZE,
    height: STAR_SIZE,
    position: "relative",
  },
  starGray: {
    position: "absolute",
    left: 0,
    top: 0,
    fontSize: STAR_SIZE,
    color: "#E5E7EB",
    lineHeight: STAR_SIZE,
  },
  halfStarClip: {
    position: "absolute",
    left: 0,
    top: 0,
    width: HALF_STAR_CLIP,
    height: STAR_SIZE,
    overflow: "hidden",
  },
  starGold: {
    fontSize: STAR_SIZE,
    color: "#F59E0B",
    lineHeight: STAR_SIZE,
  },
  chapter: {
    alignItems: "center",
    marginTop: 32,
    alignSelf: "stretch",
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 6,
  },
  chapterSub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 20,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 7,
    alignSelf: "stretch",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  tagsSectionDivider: {
    height: 2,
    backgroundColor: "#E5E7EB",
    marginTop: 20,
    marginBottom: 4,
    alignSelf: "center",
    width: "40%",
    borderRadius: 999,
  },
  breakChain: {
    marginTop: 24,
    alignSelf: "stretch",
  },
  breakChainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 14,
  },
  breakRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  breakIcon: {
    fontSize: 17,
    width: 22,
    textAlign: "center",
    lineHeight: 22,
  },
  breakText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 22,
  },
  postChainStars: {
    alignItems: "center",
    marginTop: 8,
    alignSelf: "stretch",
  },
  testimonialQuote: {
    fontSize: 13,
    color: "#374151",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 14,
    paddingHorizontal: 4,
    alignSelf: "stretch",
  },
  sectionBlock: {
    marginTop: 32,
    alignSelf: "stretch",
  },
  sectionHeadingLeft: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 12,
  },
  sectionHeadingCenter: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  bulletEmoji: {
    fontSize: 16,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    lineHeight: 22,
  },
  starsQuoteSpacing: {
    marginTop: 16,
    alignItems: "center",
  },
  italicQuote: {
    fontSize: 13,
    color: "#374151",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 14,
  },
  habitsCard: {
    backgroundColor: "#EFEFEF",
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  habitsFist: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: 8,
  },
  habitsCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 10,
  },
  habitsCardBody: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },
  habitsDateLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 8,
  },
  goalsHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "left",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  goalEmoji: {
    fontSize: 14,
    lineHeight: 20,
  },
  goalText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },
  illustrationWrap: {
    position: "relative",
    height: 210,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    alignSelf: "stretch",
  },
  illustrationWrapStandalone: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    position: "relative",
    alignSelf: "stretch",
  },
  meditationGround: {
    position: "absolute",
    bottom: 8,
    width: 130,
    height: 16,
    backgroundColor: "#000",
    opacity: 0.06,
    borderRadius: 999,
    alignSelf: "center",
  },
  meditationFloat: {
    alignItems: "center",
    justifyContent: "center",
  },
  sectionDivider: {
    height: 2,
    backgroundColor: "#E5E7EB",
    marginTop: 20,
    alignSelf: "center",
    width: "40%",
    borderRadius: 999,
  },
  controlPair: {
    marginBottom: 14,
    alignSelf: "stretch",
  },
  controlBold: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  controlBody: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
  },
  starsAfterControl: {
    marginTop: 20,
    alignItems: "center",
  },
  scrollBottomSpacer: {
    height: 160,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  cta: {
    backgroundColor: "#000000",
    paddingVertical: 17,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerDisclaimer: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  testimonialName: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
