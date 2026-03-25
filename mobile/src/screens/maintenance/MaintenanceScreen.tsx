import React, { useState, useEffect } from 'react';
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
import { MaintenanceRequest, ScreenProps } from '../../types';
import { format } from 'date-fns';

export const MaintenanceScreen = ({ navigation }: ScreenProps) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'all' ? '/maintenance' : `/maintenance?status=${filter}`;
      const response = await api.get(endpoint);
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return colors.error;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.info;
      case 'low':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.info;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plumbing':
        return 'water';
      case 'electrical':
        return 'flash';
      case 'hvac':
        return 'thermometer';
      case 'appliance':
        return 'home';
      default:
        return 'construct';
    }
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'pending', 'in_progress', 'completed'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterTab,
                filter === item && styles.filterTabActive,
              ]}
              onPress={() => setFilter(item as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadRequests} />
        }
      >
        <View style={styles.content}>
          {requests.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="construct-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No maintenance requests</Text>
              <Button
                title="Create New Request"
                onPress={() => navigation.navigate('CreateRequest')}
                variant="primary"
                style={styles.createButton}
              />
            </Card>
          ) : (
            <>
              {requests.map((request) => (
                <Card
                  key={request.id}
                  style={styles.requestCard}
                  onPress={() => navigation.navigate('RequestDetail', { request })}
                >
                  <View style={styles.requestHeader}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: colors.primary + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getCategoryIcon(request.category)}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestTitle}>{request.title}</Text>
                      <Text style={styles.requestDescription} numberOfLines={2}>
                        {request.description}
                      </Text>
                      <View style={styles.requestMeta}>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: getPriorityColor(request.priority) + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: getPriorityColor(request.priority) },
                            ]}
                          >
                            {request.priority}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: getStatusColor(request.status) + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: getStatusColor(request.status) },
                            ]}
                          >
                            {request.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.requestDate}>
                        {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
                  </View>
                </Card>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateRequest')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundGray,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: colors.white,
  },
  content: {
    padding: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    minWidth: 200,
  },
  requestCard: {
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  requestDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
