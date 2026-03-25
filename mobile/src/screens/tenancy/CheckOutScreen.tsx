import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useTenancy } from '../../contexts/TenancyContext';
import { scheduleReviewPrompt } from '../../services/notifications';

const rooms = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Balcony'];

export const CheckOutScreen = () => {
  const {
    checkOut,
    setCheckOutField,
    addCheckOutPhoto,
    setForwardingAddress,
    setMeterReading,
    syncCheckOut,
    leaseInfo,
  } = useTenancy();

  const handleInitiate = () => {
    const leaseEnd = new Date(leaseInfo.endDate);
    if (Date.now() > leaseEnd.getTime()) {
      Alert.alert('Lease ended', 'Check-out should be initiated on or before the lease end date.');
    }
    const timestamp = new Date().toISOString();
    setCheckOutField({ initiated: true, checkOutTimestamp: timestamp });
    syncCheckOut({ initiated: true, checkOutTimestamp: timestamp }).catch(() => undefined);
  };

  const handleCapturePhoto = async (room: string) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Camera permission', 'Camera access is required for photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const photo = result.assets[0];
      const lastLocation = await Location.getLastKnownPositionAsync({});
      const coords = lastLocation
        ? { lat: lastLocation.coords.latitude, lng: lastLocation.coords.longitude }
        : undefined;
      addCheckOutPhoto(room, photo.uri, coords);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>QR Check-out</Text>
        <Text style={styles.subtitle}>Initiate within lease end date to stay compliant.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleInitiate}>
          <Ionicons name="exit-outline" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>
            {checkOut.initiated ? 'Check-out Initiated' : 'Initiate Check-out'}
          </Text>
        </TouchableOpacity>
        {checkOut.checkOutTimestamp && (
          <Text style={styles.metaText}>Started: {checkOut.checkOutTimestamp}</Text>
        )}
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Final inspection</Text>
        <Text style={styles.sectionSubtitle}>Room-by-room photo guide with comparisons.</Text>
        {rooms.map((room) => (
          <View key={room} style={styles.photoRow}>
            <View>
              <Text style={styles.photoRoom}>{room}</Text>
              <Text style={styles.photoMeta}>
                {checkOut.photos.filter((photo) => photo.room === room).length} added
              </Text>
            </View>
            <TouchableOpacity style={styles.photoButton} onPress={() => handleCapturePhoto(room)}>
              <Ionicons name="camera" size={16} color={colors.primary} />
              <Text style={styles.photoButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => {
            const nextValue = !checkOut.inspectionCompleted;
            setCheckOutField({ inspectionCompleted: nextValue });
            syncCheckOut({ inspectionCompleted: nextValue }).catch(() => undefined);
          }}
        >
          <Ionicons name="checkmark-done" size={16} color={colors.primary} />
          <Text style={styles.outlineButtonText}>
            {checkOut.inspectionCompleted ? 'Inspection Complete' : 'Mark Inspection Complete'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.compareButton}>
          <Ionicons name="git-compare-outline" size={16} color={colors.primary} />
          <Text style={styles.compareText}>Compare with move-in photos</Text>
        </TouchableOpacity>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Utilities & Keys</Text>
        <TextInput
          placeholder="Final meter readings"
          value={checkOut.meterReading}
          onChangeText={(value) => {
            setMeterReading(value);
            syncCheckOut({ meterReading: value }).catch(() => undefined);
          }}
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => {
            const nextValue = !checkOut.keyReturned;
            setCheckOutField({ keyReturned: nextValue });
            syncCheckOut({ keyReturned: nextValue }).catch(() => undefined);
          }}
        >
          <Ionicons name="key-outline" size={16} color={colors.primary} />
          <Text style={styles.outlineButtonText}>
            {checkOut.keyReturned ? 'Key Returned' : 'Confirm Key Return'}
          </Text>
        </TouchableOpacity>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Forwarding address</Text>
        <TextInput
          placeholder="Address for deposit return"
          value={checkOut.forwardingAddress}
          onChangeText={(value) => {
            setForwardingAddress(value);
            syncCheckOut({ forwardingAddress: value }).catch(() => undefined);
          }}
          style={[styles.input, styles.multiline]}
          multiline
        />
        <View style={styles.statusRow}>
          <Ionicons name="home-outline" size={16} color={colors.primary} />
          <Text style={styles.statusText}>Unit status: {checkOut.unitStatus}</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setCheckOutField({ unitStatus: 'available' });
            syncCheckOut({ unitStatus: 'available' }).catch(() => undefined);
            if (checkOut.checkOutTimestamp) {
              scheduleReviewPrompt(checkOut.checkOutTimestamp).catch(() => undefined);
            }
          }}
        >
          <Ionicons name="checkmark-circle" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>Confirm Check-out</Text>
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
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  photoRoom: {
    fontSize: 14,
    color: colors.text,
  },
  photoMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
    color: colors.primary,
    fontWeight: '600',
  },
  outlineButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  compareButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primary + '12',
  },
  compareText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    color: colors.text,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
