import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useTenancy } from '../../contexts/TenancyContext';

export const MoveInPrepScreen = ({ navigation }: any) => {
  const {
    checklist,
    toggleChecklistItem,
    reminderEnabled,
    toggleMoveInReminder,
    leasePreviewed,
    moveInDate,
  } = useTenancy();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>Move-in checklist</Text>
        {checklist.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.checklistRow}
            onPress={() => toggleChecklistItem(item.id)}
          >
            <Ionicons
              name={item.completed ? 'checkbox' : 'square-outline'}
              size={20}
              color={item.completed ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.checklistText, item.completed && styles.checklistDone]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={styles.card} padding={16}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionTitle}>Move-in date reminder</Text>
            <Text style={styles.sectionSubtitle}>
              Push notification before arrival · Move-in: {moveInDate}
            </Text>
          </View>
          <Switch value={reminderEnabled} onValueChange={toggleMoveInReminder} />
        </View>
      </Card>

      <Card style={styles.card} padding={16}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.sectionTitle}>Digital lease preview</Text>
            <Text style={styles.sectionSubtitle}>
              Review your lease before check-in.
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{leasePreviewed ? 'Reviewed' : 'Pending'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('LeasePreview')}
        >
          <Ionicons name="document-text" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>Open Lease Preview</Text>
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
    marginBottom: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checklistText: {
    fontSize: 14,
    color: colors.text,
  },
  checklistDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.primary + '14',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
