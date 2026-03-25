import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useTenancy } from '../../contexts/TenancyContext';

export const LeasePreviewScreen = () => {
  const { leaseInfo, leasePreviewed, setLeasePreviewed } = useTenancy();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>Digital Lease Preview</Text>
        <Text style={styles.subtitle}>
          Review key clauses, lease term, and payment details before move-in.
        </Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lease Term</Text>
          <Text style={styles.sectionText}>Ends on {leaseInfo.endDate}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Clauses</Text>
          <Text style={styles.sectionText}>Maintenance response, late fees, pet policy.</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.sectionText}>Landlord: Kelly Morgan · 555-0199</Text>
        </View>

        <View style={styles.acknowledgeRow}>
          <Ionicons
            name={leasePreviewed ? 'checkmark-circle' : 'information-circle-outline'}
            size={18}
            color={leasePreviewed ? colors.success : colors.textSecondary}
          />
          <Text style={styles.acknowledgeText}>
            {leasePreviewed ? 'Lease preview reviewed' : 'Tap to acknowledge review'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setLeasePreviewed(!leasePreviewed)}
        >
          <Text style={styles.primaryButtonText}>
            {leasePreviewed ? 'Mark as Unread' : 'Acknowledge Review'}
          </Text>
        </TouchableOpacity>
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
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sectionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  acknowledgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  acknowledgeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
