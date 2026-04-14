import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const FAQ_ITEMS = [
  {
    question: "What is RECLAIM and how does it work?",
    answer: "RECLAIM is a structured recovery app designed to help you overcome pornography addiction. It combines daily check-ins, a chapter-based recovery program, an AI coach, and a content blocker to support your journey one day at a time.",
  },
  {
    question: "How does the chapter system work?",
    answer: "There are 7 chapters across a 120-day journey — Awareness, Control, Stability, Discipline, Confidence, Mastery, and Freedom. Each chapter unlocks after completing the previous one. Your progress advances by 1 day each day and resets by 1 day if you relapse.",
  },
  {
    question: "What happens when I press 'I Relapsed'?",
    answer: "Relapsing resets your current streak to 0, moves your chapter progress back by 1 day, and records the event. It does not lock you out or punish you — it simply resets your timer so you can start again from an honest place.",
  },
  {
    question: "What is the Panic Button for?",
    answer: "The Panic Button activates a protection mode for a set duration (default 30 minutes) when you feel a strong urge. It locks your phone usage, connects you with the AI coach, and helps you ride out the urge without acting on it.",
  },
  {
    question: "How does the AI Coach work?",
    answer: "The AI Coach is powered by Claude (Anthropic). It uses a recovery-focused system prompt to give you direct, honest support. You can choose between Calm Mode (supportive), Strict Mode (tough love), and Distractor Mode (humor to break the mood).",
  },
  {
    question: "Is my data private?",
    answer: "All your personal progress data — streaks, chapter progress, check-ins, relapses — is stored locally on your device using AsyncStorage. It is never uploaded to a server or shared with anyone.",
  },
  {
    question: "How does the content blocker work?",
    answer: "The blocker activates protection during your vulnerable hours. It tracks days protected and blocks today count to help you see the impact of staying protected over time.",
  },
  {
    question: "What is the daily check-in?",
    answer: "The daily check-in is a 2-step reflection that asks how your day went and what affected you most. It takes less than 30 seconds and helps you build self-awareness — a critical part of recovery.",
  },
  {
    question: "Can I use RECLAIM without an internet connection?",
    answer: "Yes — all core features (chapters, streaks, check-ins, panic button timer) work fully offline. The AI Coach requires an internet connection to generate responses.",
  },
  {
    question: "How do I contact support?",
    answer: "Tap the 'Contact Us' button on the home screen or email us directly at support@reclaimapp.com. We typically respond within 24 hours.",
  },
];

const FAQsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIndex(prev => prev === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQs</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>💬</Text>
          <Text style={styles.heroTitle}>Frequently Asked Questions</Text>
          <Text style={styles.heroSubtitle}>
            Everything you need to know about RECLAIM and your recovery journey.
          </Text>
        </View>

        {/* FAQ items */}
        {FAQ_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            onPress={() => toggleItem(index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#888888"
              />
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Contact section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactSubtitle}>
            We're here to help. Reach out any time.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@reclaimapp.com')}
            activeOpacity={0.8}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    paddingRight: 12,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactSection: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 24,
    backgroundColor: '#000000',
    borderRadius: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  contactSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
});

export default FAQsScreen;
