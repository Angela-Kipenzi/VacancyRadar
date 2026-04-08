import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { useTenancy } from '../../contexts/TenancyContext';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';

const { width } = Dimensions.get('window');
const PHOTO_WIDTH = (width - 48) / 2;

const rooms = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Balcony'];

export const PhotoComparisonScreen = () => {
  const { checkIn, checkOut } = useTenancy();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Move-in vs Move-out</Text>
      <Text style={styles.headerSubtitle}>Compare conditions room by room</Text>

      {rooms.map((room) => {
        const inPhoto = checkIn.photos.find((p) => p.room === room);
        const outPhoto = checkOut.photos.find((p) => p.room === room);

        if (!inPhoto && !outPhoto) return null;

        return (
          <Card key={room} style={styles.card} padding={12}>
            <Text style={styles.roomName}>{room}</Text>
            <View style={styles.comparisonRow}>
              <View style={styles.photoContainer}>
                <Text style={styles.photoLabel}>Move-in</Text>
                {inPhoto ? (
                  <Image source={{ uri: inPhoto.uri }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>No photo</Text>
                  </View>
                )}
              </View>

              <View style={styles.photoContainer}>
                <Text style={styles.photoLabel}>Move-out</Text>
                {outPhoto ? (
                  <Image source={{ uri: outPhoto.uri }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>No photo</Text>
                  </View>
                )}
              </View>
            </View>
            {outPhoto?.note && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Move-out Note:</Text>
                <Text style={styles.noteText}>{outPhoto.note}</Text>
              </View>
            )}
          </Card>
        );
      })}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: PHOTO_WIDTH,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_WIDTH,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  placeholder: {
    width: PHOTO_WIDTH,
    height: PHOTO_WIDTH,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textLight,
  },
  noteContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
