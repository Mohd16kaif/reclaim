import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  Settings: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

type CoachMode = 'calm' | 'strict' | 'distractor';

interface ModeConfig {
  key: CoachMode;
  emoji: string;
  name: string;
  coachName: string;
  coachGender: 'male' | 'female';
  subtitle: string;
  traits: string[];
}

const MODES: ModeConfig[] = [
  {
    key: 'calm',
    emoji: '🌿',
    name: 'Calm Mode',
    coachName: 'Sofia',
    coachGender: 'female',
    subtitle: 'SUPPORTIVE FRIEND',
    traits: [
      'Listens patiently',
      'Reassures gently',
      'Uses a slow grounding tone',
      'Offers emotional support',
    ],
  },
  {
    key: 'strict',
    emoji: '🛡️',
    name: 'Strict Mode',
    coachName: 'Marcus',
    coachGender: 'male',
    subtitle: 'ACCOUNTABILITY COACH',
    traits: [
      'Challenges excuses',
      'Pushes for discipline',
      'Sets clear goals',
      'Reinforces accountability',
    ],
  },
  {
    key: 'distractor',
    emoji: '🎭',
    name: 'Distractor Mode',
    coachName: 'Zane',
    coachGender: 'male',
    subtitle: 'LIGHT & FUNNY',
    traits: [
      'Uses light humor',
      'Breaks the urge mood',
      'Sends witty responses',
      'Redirects attention quickly',
    ],
  },
];

const AICoachModeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedMode, setSelectedMode] = useState<CoachMode>('calm');

  // Load saved mode on mount
  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem('aiCoachMode');
      if (saved && ['calm', 'strict', 'distractor'].includes(saved)) {
        setSelectedMode(saved as CoachMode);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('aiCoachMode', selectedMode);
    Alert.alert('Saved', 'Your AI Coach mode has been updated.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Coach Mode</Text>
          <View style={styles.backButton} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Choose how your AI Coach responds during urges.
        </Text>

        {/* Mode Cards */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {MODES.map((mode) => {
            const isSelected = selectedMode === mode.key;
            return (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.modeCard,
                  isSelected && styles.modeCardSelected,
                ]}
                onPress={() => setSelectedMode(mode.key)}
                activeOpacity={0.7}
              >
                {/* Top Row: Emoji + Name + Radio */}
                <View style={styles.modeHeader}>
                  <View style={styles.modeTitleContainer}>
                    <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                    <View>
                      <Text style={styles.modeName}>{mode.name}</Text>
                      <Text style={styles.coachNameTag}>
                        with {mode.coachName} {mode.coachGender === 'female' ? '👩' : '👨'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>

                {/* Subtitle */}
                <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>

                {/* Traits List */}
                <View style={styles.traitsContainer}>
                  {mode.traits.map((trait, index) => (
                    <View key={index} style={styles.traitRow}>
                      <Text style={styles.traitDot}>·</Text>
                      <Text style={styles.traitText}>{trait}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Bottom Spacer for button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default AICoachModeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 16,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modeCardSelected: {
    borderColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  modeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  coachNameTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
    marginTop: 2,
  },
  modeSubtitle: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
    marginLeft: 28,
    letterSpacing: 0.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#000000',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  traitsContainer: {
    marginTop: 12,
    marginLeft: 28,
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  traitDot: {
    fontSize: 13,
    color: '#888888',
    marginRight: 6,
    lineHeight: 18,
  },
  traitText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
