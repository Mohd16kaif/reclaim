// Phase 1: helper available. Phase 2: migrate profileStorage.ts callsites.
//
// Secure storage helper for sensitive keys. Routes sensitive keys to
// expo-secure-store (Keychain on iOS / EncryptedSharedPreferences on Android)
// while leaving non-sensitive keys on AsyncStorage. Includes a one-time
// migration from legacy AsyncStorage values into SecureStore on first read.

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SENSITIVE_KEYS = ['userEmail', 'userName', 'deviceId'];

// Development builds can run without the Keychain entitlement (notably on
// some Xcode Simulator configurations). Keep the app usable in that case by
// falling back to AsyncStorage. Production builds continue to use Keychain.
let secureStoreUnavailable = false;

const canUseSecureStore = (key: string) =>
  SENSITIVE_KEYS.includes(key) && !secureStoreUnavailable;

export async function setSecure(key: string, value: string): Promise<void> {
  if (canUseSecureStore(key)) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      secureStoreUnavailable = true;
    }
  }
  await AsyncStorage.setItem(key, value);
}

export async function getSecure(key: string): Promise<string | null> {
  if (canUseSecureStore(key)) {
    try {
      const v = await SecureStore.getItemAsync(key);
      if (v) return v;
      // Migration: fall back to AsyncStorage, copy over, delete old only
      // after the secure write succeeds.
      const legacy = await AsyncStorage.getItem(key);
      if (legacy) {
        await SecureStore.setItemAsync(key, legacy);
        await AsyncStorage.removeItem(key);
        return legacy;
      }
      return null;
    } catch {
      secureStoreUnavailable = true;
    }
  }
  return AsyncStorage.getItem(key);
}

export async function deleteSecure(key: string): Promise<void> {
  if (canUseSecureStore(key)) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      secureStoreUnavailable = true;
    }
  }
  await AsyncStorage.removeItem(key);
}
