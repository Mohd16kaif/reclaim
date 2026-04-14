import PostHog from "posthog-react-native";

// ── Client ────────────────────────────────────────────────────────────────────
let client: PostHog | null = null;

export const initAnalytics = (): PostHog => {
  if (!client) {
    client = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
      host: "https://us.i.posthog.com",
      flushInterval: 10000,
      flushAt: 20,
    });
  }
  return client;
};

export const getAnalytics = (): PostHog | null => client;

// ── Identity ──────────────────────────────────────────────────────────────────
export const identifyUser = (
  deviceId: string,
  properties?: {
    name?: string;
    email?: string;
    memberSinceDate?: string;
    gender?: string;
    age?: string;
    quittingReason?: string;
    coachMode?: string;
  },
) => {
  // PostHog identify requires JsonType — no undefined values allowed
  const traits: Record<string, string> = {
    platform: "ios",
    app: "reclaim",
  };
  if (properties?.name) traits["$name"] = properties.name;
  if (properties?.email) traits["$email"] = properties.email;
  if (properties?.memberSinceDate)
    traits["member_since"] = properties.memberSinceDate;
  if (properties?.gender) traits["gender"] = properties.gender;
  if (properties?.age) traits["age_group"] = properties.age;
  if (properties?.quittingReason)
    traits["quitting_reason"] = properties.quittingReason;
  if (properties?.coachMode) traits["coach_mode"] = properties.coachMode;

  client?.identify(deviceId, traits);
};

export const resetUser = () => {
  client?.reset();
};

// ── App Lifecycle ─────────────────────────────────────────────────────────────
export const trackAppOpened = (properties?: {
  currentStreak?: number;
  hasCheckedInToday?: boolean;
  dnsShieldActive?: boolean;
}) => {
  client?.capture("app_opened", {
    current_streak: properties?.currentStreak ?? 0,
    checked_in_today: properties?.hasCheckedInToday ?? false,
    shield_active: properties?.dnsShieldActive ?? false,
  });
};

export const trackAppBackgrounded = () => {
  client?.capture("app_backgrounded");
};

// ── Onboarding ────────────────────────────────────────────────────────────────
export const trackOnboardingStarted = () => {
  client?.capture("onboarding_started");
};

export const trackOnboardingStepCompleted = (
  step: string,
  questionNumber: number,
  answer?: string,
) => {
  client?.capture("onboarding_step_completed", {
    step,
    question_number: questionNumber,
    answer: answer ?? "",
  });
};

export const trackOnboardingCompleted = (properties: {
  gender?: string;
  ageGroup?: string;
  quittingReason?: string;
  previousAttempt?: string;
  selectedCoach?: string;
}) => {
  client?.capture("onboarding_completed", {
    gender: properties.gender ?? "",
    age_group: properties.ageGroup ?? "",
    quitting_reason: properties.quittingReason ?? "",
    previous_attempt: properties.previousAttempt ?? "",
    selected_coach: properties.selectedCoach ?? "",
  });
};

export const trackOnboardingAbandoned = (
  lastStep: string,
  questionNumber: number,
) => {
  client?.capture("onboarding_abandoned", {
    last_step: lastStep,
    question_number: questionNumber,
  });
};

// ── Screen Views ──────────────────────────────────────────────────────────────
export const trackScreenViewed = (
  screenName: string,
  properties?: Record<string, string | number | boolean>,
) => {
  client?.capture("screen_viewed", {
    screen: screenName,
    ...properties,
  });
};

// ── Check-In ──────────────────────────────────────────────────────────────────
export const trackCheckInOpened = () => {
  client?.capture("check_in_opened");
};

export const trackCheckInCompleted = (
  mood: string | null,
  trigger: string | null,
) => {
  client?.capture("check_in_completed", {
    mood: mood ?? "skipped",
    trigger: trigger ?? "skipped",
  });
};

export const trackCheckInSkipped = () => {
  client?.capture("check_in_skipped");
};

// ── Streak ────────────────────────────────────────────────────────────────────
export const trackStreakMilestone = (days: number) => {
  client?.capture("streak_milestone_reached", {
    streak_days: days,
    milestone: days,
  });
};

export const trackStreakReset = (previousStreak: number, reason: string) => {
  client?.capture("streak_reset", {
    previous_streak_days: previousStreak,
    reason,
  });
};

// ── Relapse ───────────────────────────────────────────────────────────────────
export const trackRelapseModalOpened = () => {
  client?.capture("relapse_modal_opened");
};

export const trackRelapseDenied = () => {
  client?.capture("relapse_denied");
};

export const trackRelapseRecorded = (properties: {
  reason: string | null;
  previousStreakDays: number;
  commitment?: string;
}) => {
  client?.capture("relapse_recorded", {
    reason: properties.reason ?? "not_specified",
    previous_streak_days: properties.previousStreakDays,
    made_commitment: !!properties.commitment,
  });
};

// ── Panic Button ──────────────────────────────────────────────────────────────
export const trackPanicButtonPressed = (properties: {
  currentStreak: number;
  timeOfDay: string;
  durationMinutes: number;
}) => {
  client?.capture("panic_button_pressed", {
    current_streak: properties.currentStreak,
    time_of_day: properties.timeOfDay,
    panic_duration_minutes: properties.durationMinutes,
  });
};

export const trackPanicCompleted = (durationSeconds: number) => {
  client?.capture("panic_completed", {
    duration_seconds: durationSeconds,
    duration_minutes: Math.round(durationSeconds / 60),
  });
};

export const trackPanicAbandoned = (
  secondsElapsed: number,
  endedInRelapse: boolean,
) => {
  client?.capture("panic_abandoned", {
    seconds_elapsed: secondsElapsed,
    ended_in_relapse: endedInRelapse,
  });
};

// ── DNS Shield ────────────────────────────────────────────────────────────────
export const trackShieldEnabled = () => {
  client?.capture("shield_enabled");
};

export const trackShieldDisabled = () => {
  client?.capture("shield_disabled");
};

export const trackShieldInstallStarted = () => {
  client?.capture("shield_install_started");
};

export const trackShieldInstallConfirmed = () => {
  client?.capture("shield_install_confirmed");
};

// ── AI Coach ──────────────────────────────────────────────────────────────────
export const trackCoachSessionStarted = (coachMode: string) => {
  client?.capture("coach_session_started", {
    coach_mode: coachMode,
  });
};

export const trackCoachMessageSent = (properties: {
  coachMode: string;
  messageCount: number;
}) => {
  client?.capture("coach_message_sent", {
    coach_mode: properties.coachMode,
    message_count: properties.messageCount,
  });
};

export const trackCoachModeChanged = (fromMode: string, toMode: string) => {
  client?.capture("coach_mode_changed", {
    from_mode: fromMode,
    to_mode: toMode,
  });
};

// ── Stats ─────────────────────────────────────────────────────────────────────
export const trackStatsViewed = (timeRange: string) => {
  client?.capture("stats_viewed", {
    time_range: timeRange,
  });
};

export const trackStatsTimeRangeChanged = (range: string) => {
  client?.capture("stats_time_range_changed", { range });
};

// ── Settings / Profile ────────────────────────────────────────────────────────
export const trackSettingsOpened = () => {
  client?.capture("settings_opened");
};

export const trackPanicDurationChanged = (newDurationMinutes: number) => {
  client?.capture("panic_duration_changed", {
    new_duration_minutes: newDurationMinutes,
  });
};

export const trackNotificationsToggled = (enabled: boolean) => {
  client?.capture("notifications_toggled", { enabled });
};

export const trackProfileUpdated = (fields: string[]) => {
  client?.capture("profile_updated", { updated_fields: fields.join(",") });
};

// ── Paywall ───────────────────────────────────────────────────────────────────
export const trackPaywallShown = (trigger: string) => {
  client?.capture("paywall_shown", { trigger });
};

export const trackPaywallDismissed = (trigger: string) => {
  client?.capture("paywall_dismissed", { trigger });
};

export const trackSubscriptionStarted = (plan: string, price: string) => {
  client?.capture("subscription_started", { plan, price });
};

export const trackSubscriptionCancelled = (plan: string) => {
  client?.capture("subscription_cancelled", { plan });
};

export const trackFreeTrialStarted = () => {
  client?.capture("free_trial_started");
};

// ── Helper ────────────────────────────────────────────────────────────────────
export const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};
