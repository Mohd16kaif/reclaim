import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  BackHandler,
  Image,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fireBlockingActivated } from '../utils/notificationManager';

const { FamilyControlsBridge } = NativeModules;

type RootStackParamList = {
  PanicShield: undefined;
  PanicActivated: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'PanicShield'>;

const PanicShieldScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      'Panic mode active. Triple-tap home button to exit if needed.'
    );
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    });
  }, [opacityAnim, pulseAnim, rotateAnim, scaleAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const initPanic = async () => {
      const [uninstallPreventionEnabled, panicAppSelectionEnabled] = await Promise.all([
        AsyncStorage.getItem('@reclaim_uninstall_prevention_enabled'),
        AsyncStorage.getItem('@reclaim_panic_app_selection_enabled'),
      ]);

      const uninstallOn = uninstallPreventionEnabled === 'true';
      const appsOn = panicAppSelectionEnabled === 'true';

      if (!uninstallOn || !appsOn) {
        let message: string;
        if (!uninstallOn && !appsOn) {
          message = 'Turn on Uninstall Prevention and Block Apps During Panic in Settings to use Panic Mode.';
        } else if (!uninstallOn) {
          message = 'Turn on Uninstall Prevention in Settings to use Panic Mode.';
        } else {
          message = 'Turn on Block Apps During Panic in Settings to use Panic Mode.';
        }

        Alert.alert(
          'Setup Required',
          message,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Go to Settings',
              onPress: () => {
                navigation.goBack();
                // @ts-ignore - parent navigator handles Settings route
                navigation.navigate('Profile' as never);
              },
            },
          ]
        );
        return;
      }

      const authResult = await FamilyControlsBridge.getAuthorizationStatus();
      const isAuthorized = authResult?.status === 'authorized';

      if (!isAuthorized) {
        Alert.alert(
          'Permission Lost',
          'Screen Time access was revoked. Please re-enable Uninstall Prevention in Settings.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const appsResult = await FamilyControlsBridge.hasSelectedApps();
      if (!appsResult?.hasApps) {
        try {
          await FamilyControlsBridge.presentAppPicker();
          await AsyncStorage.setItem('panicAppsSelected', 'true');
        } catch {}
      }

      proceedToPanic(true);
    };

    const proceedToPanic = async (startBlocking: boolean) => {
      if (startBlocking) {
        const saved = await AsyncStorage.getItem('defaultPanicDuration');
        const durationSeconds = saved ? parseInt(saved, 10) : 1800;
        await FamilyControlsBridge.startPanicSession(durationSeconds);
      }

      await fireBlockingActivated();

      setTimeout(() => {
        navigation.replace('PanicActivated');
      }, 3000);
    };

    initPanic();
  }, [navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        rotateAnim.setValue(0);
        pulseAnim.setValue(1);
      };
    }, [pulseAnim, rotateAnim])
  );

  const combinedScale = Animated.multiply(scaleAnim, pulseAnim);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Image
            source={require('../assets/images/reclaim-header.png')}
            style={{ width: 140, height: 40, resizeMode: 'contain' }}
          />
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.shieldWrapper}>
            <Animated.View
              style={[
                styles.ring,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: combinedScale }, { rotate }],
                },
              ]}
            />
            <Animated.View
              style={{
                opacity: opacityAnim,
                transform: [{ scale: combinedScale }],
              }}
            >
              <MaterialCommunityIcons name="shield-check" size={160} color="#000000" />
            </Animated.View>
          </View>

          <Text style={styles.heading}>Your Shield is Engaging...</Text>
          <Text style={styles.subtext}>Please hold tight. Activating protection now.</Text>
          <Text style={styles.subtextSecondary}>Securing your environment...</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default PanicShieldScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  brand: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#000000',
    textTransform: 'uppercase',
  },
  bellButton: {
    position: 'absolute',
    right: 20,
    top: 8,
    padding: 4,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  shieldWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  ring: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
  },
  subtextSecondary: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
  },
});