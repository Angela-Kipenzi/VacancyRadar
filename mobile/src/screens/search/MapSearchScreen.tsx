import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { useSearch } from '../../contexts/SearchContext';
import { mockProperties } from '../../data/mockProperties';
import { formatCurrency, matchesFilters } from '../../utils/search';
import { PropertyListing } from '../../types';

type MapType = 'street' | 'satellite' | 'hybrid';

interface ClusterItem {
  id: string;
  properties: PropertyListing[];
  mapX: number;
  mapY: number;
}

const MAP_TYPES: MapType[] = ['street', 'satellite', 'hybrid'];

const getPinColor = (status: PropertyListing['status'], isSaved: boolean) => {
  if (isSaved) return colors.info;
  if (status === 'available') return colors.success;
  if (status === 'pending') return colors.warning;
  return colors.gray[400];
};

const clusterProperties = (properties: PropertyListing[], zoomLevel: number) => {
  const threshold = zoomLevel === 1 ? 0.12 : zoomLevel === 2 ? 0.08 : 0.05;
  const remaining = [...properties];
  const clusters: ClusterItem[] = [];

  while (remaining.length) {
    const seed = remaining.shift()!;
    const group = [seed];

    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      const candidate = remaining[i];
      const dx = seed.location.mapX - candidate.location.mapX;
      const dy = seed.location.mapY - candidate.location.mapY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < threshold) {
        group.push(candidate);
        remaining.splice(i, 1);
      }
    }

    if (group.length === 1) {
      clusters.push({
        id: seed.id,
        properties: group,
        mapX: seed.location.mapX,
        mapY: seed.location.mapY,
      });
    } else {
      const avgX = group.reduce((sum, item) => sum + item.location.mapX, 0) / group.length;
      const avgY = group.reduce((sum, item) => sum + item.location.mapY, 0) / group.length;
      clusters.push({
        id: `cluster-${seed.id}`,
        properties: group,
        mapX: avgX,
        mapY: avgY,
      });
    }
  }

  return clusters;
};

export const MapSearchScreen = ({ navigation }: any) => {
  const {
    filters,
    savedPropertyIds,
    toggleSavedProperty,
    saveSearch,
    recordViewedProperty,
  } = useSearch();
  const [mapType, setMapType] = useState<MapType>('street');
  const [zoomLevel, setZoomLevel] = useState(2);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<PropertyListing[] | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showLocationNote, setShowLocationNote] = useState(false);
  const locationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  const filteredProperties = useMemo(
    () => mockProperties.filter((property) => matchesFilters(property, filters)),
    [filters]
  );

  const clusters = useMemo(
    () => clusterProperties(filteredProperties, zoomLevel),
    [filteredProperties, zoomLevel]
  );

  const handleSelectProperty = (property: PropertyListing) => {
    setSelectedCluster(null);
    setSelectedProperty(property);
  };

  const handleSelectCluster = (properties: PropertyListing[]) => {
    setSelectedProperty(null);
    setSelectedCluster(properties);
  };

  const handleOpenDetails = (property: PropertyListing) => {
    recordViewedProperty(property);
    navigation.navigate('PropertyDetails', { propertyId: property.id });
  };

  const handleSaveSearch = () => {
    if (!saveName.trim()) return;
    saveSearch(saveName.trim(), filters);
    setSaveName('');
    setShowSaveModal(false);
  };

  const handleLocate = () => {
    setShowLocationNote(true);
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
    locationTimeoutRef.current = setTimeout(() => {
      setShowLocationNote(false);
    }, 1600);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('SearchFilters')}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search city, neighborhood</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate('SearchFilters')}
        >
          <Ionicons name="options" size={18} color={colors.white} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('PropertyList')}
        >
          <Ionicons name="list" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.gray[400] }]} />
          <Text style={styles.legendText}>Occupied</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Text style={styles.legendText}>Saved</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <View
          style={[
            styles.mapSurface,
            mapType === 'satellite' && styles.mapSatellite,
            mapType === 'hybrid' && styles.mapHybrid,
          ]}
        >
          <View style={styles.mapGrid} />
          {clusters.map((cluster) => {
            const isCluster = cluster.properties.length > 1;
            const displayProperty = cluster.properties[0];
            const isSaved = displayProperty
              ? savedPropertyIds.includes(displayProperty.id)
              : false;
            const color = getPinColor(displayProperty.status, isSaved);
            return (
              <TouchableOpacity
                key={cluster.id}
                style={[
                  styles.pin,
                  {
                    backgroundColor: color,
                    left: `${cluster.mapX * 100}%`,
                    top: `${cluster.mapY * 100}%`,
                  },
                ]}
                onPress={() =>
                  isCluster
                    ? handleSelectCluster(cluster.properties)
                    : handleSelectProperty(displayProperty)
                }
              >
                {isCluster ? (
                  <Text style={styles.clusterText}>{cluster.properties.length}</Text>
                ) : (
                  <View style={styles.pinDot} />
                )}
              </TouchableOpacity>
            );
          })}

          <View style={styles.mapControls}>
            <View style={styles.mapTypeToggle}>
              {MAP_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mapTypeOption,
                    mapType === type && styles.mapTypeOptionActive,
                  ]}
                  onPress={() => setMapType(type)}
                >
                  <Text
                    style={[
                      styles.mapTypeText,
                      mapType === type && styles.mapTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setZoomLevel((prev) => Math.min(3, prev + 1))}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.zoomLabel}>Zoom {zoomLevel}</Text>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setZoomLevel((prev) => Math.max(1, prev - 1))}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.locationButton} onPress={handleLocate}>
              <Ionicons name="locate" size={18} color={colors.white} />
              <Text style={styles.locationText}>Current</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {showLocationNote && (
        <View style={styles.locationToast}>
          <Ionicons name="location" size={16} color={colors.white} />
          <Text style={styles.locationToastText}>Centered on your location</Text>
        </View>
      )}

      {(selectedProperty || selectedCluster) && (
        <Card style={styles.previewCard} padding={16}>
          {selectedProperty && (
            <>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.previewTitle}>{selectedProperty.title}</Text>
                  <Text style={styles.previewSubtitle}>
                    {selectedProperty.neighborhood} · {selectedProperty.city}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleSavedProperty(selectedProperty.id)}
                  style={styles.saveButton}
                >
                  <Ionicons
                    name={savedPropertyIds.includes(selectedProperty.id) ? 'heart' : 'heart-outline'}
                    size={18}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.previewPriceRow}>
                <Text style={styles.previewPrice}>
                  {formatCurrency(selectedProperty.price, selectedProperty.currency)}
                </Text>
                <Text style={styles.previewMeta}>
                  {selectedProperty.bedrooms} bd · {selectedProperty.bathrooms} ba ·{' '}
                  {selectedProperty.sqft} {selectedProperty.sqftUnit}
                </Text>
              </View>
              <View style={styles.previewImageRow}>
                <View style={styles.previewImage}>
                  <Ionicons name="image" size={18} color={colors.textSecondary} />
                  <Text style={styles.previewImageText}>Photo</Text>
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewInfoTitle}>Quick Preview</Text>
                  <Text style={styles.previewInfoText}>
                    Tap to see full details, amenities, and availability.
                  </Text>
                </View>
              </View>
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewAction}
                  onPress={() => handleOpenDetails(selectedProperty)}
                >
                  <Text style={styles.previewActionText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewAction, styles.previewSecondary]}
                  onPress={() => navigation.navigate('SearchFilters')}
                >
                  <Ionicons name="options" size={16} color={colors.primary} />
                  <Text style={styles.previewSecondaryText}>Refine</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {selectedCluster && (
            <>
              <Text style={styles.previewTitle}>
                {selectedCluster.length} listings in this area
              </Text>
              <Text style={styles.previewSubtitle}>Zoom in or select a listing</Text>
              <ScrollView style={styles.clusterList}>
                {selectedCluster.map((property) => (
                  <TouchableOpacity
                    key={property.id}
                    style={styles.clusterItem}
                    onPress={() => handleSelectProperty(property)}
                  >
                    <View style={styles.clusterDot} />
                    <View style={styles.clusterInfo}>
                      <Text style={styles.clusterTitle}>{property.title}</Text>
                      <Text style={styles.clusterMeta}>
                        {formatCurrency(property.price, property.currency)} · {property.bedrooms} bd
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </Card>
      )}

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bottomButton} onPress={() => setShowSaveModal(true)}>
          <Ionicons name="bookmark" size={18} color={colors.white} />
          <Text style={styles.bottomButtonText}>Save Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomSecondary]}
          onPress={() => navigation.navigate('SavedSearches')}
        >
          <Ionicons name="bookmarks" size={18} color={colors.primary} />
          <Text style={styles.bottomSecondaryText}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomSecondary]}
          onPress={() => navigation.navigate('SearchHistory')}
        >
          <Ionicons name="time" size={18} color={colors.primary} />
          <Text style={styles.bottomSecondaryText}>History</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={showSaveModal} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save this search</Text>
            <Text style={styles.modalSubtitle}>Give your search a name to reuse it later.</Text>
            <TextInput
              placeholder="e.g. Downtown studios"
              value={saveName}
              onChangeText={setSaveName}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleSaveSearch}>
                <Text style={styles.modalButtonText}>Save</Text>
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
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchPlaceholder: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  filterButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  listButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mapSurface: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  mapSatellite: {
    backgroundColor: '#1F2937',
  },
  mapHybrid: {
    backgroundColor: '#374151',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    borderWidth: 2,
    borderColor: colors.white,
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  clusterText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    alignItems: 'flex-end',
    gap: 10,
  },
  mapTypeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  mapTypeOption: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapTypeOptionActive: {
    backgroundColor: colors.primary,
  },
  mapTypeText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  mapTypeTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  zoomControls: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 6,
  },
  zoomButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  locationText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  locationToast: {
    position: 'absolute',
    bottom: 150,
    alignSelf: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationToastText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  previewCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  previewSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  previewMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  previewImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewImageText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  previewInfo: {
    flex: 1,
  },
  previewInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  previewInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  previewAction: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewActionText: {
    color: colors.white,
    fontWeight: '600',
  },
  previewSecondary: {
    backgroundColor: colors.primary + '14',
  },
  previewSecondaryText: {
    color: colors.primary,
    fontWeight: '600',
  },
  clusterList: {
    marginTop: 10,
    maxHeight: 150,
  },
  clusterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  clusterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  clusterInfo: {
    flex: 1,
  },
  clusterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  clusterMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  bottomSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomSecondaryText: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancel: {
    backgroundColor: colors.backgroundGray,
  },
  modalButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
