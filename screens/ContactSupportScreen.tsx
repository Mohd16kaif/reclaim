import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const ContactSupportScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🙋</Text>
          <Text style={styles.heroTitle}>We're here to help</Text>
          <Text style={styles.heroSubtitle}>
            Our support team typically responds within 24 hours.
            We read every message personally.
          </Text>
        </View>

        {/* Response time info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#000000" />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Response Time</Text>
              <Text style={styles.infoValue}>Within 24 hours</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#000000" />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>support@reclaimapp.com</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#000000" />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Privacy</Text>
              <Text style={styles.infoValue}>Your data is never shared</Text>
            </View>
          </View>
        </View>

        {/* What can we help with section */}
        <Text style={styles.sectionHeader}>WHAT CAN WE HELP WITH?</Text>

        {[
          { icon: 'bug-outline', label: 'Report a bug or technical issue' },
          { icon: 'card-outline', label: 'Subscription or billing questions' },
          { icon: 'lock-closed-outline', label: 'Account or privacy concerns' },
          { icon: 'heart-outline', label: 'Recovery support guidance' },
          { icon: 'information-circle-outline', label: 'General questions about the app' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.topicRow}
            onPress={() => Linking.openURL(`mailto:support@reclaimapp.com?subject=${encodeURIComponent(item.label)}`)}
            activeOpacity={0.7}
          >
            <View style={styles.topicIconCircle}>
              <Ionicons name={item.icon as any} size={18} color="#000000" />
            </View>
            <Text style={styles.topicLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#AAAAAA" />
          </TouchableOpacity>
        ))}

        {/* Main CTA button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => Linking.openURL('mailto:support@reclaimapp.com')}
          activeOpacity={0.8}
        >
          <Ionicons name="mail" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Send us an Email</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          RECLAIM is not a crisis service. If you are in immediate danger or
          experiencing thoughts of self-harm, please contact a local crisis
          helpline or emergency services immediately.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: {
    fontSize: 20, fontWeight: '800', color: '#000000',
    textAlign: 'center', marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14, color: '#6B7280',
    textAlign: 'center', lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  infoTextGroup: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#000000' },
  infoDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 1, marginHorizontal: 16,
    marginTop: 20, marginBottom: 8,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topicIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  topicLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#000000' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 999,
    height: 54,
    marginHorizontal: 16,
    marginTop: 24,
    gap: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disclaimer: {
    fontSize: 12, color: '#9CA3AF',
    textAlign: 'center', lineHeight: 18,
    marginHorizontal: 24, marginTop: 20,
  },
});

export default ContactSupportScreen;
