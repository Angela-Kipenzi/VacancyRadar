import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useApplications } from '../../contexts/ApplicationsContext';
import { format } from 'date-fns';

export const ApplicationDetailScreen = ({ navigation, route }: any) => {
  const { applicationId } = route.params;
  const { getApplicationById, withdrawApplication } = useApplications();
  const application = getApplicationById(applicationId);

  if (!application) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Application not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>
          Application for: {application.propertyAddress}, Unit {application.unitNumber}
        </Text>
        <Text style={styles.meta}>
          Applied on: {format(new Date(application.appliedOn), 'MMMM dd, yyyy')}
        </Text>
        <Text style={styles.meta}>Status: {application.status}</Text>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Your Information</Text>
        <Text style={styles.infoText}>
          Name: {application.applicant.firstName} {application.applicant.lastName}
        </Text>
        <Text style={styles.infoText}>Email: {application.applicant.email}</Text>
        <Text style={styles.infoText}>Phone: {application.applicant.phone}</Text>
        {application.applicant.currentAddress ? (
          <Text style={styles.infoText}>
            Current Address: {application.applicant.currentAddress}
          </Text>
        ) : null}
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Your Message</Text>
        <Text style={styles.messageText}>
          {application.message || 'No message provided.'}
        </Text>
      </Card>

      <View style={styles.actions}>
        {application.status === 'pending' && (
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => withdrawApplication(application.id)}
          >
            <Text style={styles.withdrawText}>Withdraw Application</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back to Applications</Text>
        </TouchableOpacity>
      </View>
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
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    gap: 10,
  },
  withdrawButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 12,
    alignItems: 'center',
  },
  withdrawText: {
    color: colors.error,
    fontWeight: '600',
  },
  backButton: {
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backText: {
    color: colors.white,
    fontWeight: '600',
  },
  emptyText: {
    padding: 16,
    color: colors.textSecondary,
  },
});
