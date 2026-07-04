import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { signInWithApple, AppleSignInResult } from '../utils/supabase';

const SignInScreen: React.FC = () => {
  const [result, setResult] = useState<AppleSignInResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    setLoading(true);
    setResult(null);
    const res = await signInWithApple();
    setResult(res);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>
          This is a placeholder screen. You can add your sign-in form here.
        </Text>
        <TouchableOpacity
          style={styles.appleButton}
          onPress={handleAppleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.appleButtonText}>Test Apple Sign In</Text>
          )}
        </TouchableOpacity>
        {result && (
          <Text style={styles.resultText}>
            {result.status}
            {result.status === "error" && result.message ? `: ${result.message}` : ""}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
  },
  appleButton: {
    marginTop: 32,
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultText: {
    marginTop: 20,
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
});


