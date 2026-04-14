import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const HELP_TOPICS = [
  {
    title: '🚀 Getting Started',
    items: [
      'How to set up your profile',
      'Understanding your streak counter',
      'How chapters work',
      'Setting your risk time and preferences',
    ],
  },
  {
    title: '🆘 Panic Button',
    items: [
      'How to use the panic button',
      'Changing panic duration',
      'What happens during panic mode',
      'Using the AI coach in crisis',
    ],
  },
  {
    title: '📊 Progress & Stats',
    items: [
      'Understanding your stability score',
      'How the calendar tracks your days',
      'What counts as a safe day',
      'Resetting your streak after relapse',
    ],
  },
  {
    title: '🤖 AI Coach',
    items: [
      'Switching between coach modes',
      'What the AI coach can and cannot do',
      'Getting the most from your sessions',
      'Privacy and AI conversations',
    ],
  },
  {
    title: '🔒 Blocker',
    items: [
      'Enabling and disabling the blocker',
      'Understanding blocker limitations on iOS',
      'Setting protection schedules',
      'Tracking protection stats',
    ],
  },
  {
    title: '💳 Subscription',
    items: [
      'Free vs Premium features',
      'How to upgrade to Premium',
      'Cancelling your subscription',
      'Restoring purchases after reinstall',
    ],
  },
];

const HelpCenterScreen: React.FC = () => {
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
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🛟</Text>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions and learn how to get the most from RECLAIM.
          </Text>
        </View>

        {/* Quick action cards — 2x2 grid */}
        <Text style={styles.sectionHeader}>QUICK HELP</Text>
        <View style={styles.quickGrid}>
          {[
            { icon: 'rocket-outline', label: 'Getting Started', screen: 'FAQs' },
            { icon: 'warning-outline', label: 'Panic Button', screen: 'FAQs' },
            { icon: 'bar-chart-outline', label: 'Tracking Progress', screen: 'FAQs' },
            { icon: 'shield-outline', label: 'Blocker Help', screen: 'Blocker' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickCard}
              onPress={() => navigation.navigate(item.screen as any)}
              activeOpacity={0.7}
            >
              <View style={styles.quickIconCircle}>
                <Ionicons name={item.icon as any} size={22} color="#000000" />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Help topics */}
        <Text style={styles.sectionHeader}>HELP TOPICS</Text>

        {HELP_TOPICS.map((topic, index) => (
          <View key={index} style={styles.topicCard}>
            <Text style={styles.topicCardTitle}>{topic.title}</Text>
            {topic.items.map((item, itemIndex) => (
              <View key={itemIndex}>
                {itemIndex > 0 && <View style={styles.topicItemDivider} />}
                <TouchableOpacity
                  style={styles.topicItem}
                  onPress={() => navigation.navigate('FAQs')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.topicItemText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#AAAAAA" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}

        {/* Still need help */}
        <View style={styles.stillNeedHelpCard}>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <Text style={styles.stillNeedHelpSubtitle}>
            Our support team is available 7 days a week
          </Text>
          <View style={styles.stillNeedHelpButtons}>
            <TouchableOpacity
              style={styles.helpButtonPrimary}
              onPress={() => navigation.navigate('ContactSupport' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.helpButtonPrimaryText}>Contact Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpButtonSecondary}
              onPress={() => navigation.navigate('FAQs')}
              activeOpacity={0.8}
            >
              <Text style={styles.helpButtonSecondaryText}>View FAQs</Text>
            </TouchableOpacity>
          </View>
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  quickCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: 13, fontWeight: '600',
    color: '#000000', textAlign: 'center',
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topicCardTitle: {
    fontSize: 14, fontWeight: '700', color: '#000000',
    padding: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topicItemText: { fontSize: 14, color: '#374151', flex: 1 },
  topicItemDivider: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 16 },
  stillNeedHelpCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    alignItems: 'center',
  },
  stillNeedHelpTitle: {
    fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 6,
  },
  stillNeedHelpSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', marginBottom: 20,
  },
  stillNeedHelpButtons: {
    flexDirection: 'row', gap: 10, width: '100%',
  },
  helpButtonPrimary: {
    flex: 1, backgroundColor: '#FFFFFF',
    borderRadius: 999, height: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  helpButtonPrimaryText: {
    fontSize: 14, fontWeight: '700', color: '#000000',
  },
  helpButtonSecondary: {
    flex: 1,
    borderRadius: 999, height: 46,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  helpButtonSecondaryText: {
    fontSize: 14, fontWeight: '600', color: '#FFFFFF',
  },
});

export default HelpCenterScreen;
