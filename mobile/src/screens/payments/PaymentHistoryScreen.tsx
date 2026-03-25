import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { usePayments } from '../../contexts/PaymentsContext';
import { format } from 'date-fns';

const statusColor = (status: string) => {
  if (status === 'paid') return colors.success;
  if (status === 'pending') return colors.warning;
  return colors.error;
};

export const PaymentHistoryScreen = () => {
  const { transactions, methods } = usePayments();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Payment History</Text>
        {transactions.length === 0 ? (
          <Card style={styles.emptyCard} padding={16}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </Card>
        ) : (
          transactions.map((txn) => {
            const method = methods.find((item) => item.id === txn.methodId);
            return (
              <Card key={txn.id} style={styles.card} padding={16}>
                <View style={styles.row}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.amount}>
                      {txn.currency} {txn.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.meta}>
                      {txn.description} · {format(new Date(txn.createdAt), 'MMM dd, yyyy')}
                    </Text>
                    <Text style={styles.meta}>{method?.label ?? 'Manual payment'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(txn.status) + '22' }]}>
                    <Text style={[styles.statusText, { color: statusColor(txn.status) }]}>
                      {txn.status}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
