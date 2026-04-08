import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useApplications } from '../../contexts/ApplicationsContext';
import { ApplicationStatus } from '../../types';
import { format } from 'date-fns';

const statusColors: Record<ApplicationStatus, string> = {
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.error,
  withdrawn: colors.gray[400],
};

const formatDateSafe = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM dd, yyyy');
};

export const ApplicationsDashboardScreen = ({ navigation }: any) => {
  const { applications } = useApplications();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Applications</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.colProperty]}>Property</Text>
        <Text style={[styles.headerText, styles.colUnit]}>Unit</Text>
        <Text style={[styles.headerText, styles.colDate]}>Applied</Text>
        <Text style={[styles.headerText, styles.colStatus]}>Status</Text>
      </View>

      {applications.length === 0 ? (
        <Card style={styles.emptyCard} padding={16}>
          <Text style={styles.emptyText}>You have not submitted any applications yet.</Text>
        </Card>
      ) : (
        applications.map((app) => (
          <Card key={app.id} style={styles.card} padding={12}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('ApplicationDetail', { applicationId: app.id })}
            >
              <Text style={[styles.cellText, styles.colProperty]} numberOfLines={1}>
                {app.propertyName}
              </Text>
              <Text style={[styles.cellText, styles.colUnit]}>{app.unitNumber}</Text>
              <Text style={[styles.cellText, styles.colDate]}>
                {formatDateSafe(app.appliedOn)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[app.status] + '22' }]}>
                <Text style={[styles.statusText, { color: statusColors[app.status] }]}>
                  {app.status}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        ))
      )}
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    marginBottom: 10,
  },
  cellText: {
    fontSize: 12,
    color: colors.text,
  },
  colProperty: {
    flex: 2.2,
  },
  colUnit: {
    flex: 0.8,
    textAlign: 'center',
  },
  colDate: {
    flex: 1.4,
    textAlign: 'center',
  },
  colStatus: {
    flex: 1.1,
  },
  statusBadge: {
    flex: 1.1,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
