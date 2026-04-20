import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import api from '../../config/api';
import { Lease, Payment, MaintenanceRequest } from '../../types';
import { format } from 'date-fns';

export const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [nextPayment, setNextPayment] = useState<Payment | null>(null);
  const [openRequests, setOpenRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tenant's lease info
      
      const [leaseRes, paymentRes, requestsRes] = await Promise.all([
        api.get('/tenants/me/lease').catch(() => ({ data: null })),
        api.get('/payments/next').catch(() => ({ data: null })),
        api.get('/maintenance?status=pending,in_progress').catch(() => ({ data: [] })),
      ]);

      setLease(leaseRes.data);
      setNextPayment(paymentRes.data);
      setOpenRequests(requestsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = () => {
    if (!nextPayment) return null;
    const dueDate = new Date(nextPayment.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
        <Text style={styles.subtitle}>Welcome to your tenant portal</Text>
      </View>

      {/* Lease Information */}
      {lease && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Your Unit</Text>
          </View>
          <View style={styles.unitInfo}>
            <Text style={styles.unitNumber}>Unit {lease.unit?.unitNumber}</Text>
            <Text style={styles.propertyName}>{lease.unit?.property.name}</Text>
            <Text style={styles.address}>
              {lease.unit?.property.address}, {lease.unit?.property.city}
            </Text>
            <View style={styles.leaseDetails}>
              <View style={styles.leaseDetail}>
                <Text style={styles.leaseLabel}>Lease End</Text>
                <Text style={styles.leaseValue}>
                  {format(new Date(lease.endDate), 'MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.leaseDetail}>
                <Text style={styles.leaseLabel}>Monthly Rent</Text>
                <Text style={styles.leaseValue}>${lease.rentAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </Card>
      )}

      {/* Next Payment */}
      {nextPayment && (
        <Card style={styles.card} onPress={() => navigation.navigate('Payments')}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Next Payment</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentAmount}>${nextPayment.amount.toFixed(2)}</Text>
            <Text style={styles.paymentDue}>
              Due {format(new Date(nextPayment.dueDate), 'MMM dd, yyyy')}
            </Text>
            {getDaysUntilDue() !== null && (
              <View style={[
                styles.dueBadge,
                getDaysUntilDue()! < 5 ? styles.dueSoon : styles.dueNormal
              ]}>
                <Text style={styles.dueBadgeText}>
                  {getDaysUntilDue()! > 0
                    ? `${getDaysUntilDue()} days remaining`
                    : 'Overdue'}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.payButton}>
            <Text style={styles.payButtonText}>Pay Now</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </Card>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Payments')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="card" size={28} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Maintenance')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="construct" size={28} color={colors.warning} />
            </View>
            <Text style={styles.actionText}>Maintenance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Documents')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.info + '20' }]}>
              <Ionicons name="document-text" size={28} color={colors.info} />
            </View>
            <Text style={styles.actionText}>Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="person" size={28} color={colors.secondary} />
            </View>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Open Maintenance Requests */}
      {openRequests.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Open Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Maintenance')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {openRequests.slice(0, 3).map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestTitle}>{request.title}</Text>
                <View style={[styles.statusBadge, styles[`status_${request.status}`]]}>
                  <Text style={styles.statusText}>{request.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.requestDate}>
                {format(new Date(request.createdAt), 'MMM dd, yyyy')}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: colors.primary,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  unitInfo: {
    paddingLeft: 36,
  },
  unitNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  leaseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leaseDetail: {},
  leaseLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  leaseValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  paymentInfo: {
    paddingLeft: 36,
    marginBottom: 16,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  paymentDue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dueBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dueSoon: {
    backgroundColor: colors.error + '20',
  },
  dueNormal: {
    backgroundColor: colors.success + '20',
  },
  dueBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  payButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  requestCard: {
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_pending: {
    backgroundColor: colors.warning + '20',
  },
  status_in_progress: {
    backgroundColor: colors.info + '20',
  },
  status_completed: {
    backgroundColor: colors.success + '20',
  },
  status_cancelled: {
    backgroundColor: colors.gray[300] + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  requestDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
