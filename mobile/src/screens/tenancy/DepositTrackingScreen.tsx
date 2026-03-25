import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useTenancy } from '../../contexts/TenancyContext';

export const DepositTrackingScreen = () => {
  const { deposit, setDepositStatus, fileDispute } = useTenancy();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>Deposit tracking</Text>
        <Text style={styles.amount}>
          {deposit.currency} {deposit.amount}
        </Text>
        <View style={styles.statusRow}>
          {(['held', 'processing', 'returned', 'disputed'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusChip, deposit.status === status && styles.statusChipActive]}
              onPress={() => setDepositStatus(status)}
            >
              <Text
                style={[styles.statusText, deposit.status === status && styles.statusTextActive]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.meta}>
          Timeline: {deposit.timelineDays} days · {deposit.returnDate ?? 'Pending return date'}
        </Text>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Deductions</Text>
        {deposit.deductions.length === 0 ? (
          <Text style={styles.meta}>No deductions reported.</Text>
        ) : (
          deposit.deductions.map((deduction) => (
            <View key={deduction.id} style={styles.deductionRow}>
              <Text style={styles.deductionLabel}>{deduction.label}</Text>
              <Text style={styles.deductionAmount}>
                -{deposit.currency} {deduction.amount}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Dispute</Text>
        <Text style={styles.meta}>
          If deductions are inaccurate, file a dispute with evidence.
        </Text>
        <TouchableOpacity style={styles.disputeButton} onPress={fileDispute}>
          <Ionicons name="flag-outline" size={16} color={colors.white} />
          <Text style={styles.disputeText}>
            {deposit.disputeFiled ? 'Dispute Filed' : 'File Dispute'}
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  statusTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  deductionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  deductionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  deductionAmount: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  disputeButton: {
    marginTop: 12,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disputeText: {
    color: colors.white,
    fontWeight: '600',
  },
});
