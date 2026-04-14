import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using Reclaim, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the application.',
  },
  {
    title: '2. Description of Service',
    body: 'Reclaim provides tools to block access to adult content using DNS, VPN, and device-level controls, support habit-building and self-improvement, and offer AI-based guidance and insights. Reclaim is a self-help tool and does not provide medical or professional services.',
  },
  {
    title: '3. Eligibility',
    body: 'To use Reclaim, you must be at least 13 years old and have the legal capacity to enter into a binding agreement.',
  },
  {
    title: '4. Subscriptions and Payments',
    body: 'Reclaim offers subscription-based services. All payments are processed via Apple In-App Purchases. Subscriptions automatically renew unless canceled. Billing, cancellations, and refunds are managed by Apple. We do not store or process your payment details.',
  },
  {
    title: '5. User Responsibilities',
    body: 'By using Reclaim, you agree to use the app only for lawful purposes, not to misuse or interfere with the service, and not to intentionally attempt to bypass or disable blocking features.',
  },
  {
    title: '6. Content Blocking & System Limitations',
    body: 'Reclaim uses VPN, DNS filtering, and device-level parental controls to restrict access to certain content. However, blocking systems may not be fully effective in all situations, some content may still be accessible, and users may be able to bypass restrictions. You acknowledge these technical limitations.',
  },
  {
    title: '7. AI Features Disclaimer',
    body: 'Reclaim may provide AI-generated responses or guidance. These features are for informational purposes only, may not always be accurate or appropriate, and should not be relied upon for important decisions.',
  },
  {
    title: '8. Behavioral Outcomes Disclaimer',
    body: 'Reclaim is designed to support behavior change, but we do not guarantee prevention of access to all restricted content, successful habit change, or any specific personal or psychological outcomes. You remain solely responsible for your behavior and decisions.',
  },
  {
    title: '9. No Medical or Professional Advice',
    body: 'Reclaim does not provide medical advice, psychological counseling, therapy, or treatment. All content, including AI-generated responses, is for self-help and informational purposes only and is not a substitute for professional advice.',
  },
  {
    title: '10. Limitation of Liability',
    body: 'To the maximum extent permitted by law, Reclaim shall not be liable for failure or circumvention of blocking systems, any indirect or consequential damages, or personal, behavioral, or psychological outcomes including relapse, emotional distress, incomplete blocking, or technical failures.',
  },
  {
    title: '11. "As-Is" Disclaimer',
    body: 'The service is provided on an as-is and as-available basis without warranties of any kind. We do not guarantee uninterrupted or error-free operation, complete effectiveness of features, or that the service will meet your expectations.',
  },
  {
    title: '12. Termination',
    body: 'We may suspend or terminate your access to Reclaim if you violate these Terms or if misuse or abuse is detected.',
  },
  {
    title: '13. Changes to Terms',
    body: 'We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance of the updated Terms.',
  },
  {
    title: '14. Contact Information',
    body: 'Company Name: Reclaim\nEmail: support@reclaimapp.com',
  },
];

const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>📄</Text>
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Text style={styles.heroSubtitle}>Effective Date: January 1, 2025</Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}

        {/* Bottom contact card */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Have a legal question?</Text>
          <Text style={styles.contactSubtitle}>We're happy to clarify anything.</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@reclaimapp.com')}
            activeOpacity={0.8}
          >
            <Text style={styles.contactButtonText}>Contact Us</Text>
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
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
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

export default TermsOfServiceScreen;