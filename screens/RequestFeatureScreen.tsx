import { Ionicons } from '@expo/vector-icons';
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

const RequestFeatureScreen: React.FC = () => {
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
          <Text style={styles.headerTitle}>Request a Feature</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>??</Text>
          <Text style={styles.heroTitle}>Shape RECLAIM{"'"}s Future</Text>
          <Text style={styles.heroSubtitle}>
            Your ideas directly influence what we build next.
            Every request is read by our team.
          </Text>
        </View>

        {/* Roadmap teaser card */}
        <Text style={styles.sectionHeader}>COMING SOON</Text>
        {[
          { emoji: '??', title: 'Smarter AI Coach', subtitle: 'Context-aware responses using your history', status: 'In Progress' },
          { emoji: '?', title: 'Apple Watch App', subtitle: 'Quick panic button from your wrist', status: 'Planned' },
          { emoji: '??', title: 'Accountability Partners', subtitle: 'Invite a friend to track progress together', status: 'Planned' },
          { emoji: '??', title: 'Hindi & Spanish Support', subtitle: 'Full localization for more users', status: 'Planned' },
          { emoji: '??', title: 'Achievements & Badges', subtitle: 'Milestone rewards and gamification', status: 'Planned' },
          { emoji: '??', title: 'Advanced Insights', subtitle: 'AI-generated weekly pattern analysis', status: 'In Progress' },
        ].map((item, index) => (
          <View key={index} style={styles.roadmapCard}>
            <Text style={styles.roadmapEmoji}>{item.emoji}</Text>
            <View style={styles.roadmapTextGroup}>
              <Text style={styles.roadmapTitle}>{item.title}</Text>
              <Text style={styles.roadmapSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              item.status === 'In Progress' ? styles.statusBadgeActive : styles.statusBadgePlanned
            ]}>
              <Text style={[
                styles.statusBadgeText,
                item.status === 'In Progress' ? styles.statusBadgeTextActive : styles.statusBadgeTextPlanned
              ]}>
                {item.status}
              </Text>
            </View>
          </View>
        ))}

        {/* Submit request CTA */}
        <Text style={styles.sectionHeader}>SUBMIT YOUR IDEA</Text>

        <View style={styles.submitCard}>
          <Text style={styles.submitTitle}>Have an idea we haven{"'"}t thought of?</Text>
          <Text style={styles.submitSubtitle}>
            Email us with your feature idea. Tell us what problem it solves
            and how it would help your recovery journey.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => Linking.openURL('mailto:support@reclaimapp.com?subject=Feature%20Request&body=Hi%20RECLAIM%20team%2C%0A%0AI%20have%20a%20feature%20idea%3A%0A%0A')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Submit Feature Request</Text>
          </TouchableOpacity>
        </View>
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
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 1, marginHorizontal: 16,
    marginTop: 20, marginBottom: 8,
  },
  roadmapCard: {
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
  roadmapEmoji: { fontSize: 28 },
  roadmapTextGroup: { flex: 1 },
  roadmapTitle: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 2 },
  roadmapSubtitle: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeActive: { backgroundColor: '#F0FDF4' },
  statusBadgePlanned: { backgroundColor: '#F3F4F6' },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  statusBadgeTextActive: { color: '#16A34A' },
  statusBadgeTextPlanned: { color: '#6B7280' },
  submitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  submitTitle: {
    fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 8,
  },
  submitSubtitle: {
    fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 999,
    height: 54,
    gap: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default RequestFeatureScreen;
