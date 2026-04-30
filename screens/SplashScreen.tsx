import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { NativeModules } from "react-native";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const SPLASH_DURATION_MS = 2000;

async function getLastCrash(): Promise<string | null> {
  try {
    const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
    return await AsyncStorage.getItem('lastCrashLog');
  } catch { return null; }
}
const logoImage = require("../assets/images/reclaim-logo-app.png");

export default function SplashScreen(): JSX.Element {
  const navigation = useNavigation<SplashScreenNavigationProp>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Replace the splash screen so it isn't in the back stack
      navigation.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [navigation]);

  if (crashLog) {
    return (
      <SafeAreaView style={{flex:1,backgroundColor:'red',padding:30}}>
        <Text style={{color:'white',fontSize:16,fontWeight:'bold',marginTop:60}}>PREVIOUS CRASH:</Text>
        <Text style={{color:'white',fontSize:11,marginTop:10}}>{crashLog}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
});
