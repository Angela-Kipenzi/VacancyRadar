import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';

export const EditProfileScreen = ({ navigation }: any) => {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName ?? '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergencyContactPhone ?? '');
  const [photoUri, setPhotoUri] = useState(user?.profilePhotoUrl ?? '');
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().length > 0 &&
      phone.trim().length > 0 &&
      (firstName !== user?.firstName ||
        lastName !== user?.lastName ||
        email !== user?.email ||
        phone !== user?.phone ||
        emergencyContactName !== (user?.emergencyContactName ?? '') ||
        emergencyContactPhone !== (user?.emergencyContactPhone ?? '') ||
        photoUri !== (user?.profilePhotoUrl ?? ''))
    );
  }, [
    email,
    emergencyContactName,
    emergencyContactPhone,
    firstName,
    lastName,
    phone,
    photoUri,
    user?.email,
    user?.emergencyContactName,
    user?.emergencyContactPhone,
    user?.firstName,
    user?.lastName,
    user?.phone,
    user?.profilePhotoUrl,
  ]);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;

    if (asset.base64) {
      const mime = asset.mimeType ?? 'image/jpeg';
      setPhotoUri(`data:${mime};base64,${asset.base64}`);
      return;
    }

    setPhotoUri(asset.uri);
  };

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('No changes', 'Update at least one field before saving.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        profilePhotoUrl: photoUri || undefined,
      });
      Alert.alert('Profile updated', 'Your details have been saved.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Update failed', error.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>Profile Photo</Text>
        <View style={styles.photoRow}>
          <View style={styles.photoWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={28} color={colors.textLight} />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
            <Ionicons name="image-outline" size={16} color={colors.primary} />
            <Text style={styles.photoButtonText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>Personal Details</Text>
        <Text style={styles.label}>First name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
        />
        <Text style={styles.label}>Last name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>Emergency Contact</Text>
        <Text style={styles.label}>Contact name</Text>
        <TextInput
          style={styles.input}
          value={emergencyContactName}
          onChangeText={setEmergencyContactName}
          placeholder="Full name"
        />
        <Text style={styles.label}>Contact phone</Text>
        <TextInput
          style={styles.input}
          value={emergencyContactPhone}
          onChangeText={setEmergencyContactPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
        <Button
          title={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          loading={saving}
          disabled={!canSave || saving}
          fullWidth
          style={styles.saveButton}
        />
      </Card>

      <Card style={styles.noteCard} padding={16}>
        <View style={styles.noteHeader}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.noteTitle}>Profile updates</Text>
        </View>
        <Text style={styles.noteText}>
          Need help? Reach out to support if you have issues updating your profile.
        </Text>
        <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('HelpSupport')}>
          <Text style={styles.supportText}>Contact Support</Text>
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
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginTop: 6,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  saveButton: {
    marginTop: 16,
  },
  noteCard: {
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  noteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  supportButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  supportText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
