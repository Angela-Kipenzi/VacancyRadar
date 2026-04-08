import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../config/api';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { Notification } from '../../types';

import { useNotifications } from '../../contexts/NotificationsContext';

export const NotificationsScreen = () => {
  const { refreshNotifications } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/tenant-notifications');
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Unable to load notifications right now.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/tenant-notifications/${id}/read`);
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotifications} />}
    >
      {error && (
        <Card style={styles.noticeCard} padding={16}>
          <Text style={styles.noticeText}>{error}</Text>
          <Text style={styles.noticeSubtext}>Please try again in a moment.</Text>
        </Card>
      )}

      {notifications.length === 0 ? (
        <Card style={styles.emptyCard} padding={16}>
          <Ionicons name="notifications-outline" size={32} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyText}>Updates about payments, leases, and maintenance will show here.</Text>
        </Card>
      ) : (
        notifications.map((note) => (
          <TouchableOpacity key={note.id} onPress={() => markAsRead(note.id)}>
            <Card style={[styles.noteCard, !note.isRead && styles.noteUnread]} padding={16}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                {!note.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.noteMessage}>{note.message}</Text>
              <Text style={styles.noteMeta}>{format(new Date(note.createdAt), 'MMM dd, yyyy')}</Text>
            </Card>
          </TouchableOpacity>
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
  noticeCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warning + '14',
  },
  noticeText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  noticeSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noteCard: {
    marginBottom: 12,
  },
  noteUnread: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    paddingRight: 8,
  },
  noteMessage: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  noteMeta: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
