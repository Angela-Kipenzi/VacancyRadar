import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { MaintenanceRequest } from '../../types';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export const MaintenanceRequestDetailScreen = ({ route }: any) => {
  const { request } = route.params;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.info;
      case 'low': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'in_progress': return colors.info;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <View style={styles.header}>
          <Text style={styles.title}>{request.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {request.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
            <Text style={styles.metaValue}>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={16} color={colors.textLight} />
            <Text style={styles.metaValue}>{request.category}</Text>
          </View>
        </View>

        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) + '20' }]}>
          <Ionicons name="alert-circle-outline" size={14} color={getPriorityColor(request.priority)} />
          <Text style={[styles.priorityText, { color: getPriorityColor(request.priority) }]}>
            {request.priority} priority
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{request.description}</Text>
      </Card>

      {request.photos && request.photos.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
            {request.photos.map((photo: string, index: number) => (
              <Image key={index} source={{ uri: photo }} style={styles.photo} />
            ))}
          </ScrollView>
        </>
      )}

      {request.status === 'completed' && request.completedAt && (
        <Card style={styles.completedCard} padding={16}>
          <View style={styles.completedHeader}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.completedTitle}>Request Completed</Text>
          </View>
          <Text style={styles.completedMeta}>
            Finished on {format(new Date(request.completedAt), 'MMM dd, yyyy')}
          </Text>
        </Card>
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
    paddingBottom: 32,
  },
  card: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  photoList: {
    marginBottom: 20,
  },
  photo: {
    width: width * 0.7,
    height: width * 0.5,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: colors.borderLight,
  },
  completedCard: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  completedMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
