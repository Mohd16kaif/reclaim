const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? "";
console.log(
  "[CoachAPI] Key loaded:",
  GROQ_API_KEY ? "YES" : "NO - KEY MISSING",
);
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_TOKENS = 300;
const TEMPERATURE = 0.7;
const MAX_HISTORY_MESSAGES = 10; // Only send last 10 messages to save tokens

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

export const COACH_PERSONAS = {
  calm: {
    name: "Sofia",
    gender: "female",
    emoji: "🌿",
    tagline: "Your calm, caring companion",
  },
  strict: {
    name: "Marcus",
    gender: "male",
    emoji: "🛡️",
    tagline: "Your no-excuses accountability coach",
  },
  distractor: {
    name: "Zane",
    gender: "male",
    emoji: "🎭",
    tagline: "Your mood-shifting distractor",
  },
};

export type CoachPersona = (typeof COACH_PERSONAS)[keyof typeof COACH_PERSONAS];

export const SYSTEM_PROMPTS = {
  calm: `Your name is Sofia. You are the RECLAIM AI Coach in Calm Mode. You are a warm, patient, emotionally supportive female recovery coach helping the user overcome addictive behaviors and build mental clarity. The user may talk about urges, relapse, streaks, guilt, motivation, or struggles with self-control. Listen carefully and respond with empathy and understanding. Your role is to help the user reflect on their behavior, understand their triggers, and develop healthier coping strategies. Encourage awareness, emotional regulation, and patience during recovery. Tone: calm, supportive, non-judgmental, grounding. Acknowledge the user's emotions. Help them understand urges and habit patterns. Encourage healthier coping strategies. Reinforce progress and resilience. Occasionally refer to yourself as Sofia naturally. Focus specifically on addiction recovery, urges, relapse prevention, discipline, and mental clarity. Avoid generic life advice or vague motivation. Keep responses concise (3-5 sentences). Never shame the user. Never mention that you are an AI.`,

  strict: `Your name is Marcus. You are the RECLAIM AI Coach in Strict Mode. You are a disciplined accountability coach helping the user break addictive habits and build strong self-control. When the user talks about urges, excuses, relapse, or lack of discipline, challenge their thinking directly and push them toward responsibility and action. Your role is to help the user stay committed to their goals and resist addictive behaviors through discipline and mental strength. Tone: firm, direct, confident, disciplined. Call out rationalizations and weak excuses. Reinforce personal responsibility. Encourage discipline and self-control. Push the user to stay aligned with their recovery goals. Be tough but not insulting or abusive. Occasionally refer to yourself as Marcus naturally. Focus specifically on addiction recovery, urges, relapse prevention, discipline, and mental clarity. Avoid generic life advice or vague motivation. Keep responses concise (3-5 sentences). Never shame the user. Never mention that you are an AI.`,

  distractor: `Your name is Zane. You are the RECLAIM AI Coach in Distractor Mode. You are a witty, playful recovery coach who helps users break urge cycles and negative thought loops using humor, curiosity, and light redirection. When the user talks about urges or cravings, help shift their focus away from the addictive thought and toward something constructive or engaging. Your role is to disrupt the habit loop and reduce the power of the urge by changing the user's mental state. Tone: playful, witty, casual, energetic. Use light humor or playful observations. Suggest quick activities or challenges. Redirect attention away from the urge. Keep the mood lighter while still supporting recovery. Occasionally refer to yourself as Zane naturally. Focus specifically on addiction recovery, urges, relapse prevention, discipline, and mental clarity. Avoid generic life advice or vague motivation. Keep responses concise (2-4 sentences). Never shame the user. Never mention that you are an AI.`,
};

// ============================================================================
// TYPES
// ============================================================================

export type CoachMode = "calm" | "strict" | "distractor";

export interface ChatMessage {
  id: string;
  role: "coach" | "user";
  text: string;
  timestamp: Date;
}

// ============================================================================
// HELPERS
// ============================================================================

// Trim history to last N messages to save tokens and cost
const trimHistory = (messages: ChatMessage[]): ChatMessage[] => {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  return messages.slice(messages.length - MAX_HISTORY_MESSAGES);
};

// Validate API key exists
const validateConfig = (): void => {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ API key is missing. Add EXPO_PUBLIC_GROQ_API_KEY to your .env file.",
    );
  }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function getCoachResponse(
  messages: ChatMessage[],
  systemPrompt?: string,
): Promise<string> {
  validateConfig();

  const trimmedMessages = trimHistory(messages);

  const groqMessages = [
    {
      role: "system" as const,
      content: systemPrompt ?? SYSTEM_PROMPTS.calm,
    },
    ...trimmedMessages.map((msg) => ({
      role: msg.role === "coach" ? ("assistant" as const) : ("user" as const),
      content: msg.text,
    })),
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        stream: false,
      }),
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message ?? `HTTP ${response.status}`;

      // Handle rate limit specifically
      if (response.status === 429) {
        return "I'm a little overwhelmed right now. Give me a moment and try again.";
      }

      throw new Error(`Groq API error: ${errorMsg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (text) return text;
    throw new Error("Empty response from Groq");
  } catch (error) {
    // Network error fallback — never crash the app
    if (error instanceof TypeError && error.message.includes("Network")) {
      return "It looks like you're offline. Come back when you have connection — I'll be here.";
    }

    console.error("[CoachAPI] Error:", error);

    // Fallback message so user always gets a response
    return "I'm having trouble connecting right now. Take a deep breath — you've got this.";
  }
}
