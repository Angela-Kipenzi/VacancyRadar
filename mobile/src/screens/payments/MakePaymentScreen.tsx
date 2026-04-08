import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { AxiosError } from 'axios';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { usePayments } from '../../contexts/PaymentsContext';
import { colors } from '../../theme/colors';
import { PaymentMethod } from '../../types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const MakePaymentScreen = ({ navigation, route }: any) => {
  const { payment } = route.params;
  const { user } = useAuth();
  const { methods, initiateMpesaPayment, fetchTransactionStatus } = usePayments();
  const defaultMethod = methods.find((method) => method.isDefault);
  const [selectedMethodId, setSelectedMethodId] = useState<string | undefined>(defaultMethod?.id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMethodId && methods.length > 0) {
      setSelectedMethodId(defaultMethod?.id ?? methods[0]?.id);
    }
  }, [defaultMethod?.id, methods, selectedMethodId]);

  const selectedMethod = useMemo(
    () => methods.find((method) => method.id === selectedMethodId),
    [methods, selectedMethodId]
  );

  const getMethodMeta = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return `${method.brand ?? 'Card'} - Expires ${method.expiry ?? 'N/A'}`;
    }
    return `${method.provider ?? 'Mobile money'} - ${method.phone ?? ''}`;
  };

  const waitForFinalTransactionStatus = async (transactionId: string) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await sleep(4000);
      const statusResponse = await fetchTransactionStatus(transactionId);
      if (!statusResponse) {
        continue;
      }
      if (statusResponse.transaction.status === 'paid') {
        return 'paid';
      }
      if (statusResponse.transaction.status === 'failed') {
        return 'failed';
      }
    }
    return 'pending';
  };

  const handlePay = async () => {
    if (!selectedMethod) {
      Alert.alert('No payment method', 'Add an M-Pesa payment method to continue.');
      return;
    }

    if (selectedMethod.type !== 'mobile_money') {
      Alert.alert('M-Pesa required', 'This payment flow currently supports M-Pesa mobile money only.');
      return;
    }

    if (!selectedMethod.provider?.toLowerCase().includes('m-pesa')) {
      Alert.alert('Use M-Pesa', 'Please choose an M-Pesa payment method for this payment.');
      return;
    }

    setLoading(true);
    try {
      const purpose = payment.paymentType === 'deposit' ? 'deposit' : 'rent';
      const description =
        purpose === 'deposit'
          ? `Security deposit due ${format(new Date(payment.dueDate), 'MMM dd, yyyy')}`
          : `Rent payment due ${format(new Date(payment.dueDate), 'MMM dd, yyyy')}`;

      const initiation = await initiateMpesaPayment({
        paymentId: payment.id,
        methodId: selectedMethod.id,
        phone: selectedMethod.phone || user?.phone,
        purpose,
        description,
      });

      if (!initiation?.transaction?.id) {
        throw new Error('M-Pesa request was not created');
      }

      Alert.alert(
        'Complete on phone',
        initiation.customerMessage ||
          'A payment prompt was sent to your phone. Enter your M-Pesa PIN to complete.'
      );

      const finalStatus = await waitForFinalTransactionStatus(initiation.transaction.id);
      if (finalStatus === 'paid') {
        Alert.alert('Payment successful', 'M-Pesa payment confirmed and recorded.');
        navigation.goBack();
        return;
      }

      if (finalStatus === 'failed') {
        Alert.alert('Payment failed', 'M-Pesa payment was not completed. Please try again.');
        return;
      }

      Alert.alert(
        'Payment pending',
        'The payment is still processing. You can check the latest state in Payment History shortly.'
      );
      navigation.goBack();
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const message = axiosError.response?.data?.error || 'Unable to process M-Pesa payment right now.';
      console.error('Error making M-Pesa payment:', error);
      Alert.alert('Payment failed', message);
    } finally {
      setLoading(false);
    }
  };

  const payLabel = 'Pay with M-Pesa';
  const paymentTitle = payment.paymentType === 'deposit' ? 'Security Deposit' : 'Rent Amount Due';
  const currency = payment.currency || 'KES';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.summaryCard} padding={16}>
        <Text style={styles.title}>{paymentTitle}</Text>
        <Text style={styles.amount}>
          {currency} {payment.amount.toFixed(2)}
        </Text>
        <Text style={styles.dueDate}>Due {format(new Date(payment.dueDate), 'MMM dd, yyyy')}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Select Payment Method</Text>

      {methods.length === 0 ? (
        <Card style={styles.emptyCard} padding={16}>
          <Text style={styles.emptyText}>No payment methods saved yet.</Text>
          <Button
            title="Add M-Pesa Method"
            onPress={() => navigation.navigate('AddPaymentMethod')}
            variant="outline"
            fullWidth
            style={styles.addButton}
          />
        </Card>
      ) : (
        methods.map((method) => (
          <TouchableOpacity key={method.id} onPress={() => setSelectedMethodId(method.id)}>
            <Card
              style={[styles.methodCard, selectedMethodId === method.id && styles.methodCardActive]}
              padding={16}
            >
              <View style={styles.methodRow}>
                <Ionicons
                  name={method.type === 'card' ? 'card-outline' : 'phone-portrait-outline'}
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodMeta}>{getMethodMeta(method)}</Text>
                </View>
                {selectedMethodId === method.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}

      <Button
        title={payLabel}
        onPress={handlePay}
        loading={loading}
        disabled={!selectedMethod}
        fullWidth
        style={styles.payButton}
      />
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
  summaryCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  dueDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  methodCard: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodCardActive: {
    borderColor: colors.primary,
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
  payButton: {
    marginTop: 8,
  },
  emptyCard: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  addButton: {
    marginTop: 4,
  },
});
