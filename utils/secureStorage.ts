// Phase 1: helper available. Phase 2: migrate profileStorage.ts callsites.
//
// Secure storage helper for sensitive keys. Routes sensitive keys to
// expo-secure-store (Keychain on iOS / EncryptedSharedPreferences on Android)
// while leaving non-sensitive keys on AsyncStorage. Includes a one-time
// migration from legacy AsyncStorage values into SecureStore on first read.

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SENSITIVE_KEYS = ['userEmail', 'userName', 'deviceId'];

export async function setSecure(key: string, value: string): Promise<void> {
  if (SENSITIVE_KEYS.includes(key)) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

export async function getSecure(key: string): Promise<string | null> {
  if (SENSITIVE_KEYS.includes(key)) {
    const v = await SecureStore.getItemAsync(key);
    if (v) return v;
    // Migration: fall back to AsyncStorage, copy over, delete old
    const legacy = await AsyncStorage.getItem(key);
    if (legacy) {
      await SecureStore.setItemAsync(key, legacy);
      await AsyncStorage.removeItem(key);
      return legacy;
    }
    return null;
  }
  return AsyncStorage.getItem(key);
}

export async function deleteSecure(key: string): Promise<void> {
  if (SENSITIVE_KEYS.includes(key)) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}
