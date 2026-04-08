import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useTenancy } from '../../contexts/TenancyContext';

const ProgressBar = ({ value }: { value: number }) => (
  <View style={styles.progressTrack}>
    <View style={[styles.progressFill, { width: `${Math.min(100, value * 100)}%` }]} />
  </View>
);

export const TenancyHomeScreen = ({ navigation }: any) => {
  const {
    checklist,
    reminderEnabled,
    leasePreviewed,
    checkIn,
    checkOut,
    deposit,
    leaseInfo,
    scheduleRenewal,
    renewalReminderIds,
  } = useTenancy();

  const checklistProgress =
    checklist.length === 0
      ? 0
      : checklist.filter((item) => item.completed).length / checklist.length;

  const checkInComplete =
    checkIn.qrScanned && checkIn.locationVerified && checkIn.keyCollected && checkIn.photos.length > 0;

  const checkOutComplete =
    checkOut.initiated && checkOut.inspectionCompleted && checkOut.keyReturned;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Check-in & Tenancy</Text>
        <Text style={styles.subtitle}>Manage the full move-in and move-out journey.</Text>
      </View>

      <Card style={styles.card} padding={16}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Pre-move-in prep</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MoveInPrep')}>
            <Text style={styles.linkText}>Open</Text>
          </TouchableOpacity>
        </View>
        <ProgressBar value={checklistProgress} />
        <Text style={styles.cardMeta}>
          {Math.round(checklistProgress * 100)}% checklist complete - Reminder{' '}
          {reminderEnabled ? 'on' : 'off'} - Lease preview {leasePreviewed ? 'done' : 'pending'}
        </Text>
      </Card>

      <Card style={styles.card} padding={16}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>QR Check-in</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CheckIn')}>
            <Text style={styles.linkText}>Start</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardMeta}>
          {checkInComplete ? 'Complete' : 'In progress'} - Unit status: {checkIn.unitStatus}
        </Text>
        {checkIn.checkInTimestamp && (
          <Text style={styles.cardMeta}>Checked in: {checkIn.checkInTimestamp}</Text>
        )}
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.cardTitle}>During tenancy</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('Payments')}>
            <Ionicons name="card-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate('Maintenance')}
          >
            <Ionicons name="construct-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Maintenance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate('Reviews')}
          >
            <Ionicons name="star-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickTile}
            onPress={() => navigation.navigate('LeasePreview')}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Lease Docs</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.reminderSection}>
          <View style={styles.reminderRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.reminderText}>
              Renewal reminders: {leaseInfo.renewalReminderDays.join(', ')} days before lease end.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.reminderButton} 
            onPress={() => {
              const options = [
                { text: '60, 30, 15 days', onPress: () => scheduleRenewal([60, 30, 15]) },
                { text: '90, 60, 30 days', onPress: () => scheduleRenewal([90, 60, 30]) },
                { text: '30, 15, 7 days', onPress: () => scheduleRenewal([30, 15, 7]) },
                { text: 'Cancel', style: 'cancel' as const },
              ];
              Alert.alert('Schedule Reminders', 'Choose renewal notification lead times:', options);
            }}
          >
            <Ionicons name="notifications-outline" size={16} color={colors.primary} />
            <Text style={styles.reminderButtonText}>
              {renewalReminderIds.length ? 'Reschedule Reminders' : 'Schedule Reminders'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.card} padding={16}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>QR Check-out</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CheckOut')}>
            <Text style={styles.linkText}>Open</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardMeta}>
          {checkOutComplete ? 'Ready for handoff' : 'Pending'} - Unit status: {checkOut.unitStatus}
        </Text>
      </Card>

      <Card style={styles.card} padding={16}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Deposit tracking</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DepositTracking')}>
            <Text style={styles.linkText}>View</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardMeta}>
          {deposit.currency} {deposit.amount} - {deposit.status} - {deposit.timelineDays} days timeline
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
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 999,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  quickTile: {
    width: '47%',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  quickText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reminderSection: {
    marginTop: 12,
    gap: 10,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  reminderButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reminderButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});
