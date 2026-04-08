import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useTenancy } from '../../contexts/TenancyContext';
import api, { endpoints } from '../../config/api';
import { Lease, YesNo } from '../../types';

export const LeasePreviewScreen = () => {
  const { leasePreviewed, setLeasePreviewed } = useTenancy();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [occupants, setOccupants] = useState('');
  const [authorizedPersons, setAuthorizedPersons] = useState('');
  const [pets, setPets] = useState<YesNo | undefined>(undefined);
  const [cosigner, setCosigner] = useState<YesNo | undefined>(undefined);
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [savingTenant, setSavingTenant] = useState(false);

  const loadLease = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoints.myLease);
      setLease(response.data ?? null);
    } catch (err) {
      console.error('Error loading lease:', err);
      setError('Unable to load your lease right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLease();
    }, [loadLease])
  );

  useEffect(() => {
    if (!lease) return;
    const agreement = lease.agreementData || {};
    setTenantName(agreement.tenant ?? '');
    setOccupants(agreement.occupants ?? '');
    setAuthorizedPersons(agreement.authorizedPersons ?? '');
    setPets(agreement.pets);
    setCosigner(agreement.cosigner);
    setAdditionalTerms(agreement.additionalTerms ?? '');
  }, [lease]);

  const agreement = lease?.agreementData || {};
  const formatAgreementValue = (value?: string) => {
    if (!value) return '';
    if (value === 'yes') return 'Yes';
    if (value === 'no') return 'No';
    return value;
  };

  const agreementEntries = [
    { label: 'Type of Property', value: agreement.propertyType },
    { label: 'Type of Lease', value: agreement.leaseType },
    { label: 'Start Date', value: agreement.startDate },
    { label: 'End Date', value: agreement.endDate },
    { label: 'Bedrooms', value: agreement.bedrooms },
    { label: 'Bathrooms', value: agreement.bathrooms },
    { label: 'Property Address', value: agreement.propertyAddress },
    { label: 'The Landlord', value: agreement.landlord },
    { label: 'The Tenant', value: agreement.tenant },
    { label: 'Notices to Tenant', value: agreement.noticesToTenant },
    { label: 'Occupants', value: agreement.occupants },
    { label: 'Furnishings', value: agreement.furnishings },
    { label: 'Appliances', value: agreement.appliances },
    { label: 'Monthly Rent', value: agreement.monthlyRent },
    { label: 'Payment Methods', value: agreement.paymentMethods },
    { label: 'Security Deposit', value: agreement.securityDeposit },
    { label: 'Early Move-In', value: agreement.earlyMoveIn },
    { label: 'Prepaid Rent', value: agreement.prepaidRent },
    { label: 'Late Fee', value: agreement.lateFee },
    { label: 'NSF Fee', value: agreement.nsfFee },
    { label: 'Parking', value: agreement.parking },
    { label: 'Utilities and Services', value: agreement.utilitiesServices },
    { label: 'Pets', value: agreement.pets },
    { label: 'Move-In Inspection', value: agreement.moveInInspection },
    { label: 'Smoking Policy', value: agreement.smokingPolicy },
    { label: 'Renters Insurance', value: agreement.rentersInsurance },
    { label: 'Subletting', value: agreement.subletting },
    { label: 'Authorized Persons', value: agreement.authorizedPersons },
    { label: 'Lead-Based Paint Disclosure', value: agreement.leadBasedPaintDisclosure },
    { label: 'Co-Signer', value: agreement.cosigner },
    { label: 'Additional Terms', value: agreement.additionalTerms },
  ];

  const handleOpenDocument = async () => {
    if (!lease?.documentUrl) {
      Alert.alert('Missing file', 'The landlord has not uploaded the lease document yet.');
      return;
    }
    const supported = await Linking.canOpenURL(lease.documentUrl);
    if (!supported) {
      Alert.alert('Unsupported link', 'Unable to open this lease document.');
      return;
    }
    await Linking.openURL(lease.documentUrl);
  };

  const handleSign = () => {
    if (!lease) return;
    Alert.alert(
      'Sign lease',
      'By signing, you confirm you reviewed and accept the lease terms.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Lease',
          onPress: async () => {
            try {
              await api.patch(endpoints.signLease);
              setLeasePreviewed(true);
              await loadLease();
              Alert.alert('Lease signed', 'Your lease has been signed successfully.');
            } catch (err) {
              console.error('Sign lease error:', err);
              Alert.alert('Unable to sign', 'Please try again in a moment.');
            }
          },
        },
      ]
    );
  };

  const handleSaveTenantInfo = async () => {
    setSavingTenant(true);
    try {
      await api.patch(endpoints.tenantLeaseAgreement, {
        tenant: tenantName,
        occupants,
        authorizedPersons,
        pets,
        cosigner,
        additionalTerms,
      });
      await loadLease();
      Alert.alert('Saved', 'Your lease agreement details were updated.');
    } catch (err) {
      console.error('Save lease agreement error:', err);
      Alert.alert('Unable to save', 'Please try again in a moment.');
    } finally {
      setSavingTenant(false);
    }
  };

  const YesNoToggle = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: YesNo;
    onChange: (next: YesNo) => void;
  }) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleGroup}>
        {(['yes', 'no'] as YesNo[]).map((option) => {
          const selected = value === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.toggleButton, selected && styles.toggleButtonActive]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.toggleText, selected && styles.toggleTextActive]}>
                {option.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLease} />}
    >
      {error && (
        <Card style={styles.noticeCard} padding={16}>
          <Text style={styles.noticeText}>{error}</Text>
        </Card>
      )}

      {!lease ? (
        <Card style={styles.card} padding={16}>
          <Text style={styles.title}>Lease not available</Text>
          <Text style={styles.subtitle}>
            Your landlord has not issued a lease yet. Check back soon.
          </Text>
        </Card>
      ) : (
        <Card style={styles.card} padding={16}>
          <Text style={styles.title}>Digital Lease Preview</Text>
          <Text style={styles.subtitle}>
            Review the landlord-issued lease and sign once ready.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lease term</Text>
            <Text style={styles.sectionText}>Ends on {lease.endDate}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unit</Text>
            <Text style={styles.sectionText}>
              {lease.unit?.property.name} - Unit {lease.unit?.unitNumber}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Text style={styles.sectionText}>
              {lease.status === 'active' ? 'Signed' : 'Pending signature'}
              {lease.signedDate
                ? ` on ${format(new Date(lease.signedDate), 'MMM dd, yyyy')}`
                : ''}
            </Text>
          </View>

          {lease.notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lease notes</Text>
              <Text style={styles.sectionText}>{lease.notes}</Text>
            </View>
          ) : null}

          {agreementEntries.some((entry) => entry.value) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Agreement summary</Text>
              {agreementEntries
                .filter((entry) => entry.value)
                .map((entry) => (
                  <View key={entry.label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{entry.label}</Text>
                    <Text style={styles.summaryValue}>{formatAgreementValue(entry.value)}</Text>
                  </View>
                ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tenant agreement details</Text>
            <Text style={styles.sectionText}>
              Fill in your details before signing the lease.
            </Text>
          </View>

          <TextInput
            placeholder="The Tenant"
            value={tenantName}
            onChangeText={setTenantName}
            style={styles.input}
          />
          <TextInput
            placeholder="Occupants"
            value={occupants}
            onChangeText={setOccupants}
            style={styles.input}
          />
          <TextInput
            placeholder="Authorized Persons"
            value={authorizedPersons}
            onChangeText={setAuthorizedPersons}
            style={styles.input}
          />
          <YesNoToggle label="Pets" value={pets} onChange={setPets} />
          <YesNoToggle label="Co-Signer" value={cosigner} onChange={setCosigner} />
          <TextInput
            placeholder="Additional Terms or Conditions"
            value={additionalTerms}
            onChangeText={setAdditionalTerms}
            style={[styles.input, styles.textArea]}
            multiline
          />
          <TouchableOpacity
            style={[styles.secondaryButton, savingTenant && styles.primaryButtonDisabled]}
            onPress={handleSaveTenantInfo}
            disabled={savingTenant}
          >
            <Text style={styles.secondaryButtonText}>
              {savingTenant ? 'Saving...' : 'Save Tenant Details'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenDocument}>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Open Lease</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, lease.status === 'active' && styles.primaryButtonDisabled]}
              onPress={handleSign}
              disabled={lease.status === 'active'}
            >
              <Text style={styles.primaryButtonText}>
                {lease.status === 'active' ? 'Signed' : 'Sign Lease'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.acknowledgeRow}>
            <Ionicons
              name={leasePreviewed ? 'checkmark-circle' : 'information-circle-outline'}
              size={18}
              color={leasePreviewed ? colors.success : colors.textSecondary}
            />
            <Text style={styles.acknowledgeText}>
              {leasePreviewed ? 'Lease preview reviewed' : 'Tap to acknowledge review'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => setLeasePreviewed(!leasePreviewed)}
          >
            <Text style={styles.outlineButtonText}>
              {leasePreviewed ? 'Mark as Unread' : 'Acknowledge Review'}
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 24,
  },
  noticeCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warning + '14',
  },
  noticeText: {
    color: colors.text,
    fontSize: 13,
  },
  card: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sectionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  summaryRow: {
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    fontSize: 13,
    color: colors.text,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  toggleText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  acknowledgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  acknowledgeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.primary + '70',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  outlineButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
