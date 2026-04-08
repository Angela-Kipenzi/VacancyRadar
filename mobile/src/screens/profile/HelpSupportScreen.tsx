import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';

export const HelpSupportScreen = ({ navigation }: any) => {
  const faqs = [
    {
      question: 'How do I make a payment?',
      answer: 'Go to Payments, choose a pending rent item, and tap Pay Now.',
    },
    {
      question: 'How do I request maintenance?',
      answer: 'Open Maintenance and create a new request with photos if needed.',
    },
    {
      question: 'Where can I find my lease?',
      answer: 'Check Documents for your lease and notices once uploaded.',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>Need help?</Text>
        <Text style={styles.subtitle}>
          We are here to help. Use the quick links below or browse the FAQs.
        </Text>
        <View style={styles.linksRow}>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Maintenance')}>
            <Ionicons name="construct-outline" size={16} color={colors.primary} />
            <Text style={styles.linkText}>Maintenance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Payments')}>
            <Ionicons name="card-outline" size={16} color={colors.primary} />
            <Text style={styles.linkText}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Documents')}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={styles.linkText}>Documents</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>FAQs</Text>
      {faqs.map((item) => (
        <Card key={item.question} style={styles.faqCard} padding={16}>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </Card>
      ))}

      <Card style={styles.card} padding={16}>
        <View style={styles.contactRow}>
          <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
          <Text style={styles.contactTitle}>Contact your property manager</Text>
        </View>
        <Text style={styles.contactText}>
          For account updates or urgent issues, reach out to your property manager directly.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  linksRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  faqCard: {
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  contactText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
