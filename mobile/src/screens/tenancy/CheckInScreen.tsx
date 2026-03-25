import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useTenancy } from '../../contexts/TenancyContext';
import { GeoPoint } from '../../types';
import { distanceMeters } from '../../utils/geo';

const rooms = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Balcony'];

export const CheckInScreen = () => {
  const {
    checkIn,
    setCheckInField,
    addCheckInPhoto,
    setDamageNotes,
    propertyLocation,
    locationRadiusMeters,
    syncCheckIn,
    sendWelcomeNotification,
  } = useTenancy();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [locationChecking, setLocationChecking] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const handleScan = async () => {
    // Check camera permissions
    if (!cameraPermission) {
      await requestCameraPermission();
      return;
    }
    
    if (!cameraPermission.granted) {
      Alert.alert(
        'Camera permission',
        'Camera access is required to scan the QR code.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant', onPress: requestCameraPermission },
        ]
      );
      return;
    }
    
    setScannerVisible(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScannerVisible(false);
    const timestamp = new Date().toISOString();
    setCheckInField({ qrScanned: true, qrData: data, checkInTimestamp: timestamp });
    syncCheckIn({ qrScanned: true, qrData: data, checkInTimestamp: timestamp }).catch(() => undefined);
  };

  const handleLocationVerify = async () => {
    setLocationChecking(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission', 'Location access is required for verification.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const coords: GeoPoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      let verified = true;
      if (propertyLocation) {
        const distance = distanceMeters(coords, propertyLocation);
        verified = distance <= locationRadiusMeters;
      }
      setCheckInField({ locationVerified: verified, locationCoords: coords });
      await syncCheckIn({ locationVerified: verified, locationCoords: coords });
      if (!verified) {
        Alert.alert('Location mismatch', 'You appear to be away from the property location.');
      }
    } catch {
      Alert.alert('Location error', 'Unable to verify location right now.');
    } finally {
      setLocationChecking(false);
    }
  };

  const handleWelcome = () => {
    setCheckInField({ welcomeSent: true, unitStatus: 'occupied' });
    syncCheckIn({ welcomeSent: true, unitStatus: 'occupied' }).catch(() => undefined);
    sendWelcomeNotification().catch(() => undefined);
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
      addCheckInPhoto(room, photo.uri, coords);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>QR Check-in</Text>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Ionicons name={checkIn.qrScanned ? 'checkmark' : 'qr-code'} size={16} color={colors.white} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Scan Unit QR Code</Text>
            <Text style={styles.stepSubtitle}>Use the camera to scan on arrival.</Text>
          </View>
          <TouchableOpacity style={styles.stepButton} onPress={handleScan}>
            <Text style={styles.stepButtonText}>{checkIn.qrScanned ? 'Scanned' : 'Scan'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Ionicons
              name={checkIn.locationVerified ? 'checkmark' : 'location'}
              size={16}
              color={colors.white}
            />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Verify Location</Text>
            <Text style={styles.stepSubtitle}>GPS confirms you are on-site.</Text>
          </View>
          <TouchableOpacity style={styles.stepButton} onPress={handleLocationVerify}>
            <Text style={styles.stepButtonText}>
              {locationChecking ? 'Checking...' : checkIn.locationVerified ? 'Verified' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Ionicons
              name={checkIn.keyCollected ? 'checkmark' : 'key-outline'}
              size={16}
              color={colors.white}
            />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Key Collection</Text>
            <Text style={styles.stepSubtitle}>Confirm keys collected.</Text>
          </View>
          <TouchableOpacity
            style={styles.stepButton}
            onPress={() => {
              const nextValue = !checkIn.keyCollected;
              setCheckInField({ keyCollected: nextValue });
              syncCheckIn({ keyCollected: nextValue }).catch(() => undefined);
            }}
          >
            <Text style={styles.stepButtonText}>
              {checkIn.keyCollected ? 'Done' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Unit condition photos</Text>
        <Text style={styles.sectionSubtitle}>Room-by-room guide with timestamps.</Text>
        {rooms.map((room) => (
          <View key={room} style={styles.photoRow}>
            <View>
              <Text style={styles.photoRoom}>{room}</Text>
            <Text style={styles.photoMeta}>
              {checkIn.photos.filter((photo) => photo.room === room).length} added
            </Text>
          </View>
            <TouchableOpacity style={styles.photoButton} onPress={() => handleCapturePhoto(room)}>
              <Ionicons name="camera" size={16} color={colors.primary} />
              <Text style={styles.photoButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TextInput
          placeholder="Notes for existing damage"
          value={checkIn.damageNotes}
          onChangeText={(value) => {
            setDamageNotes(value);
            syncCheckIn({ damageNotes: value }).catch(() => undefined);
          }}
          style={styles.notesInput}
          multiline
        />
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Completion</Text>
        <Text style={styles.sectionSubtitle}>
          Timestamped check-in will be recorded for lease compliance.
        </Text>
        <View style={styles.statusRow}>
          <Ionicons
            name={checkIn.unitStatus === 'occupied' ? 'home' : 'time-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.statusText}>Unit status: {checkIn.unitStatus}</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleWelcome}>
          <Ionicons name="send" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>
            {checkIn.welcomeSent ? 'Welcome Sent' : 'Send Welcome Notification'}
          </Text>
        </TouchableOpacity>
      </Card>

      <Modal visible={scannerVisible} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417', 'aztec'],
            }}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>Align the QR code within the frame</Text>
            <TouchableOpacity style={styles.scannerClose} onPress={() => setScannerVisible(false)}>
              <Ionicons name="close" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  stepSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepButton: {
    backgroundColor: colors.primary + '14',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepButtonText: {
    fontSize: 12,
    color: colors.primary,
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
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    color: colors.text,
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
    fontSize: 13,
    color: colors.textSecondary,
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
  scannerContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scannerOverlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  scannerText: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 12,
  },
  scannerClose: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
});