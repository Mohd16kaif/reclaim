import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '../components/ui/icon-symbol';
import { getAvatarBase64Jpeg, setAvatarBase64Jpeg } from '../utils/profileStorage';
import { useUserProfile } from '../hooks/useUserProfile';
import { loadUserProgress } from '../utils/userProgress';

type RootStackParamList = {
  ProfileView: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'ProfileView'>;

const Sheet = ({
  title,
  value,
  onChangeText,
  onCancel,
  onSave,
  keyboardType,
}: {
  title: string;
  value: string;
  onChangeText: (t: string) => void;
  onCancel: () => void;
  onSave: () => void;
  keyboardType?: 'default' | 'email-address';
}) => {
  return (
    <View style={styles.sheetBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder=""
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
            autoCorrect={keyboardType !== 'email-address'}
            keyboardType={keyboardType}
            style={styles.sheetInput}
          />
          <View style={styles.sheetButtonsRow}>
            <TouchableOpacity style={[styles.sheetButton, styles.sheetButtonSecondary]} onPress={onCancel} activeOpacity={0.8}>
              <Text style={[styles.sheetButtonText, styles.sheetButtonTextSecondary]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetButton, styles.sheetButtonPrimary]} onPress={onSave} activeOpacity={0.8}>
              <Text style={[styles.sheetButtonText, styles.sheetButtonTextPrimary]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const ProfileView: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const { userName, userEmail, memberSinceDate, updateUserName, updateUserEmail, loadProfile } = useUserProfile();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  const [showEditName, setShowEditName] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');

  const avatarUri = useMemo(() => {
    if (!avatarBase64) return null;
    return `data:image/jpeg;base64,${avatarBase64}`;
  }, [avatarBase64]);

  const load = useCallback(async () => {
    await loadProfile();

    const [progress, avatar] = await Promise.all([
      loadUserProgress(),
      getAvatarBase64Jpeg(),
    ]);

    setCurrentStreak(progress.currentStreak);
    setLongestStreak(progress.longestStreak);
    setAvatarBase64(avatar);
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePickAvatar = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status === 'granted') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const imageUri = asset.uri;
      const base64 = asset.base64 ?? null;

      await AsyncStorage.setItem('@reclaim_profile_image', imageUri);

      if (base64) {
        setAvatarBase64(base64);
        await setAvatarBase64Jpeg(base64);
      }
      return;
    }

    if (perm.status === 'denied') {
      Alert.alert(
        'Permission Required',
        'Please allow photo access in Settings to update your profile picture',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    if (perm.status === 'undetermined') {
      const secondRequest = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (secondRequest.status === 'granted') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });

        if (result.canceled) return;

        const asset = result.assets?.[0];
        if (!asset) return;

        const imageUri = asset.uri;
        const base64 = asset.base64 ?? null;

        await AsyncStorage.setItem('@reclaim_profile_image', imageUri);

        if (base64) {
          setAvatarBase64(base64);
          await setAvatarBase64Jpeg(base64);
        }
      }
    }
  }, []);

  const openEditName = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingName(userName);
    setShowEditName(true);
  }, [userName]);

  const openEditEmail = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEmail(userEmail);
    setShowEditEmail(true);
  }, [userEmail]);

  const saveName = useCallback(async () => {
    const next = editingName.trim();
    await updateUserName(next);
    setShowEditName(false);
  }, [editingName, updateUserName]);

  const saveEmail = useCallback(async () => {
    const next = editingEmail.trim();
    await updateUserEmail(next);
    setShowEditEmail(false);
  }, [editingEmail, updateUserEmail]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navBack}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={18} color="#000000" />
            <Text style={styles.navBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Profile</Text>
          <View style={styles.navRightSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <IconSymbol name="person.fill" size={44} color="#FFFFFF" />
                )}
              </View>
              <TouchableOpacity style={styles.cameraButton} onPress={handlePickAvatar} activeOpacity={0.85}>
                <View style={styles.cameraButtonInner}>
                  <IconSymbol name="camera.fill" size={13} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{userName || '—'}</Text>
            <Text style={styles.memberSince}>
              {memberSinceDate ? `Member since ${memberSinceDate}` : ''}
            </Text>
          </View>

          {/* Streak stats card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowEmoji}>🔥</Text>
                <Text style={styles.rowLabel}>Current Streak</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{currentStreak} days</Text>
                <Text style={styles.rowSub}>Keep going</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardRow}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowEmoji}>🏆</Text>
                <Text style={styles.rowLabel}>Longest Streak</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{longestStreak} days</Text>
                <Text style={styles.rowSub}>Personal best</Text>
              </View>
            </View>
          </View>

          {/* Editable fields card */}
          <View style={[styles.card, { marginTop: 20 }]}>
            <TouchableOpacity style={styles.cardRow} onPress={openEditName} activeOpacity={0.7}>
              <Text style={styles.rowLabel}>Name</Text>
              <View style={styles.editRight}>
                <Text style={styles.editValue}>{userName || ''}</Text>
                <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.cardRow} onPress={openEditEmail} activeOpacity={0.7}>
              <Text style={styles.rowLabel}>Email</Text>
              <View style={styles.editRight}>
                <Text style={styles.editValue}>{userEmail || ''}</Text>
                <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showEditName} transparent animationType="slide" onRequestClose={() => setShowEditName(false)}>
        <Sheet
          title="Edit Name"
          value={editingName}
          onChangeText={setEditingName}
          onCancel={() => setShowEditName(false)}
          onSave={saveName}
        />
      </Modal>

      <Modal visible={showEditEmail} transparent animationType="slide" onRequestClose={() => setShowEditEmail(false)}>
        <Sheet
          title="Edit Email"
          value={editingEmail}
          onChangeText={setEditingEmail}
          onCancel={() => setShowEditEmail(false)}
          onSave={saveEmail}
          keyboardType="email-address"
        />
      </Modal>
    </View>
  );
};

export default ProfileView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },

  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navBack: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 90 },
  navBackText: { fontSize: 17, color: '#000000' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#000000' },
  navRightSpacer: { width: 90 },

  scrollContent: { paddingBottom: 24 },

  avatarSection: {
    alignItems: 'center',
    paddingTop: 24,
  },
  avatarWrapper: { position: 'relative', width: 100, height: 100, marginBottom: 14 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  cameraButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonInner: { justifyContent: 'center', alignItems: 'center' },

  userName: { fontSize: 22, fontWeight: '700', color: '#000000' },
  memberSince: { marginTop: 6, fontSize: 13, fontWeight: '400', color: '#888888' },

  card: {
    marginTop: 28,
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rowEmoji: { fontSize: 15 },
  rowLabel: { fontSize: 15, fontWeight: '400', color: '#000000' },
  rowRight: { alignItems: 'flex-end' },
  rowValue: { fontSize: 16, fontWeight: '700', color: '#000000' },
  rowSub: { marginTop: 3, fontSize: 12, fontWeight: '400', color: '#888888' },
  divider: { height: 1, backgroundColor: '#E5E5E5' },

  editRight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12 },
  editValue: { fontSize: 14, color: '#8E8E93' },

  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#000000', textAlign: 'center', marginBottom: 12 },
  sheetInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000000',
  },
  sheetButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  sheetButton: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetButtonPrimary: { backgroundColor: '#000000' },
  sheetButtonSecondary: { backgroundColor: '#F3F4F6' },
  sheetButtonText: { fontSize: 16, fontWeight: '600' },
  sheetButtonTextPrimary: { color: '#FFFFFF' },
  sheetButtonTextSecondary: { color: '#000000' },
});

