import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useSearch } from '../../contexts/SearchContext';
import { mockProperties } from '../../data/mockProperties';
import { formatCurrency } from '../../utils/search';

const amenityIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  parking_street: 'car-outline',
  parking_garage: 'car-sport-outline',
  parking_dedicated: 'car',
  laundry_in_unit: 'shirt-outline',
  laundry_building: 'shirt',
  laundry_none: 'close-circle-outline',
  air_conditioning: 'snow-outline',
  heating: 'flame-outline',
  pet_cats: 'paw-outline',
  pet_dogs: 'paw',
  pet_both: 'paw',
  pet_none: 'close-circle-outline',
  furnished: 'bed-outline',
  unfurnished: 'bed',
  balcony: 'sunny-outline',
  gym: 'barbell-outline',
  pool: 'water-outline',
  elevator: 'arrow-up-outline',
  wheelchair: 'accessibility-outline',
  security: 'shield-checkmark-outline',
  storage: 'cube-outline',
};

const neighborhoodInsights = [
  { label: 'Restaurants & Cafes', value: '12 nearby' },
  { label: 'Public Transport', value: '3 stops within 400m' },
  { label: 'Schools', value: '2 rated schools' },
  { label: 'Healthcare', value: '1 clinic · 1 hospital' },
  { label: 'Shopping Centers', value: '4 within 10 min' },
  { label: 'Parks & Recreation', value: '2 parks close by' },
  { label: 'Safety Stats', value: 'Low incident zone' },
  { label: 'Demographics', value: 'Young professionals' },
  { label: 'Noise Levels', value: 'Moderate day · Low night' },
  { label: 'User Reviews', value: '4.6 avg score' },
];

export const PropertyDetailsScreen = ({ route, navigation }: any) => {
  const { propertyId } = route.params;
  const { savedPropertyIds, toggleSavedProperty } = useSearch();
  const property = mockProperties.find((item) => item.id === propertyId);
  const { width } = useWindowDimensions();
  const galleryWidth = Math.max(280, width - 32);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  const galleryItems = useMemo(() => {
    if (!property) return [];
    return property.images.length ? property.images : ['photo-1', 'photo-2'];
  }, [property]);

  if (!property) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Property not found.</Text>
      </View>
    );
  }

  const isSaved = savedPropertyIds.includes(property.id);
  const statusColor =
    property.status === 'available'
      ? colors.success
      : property.status === 'pending'
      ? colors.warning
      : colors.gray[400];

  const amenityList = showAllAmenities ? property.amenities : property.amenities.slice(0, 6);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gallerySection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
              );
              setGalleryIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {galleryItems.map((imageId, index) => (
              <TouchableOpacity
                key={imageId}
                style={[styles.galleryCard, { width: galleryWidth }]}
                onPress={() => setGalleryOpen(true)}
              >
                <View style={styles.galleryPlaceholder}>
                  <Ionicons name="image-outline" size={36} color={colors.textSecondary} />
                  <Text style={styles.galleryLabel}>Photo {index + 1}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.galleryOverlay}>
            <View style={styles.galleryBadge}>
              <Text style={styles.galleryBadgeText}>
                {galleryIndex + 1}/{galleryItems.length}
              </Text>
            </View>
            {property.virtualTourAvailable && (
              <View style={styles.galleryBadge}>
                <Ionicons name="cube-outline" size={14} color={colors.white} />
                <Text style={styles.galleryBadgeText}>360 Tour</Text>
              </View>
            )}
          </View>
        </View>

        <Card style={styles.hero} padding={20}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroTitle}>{property.title}</Text>
              <Text style={styles.heroSubtitle}>
                {property.address}, {property.neighborhood}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => toggleSavedProperty(property.id)}
            >
              <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroPrice}>{formatCurrency(property.price, property.currency)}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{property.bedrooms} bd</Text>
            <Text style={styles.metaText}>{property.bathrooms} ba</Text>
            <Text style={styles.metaText}>
              {property.sqft} {property.sqftUnit}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>{property.status}</Text>
          </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => navigation.navigate('ApplicationForm', { propertyId: property.id })}
          >
            <Ionicons name="paper-plane" size={16} color={colors.white} />
            <Text style={styles.primaryActionText}>Apply Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.secondaryActionText}>Schedule Viewing</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.reviewsButton}
          onPress={() => navigation.navigate('PropertyReviews', { propertyId: property.id })}
        >
          <Ionicons name="star-outline" size={16} color={colors.primary} />
          <Text style={styles.reviewsButtonText}>View Reviews</Text>
        </TouchableOpacity>
      </Card>

        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>Key Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Monthly rent</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(property.price, property.currency)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Security deposit</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(property.depositAmount, property.currency)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Available from</Text>
            <Text style={styles.infoValue}>{property.availableDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Min lease</Text>
            <Text style={styles.infoValue}>{property.minLeaseMonths} months</Text>
          </View>
          <View style={styles.mapPreview}>
            <Text style={styles.mapPreviewText}>Static Map Preview</Text>
            <TouchableOpacity style={styles.mapButton}>
              <Ionicons name="navigate" size={14} color={colors.white} />
              <Text style={styles.mapButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bedrooms</Text>
            <Text style={styles.infoValue}>{property.bedrooms}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bathrooms</Text>
            <Text style={styles.infoValue}>{property.bathrooms}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Square footage</Text>
            <Text style={styles.infoValue}>
              {property.sqft} {property.sqftUnit}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Floor</Text>
            <Text style={styles.infoValue}>{property.floor}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Year built</Text>
            <Text style={styles.infoValue}>{property.yearBuilt}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Property type</Text>
            <Text style={styles.infoValue}>{property.type}</Text>
          </View>
        </Card>

        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <TouchableOpacity onPress={() => setShowAllAmenities((prev) => !prev)}>
              <Text style={styles.linkText}>{showAllAmenities ? 'See less' : 'See all'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.amenitiesGrid}>
            {amenityList.map((amenity) => (
              <View key={amenity} style={styles.amenityItem}>
                <Ionicons
                  name={amenityIconMap[amenity] || 'sparkles-outline'}
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.amenityText}>{amenity.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Translate</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.descriptionText} numberOfLines={expandedDescription ? undefined : 3}>
            {property.description}
          </Text>
          <TouchableOpacity onPress={() => setExpandedDescription((prev) => !prev)}>
            <Text style={styles.linkText}>{expandedDescription ? 'Read less' : 'Read more'}</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nearby amenities</Text>
            <Text style={styles.infoValue}>Groceries, cafes, transit</Text>
          </View>
          <View style={styles.locationChips}>
            {['Schools', 'Shops', 'Transit', 'Parks'].map((label) => (
              <View key={label} style={styles.locationChip}>
                <Text style={styles.locationChipText}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreValue}>82</Text>
              <Text style={styles.scoreLabel}>Walk score</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreValue}>76</Text>
              <Text style={styles.scoreLabel}>Transit score</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>Virtual Tour</Text>
          <View style={styles.virtualGrid}>
            <View style={styles.virtualCard}>
              <Ionicons name="cube-outline" size={22} color={colors.primary} />
              <Text style={styles.virtualText}>360 Viewer</Text>
            </View>
            <View style={styles.virtualCard}>
              <Ionicons name="videocam-outline" size={22} color={colors.primary} />
              <Text style={styles.virtualText}>Video Walkthrough</Text>
            </View>
            <View style={styles.virtualCard}>
              <Ionicons name="map-outline" size={22} color={colors.primary} />
              <Text style={styles.virtualText}>Floor Plan</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>Neighborhood Insights</Text>
          {neighborhoodInsights.map((item) => (
            <View key={item.label} style={styles.insightRow}>
              <Text style={styles.insightLabel}>{item.label}</Text>
              <Text style={styles.insightValue}>{item.value}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.sectionCard} padding={16}>
          <Text style={styles.sectionTitle}>Property Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              <Text style={styles.actionTileText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={styles.actionTileText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <Text style={styles.actionTileText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="share-outline" size={18} color={colors.primary} />
              <Text style={styles.actionTileText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="logo-whatsapp" size={18} color={colors.primary} />
              <Text style={styles.actionTileText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="chatbox-outline" size={18} color={colors.primary} />
              <Text style={styles.actionTileText}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="link-outline" size={18} color={colors.primary} />
              <Text style={styles.actionTileText}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="share-social-outline" size={18} color={colors.primary} />
              <Text style={styles.actionTileText}>Social</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile}>
              <Ionicons name="flag-outline" size={18} color={colors.error} />
              <Text style={[styles.actionTileText, styles.reportText]}>Report Listing</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      <Modal transparent visible={galleryOpen} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photo Gallery</Text>
              <TouchableOpacity onPress={() => setGalleryOpen(false)}>
                <Ionicons name="close" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Ionicons name="expand-outline" size={22} color={colors.white} />
              <Text style={styles.modalText}>Pinch to zoom</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalActionButton}>
                <Ionicons name="share-social-outline" size={16} color={colors.white} />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalActionButton}>
                <Ionicons name="download-outline" size={16} color={colors.white} />
                <Text style={styles.modalActionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  gallerySection: {
    marginBottom: 16,
  },
  galleryCard: {
    height: 200,
    marginRight: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.gray[200],
  },
  galleryPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  galleryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  galleryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  galleryBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  hero: {
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  heroPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionText: {
    color: colors.white,
    fontWeight: '600',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  reviewsButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewsButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  mapPreview: {
    marginTop: 12,
    height: 120,
    borderRadius: 14,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPreviewText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  amenityText: {
    fontSize: 12,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  locationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  locationChip: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  virtualGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  virtualCard: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  virtualText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  insightLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  insightValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  actionTile: {
    width: '47%',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  actionTileText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reportText: {
    color: colors.error,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.text,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalBody: {
    marginTop: 20,
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalText: {
    color: colors.white,
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  modalActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    padding: 16,
    color: colors.textSecondary,
  },
});
