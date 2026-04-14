// Note: Push notification warnings in Expo Go are expected.
// Real notifications will work in production build.
// For testing, use: npx expo run:ios (development build)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TypeScript types for navigation
type RootStackParamList = {
  GrantPermissions: any;
  SetupComplete: any;
};

type ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "GrantPermissions"
>;

const { width } = Dimensions.get("window");

const GrantPermissionsScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "GrantPermissions">>();
  const params = route.params || {};

  const [notificationStatus, setNotificationStatus] = useState<Notifications.PermissionStatus>(
    Notifications.PermissionStatus.UNDETERMINED
  );
  const [vpnStatus, setVpnStatus] = useState<
    'undetermined' | 'granted' | 'denied'
  >('undetermined');
  const [screenTimeStatus, setScreenTimeStatus] = useState<
    'undetermined' | 'granted' | 'denied'
  >('undetermined');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status: nStatus } = await Notifications.getPermissionsAsync();
    setNotificationStatus(nStatus);
  };

  const handleGrantPermissions = async () => {
    let finalNStatus = notificationStatus;

    // 1. Handle Notifications
    if (notificationStatus !== Notifications.PermissionStatus.GRANTED) {
      if (notificationStatus === Notifications.PermissionStatus.DENIED) {
        showSettingsAlert("Notifications");
      } else {
        const { status } = await Notifications.requestPermissionsAsync();
        finalNStatus = status;
        setNotificationStatus(status);
      }
    }

    // Navigate if notifications are at a terminal state
    if (
      finalNStatus === Notifications.PermissionStatus.GRANTED ||
      notificationStatus === Notifications.PermissionStatus.DENIED
    ) {
      navigation.navigate("SetupComplete" as any, params);
    }
  };

  const showSettingsAlert = (permissionName: string) => {
    Alert.alert(
      `${permissionName} Permission Denied`,
      `To protect you effectively, Reclaim needs ${permissionName} access. Please enable it in Settings.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Settings", onPress: () => Linking.openSettings() },
      ]
    );
  };

  const handleSkip = () => {
    // Navigate even if skipped, as per flow requirements
    navigation.navigate("SetupComplete" as any, params);
  };

  const PermissionCard = ({
    icon,
    label,
    description,
    why,
    status,
    onPress,
  }: {
    icon: string;
    label: string;
    description: string;
    why: string;
    status: Notifications.PermissionStatus | 'undetermined' | 'granted' | 'denied';
    onPress: () => void;
  }) => {
    const isGranted = status === "granted";
    const isDenied = status === "denied";

    return (
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>{icon}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.whyText}>Why: {why}</Text>
        </View>
        <TouchableOpacity
          style={styles.statusIndicator}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isGranted ? "checkmark-circle" : isDenied ? "settings-outline" : "add-circle-outline"}
            size={28}
            color={isGranted ? "#10B981" : isDenied ? "#EF4444" : "#D1D5DB"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Grant Permissions</Text>
            <Text style={styles.subtitle}>
              These permissions power Reclaim's protection features. You can always change them later.
            </Text>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.cardsContainer}
            showsVerticalScrollIndicator={false}
          >
            <PermissionCard
              icon="📲"
              label="Notifications"
              description="Daily check-in reminders and milestone celebrations"
              why="Get timely support when you need it most"
              status={notificationStatus}
              onPress={() => {
                if (notificationStatus === "denied") Linking.openSettings();
                else handleGrantPermissions();
              }}
            />

            <PermissionCard
              icon="🛡️"
              label="VPN Configuration"
              description="Blocks adult content system-wide across every browser and app"
              why="Core protection — without this the DNS shield cannot work"
              status={vpnStatus}
              onPress={() => {
                if (vpnStatus === 'denied') {
                  Linking.openSettings();
                } else {
                  // VPN permission is requested when user enables shield
                  // from the Blocker tab — not here
                  Alert.alert(
                    'VPN Permission',
                    'You will be asked for VPN permission when you enable the Shield from the Blocker tab.',
                    [{ text: 'Got it' }]
                  );
                }
              }}
            />

            <PermissionCard
              icon="⏱️"
              label="Screen Time"
              description="Temporarily blocks distracting apps during Panic Mode sessions"
              why="Panic protection — blocks Instagram, YouTube, Safari during urges"
              status={screenTimeStatus}
              onPress={() => {
                if (screenTimeStatus === 'denied') {
                  Linking.openSettings();
                } else {
                  Alert.alert(
                    'Screen Time Permission',
                    'You will be asked for Screen Time permission the first time you use the Panic Button.',
                    [{ text: 'Got it' }]
                  );
                }
              }}
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.privacyText}>
              🔒 Your data stays private and encrypted
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGrantPermissions}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {notificationStatus === "granted" ? "Continue" : "Grant Permissions"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
     
            </TouchableOpacity>
            
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default GrantPermissionsScreen;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  emoji: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 4,
  },
  whyText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  statusIndicator: {
    padding: 4,
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
  privacyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#000000",
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
});