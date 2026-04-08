import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';

declare const __DEV__: boolean;

export const AboutScreen = () => {
  const appName = Constants.expoConfig?.name ?? 'VacancyRadar Tenant';
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build = Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber ?? '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <View style={styles.header}>
          <Ionicons name="home-outline" size={28} color={colors.primary} />
          <View>
            <Text style={styles.appName}>{appName}</Text>
            <Text style={styles.appMeta}>Version {version}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Build</Text>
          <Text style={styles.metaValue}>{build}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Environment</Text>
          <Text style={styles.metaValue}>{__DEV__ ? 'Development' : 'Production'}</Text>
        </View>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>What this app does</Text>
        <Text style={styles.sectionText}>
          Manage your tenancy in one place: payments, documents, maintenance, and lease updates.
        </Text>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Privacy & Terms</Text>
        <Text style={styles.sectionText}>
          Your data is shared only with your property manager to help manage your tenancy.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  appMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
