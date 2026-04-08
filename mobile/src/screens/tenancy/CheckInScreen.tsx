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
  Image,
  Dimensions,
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
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [locationChecking, setLocationChecking] = useState(false);
  const [photosExpanded, setPhotosExpanded] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const totalPhotos = checkIn.photos.length;

  const getOptionalLastKnownCoords = async () => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      let status = current.status;

      if (status !== 'granted' && current.canAskAgain) {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status !== 'granted') {
        return undefined;
      }

      const lastLocation = await Location.getLastKnownPositionAsync({});
      if (!lastLocation) {
        return undefined;
      }

      return {
        lat: lastLocation.coords.latitude,
        lng: lastLocation.coords.longitude,
      };
    } catch (error) {
      console.error('Unable to read last known location:', error);
      return undefined;
    }
  };

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
    
    // Extract unit id (assumes 'http://.../api/qrcodes/<unitId>' or just '<unitId>')
    const parts = data.split('/');
    const unitId = parts.pop() || data;
    
    const timestamp = new Date().toISOString();
    
    syncCheckIn({ qrScanned: true, qrData: data, unitId, checkInTimestamp: timestamp })
      .then(() => {
        setCheckInField({ qrScanned: true, qrData: data, unitId, checkInTimestamp: timestamp });
      })
      .catch((error) => {
        Alert.alert(
          'Check-in Failed',
          error?.response?.data?.error || 'Unit is currently occupied by another tenant.'
        );
      });
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
      const coords = await getOptionalLastKnownCoords();
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

        {checkIn.welcomeInfo && (
          <View style={styles.welcomeBanner}>
            <Ionicons name="home" size={24} color={colors.primary} style={styles.welcomeIcon} />
            <View style={styles.welcomeBannerText}>
              <Text style={styles.welcomeTitle}>
                Welcome {checkIn.welcomeInfo.firstName} to {checkIn.welcomeInfo.propertyName}
              </Text>
              <Text style={styles.welcomeSubtitle}>Unit {checkIn.welcomeInfo.unitNumber}</Text>
            </View>
          </View>
        )}

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
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Unit condition photos</Text>
            <Text style={styles.sectionSubtitle}>Room-by-room guide with timestamps.</Text>
          </View>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setPhotosExpanded((prev) => !prev)}
          >
            <Text style={styles.secondaryButtonText}>
              {photosExpanded ? 'Hide' : 'Manage'}
            </Text>
          </TouchableOpacity>
        </View>
        {!photosExpanded ? (
          <Text style={styles.photoSummary}>
            Photos added: {totalPhotos}. Add room photos and damage notes when ready.
          </Text>
        ) : (
          <>
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
          </>
        )}
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Check-in Photos</Text>
        <Text style={styles.sectionSubtitle}>
          Review all photos taken during check-in.
        </Text>
        <View style={styles.statusRow}>
          <Ionicons
            name={checkIn.photos.length > 0 ? 'image' : 'image-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.statusText}>{checkIn.photos.length} Photos Captured</Text>
        </View>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => {
            if (checkIn.photos.length === 0) {
              Alert.alert('No Photos', 'Please add some room photos first.');
              return;
            }
            setGalleryVisible(true);
          }}
        >
          <Ionicons name="images" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>
            View All Photos
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

      <Modal visible={galleryVisible} animationType="fade" transparent={true}>
        <View style={styles.galleryContainer}>
          <TouchableOpacity 
            style={styles.galleryClose} 
            onPress={() => setGalleryVisible(false)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
          >
            {checkIn.photos.map((photo, index) => (
              <View key={photo.id || index} style={styles.gallerySlide}>
                <Image 
                  source={{ uri: photo.uri }} 
                  style={styles.galleryImage} 
                  resizeMode="contain" 
                />
                <View style={styles.galleryCaption}>
                  <Text style={styles.galleryCaptionText}>{photo.room}</Text>
                  {photo.note && <Text style={styles.galleryCaptionNote}>{photo.note}</Text>}
                </View>
              </View>
            ))}
          </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  photoSummary: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
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
  welcomeBanner: {
    backgroundColor: colors.primary + '11',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeIcon: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 12,
  },
  welcomeBannerText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  galleryScroll: {
    flex: 1,
  },
  gallerySlide: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  galleryImage: {
    width: '100%',
    height: '80%',
  },
  galleryClose: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  galleryCaption: {
    position: 'absolute',
    bottom: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  galleryCaptionText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  galleryCaptionNote: {
    color: colors.textLight,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
