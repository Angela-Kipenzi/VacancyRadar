import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useApplications } from '../../contexts/ApplicationsContext';
import { useListings } from '../../contexts/ListingsContext';
import { PropertyListing } from '../../types';
import { formatCurrency } from '../../utils/search';

export const ApplicationFormScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { submitApplication } = useApplications();
  const { getListingById, fetchListingById } = useListings();
  const propertyId = route?.params?.propertyId as string | undefined;
  const [property, setProperty] = useState<PropertyListing | undefined>(
    () => (propertyId ? getListingById(propertyId) : undefined)
  );

  useEffect(() => {
    if (!propertyId) return;
    const existing = getListingById(propertyId);
    if (existing) {
      setProperty(existing);
      return;
    }
    fetchListingById(propertyId)
      .then((item) => setProperty(item ?? undefined))
      .catch(() => undefined);
  }, [propertyId, getListingById, fetchListingById]);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentAddress, setCurrentAddress] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!property) {
      Alert.alert('Missing property', 'Unable to submit without a property selection.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Please complete all required fields.');
      return;
    }
    submitApplication(
      property,
      { firstName: firstName.trim(), lastName: lastName.trim(), email, phone, currentAddress },
      message.trim() || undefined
    );
    Alert.alert('Application submitted', 'Your application has been sent to the landlord.');
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Applications', { screen: 'ApplicationsDashboard' });
    } else {
      navigation.navigate('ApplicationsDashboard');
    }
  };

  if (!property) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No property selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Property Information</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Property</Text>
          <Text style={styles.value}>{property.title}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>
            {property.address}, {property.city}
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Unit</Text>
          <Text style={styles.value}>{property.unitNumber}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Monthly rent</Text>
          <Text style={styles.value}>{formatCurrency(property.price, property.currency)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Bedrooms/Bathrooms</Text>
          <Text style={styles.value}>
            {property.bedrooms} bd · {property.bathrooms} ba
          </Text>
        </View>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Applicant Information</Text>
        <TextInput
          placeholder="First Name *"
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
        />
        <TextInput
          placeholder="Last Name *"
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
        />
        <TextInput
          placeholder="Email *"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Phone *"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TextInput
          placeholder="Current Address (optional)"
          value={currentAddress}
          onChangeText={setCurrentAddress}
          style={styles.input}
        />
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Message to Landlord</Text>
        <TextInput
          placeholder="Introduce yourself, ask questions, or share anything relevant."
          value={message}
          onChangeText={setMessage}
          style={[styles.input, styles.messageInput]}
          multiline
        />
      </Card>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Ionicons name="paper-plane" size={18} color={colors.white} />
        <Text style={styles.submitText}>Submit Application</Text>
      </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginTop: 10,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: colors.white,
    fontWeight: '600',
  },
  emptyText: {
    padding: 16,
    color: colors.textSecondary,
  },
});
