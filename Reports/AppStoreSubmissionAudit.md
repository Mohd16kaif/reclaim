# Pre-App-Store-Submission Audit Report — Reclaim

**Audit Date:** 6 July 2026  
**App:** Reclaim (React Native / Expo / Swift)  
**Bundle ID:** `com.reclaim.recovery`  
**Current Version:** 1.0.0 (build 84 / pbxproj CURRENT_PROJECT_VERSION = 71)  

---

## 1. App Overview

**Core purpose:** Reclaim is an iOS-only pornography addiction recovery app that combines system-level content blocking (via iOS Screen Time / Family Controls), an AI coach powered by Groq/Claude, a 23-question onboarding assessment, a 120-day structured chapter program, daily check-in streak tracking, and a Panic Button that locks distracting apps during urges — all synced to a Supabase backend.

**Major user-facing features and screens:**

| Feature | Screens | Files |
|---------|---------|-------|
| Splash / Welcome | SplashScreen, WelcomeScreen | `screens/SplashScreen.tsx`, `screens/WelcomeScreen.tsx` |
| Sign In (Apple) | SignInScreen | `screens/SignInScreen.tsx` |
| Onboarding (23 questions) | OnboardingCarousel → OnboardingQuestion → GenderSelection → DateOfBirthPicker → FirstExposureAge → SessionDuration → ~20 education/info screens → PersonalizedPlan → AICoachMode → AlwaysOnBlocking → GrantPermissions → SetupComplete | `screens/OnboardingQuestionScreen.tsx`, `screens/GenderSelectionScreen.tsx`, `screens/DateOfBirthPickerScreen.tsx`, `screens/FirstExposureAgeScreen.tsx`, `screens/SessionDurationScreen.tsx`, `screens/PersonalizedPlanScreen.tsx`, `screens/GrantPermissionsScreen.tsx`, `screens/SetupCompleteScreen.tsx`, `screens/EducationScreen1-5.tsx`, etc. |
| Panic Button (lock apps during urges) | PanicButtonInfo → PanicActivated → PanicLock → PanicShield → PanicCoach | `screens/PanicButtonInfoScreen.tsx`, `screens/PanicActivatedScreen.tsx`, `screens/PanicLockScreen.tsx`, `screens/PanicShieldScreen.tsx`, `screens/PanicCoachScreen.tsx` |
| AI Coach (3 modes: Calm/Strict/Distractor) | CoachScreen (tab), PanicCoachScreen | `screens/CoachScreen.tsx`, `screens/PanicCoachScreen.tsx`, `utils/coachApi.ts` |
| Shield / Blocker (DNS + Screen Time) | BlockerScreen, ShieldStatusScreen, SelfHealScreen | `screens/BlockerScreen.tsx`, `screens/ShieldStatusScreen.tsx`, `utils/shieldManager.ts`, `utils/shieldLayers.ts`, `utils/familyControls.ts` |
| Chapters (120-day program, 7 chapters) | ChaptersScreen, ChapterDetailScreen | `screens/ChaptersScreen.tsx`, `screens/ChapterDetailScreen.tsx`, `constants/chapters.ts` |
| Daily Check-ins & Streak | HomeScreen (Dashboard), StatsScreen | `screens/HomeScreen.tsx`, `screens/StatsScreen.tsx`, `utils/statsStorage.ts`, `utils/userProgress.ts` |
| Settings | SettingsScreen, NotificationsScreen, DefaultPanicDurationScreen, AICoachModeScreen, AlwaysOnBlockingScreen | `screens/SettingsScreen.tsx`, `screens/NotificationsScreen.tsx`, `screens/DefaultPanicDurationScreen.tsx`, `screens/AICoachModeScreen.tsx` |
| Subscription/Paywall (planned, not implemented) | OnboardingResultScreen (CTA only, no purchase logic) | `screens/OnboardingResultScreen.tsx:162` |
| Privacy & Legal | PrivacyPolicyScreen, TermsOfServiceScreen, FAQsScreen, ContactSupportScreen, RequestFeatureScreen | `screens/PrivacyPolicyScreen.tsx`, `screens/TermsOfServiceScreen.tsx`, `screens/FAQsScreen.tsx`, `screens/ContactSupportScreen.tsx` |

---

## 2. Native Entitlements & Capabilities

### 2.1 Family Controls / Screen Time API

| Entitlement | File | Line | Usage |
|---|---|---|---|
| `com.apple.developer.family-controls` = `true` | `ios/reclaimapp/reclaimapp.entitlements` | 11-12 | Main app — Screen Time app blocking, web content filtering, panic sessions |
| `com.apple.developer.family-controls` = `true` | `ios/ReclaimDeviceActivity/ReclaimDeviceActivity.entitlements` | 5-6 | DeviceActivity monitor extension |
| `com.apple.developer.family-controls` = `true` | `ios/ReclaimShieldConfig/ReclaimShieldConfig.entitlements` | 5-6 | Shield configuration extension |

**Frameworks used:** `DeviceActivity.framework`, `ManagedSettings.framework`, `ManagedSettingsUI.framework`, `ActivityKit.framework`  
**Swift files:** `FamilyControlsBridge.swift`, `FamilyPickerHostingController.swift`, `DeviceActivityMonnintor.swift`, `ShieldConfigurationExtension.swift`

### 2.2 Network Extension / DNS Proxy (DISABLED / ORPHANED)

The `ios/ReclaimTunnel/` directory contains a full NEPacketTunnelProvider implementation (`PacketTunnelProvider.swift`, `DNSOverHTTPS.swift`, `AppProxyProvider.swift`) with CleanBrowsing DNS-over-HTTPS filtering, but **this target is not included in the Xcode project**. The file `TunnelBridge.swift` explicitly states:

> `"TunnelBridge disabled — DNS tunnel approach removed."`

The orphaned entitlement file `ReclaimTunnel.entitlements` declares `com.apple.developer.networking.networkextension` → `packet-tunnel-provider`, but since the target is not built, this is dead code.

**Action:** Either delete the `ReclaimTunnel/` directory entirely, or revive it if DNS-over-VPN blocking is needed.

### 2.3 Push Notifications

| Entitlement | File | Line | Value |
|---|---|---|---|
| `aps-environment` | `ios/reclaimapp/reclaimapp.entitlements` | 6 | `production` |

Used for daily check-in reminders and milestone celebration notifications.

### 2.4 Sign In with Apple

| Entitlement | File | Line | Value |
|---|---|---|---|
| `com.apple.developer.applesignin` | `ios/reclaimapp/reclaimapp.entitlements` | 7-10 | `Default` |

### 2.5 App Groups (shared UserDefaults)

| Entitlement | File | Line | Value |
|---|---|---|---|
| `com.apple.security.application-groups` | `reclaimapp.entitlements` | 13-16 | `group.com.reclaim.recovery` |
| Same | `ReclaimDeviceActivity.entitlements` | 7-10 | Same |
| Same | `ReclaimShieldConfig.entitlements` | 7-10 | Same |
| Same | `PanicTimerWidget.entitlements` | 5-8 | Same |
| Same | `ReclaimTunnel.entitlements` (orphan) | 5-8 | Same |

### 2.6 Live Activities

| Key | File | Line | Value |
|---|---|---|---|
| `NSSupportsLiveActivities` | `ios/reclaimapp/Info.plist` | 86-87 | `true` |

Powering the Dynamic Island / Lock Screen panic timer countdown via `PanicTimerWidget` (WidgetKit extension).

### 2.7 Custom URL Schemes

| Scheme | File | Line |
|---|---|---|
| `reclaim` | `ios/reclaimapp/Info.plist` | 30 |
| `com.reclaim.recovery` | `ios/reclaimapp/Info.plist` | 31 |

### 2.8 Capabilities NOT Declared

| Capability | Status | Notes |
|---|---|---|
| `aps-environment` | ✅ Declared (production) | |
| Keychain Sharing | ❌ NOT declared | `secureStorage.ts` uses `expo-secure-store` which does not require keychain-sharing entitlements |
| Associated Domains | ❌ NOT declared | `AppDelegate.swift` has a `continue userActivity` universal link handler stub but no `com.apple.developer.associated-domains` entitlement |
| Background Modes (`UIBackgroundModes`) | ❌ NOT declared | No background modes in any Info.plist |
| In-App Purchase | ❌ Not needed yet | Paywall not implemented |
| iCloud, HealthKit, HomeKit, Wallet, Siri, Game Center | ❌ NOT declared | |

---

## 3. Info.plist Usage Descriptions

### 3.1 All `NS*UsageDescription` Keys in `ios/reclaimapp/Info.plist`

| Key | Line | Exact String | Assessment |
|---|---|---|---|
| `NSCameraUsageDescription` | 47 | `"Allow $(PRODUCT_NAME) to access your camera"` | ⚠️ **VAGUE** — does not explain *why* camera is needed. Also **UNUSED** — no TypeScript code requests camera permission. |
| `NSContactsUsageDescription` | 49 | `"Reclaim needs access to your contacts to quickly reach your accountability partners during moments of struggle."` | ✅ **GOOD** — specific and contextual |
| `NSFaceIDUsageDescription` | 51 | `"Allow $(PRODUCT_NAME) to access your Face ID biometric data."` | ⚠️ **VAGUE** — no explanation of purpose. Also **UNUSED** — no biometric auth code found. |
| `NSMicrophoneUsageDescription` | 53 | `"Allow $(PRODUCT_NAME) to access your microphone"` | ⚠️ **VAGUE** — no explanation of purpose. Also **UNUSED** — no microphone-requiring code found. |
| `NSPhotoLibraryUsageDescription` | 55 | `"Reclaim needs access to your photo library to set your profile picture"` | ✅ **GOOD** — specific and reasonable |
| `NSUserNotificationsUsageDescription` | 57 | `"Reclaim sends you daily check-in reminders and celebrates your milestones to keep you motivated."` | ✅ **GOOD** |

### 3.2 `app.json` Overrides (3 of 6 keys)

| Key | Match? |
|---|---|
| `NSContactsUsageDescription` | ✅ Identical to Info.plist |
| `NSUserNotificationsUsageDescription` | ✅ Identical to Info.plist |
| `NSPhotoLibraryUsageDescription` | ✅ Identical to Info.plist |

`NSCameraUsageDescription`, `NSFaceIDUsageDescription`, and `NSMicrophoneUsageDescription` are **not** overridden in `app.json` — they come solely from the raw `ios/` Info.plist.

### 3.3 Missing Critical Usage Description

| Missing Key | Required By | Impact |
|---|---|---|
| `NSFamilyControlsUsageDescription` | FamilyControls framework | 🚨 **CRITICAL — GUARANTEED REJECTION.** The app uses FamilyControls extensively (`FamilyControlsBridge.swift`, `DeviceActivityMonnintor.swift`, `ShieldConfigurationExtension.swift`, `GrantPermissionsScreen.tsx`, etc.) but **no Info.plist contains `NSFamilyControlsUsageDescription`**. Apple's documentation requires this key for any app using the FamilyControls framework. |

### 3.4 Permission APIs Called Without Matching Info.plist Entry

- `expo-apple-authentication` (Sign In with Apple) — used in `utils/supabase.ts` — does not require a usage description; uses entitlement only. ✅ OK

---

## 4. In-App Purchases / Subscriptions

### 4.1 Current State: NOT IMPLEMENTED

**The subscription/paywall system is not yet built.** Here is the evidence:

| Finding | File | Line |
|---|---|---|
| TODO placeholder for paywall | `screens/OnboardingResultScreen.tsx` | 162 |
| Static CTA "Become a Reclaimer" with legal footnotes but no purchase logic | `screens/OnboardingResultScreen.tsx` | 424-436 |
| Terms of Service references subscription-based services via Apple IAP | `screens/TermsOfServiceScreen.tsx` | 29-31 |
| Analytics events defined (uncalled) | `utils/analytics.ts` | 286-305 |
| No Superwall, RevenueCat, or StoreKit SDK/package installed | `package.json`, `Podfile.lock` | — |
| No IAP product identifiers found (no `com.reclaim.recovery.*` subscription IDs) | Entire codebase | — |
| No restore purchases functionality | Entire codebase | — |
| No subscription management UI or Apple subscription link | Entire codebase | — |
| "Manage Subscription" button shows `"Coming soon in production build!"` alert | `screens/SettingsScreen.tsx:476,741` | 🚨 **REJECTION RISK** |

### 4.2 What Must Be Done Before Submission

1. **Implement paywall** at the point currently marked `// TODO: SUPERWALL` (`OnboardingResultScreen.tsx:162`)
2. **Define product identifiers** in App Store Connect (e.g., `com.reclaim.recovery.monthly`, `com.reclaim.recovery.annual`)
3. **Integrate an IAP SDK** — either StoreKit (raw), RevenueCat, or Superwall
4. **Implement restore purchases** and make it reachable from Settings
5. **Add a subscription management link** (`https://apps.apple.com/account/subscriptions`) or equivalent UI
6. **Remove or properly implement** the "Manage Subscription" button in Settings that currently shows a "coming soon" alert — Apple will reject a production build with non-functional menu items
7. Free trial logic (`trackFreeTrialStarted` in `analytics.ts:303-305`) is planned but not implemented

---

## 5. Content & Age Rating Considerations

### 5.1 Sensitive Language Present in the App

The app openly discusses pornography, masturbation, sexual fantasy, and explicit content throughout its onboarding and UI. Key examples:

| Text | File | Line |
|---|---|---|
| `"Quit Porn Addiction Easily"` | `screens/WelcomeScreen.tsx` | 126 |
| `"Porn Affects the Brain"` / `"Frequent porn use trains the brain to expect intense pleasure..."` | `screens/OnboardingCarouselScreen.tsx` | 41-42 |
| `"Porn Can Lower Sexual Drive"` / `"Constant artificial stimulation can weaken natural desire..."` | `screens/OnboardingCarouselScreen.tsx` | 56-57 |
| `"When did you first start watching porn?"` | `screens/FirstExposureAgeScreen.tsx` | 206 |
| `"What's your main reason for Quitting porn?"` | `screens/QuittingReasonScreen.tsx` | 173 |
| `"Have you noticed your content becoming more extreme over time?"` | `screens/ContentEscalationScreen.tsx` | 282 |
| `"Do you fantasize sexually about content you watch?"` | `screens/SexualFantasyScreen.tsx` | 309 |
| `"How do you feel about your relationship with masturbation?"` | `screens/MasturbationRelationshipScreen.tsx` | 221 |
| `"18+"` badge and `"NSFW"` label | `screens/PanicActivatedScreen.tsx` | 63-65 |
| `"Porn sites, explicit images, and adult content are rigorously blocked"` | `screens/AlwaysOnBlockingScreen.tsx` | 63 |

### 5.2 Age Gate / Verification

- **No age enforcement exists.** The `DateOfBirthPickerScreen.tsx` collects a birthdate but states it is only used for "calibration" (line 191). There is no minimum-age check or parental gate.
- Terms of Service state minimum age 13 (`screens/TermsOfServiceScreen.tsx:26`) but this is not enforced in code.

### 5.3 Expected App Store Age Rating

Given the subject matter (pornography addiction recovery, explicit questions about sexual behavior, masturbation, and content escalation), this app will almost certainly receive a **17+ (Mature) rating** from Apple. The developer should select the **"Mature/Sexual Content or Nudity"** and **"Medical/Treatment Information"** indicators in App Store Connect.

**Action:** Ensure the `"18+"` badge and `"NSFW"` label remain as visible content warnings — these are good UX practice and demonstrate responsible handling of sensitive material.

---

## 6. Privacy & Data Handling

### 6.1 Third-Party SDKs and Data Collection

| SDK | Data Collected/Transmitted | File | Line |
|---|---|---|---|
| **Supabase** (`@supabase/supabase-js`) | Device ID (iOS `identifierForVendor`), user_name, user_email, member_since_date, streak data (start date, current/longest streak), check-in/relapse/panic events (with timestamps and arbitrary event_data), settings (panic_duration, coach_mode, dns_shield_installed), avatar photo | `utils/supabase.ts` | 180-200, 248-283, 276-305, 339-348, 464-488 |
| **Sentry** (`@sentry/react-native`) | Crash reports, breadcrumbs (Apple sign-in flow). **PII disabled** (`sendDefaultPii: false`). Sensitive screen breadcrumbs filtered via `beforeSend` regex (Masturbation, SexualFantasy, UrgeIntensity, etc.) | `App.tsx` | 110-128 |
| **PostHog** (`posthog-react-native`) | Device ID, name, email, gender, age group, quitting reason, coach mode, app_open/background events, screen views. No IDFA. | `utils/analytics.ts` | 6-53, `App.tsx:448,478,491,557` |
| **Groq** (via Supabase Edge Function) | AI coach chat messages (user messages and AI responses — transmitted through Supabase proxy) | `utils/coachApi.ts` | 1-116 |
| **Expo SecureStore** | User name, email, streaks (iOS Keychain) | `utils/secureStorage.ts`, `utils/profileStorage.ts` | — |

### 6.2 Privacy Policy URL

- **In-app link:** `https://mohd16kaif.github.io/reclaim-privacy-policy/`
- **Reachable from:** `screens/SettingsScreen.tsx:781` and `screens/PrivacyPolicyScreen.tsx:5`
- **Status:** URL is ready (per prior context)

### 6.3 Support URL

- **Status:** ❌ **NOT YET READY** — per prior context, a working Support URL must be created before App Store Connect submission. Apple requires a working Support URL separate from the Privacy Policy URL.

### 6.4 App Tracking Transparency (ATT)

- **Not required.** The app does not use IDFA, does not request tracking authorization, has no ad SDKs, and has no cross-app tracking. No `NSUserTrackingUsageDescription` needed. ✅

### 6.5 Hardcoded Environment Variables (Exposed in Client Bundle)

| Key | Value Source | File | Line |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | CI env | `utils/supabase.ts` | 8 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | CI env | `utils/supabase.ts` | 9 |
| `EXPO_PUBLIC_POSTHOG_KEY` | CI env | `utils/analytics.ts` | 9 |
| `EXPO_PUBLIC_GROQ_API_KEY` | CI env | `codemagic.yaml` | 25 |

As noted in a developer comment in `coachApi.ts:2`: *"EXPO_PUBLIC_* env vars ship in client bundle and are extractable."* This is acceptable for Supabase anon keys (Row Level Security protects data) but the Groq API key being in the client bundle is a security concern — anyone can extract it and use the API directly.

### 6.6 Sentry Data Filtering

`App.tsx:117-128` implements a `beforeSend` callback that strips breadcrumbs from screens matching the regex `/Masturbation|SexualFantasy|UrgeIntensity|RelationshipImpact|Relapse|Panic/` — good privacy practice for sensitive content.

---

## 7. App Store Metadata Cross-Check Prep

| Metadata | Value | Source | Line |
|---|---|---|---|
| **App Name** | Reclaim | `ios/reclaimapp/Info.plist` | 10 |
| **Bundle Identifier** | `com.reclaim.recovery` | `project.pbxproj` | 715, 753 |
| **CFBundleShortVersionString** | `1.0.0` | `ios/reclaimapp/Info.plist` | 22 |
| **CFBundleVersion (build)** | `84` (hardcoded in Info.plist) | `ios/reclaimapp/Info.plist` | 36 |
| **CURRENT_PROJECT_VERSION (Xcode)** | `71` (for all 4 targets) | `project.pbxproj` | 693+ |
| **App Category** | Productivity (`public.app-category.productivity`) | `project.pbxproj` | 702, 740 |
| **App Store Connect App ID** | `22289819888` | `eas.json` | 32 |
| **Apple Team ID** | `6W846KW4B3` | `eas.json` | 33 |
| **Apple ID** | `ark07q@gmail.com` | `eas.json` | 31 |
| **URL Schemes** | `reclaim`, `com.reclaim.recovery` | `ios/reclaimapp/Info.plist` | 30-31 |

**Discrepancy:** `Info.plist` has hardcoded build number `84`, but `project.pbxproj` has `CURRENT_PROJECT_VERSION = 71`. The three extensions use `$(CURRENT_PROJECT_VERSION)` (resolving to 71), meaning the main app's build number is out of sync with extensions. Use `agvtool` or EAS's `autoIncrement: true` to align them.

---

## 8. Common Apple Rejection Triggers — Explicit Checklist

### ❌ CRITICAL — Will Likely Cause Rejection

- [x] **Placeholder/lorem ipsum/test text in user-facing screens**
  - **Found.** `screens/LeaveRatingScreen.tsx:9-13` contains fabricated testimonials ("Michael R.", "Sarah Jenkins", "David K.") — violates Guideline 3.2. Remove or replace with real user reviews.
  - **Found.** `screens/LeaveRatingScreen.tsx:49` uses `'https://apps.apple.com/app/your-app-id'` — a placeholder URL that will open a broken link.
  - **Found.** `screens/SettingsScreen.tsx:476,741` — "Manage Subscription" button shows alert `'Coming soon in production build!'`. Apple rejects production builds with non-functional menu items.
  - **Found.** Illustration placeholders in `screens/EducationScreen1.tsx:73`, `screens/OnboardingCarouselScreen.tsx:119`, `screens/PanicButtonInfoScreen.tsx:444`.

- [x] **NSFamilyControlsUsageDescription missing**
  - **CRITICAL.** The app uses `FamilyControls` framework extensively but no Info.plist contains the required `NSFamilyControlsUsageDescription` key. This is a **guaranteed rejection**.

- [x] **Paywall not implemented; users can bypass**
  - `screens/OnboardingResultScreen.tsx:162` — `// TODO: SUPERWALL — trigger paywall here before navigating`. There is no gating; users navigate past the paywall point and can use the app indefinitely without purchasing.

- [x] **External payment links bypassing Apple IAP**
  - **NOT FOUND.** ✅ The Terms of Service correctly state all payments go through Apple IAP.
  - However, the contact email is a personal Gmail (`kaif64118@gmail.com`) used in TOS as the official business contact — this may raise legitimacy concerns with Apple review.

- [x] **Broken or dead-end navigation**
  - **Found.** Panic mode screens have `gestureEnabled: false` (intentional), but `SignInScreen.tsx` has no back button on error state — user can get stuck.
  - Several onboarding screens (`SetupCompleteScreen.tsx`, `PersonalizedPlanScreen.tsx`, `EducationScreen*.tsx`) have no back buttons and only navigate forward — acceptable for sequential flow, but verify this is intentional.

### ⚠️ HIGH — Should Be Addressed

- [x] **Beta/TestFlight/debug flags left enabled**
  - **Found (minor).** `GrantPermissionsScreen.tsx:3` has a testing comment `"For testing, use: npx expo run:ios (development build)"`. This is a code comment and won't appear in UI, but Apple may flag it during source code review if requested.

- [x] **Crash-prone patterns**
  - **Found.** `screens/PanicLockScreen.tsx:94,140` — `FamilyControlsBridge.stopPanicSession().catch(() => {})` — **empty catch swallows all errors** including native bridge crashes. This is in the critical panic flow.
  - **Found.** `utils/supabase.ts:8-9` — Force-unwrapped env vars (`!`) crash if missing at runtime.
  - **Found.** `ios/reclaimapp/FamilyPickerHostingController.swift:16` — `required init?(coder: NSCoder) { fatalError() }` — crashes if initialized via Storyboard.
  - **Found.** `ios/reclaimapp/FamilyControlsBridge.swift:336` — Force-unwrapped optional date.

- [x] **Unhandled promise rejections in critical flows**
  - Multiple fire-and-forget patterns exist across the codebase (documented in agent findings). The PanicLockScreen empty catch is the most concerning.

### ✅ Compliant

- [x] **Sign in with Apple offered when other login exists**
  - **Only Apple sign-in is implemented.** No Google, Facebook, or other third-party login exists. Fully compliant with Guideline 4.8.

- [x] **Hardcoded API keys in plaintext**
  - **NOT found in repo.** Secrets are injected via CI variables (`codemagic.yaml`). The `.env` file is not committed. However, `EXPO_PUBLIC_*` keys ship in the client bundle (developer is aware — see `coachApi.ts:2`).

- [x] **App icon/launch screen assets present and non-placeholder**
  - `assets/images/icon.png` ✅ exists. Standard Expo default icons — likely to be replaced before final submission.

### 📝 Additional Items

- [x] **Unused permissions** — `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSFaceIDUsageDescription` are defined but no corresponding code uses them. Either remove them or implement the features they're intended for.
- [x] **Personal Gmail in TOS** — `kaif64118@gmail.com` is listed as the business contact in `screens/TermsOfServiceScreen.tsx:70`. This may cause Apple to question the legitimacy of the business entity. Consider using a professional/business domain email.
- [x] **Filename typo** — `ios/ReclaimDeviceActivity/DeviceActivityMonnintor.swift` ("Monnintor" should be "Monitor"). Won't cause rejection but signals quality issues.
- [x] **commit41_BlockerScreen.tsx** and **commit41_FamilyControlsBridge.swift** — Old backup files left in the repo. Clean them up before submission.

---

## 9. Known Outstanding Items

*(Included verbatim from prior context — not investigated, do not change)*

- Privacy Policy URL is ready: https://mohd16kaif.github.io/reclaim-privacy-policy/
- Support URL is NOT yet ready — needs to be created before App Store Connect submission (Apple requires a working Support URL, separate from the privacy policy URL)

---

## Summary of Pre-Submission Action Items

| Priority | Item | Reference |
|---|---|---|
| 🚨 **BLOCKER** | Add `NSFamilyControlsUsageDescription` to Info.plist | Section 3.3 |
| 🚨 **BLOCKER** | Implement paywall / gating (replace TODO) | Section 4.2, `OnboardingResultScreen.tsx:162` |
| 🚨 **BLOCKER** | Remove or fix "Coming soon in production build" alert in Manage Subscription | Section 8, `SettingsScreen.tsx:476,741` |
| 🚨 **BLOCKER** | Remove fabricated testimonials from LeaveRatingScreen | Section 8, `LeaveRatingScreen.tsx:9-13` |
| 🚨 **BLOCKER** | Fix placeholder App Store URL in LeaveRatingScreen | Section 8, `LeaveRatingScreen.tsx:49` |
| 🚨 **BLOCKER** | Create Support URL and add to app metadata | Section 9 |
| ⚠️ **HIGH** | Remove or implement unused permissions (camera, microphone, FaceID) | Section 3.1 |
| ⚠️ **HIGH** | Fix empty `.catch(() => {})` in PanicLockScreen | Section 8, `PanicLockScreen.tsx:94,140` |
| ⚠️ **HIGH** | Replace personal Gmail in TOS with business email | Section 8, `TermsOfServiceScreen.tsx:70` |
| ⚠️ **HIGH** | Align build numbers: Info.plist (84) vs pbxproj (71) | Section 7 |
| ⚠️ **HIGH** | Remove dead ReclaimTunnel directory or revive the extension | Section 2.2 |
| ⚠️ **HIGH** | Clean up backup files (commit41_*) | Section 8 |
| ⚠️ **MEDIUM** | Fix force-unwrapped env var crashes | `supabase.ts:8-9`, `analytics.ts:9` |
| ⚠️ **MEDIUM** | Tighten vague NS*UsageDescription strings (camera, microphone, FaceID) | Section 3.1 |
| ⚠️ **MEDIUM** | Fix DeviceActivityMonnintor.swift filename typo | Section 8 |
