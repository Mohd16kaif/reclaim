import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
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

interface DurationOption {
  label: string;
  seconds: number;
}

const DURATION_OPTIONS: DurationOption[] = [
  { label: '1 Minute (Test Only)', seconds: 60 }, // 🧪 TEST MODE
  { label: '15 Minutes', seconds: 900 },
  { label: '30 Minutes', seconds: 1800 },
  { label: '45 Minutes', seconds: 2700 },
  { label: '1 Hour', seconds: 3600 },
  { label: '1 Hour 30 Minutes', seconds: 5400 },
  { label: '2 Hours', seconds: 7200 },
];

const DefaultPanicDurationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedDuration, setSelectedDuration] = useState<number>(1800); // default 30 min

  // Load saved value on mount
  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem('defaultPanicDuration');
      if (saved) {
        setSelectedDuration(parseInt(saved, 10));
      }
    };
    load();
  }, []);

  // Handle selection
  const handleSelect = async (seconds: number) => {
    setSelectedDuration(seconds);
    await AsyncStorage.setItem('defaultPanicDuration', seconds.toString());
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
          <Text style={styles.headerTitle}>Default Panic Duration</Text>
          <TouchableOpacity style={styles.infoButton} activeOpacity={0.7}>
            <Ionicons name="time-outline" size={22} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          This duration activates automatically when Panic Protection is triggered.
        </Text>

        {/* Options List */}
        <View style={styles.optionsContainer}>
          {DURATION_OPTIONS.map((option, index) => {
            const isSelected = selectedDuration === option.seconds;
            const isLast = index === DURATION_OPTIONS.length - 1;

            return (
              <TouchableOpacity
                key={option.seconds}
                style={styles.optionRow}
                onPress={() => handleSelect(option.seconds)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default DefaultPanicDurationScreen;

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
  infoButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 24,
    lineHeight: 18,
  },
  optionsContainer: {
    marginTop: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLabel: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  optionLabelSelected: {
    fontWeight: '700',
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
});
