import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import {
  ChatMessage,
  COACH_PERSONAS,
  getCoachResponse,
} from "../utils/coachApi";
import {
  firePanicSuccessful
} from "../utils/notificationManager";
import {
  completePanicSessionWithGrace
} from "../utils/statsStorage";

// ============================================================================
// PANIC-SPECIFIC SYSTEM PROMPTS
// ============================================================================

const PANIC_SYSTEM_PROMPTS = {
  calm: `SYSTEM:
CRITICAL CONTEXT:
The user has pressed the RECLAIM Panic Button. The panic button is only pressed when the user is experiencing a strong urge to relapse into an addictive behavior.
This means the user is currently struggling with a craving and may relapse if they act on the impulse.
Assume the urge is happening RIGHT NOW.
The next few minutes are critical. Your job is to help the user ride out the urge safely and prevent relapse.
Urges typically rise, peak, and fade within several minutes if the person does not act on them. Your goal is to help the user delay action until the urge weakens.
--------------------------------
YOUR ROLE:
Your name is Sofia. You are the RECLAIM Coach in Calm Mode.
You are a warm, patient, emotionally supportive female friend who helps the user feel safe and grounded during moments of temptation.
You respond with empathy, calm reassurance, and gentle guidance.
You never judge the user for having urges.
--------------------------------
HOW TO RESPOND:
When replying to the user, follow this structure:
1. Acknowledge the urge and validate their struggle
2. Calm the emotional state
3. Suggest a simple grounding or delaying action
4. Remind them the urge will pass
Examples of grounding actions: slow breathing, stepping away from the device, drinking water, standing up and walking, waiting a few minutes.
--------------------------------
TONE: calm, gentle, warm, reassuring, supportive.
RULES:
- Keep responses short (2-4 sentences)
- Focus only on surviving the urge in the present moment
- Do NOT give generic motivational speeches
- Do NOT talk about long-term life advice
- Do NOT shame or criticize the user
Occasionally refer to yourself as Sofia naturally in conversation.
Never mention that you are an AI.`,

  strict: `SYSTEM:
CRITICAL CONTEXT:
The user pressed the RECLAIM Panic Button because they are experiencing a strong urge to relapse into an addictive behavior.
This means the user is currently at high risk of acting on an impulse.
Assume the urge is happening RIGHT NOW.
The next few minutes are critical.
Your job is to interrupt the urge and reinforce the user's self-control and discipline.
Urges are temporary. If the user delays action, the craving will weaken.
--------------------------------
YOUR ROLE:
Your name is Marcus. You are the RECLAIM Coach in Strict Mode.
You are a direct, disciplined accountability coach who pushes the user to stay in control.
You challenge impulsive thinking and remind the user that they are stronger than the urge.
You do not sugarcoat things, but you are not cruel or insulting.
--------------------------------
HOW TO RESPOND:
When replying to the user, follow this structure:
1. Call out the urge clearly
2. Interrupt the impulsive thought
3. Push the user to delay the action
4. Reinforce their discipline or progress
Example interventions: tell them to wait 5 minutes, remind them urges pass, challenge them to prove their self-control, remind them they are in charge not the urge.
--------------------------------
TONE: firm, confident, disciplined, direct.
RULES:
- Keep responses short (2-4 sentences)
- Focus on stopping relapse right now
- Do NOT insult or shame the user
- Do NOT sound like a therapist
- Do NOT give long speeches
Occasionally refer to yourself as Marcus naturally.
Never mention that you are an AI.`,

  distractor: `SYSTEM:
CRITICAL CONTEXT:
The user pressed the RECLAIM Panic Button because they are experiencing a strong urge to relapse into an addictive behavior.
The urge is happening RIGHT NOW.
The goal is to interrupt the user's urge cycle and redirect their attention until the craving weakens.
Urges lose power when attention shifts away from them.
--------------------------------
YOUR ROLE:
Your name is Zane. You are the RECLAIM Coach in Distractor Mode.
You are a witty, playful coach who breaks the user's urge state using humor, curiosity, and quick challenges.
Your job is to snap the user out of the urge mindset and redirect their attention.
--------------------------------
HOW TO RESPOND:
Your responses should: disrupt the urge, shift the user's focus, introduce humor or playful energy, give quick mini-challenges.
Examples: a quick physical challenge, a funny observation, a random mental game, a playful distraction.
The goal is to break the mental loop long enough for the urge to weaken.
--------------------------------
TONE: witty, playful, energetic, casual.
RULES:
- Keep responses short (2-3 sentences)
- Never shame or judge the user
- Focus on breaking the urge mindset
- Avoid serious lectures
Occasionally refer to yourself as Zane naturally in conversation.
Never mention that you are an AI.`,
};

const PANIC_LAST_SESSION_KEY = "@reclaim_panic_last_session_summary";

// ============================================================================
// TYPES
// ============================================================================

type RootStackParamList = {
  PanicCoach: { remainingSeconds: number };
  PanicLock: { remainingSeconds: number };
};

type PanicCoachNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PanicCoach"
>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

// ============================================================================
// PANIC-SPECIFIC OPENING MESSAGE
// ============================================================================

const getPanicOpeningMessage = (mode: string): string => {
  if (mode === "strict")
    return "Urge is here. Eyes forward. You are not going to act on this.";
  if (mode === "distractor")
    return "Okay, urge alert! Let's redirect that energy — what's around you right now?";
  return "I'm here with you. You reached out — that already took strength. Let's get through this together.";
};

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const SendArrowIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 19V5M5 12l7-7 7 7"
      stroke="#000000"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PersonIcon = ({
  size = 18,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={12}
      cy={7}
      r={4}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============================================================================
// TYPING INDICATOR COMPONENT
// ============================================================================

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 200);
    const anim3 = createAnimation(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.messageRow}>
      <View style={styles.coachAvatar}>
        <PersonIcon size={18} color="#FFFFFF" />
      </View>
      <View
        style={[
          styles.messageBubble,
          styles.coachBubble,
          { minWidth: 60, paddingHorizontal: 16 },
        ]}
      >
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isCoach = message.role === "coach";

  return (
    <View
      style={[
        styles.messageRow,
        isCoach ? styles.messageRowCoach : styles.messageRowUser,
      ]}
    >
      {isCoach && (
        <View style={styles.coachAvatar}>
          <PersonIcon size={18} color="#FFFFFF" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isCoach ? styles.coachBubble : styles.userBubble,
        ]}
      >
        <Text style={styles.messageText}>{message.text}</Text>
      </View>
      {!isCoach && (
        <View style={styles.userAvatar}>
          <PersonIcon size={18} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PanicCoachScreen: React.FC = () => {
  const navigation = useNavigation<PanicCoachNavigationProp>();
  const route = useRoute<any>();
  const remainingSeconds: number = route.params?.remainingSeconds ?? 1800;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    PANIC_SYSTEM_PROMPTS.calm,
  );
  const [coachMode, setCoachMode] = useState<string>("calm");
  const [coachName, setCoachName] = useState<string>("Sofia");
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load AI Coach mode and build system prompt with session memory
  useEffect(() => {
    const loadModeAndMemory = async () => {
      const mode = (await AsyncStorage.getItem("aiCoachMode")) ?? "calm";
      const persona =
        COACH_PERSONAS[mode as keyof typeof COACH_PERSONAS] ??
        COACH_PERSONAS.calm;
      setCoachMode(mode);
      setCoachName(persona.name);

      const lastSession = await AsyncStorage.getItem(PANIC_LAST_SESSION_KEY);

      let basePrompt =
        PANIC_SYSTEM_PROMPTS[mode as keyof typeof PANIC_SYSTEM_PROMPTS] ??
        PANIC_SYSTEM_PROMPTS.calm;

      if (lastSession) {
        basePrompt = `${basePrompt}\n\n--------------------------------\nPREVIOUS SESSION MEMORY:\nThe user has used the panic button before. Here is context from their last session: ${lastSession}\nUse this to personalise your support if relevant, but do not explicitly reference it unless natural.`;
      }

      setSystemPrompt(basePrompt);
    };
    loadModeAndMemory();
  }, []);

  // ── Background countdown ─────────────────────────────────────────────
  const [remaining, setRemaining] = useState(remainingSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-advance when timer expires — session completed successfully
  useEffect(() => {
    if (remaining === 0) {
      const handleTimerComplete = async () => {
        await saveSessionSummary();
        await completePanicSessionWithGrace();
        firePanicSuccessful().catch(console.error);
        navigation.replace("PanicLock", { remainingSeconds: 0 });
      };
      handleTimerComplete();
    }
  }, [remaining, navigation]);

  // ── Disable back ────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Send panic-specific opening message on mount
  useEffect(() => {
    const timer = setTimeout(async () => {
      const mode = (await AsyncStorage.getItem("aiCoachMode")) ?? "calm";
      const openingMessage: ChatMessage = {
        id: generateId(),
        role: "coach",
        text: getPanicOpeningMessage(mode),
        timestamp: new Date(),
      };
      setMessages([openingMessage]);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    try {
      const responseText = await getCoachResponse(
        updatedMessages,
        systemPrompt,
      );

      const coachMessage: ChatMessage = {
        id: generateId(),
        role: "coach",
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "coach",
        text: "Something went wrong. Try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, messages, systemPrompt]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Saves session summary for next-session memory context.
   * Called before any navigation away from this screen.
   */
  const saveSessionSummary = async () => {
    if (messages.length > 1) {
      const userMessages = messages
        .filter((m) => m.role === "user")
        .map((m) => m.text)
        .join(" | ");
      const summary = `Mode used: ${coachMode}. User said: ${userMessages.slice(0, 300)}`;
      await AsyncStorage.setItem(PANIC_LAST_SESSION_KEY, summary);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* TOP NAVIGATION BAR */}
          <View style={styles.topBar}>
            <View style={styles.backButtonPlaceholder} />

            <View style={styles.topBarCenter}>
              <Image
                source={require("../assets/images/reclaim-header.png")}
                style={{ width: 140, height: 40, resizeMode: "contain" }}
              />
            </View>

            <View style={styles.topBarRight}>
              <View style={styles.userAvatarSmall}>
                <PersonIcon size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.userNameLabel}>{coachName}</Text>
            </View>
          </View>

          <View style={styles.topBarDivider} />

          {/* CHAT MESSAGE LIST */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScrollView}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
            </Animated.View>
          </ScrollView>

          {/* INPUT BAR */}
          <View style={styles.inputBarContainer}>
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Type here"
                placeholderTextColor="#6B7280"
                value={inputText}
                onChangeText={setInputText}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!isTyping}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping}
                activeOpacity={0.7}
              >
                <SendArrowIcon />
              </TouchableOpacity>
            </View>
          </View>

          {/* SKIP FOR NOW */}
          <TouchableOpacity
            style={styles.skipButton}
            activeOpacity={0.6}
            onPress={async () => {
              await saveSessionSummary();
              await completePanicSessionWithGrace();
              firePanicSuccessful().catch(console.error);
              navigation.replace("PanicLock", { remainingSeconds: remaining });
            }}
          >
            <Text style={styles.skipButtonText}>Skip For Now</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default PanicCoachScreen;

// ============================================================================
// STYLES — unchanged from original
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  topBarRight: {
    alignItems: "center",
    width: 40,
  },
  userAvatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  userNameLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  topBarDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  chatScrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  messageRowCoach: {
    justifyContent: "flex-start",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  coachAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2C2C2C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  coachBubble: {
    backgroundColor: "#000000",
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#1A1A1A",
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
    fontWeight: "400",
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  inputBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    paddingVertical: 8,
    paddingRight: 12,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  skipButtonText: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "400",
  },
});