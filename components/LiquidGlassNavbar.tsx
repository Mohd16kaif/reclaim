import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface LiquidGlassNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ['Home', 'Stats', 'Blocker', 'AICoach', 'Profile'] as const;
type TabType = typeof TABS[number];

const LiquidGlassNavbar: React.FC<LiquidGlassNavbarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [blurIntensity, setBlurIntensity] = useState(60);

  // Load profile avatar
  useEffect(() => {
    const loadAvatar = async () => {
      const avatar = await AsyncStorage.getItem('userAvatarImageData');
      if (avatar) setProfileAvatar(avatar);
    };
    loadAvatar();
  }, []);

  // Scale animations for each tab
  const scaleAnims = useRef(
    TABS.reduce((acc, tab) => {
      acc[tab] = new Animated.Value(1);
      return acc;
    }, {} as Record<TabType, Animated.Value>)
  ).current;

  const pulseBlur = () => {
    setBlurIntensity(90);
    setTimeout(() => setBlurIntensity(60), 300);
  };

  const handleTabPress = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Bounce animation
    Animated.sequence([
      Animated.spring(scaleAnims[tab], {
        toValue: 0.85,
        useNativeDriver: true,
        speed: 50,
        bounciness: 10,
      }),
      Animated.spring(scaleAnims[tab], {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 14,
      }),
    ]).start();

    // Blur pulse
    pulseBlur();

    onTabChange(tab);
  };

  const getIconName = (tab: TabType, isActive: boolean): keyof typeof Ionicons.glyphMap => {
    switch (tab) {
      case 'Home':
        return isActive ? 'home' : 'home-outline';
      case 'Stats':
        return isActive ? 'bar-chart' : 'bar-chart-outline';
      case 'Blocker':
        return isActive ? 'ban' : 'ban-outline';
      case 'AICoach':
        return isActive ? 'person' : 'person-outline';
      case 'Profile':
        return 'person';
      default:
        return 'home-outline';
    }
  };

  return (
    <View style={styles.navbarWrapper}>
      <BlurView
        intensity={blurIntensity}
        tint="light"
        style={styles.navbarBlur}
      >
        <View style={styles.navbarContent}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const isProfile = tab === 'Profile';

            if (isProfile) {
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.navbarProfileTab}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.7}
                >
                  <Animated.View style={{ transform: [{ scale: scaleAnims[tab] }] }}>
                    <View style={[styles.profileCircle, isActive && styles.profileCircleActive]}>
                      {profileAvatar ? (
                        <Image
                          source={{ uri: `data:image/jpeg;base64,${profileAvatar}` }}
                          style={styles.profileCircleImage}
                        />
                      ) : (
                        <Ionicons name="person" size={20} color="#FFFFFF" />
                      )}
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={tab}
                style={styles.navbarTab}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                <Animated.View style={{ transform: [{ scale: scaleAnims[tab] }] }}>
                  <Ionicons
                    name={getIconName(tab, isActive)}
                    size={24}
                    color={isActive ? '#000000' : 'rgba(0,0,0,0.45)'}
                  />
                  <Text style={[styles.navbarTabLabel, { color: isActive ? '#000000' : 'rgba(0,0,0,0.45)' }]}>
                    {tab === 'AICoach' ? 'AI Coach' : tab}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  navbarWrapper: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  navbarBlur: {
    borderRadius: 999,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        backgroundColor: 'rgba(240,240,240,0.95)',
      },
    }),
  },
  navbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 999,
  },
  navbarTab: {
    width: 64,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbarTabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  navbarProfileTab: {
    width: 64,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  profileCircleActive: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  profileCircleImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});

export default LiquidGlassNavbar;
