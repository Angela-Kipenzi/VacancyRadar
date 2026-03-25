import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { usePayments } from '../../contexts/PaymentsContext';

export const PaymentMethodsScreen = ({ navigation }: any) => {
  const { methods, removeMethod, setDefaultMethod } = usePayments();

  const handleRemove = (id: string) => {
    Alert.alert('Remove method', 'Are you sure you want to remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMethod(id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Payment Methods</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPaymentMethod')}
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {methods.length === 0 ? (
        <Card style={styles.emptyCard} padding={16}>
          <Text style={styles.emptyText}>No payment methods saved yet.</Text>
        </Card>
      ) : (
        methods.map((method) => (
          <Card key={method.id} style={styles.card} padding={16}>
            <View style={styles.methodRow}>
              <View style={styles.methodInfo}>
                <Ionicons
                  name={method.type === 'card' ? 'card-outline' : 'phone-portrait-outline'}
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.methodText}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodMeta}>
                    {method.type === 'card'
                      ? `${method.brand ?? 'Card'} · Expires ${method.expiry ?? 'N/A'}`
                      : `${method.provider ?? 'Mobile money'} · ${method.phone ?? ''}`}
                  </Text>
                </View>
              </View>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              {!method.isDefault && (
                <TouchableOpacity onPress={() => setDefaultMethod(method.id)}>
                  <Text style={styles.actionText}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleRemove(method.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('PaymentHistory')}
      >
        <Ionicons name="time-outline" size={16} color={colors.primary} />
        <Text style={styles.historyText}>View Payment History</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: {
    color: colors.white,
    fontWeight: '600',
  },
  card: {
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  methodInfo: {
    flexDirection: 'row',
    gap: 10,
  },
  methodText: {
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
  },
  actionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  removeText: {
    color: colors.error,
    fontWeight: '600',
  },
  historyButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  historyText: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    marginTop: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
