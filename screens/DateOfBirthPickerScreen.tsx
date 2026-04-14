import { Picker } from "@react-native-picker/picker";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  OnboardingQuestion: {
    questionNumber?: number;
    totalQuestions?: number;
  };
  GenderSelection: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
  };
  DateOfBirthPicker: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
  };
  ReferralSource: {
    questionNumber?: number;
    totalQuestions?: number;
    userName?: string;
    selectedGender?: string;
    dateOfBirth?: string;
  };
  Home: undefined;
  SignIn: undefined;
};

type DateOfBirthNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DateOfBirthPicker"
>;

type DateOfBirthRouteProp = RouteProp<RootStackParamList, "DateOfBirthPicker">;

const ANIMATION_DURATION = 400;
const DEFAULT_TOTAL_QUESTIONS = 25;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Generate years from 1940 to current year
const YEARS_ARRAY: number[] = (() => {
  const currentYear = new Date().getFullYear();
  const startYear = 1940;
  return Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  ).reverse();
})();

const generateDays = (month: number, year: number): number[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
};

const DateOfBirthPickerScreen: React.FC = () => {
  const navigation = useNavigation<DateOfBirthNavigationProp>();
  const route = useRoute<DateOfBirthRouteProp>();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const questionNumber = route.params?.questionNumber ?? 3;
  const totalQuestions =
    route.params?.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;
  const userName = route.params?.userName ?? "";
  const selectedGender = route.params?.selectedGender ?? "";

  const [selectedMonth, setSelectedMonth] = useState<number>(7); // August (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number>(6);
  const [selectedYear, setSelectedYear] = useState<number>(2009);
  const [days, setDays] = useState<number[]>(generateDays(7, 2009));

  const progress = Math.min(
    1,
    Math.max(0, questionNumber / totalQuestions || 0)
  );

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    // Update days when month or year changes
    const newDays = generateDays(selectedMonth, selectedYear);
    setDays(newDays);

    // If selected day is greater than days in new month, adjust it
    if (selectedDay > newDays.length) {
      setSelectedDay(newDays.length);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    // Format date of birth as string (YYYY-MM-DD)
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}-${String(selectedDay).padStart(2, "0")}`;

    // Navigate to referral source screen (question 4)
    navigation.navigate("ReferralSource", {
      questionNumber: 4,
      totalQuestions: totalQuestions,
      userName: userName,
      selectedGender: selectedGender,
      dateOfBirth: formattedDate,
    });
  };

  const handleMonthChange = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMonth(value);
  };

  const handleDayChange = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDay(value);
  };

  const handleYearChange = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedYear(value);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header with back button + progress bar on one line */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={handleBack}
          >
            <Text style={styles.backArrow}>{"←"}</Text>
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={styles.heading}>When were you born?</Text>
          <Text style={styles.subheading}>
            This will be used to calibrate your custom plan
          </Text>

          {/* Native Wheel Picker */}
          <View style={styles.pickerContainer}>
            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={handleMonthChange}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {MONTHS.map((month, index) => (
                  <Picker.Item key={index} label={month} value={index} />
                ))}
              </Picker>
            </View>

            {/* Day Picker */}
            <View style={styles.pickerColumn}>
              <Picker
                selectedValue={selectedDay}
                onValueChange={handleDayChange}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={String(day)} value={day} />
                ))}
              </Picker>
            </View>

            {/* Year Picker */}
            <View style={styles.pickerColumn}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={handleYearChange}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {YEARS_ARRAY.map((year) => (
                  <Picker.Item key={year} label={String(year)} value={year} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Bottom button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DateOfBirthPickerScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 20,
    color: "#000000",
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "#E5E5E5",
    marginLeft: 12,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
    marginBottom: 32,
  },
  pickerContainer: {
    flexDirection: "row",
    height: 200,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
  },
  pickerColumn: {
    flex: 1,
  },
  picker: {
    width: "100%",
    height: "100%",
  },
  pickerItem: {
    height: 200,
    fontSize: 18,
    color: "#000000",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: "#000000",
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
