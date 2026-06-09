import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BROWSER_SETUP_KEY = 'blocker_browser_setup_done';

interface Props {
  onSetupComplete: () => void;
}

export default function BrowserBlockerSetup({ onSetupComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { FamilyControlsBridge } = NativeModules;

      // Open FamilyActivityPicker so user selects browser apps/categories
      // The picker returns tokenData which we save for future blocker use
      const result = await FamilyControlsBridge.presentAppPicker();

      if (result.cancelled) {
        setLoading(false);
        return;
      }

      if (result.tokenData) {
        await FamilyControlsBridge.saveBrowserCategoryTokens(result.tokenData);
        await AsyncStorage.setItem(BROWSER_SETUP_KEY, 'true');
        onSetupComplete();
      }
    } catch (e) {
      Alert.alert(
        'Setup Failed',
        'Could not complete browser setup. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>One-time Browser Setup</Text>
      <Text style={styles.subtitle}>
        To block adult content on Chrome, Firefox and other browsers,
        Reclaim needs you to select those browsers once.{'\n\n'}
        On the next screen, select Chrome, Firefox, Brave, DuckDuckGo
        — any browser you use other than Safari.{'\n\n'}
        YouTube, WhatsApp and Reddit will NOT be affected.
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3366FF" style={{ marginTop: 24 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSetup}>
          <Text style={styles.buttonText}>Select Browsers to Block</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#AAAAAA',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#3366FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { BROWSER_SETUP_KEY };
