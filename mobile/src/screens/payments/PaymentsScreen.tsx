import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import api from '../../config/api';
import { Payment } from '../../types';
import { format } from 'date-fns';
import { usePayments } from '../../contexts/PaymentsContext';
import { useFocusEffect } from '@react-navigation/native';

export const PaymentsScreen = ({ navigation }: any) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const { methods, transactions } = usePayments();
  const defaultMethod = methods.find((method) => method.isDefault);
  const defaultCurrency = payments[0]?.currency || 'KES';
  const nextOutstandingPayment = payments
    .filter((payment) => ['pending', 'late', 'partial'].includes(payment.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'late':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'late':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getPaymentTypeLabel = (payment: Payment) =>
    payment.paymentType === 'deposit' ? 'Security Deposit' : 'Rent';

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPayments} />
        }
      >
        <Card style={styles.methodsCard}>
          <View style={styles.methodsHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods')}>
              <Text style={styles.linkText}>Manage</Text>
            </TouchableOpacity>
          </View>
          {defaultMethod ? (
            <View style={styles.methodRow}>
              <Ionicons
                name={defaultMethod.type === 'mobile_money' ? 'phone-portrait-outline' : 'card-outline'}
                size={20}
                color={colors.primary}
              />
              <View style={styles.methodInfo}>
                <Text style={styles.methodLabel}>{defaultMethod.label}</Text>
                <Text style={styles.methodMeta}>
                  {defaultMethod.type === 'card'
                    ? `${defaultMethod.brand ?? 'Card'} - Expires ${defaultMethod.expiry ?? 'N/A'}`
                    : `${defaultMethod.provider ?? 'Mobile money'} - ${defaultMethod.phone ?? ''}`}
                </Text>
              </View>
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyTextSmall}>No default method set.</Text>
          )}
          <TouchableOpacity
            style={styles.addMethodButton}
            onPress={() => navigation.navigate('AddPaymentMethod')}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addMethodText}>Add New Method</Text>
          </TouchableOpacity>
        </Card>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>
                {defaultCurrency}{' '}
                {payments
                  .filter((p) => p.status === 'paid')
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>
                {defaultCurrency}{' '}
                {payments
                  .filter((p) => ['pending', 'late', 'partial'].includes(p.status))
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.makePaymentCard}>
          <Button
            title="Make Payment"
            onPress={() => navigation.navigate('MakePayment', { payment: nextOutstandingPayment })}
            disabled={!nextOutstandingPayment}
            fullWidth
          />
          {!nextOutstandingPayment && (
            <Text style={styles.makePaymentHint}>No pending payment right now.</Text>
          )}
        </Card>

        {/* Payment History */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PaymentHistory')}>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>
          {payments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No payments yet</Text>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentLeft}>
                    <View
                      style={[
                        styles.statusIcon,
                        { backgroundColor: getStatusColor(payment.status) + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(payment.status)}
                        size={24}
                        color={getStatusColor(payment.status)}
                      />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>
                        {(payment.currency || defaultCurrency)} {payment.amount.toFixed(2)}
                      </Text>
                      <Text style={styles.paymentType}>{getPaymentTypeLabel(payment)}</Text>
                      <Text style={styles.paymentDate}>
                        Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                      </Text>
                      {payment.paidDate && (
                        <Text style={styles.paidDate}>
                          Paid: {format(new Date(payment.paidDate), 'MMM dd, yyyy')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(payment.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(payment.status) },
                      ]}
                    >
                      {payment.status}
                    </Text>
                  </View>
                </View>
                {['pending', 'late', 'partial'].includes(payment.status) && (
                  <Button
                    title="Pay Now"
                    onPress={() => navigation.navigate('MakePayment', { payment })}
                    variant="primary"
                    size="small"
                    fullWidth
                    style={styles.payButton}
                  />
                )}
              </Card>
            ))
          )}
        </View>

        {transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Transactions</Text>
            {transactions.slice(0, 3).map((txn) => (
              <Card key={txn.id} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionAmount}>
                      {txn.currency} {txn.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.transactionMeta}>{txn.description}</Text>
                  </View>
                  <Text style={styles.transactionStatus}>{txn.status}</Text>
                </View>
              </Card>
            ))}
          </View>
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
  methodsCard: {
    margin: 16,
    marginBottom: 8,
  },
  methodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  methodMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  defaultBadge: {
    backgroundColor: colors.primary + '16',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  addMethodButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addMethodText: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyTextSmall: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryCard: {
    margin: 16,
  },
  makePaymentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  makePaymentHint: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 16,
  },
  paymentCard: {
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  paymentType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  paidDate: {
    fontSize: 12,
    color: colors.success,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  payButton: {
    marginTop: 8,
  },
  transactionCard: {
    marginBottom: 10,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  transactionMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
});
