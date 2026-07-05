import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  signInWithApple,
  restoreFromSupabase,
  AppleSignInResult,
} from "../utils/supabase";

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  OnboardingQuestion: { questionNumber: number; totalQuestions: number };
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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const result: AppleSignInResult = await signInWithApple();

    if (result.status === "linked") {
      navigation.replace("OnboardingQuestion", {
        questionNumber: 1,
        totalQuestions: 23,
      });
    } else if (result.status === "signed_in_existing_account") {
      await restoreFromSupabase();
      navigation.replace("MainDashboard");
    } else if (result.status === "error") {
      setIsLoading(false);
      if (result.message === "User canceled sign in") {
        setErrorMessage("Sign in was canceled.");
      } else {
        setErrorMessage(result.message);
      }
    }
  };

  useEffect(() => {
    runSignIn();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#000000" />
        ) : errorMessage !== null ? (
          <>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={runSignIn}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </>
        ) : null}
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
  errorText: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#000000",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
