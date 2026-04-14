import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
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
  trackCoachMessageSent,
  trackCoachSessionStarted,
} from "../utils/analytics";
import {
  ChatMessage,
  getCoachResponse,
  SYSTEM_PROMPTS,
} from "../utils/coachApi";

// ── Types ─────────────────────────────────────────────────────────────────────

type RootStackParamList = {
  MainDashboard: undefined;
  Home: any;
  Stats: undefined;
  Blocker: undefined;
  AICoach: undefined;
  Profile: undefined;
  Notifications: undefined;
};

type CoachNavigationProp = StackNavigationProp<RootStackParamList, "AICoach">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

// ── Session-level message cache ───────────────────────────────────────────────
// Persists chat during app session (survives tab switches), clears on app background

let sessionMessages: ChatMessage[] = [];
let lastCoachMode: string = "";

// ── Opening messages ──────────────────────────────────────────────────────────

const getOpeningMessage = (name: string, mode: string): string => {
  switch (mode) {
    case "calm":
      return `Hey, I'm ${name}. I'm here with you right now. Whatever you're feeling — you don't have to face it alone. Want to talk about what's going on?`;
    case "strict":
      return `${name} here. I know why you opened this. You're feeling it right now. The question is — are you going to let it win again, or are we going to shut it down together?`;
    case "distractor":
      return `${name} at your service! 🎭 Okay so before your brain does something dumb — tell me, what's the weirdest thing near you right now? Let's go.`;
    default:
      return `Hey, I'm ${name}. I'm here with you. What's going on?`;
  }
};

// ── Icon components ───────────────────────────────────────────────────────────

const NotificationBellIcon = ({
  unreadCount = 0,
}: {
  unreadCount?: number;
}) => (
  <View style={{ position: "relative" }}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0"
        stroke="#1F2937"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
    {unreadCount > 0 && (
      <View
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: "#EF4444",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700" }}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </Text>
      </View>
    )}
  </View>
);

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

// ── Typing indicator ──────────────────────────────────────────────────────────

const TypingIndicator = ({ coachName }: { coachName: string }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) =>
      Animated.loop(
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
  }, []);

  return (
    <View style={styles.messageRow}>
      <View style={styles.coachAvatarWrapper}>
        <View style={styles.coachAvatar}>
          <PersonIcon size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.coachAvatarName}>{coachName}</Text>
      </View>
      <View style={[styles.messageBubble, styles.coachBubble]}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────

const MessageBubble = ({
  message,
  coachName,
}: {
  message: ChatMessage;
  coachName: string;
}) => {
  const isCoach = message.role === "coach";
  return (
    <View
      style={[
        styles.messageRow,
        isCoach ? styles.messageRowCoach : styles.messageRowUser,
      ]}
    >
      {isCoach && (
        <View style={styles.coachAvatarWrapper}>
          <View style={styles.coachAvatar}>
            <PersonIcon size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.coachAvatarName}>{coachName}</Text>
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

// ── Main component ────────────────────────────────────────────────────────────

const CoachScreen: React.FC = () => {
  const navigation = useNavigation<CoachNavigationProp>();
  const [messages, setMessages] = useState<ChatMessage[]>(sessionMessages);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>(SYSTEM_PROMPTS.calm);
  const [coachMode, setCoachMode] = useState<string>("calm");
  const [coachName, setCoachName] = useState<string>("Sofia");
  // Track message count for analytics
  const messageCountRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load AI Coach mode + fire session started event
  // Also initialize lastCoachMode on first mount (without clearing chat)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const loadMode = async () => {
      const mode = (await AsyncStorage.getItem("aiCoachMode")) ?? "calm";
      setCoachMode(mode);
      setSystemPrompt(
        SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] ??
          SYSTEM_PROMPTS.calm,
      );
      const personas = { calm: "Sofia", strict: "Marcus", distractor: "Zane" };
      const name = personas[mode as keyof typeof personas] ?? "Sofia";
      setCoachName(name);
      trackCoachSessionStarted(mode);
      // Initialize lastCoachMode without clearing — first open should never wipe
      if (lastCoachMode === "") {
        lastCoachMode = mode;
      }
    };
    loadMode();
  }, []);

  // Fade in on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Sync messages to session-level cache whenever they change
  useEffect(() => {
    sessionMessages = messages;
  }, [messages]);

  // Clear session cache when app goes to background/inactive
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        sessionMessages = [];
      }
    });
    return () => subscription.remove();
  }, []);

  // Check coach mode on focus — clear chat if mode changed since last visit
  useFocusEffect(
    useCallback(() => {
      const checkMode = async () => {
        const currentMode = (await AsyncStorage.getItem("aiCoachMode")) ?? "calm";
        if (lastCoachMode !== "" && currentMode !== lastCoachMode) {
          // Mode changed — wipe chat and start fresh
          sessionMessages = [];
          setMessages([]);
        }
        lastCoachMode = currentMode;
        // Update system prompt and coach name to match current mode
        setCoachMode(currentMode);
        setSystemPrompt(
          SYSTEM_PROMPTS[currentMode as keyof typeof SYSTEM_PROMPTS] ??
            SYSTEM_PROMPTS.calm,
        );
        const personas = { calm: "Sofia", strict: "Marcus", distractor: "Zane" };
        const name = personas[currentMode as keyof typeof personas] ?? "Sofia";
        setCoachName(name);
      };
      checkMode();
    }, [])
  );

  // Send opening message once coach name + mode are set (only if no cached messages)
  useEffect(() => {
    if (!coachName || !coachMode) return;
    if (sessionMessages.length > 0) return; // Don't send opening if we have cached messages
    const timer = setTimeout(() => {
      const openingMessage: ChatMessage = {
        id: generateId(),
        role: "coach",
        text: getOpeningMessage(coachName, coachMode),
        timestamp: new Date(),
      };
      setMessages([openingMessage]);
    }, 500);
    return () => clearTimeout(timer);
  }, [coachName, coachMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    const timer = setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      100,
    );
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).substring(2);

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

    // Increment message count and track
    messageCountRef.current += 1;
    trackCoachMessageSent({
      coachMode,
      messageCount: messageCountRef.current,
    });

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
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "coach",
          text: "Something went wrong. Try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, messages, coachMode]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior="padding"
      keyboardVerticalOffset={-104}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <Image
            source={require("../assets/images/reclaim-header.png")}
            style={styles.logoImage}
          />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <NotificationBellIcon unreadCount={0} />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Disclosure */}
        <View style={styles.disclosureBar}>
          <Text style={styles.disclosureText}>
            {coachName} · AI-powered recovery coach
          </Text>
        </View>
        <View style={styles.topBarDivider} />

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScrollView}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} coachName={coachName} />
            ))}
            {isTyping && <TypingIndicator coachName={coachName} />}
          </Animated.View>
        </ScrollView>

        {/* Input Bar */}
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
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  logoImage: { width: 140, height: 40, resizeMode: "contain" },
  notificationButton: { padding: 5 },
  disclosureBar: { alignItems: "center", paddingBottom: 8 },
  disclosureText: { fontSize: 11, color: "#9CA3AF", fontWeight: "400" },
  topBarDivider: { height: 1, backgroundColor: "#F3F4F6" },
  chatScrollView: { flex: 1, backgroundColor: "#FFFFFF" },
  chatContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  messageRowCoach: { justifyContent: "flex-start" },
  messageRowUser: { justifyContent: "flex-end" },
  coachAvatarWrapper: { alignItems: "center", marginRight: 8 },
  coachAvatarName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  coachAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2C2C2C",
    justifyContent: "center",
    alignItems: "center",
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
  coachBubble: { backgroundColor: "#000000", borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: "#1A1A1A", borderTopRightRadius: 4 },
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
    paddingBottom: 120,
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
  sendButtonDisabled: { opacity: 0.5 },
});

export default CoachScreen;
