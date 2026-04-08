import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import api from '../../config/api';
import { ScreenProps } from '../../types';

const categories = [
  { id: 'plumbing', label: 'Plumbing', icon: 'water-outline' },
  { id: 'electrical', label: 'Electrical', icon: 'flash-outline' },
  { id: 'hvac', label: 'HVAC', icon: 'thermometer-outline' },
  { id: 'appliance', label: 'Appliance', icon: 'home-outline' },
  { id: 'other', label: 'Other', icon: 'construct-outline' },
];

const priorities = [
  { id: 'low', label: 'Low', color: colors.textSecondary },
  { id: 'medium', label: 'Medium', color: colors.info },
  { id: 'high', label: 'High', color: colors.warning },
  { id: 'urgent', label: 'Urgent', color: colors.error },
];

export const CreateMaintenanceRequestScreen = ({ navigation }: ScreenProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('plumbing');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/maintenance', {
        title,
        description,
        category,
        priority,
      });
      Alert.alert('Success', 'Maintenance request created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'Failed to create maintenance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Leaking faucet"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the issue in detail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Card>

      <Text style={styles.sectionTitle}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.categoryCard,
              category === item.id && styles.activeCategoryCard,
            ]}
            onPress={() => setCategory(item.id)}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={category === item.id ? colors.white : colors.primary}
            />
            <Text
              style={[
                styles.categoryLabel,
                category === item.id && styles.activeCategoryLabel,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Priority</Text>
      <Card style={styles.card} padding={8}>
        <View style={styles.priorityRow}>
          {priorities.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.priorityButton,
                priority === item.id && { backgroundColor: item.color },
              ]}
              onPress={() => setPriority(item.id)}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === item.id && styles.activePriorityText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Button
        title={loading ? 'Creating...' : 'Submit Request'}
        onPress={handleSubmit}
        disabled={loading}
        variant="primary"
        style={styles.submitButton}
      />
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCategoryCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeCategoryLabel: {
    color: colors.white,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activePriorityText: {
    color: colors.white,
  },
  submitButton: {
    marginTop: 10,
  },
});
