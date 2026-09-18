import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router/react-navigation";
import { StackNavigationProp } from "expo-router/js-stack";
import {
  getOrCreateUserId,
  signInWithApple,
  restoreFromSupabase,
  AppleSignInResult,
} from "../utils/supabase";

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  OnboardingQuestion: { questionNumber: number; totalQuestions: number };
  OnboardingResult: undefined;
  Home: undefined;
  SignIn: undefined;
  MainDashboard: undefined;
};

type SignInScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SignIn"
>;

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    // Ensure an anonymous session exists before linking Apple identity —
    // linkIdentity requires an active session's JWT to attach to.
    await getOrCreateUserId();

    const result: AppleSignInResult = await signInWithApple();

    if (result.status === "linked") {
      navigation.replace("OnboardingQuestion", {
        questionNumber: 1,
        totalQuestions: 23,
      });
    } else if (result.status === "signed_in_existing_account") {
      await restoreFromSupabase();
      navigation.replace("OnboardingResult");
    } else if (result.status === "error") {
      setIsLoading(false);
      if (result.message === "User canceled sign in") {
        setErrorMessage("Sign in was canceled.");
      } else {
        setErrorMessage(result.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign in to Reclaim</Text>
        <Text style={styles.subtitle}>
          Use your Apple ID to securely restore your account and progress.
        </Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#000000" />
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={26}
            style={styles.appleButton}
            onPress={runSignIn}
          />
        )}
        {errorMessage !== null && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    </SafeAreaView>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#111111",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: "center",
  },
  appleButton: {
    height: 52,
    width: "100%",
  },
  errorText: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    marginTop: 20,
  },
});
