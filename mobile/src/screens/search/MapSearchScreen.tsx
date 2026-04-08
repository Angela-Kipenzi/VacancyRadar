import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  Camera,
  FillLayer,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { useSearch } from '../../contexts/SearchContext';
import { useListings } from '../../contexts/ListingsContext';
import { formatCurrency, matchesFilters } from '../../utils/search';
import { PropertyListing } from '../../types';

type MapType = 'street' | 'satellite' | 'hybrid';

const MAP_TYPES: MapType[] = ['street', 'satellite', 'hybrid'];
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY || '';
const HAS_MAPTILER_KEY = MAPTILER_KEY.trim().length > 0;
const EARTH_RADIUS_KM = 6371;
const LISTING_COLORS = {
  vacant: '#00C853',
  pending: '#FF6D00',
  occupied: '#D50000',
  saved: '#0057FF',
};

const DEFAULT_CENTER: [number, number] = [36.817223, -1.286389]; // Nairobi [lng, lat]
const DEFAULT_ZOOM = 11;

const hasValidCoordinates = (property: PropertyListing) => {
  const { lat, lng } = property.location;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
};

const styleUrlForType = (mapType: MapType, key: string) => {
  const styleId =
    mapType === 'satellite' ? 'satellite' : mapType === 'hybrid' ? 'hybrid' : 'streets-v2';
  return `https://api.maptiler.com/maps/${styleId}/style.json?key=${key}`;
};

const toRadians = (value: number) => (value * Math.PI) / 180;
const toDegrees = (value: number) => (value * 180) / Math.PI;

const destinationPoint = (
  originLat: number,
  originLng: number,
  bearingDegrees: number,
  distanceKm: number
) => {
  const angularDistance = distanceKm / EARTH_RADIUS_KM;
  const bearing = toRadians(bearingDegrees);
  const lat1 = toRadians(originLat);
  const lng1 = toRadians(originLng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2),
  };
};

const buildSearchAreaPolygon = (centerLat: number, centerLng: number, radiusKm: number) => {
  const steps = 64;
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * 360;
    const point = destinationPoint(centerLat, centerLng, bearing, radiusKm);
    ring.push([point.lng, point.lat]);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
    properties: {
      radiusKm,
    },
  } as GeoJSON.Feature<GeoJSON.Polygon>;
};

const getPinColor = (status: PropertyListing['status'], isSaved: boolean) => {
  if (isSaved) return LISTING_COLORS.saved;
  if (status === 'available') return LISTING_COLORS.vacant;
  if (status === 'pending') return LISTING_COLORS.pending;
  return LISTING_COLORS.occupied;
};

export const MapSearchScreen = ({ navigation }: any) => {
  const {
    filters,
    savedPropertyIds,
    toggleSavedProperty,
    saveSearch,
    recordViewedProperty,
  } = useSearch();
  const { listings, loading, error, refreshListings } = useListings();
  const cameraRef = useRef<CameraRef | null>(null);
  const locationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markersSignatureRef = useRef('');

  const [mapType, setMapType] = useState<MapType>('street');
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showLocationNote, setShowLocationNote] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchAreaCenter, setSearchAreaCenter] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_CENTER[1],
    lng: DEFAULT_CENTER[0],
  });

  const filteredProperties = useMemo(
    () => listings.filter((property) => matchesFilters(property, filters)),
    [filters, listings]
  );

  const mappableProperties = useMemo(
    () => filteredProperties.filter(hasValidCoordinates),
    [filteredProperties]
  );

  const mapStyle = useMemo(() => styleUrlForType(mapType, MAPTILER_KEY), [mapType]);
  const searchRadiusKm = useMemo(() => {
    if (typeof filters.radiusKm === 'number' && filters.radiusKm > 0) {
      return filters.radiusKm;
    }
    if (filters.drawAreaEnabled) {
      return 2;
    }
    return null;
  }, [filters.drawAreaEnabled, filters.radiusKm]);
  const searchAreaShape = useMemo(() => {
    if (!searchRadiusKm) return null;
    return buildSearchAreaPolygon(searchAreaCenter.lat, searchAreaCenter.lng, searchRadiusKm);
  }, [searchAreaCenter.lat, searchAreaCenter.lng, searchRadiusKm]);

  useEffect(() => {
    if (!selectedProperty) return;
    const stillVisible = filteredProperties.some((item) => item.id === selectedProperty.id);
    if (!stillVisible) {
      setSelectedProperty(null);
    }
  }, [filteredProperties, selectedProperty]);

  useEffect(() => {
    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!HAS_MAPTILER_KEY) return;

    const markerSignature = mappableProperties.map((property) => property.id).join('|');
    if (!markerSignature || markerSignature === markersSignatureRef.current) {
      return;
    }

    markersSignatureRef.current = markerSignature;

    if (mappableProperties.length === 1) {
      const property = mappableProperties[0];
      setSearchAreaCenter({ lat: property.location.lat, lng: property.location.lng });
      cameraRef.current?.setCamera({
        centerCoordinate: [property.location.lng, property.location.lat],
        zoomLevel: Math.max(12, filters.radiusKm ? 14 - filters.radiusKm * 0.3 : 13),
        animationDuration: 600,
        animationMode: 'easeTo',
      });
      return;
    }

    const latitudes = mappableProperties.map((item) => item.location.lat);
    const longitudes = mappableProperties.map((item) => item.location.lng);
    const ne: [number, number] = [Math.max(...longitudes), Math.max(...latitudes)];
    const sw: [number, number] = [Math.min(...longitudes), Math.min(...latitudes)];
    cameraRef.current?.fitBounds(ne, sw, 80, 700);
  }, [filters.radiusKm, mappableProperties]);

  const handleSelectProperty = (property: PropertyListing) => {
    setSelectedProperty(property);
    setSearchAreaCenter({ lat: property.location.lat, lng: property.location.lng });
    cameraRef.current?.setCamera({
      centerCoordinate: [property.location.lng, property.location.lat],
      zoomLevel: Math.max(13, filters.radiusKm ? 14 - filters.radiusKm * 0.3 : 13),
      animationDuration: 450,
      animationMode: 'easeTo',
    });
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

  const handleLocate = async () => {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location permission', 'Enable location to center the map on your current position.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lng = position.coords.longitude;
      const lat = position.coords.latitude;

      if (!mapReady || !cameraRef.current) {
        Alert.alert('Map loading', 'Please wait for the map to finish loading, then try again.');
        return;
      }

      setSearchAreaCenter({ lat, lng });
      cameraRef.current?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 14,
        animationDuration: 700,
        animationMode: 'easeTo',
      });

      setShowLocationNote(true);
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
      locationTimeoutRef.current = setTimeout(() => {
        setShowLocationNote(false);
      }, 1600);
    } catch (locError) {
      console.error('Current location error:', locError);
      Alert.alert('Location error', 'Unable to read your location right now.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('SearchFilters')}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search county, town</Text>
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
        <TouchableOpacity style={styles.refreshButton} onPress={refreshListings}>
          <Ionicons name={loading ? 'reload-circle' : 'refresh'} size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Card style={styles.legendCard} padding={12}>
        <Text style={styles.legendTitle}>Map Guide</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: LISTING_COLORS.vacant }]} />
            <Text style={styles.legendText}>Vacant</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: LISTING_COLORS.occupied }]} />
            <Text style={styles.legendText}>Occupied</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: LISTING_COLORS.pending }]} />
            <Text style={styles.legendText}>Vacating/Pending</Text>
          </View>
          {searchRadiusKm ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendAreaDot]} />
              <Text style={styles.legendText}>
                Search Area ({searchRadiusKm.toFixed(0)}km)
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      <View style={styles.mapContainer}>
        {HAS_MAPTILER_KEY ? (
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              mapStyle={mapStyle}
              logoEnabled={false}
              attributionEnabled={false}
              onDidFinishLoadingMap={() => setMapReady(true)}
              onRegionDidChange={(feature: any) => {
                const coords = feature?.geometry?.coordinates;
                if (!Array.isArray(coords) || coords.length < 2) return;
                const [lng, lat] = coords;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                setSearchAreaCenter({ lat, lng });
              }}
              onPress={() => setSelectedProperty(null)}
            >
              <Camera
                ref={(ref) => {
                  cameraRef.current = ref;
                }}
                defaultSettings={{
                  centerCoordinate: DEFAULT_CENTER,
                  zoomLevel: DEFAULT_ZOOM,
                }}
              />

              {searchAreaShape ? (
                <ShapeSource id="search-area-source" shape={searchAreaShape as any}>
                  <FillLayer
                    id="search-area-fill"
                    style={{
                      fillColor: colors.primary,
                      fillOpacity: 0.12,
                    }}
                  />
                  <LineLayer
                    id="search-area-outline"
                    style={{
                      lineColor: colors.primary,
                      lineWidth: 2,
                    }}
                  />
                </ShapeSource>
              ) : null}

              {mappableProperties.map((property) => {
                const isSaved = savedPropertyIds.includes(property.id);
                const pinColor = getPinColor(property.status, isSaved);
                return (
                  <PointAnnotation
                    key={property.id}
                    id={`property-${property.id}`}
                    coordinate={[property.location.lng, property.location.lat]}
                    onSelected={() => handleSelectProperty(property)}
                  >
                    <View style={styles.pinWrapper}>
                      <View style={[styles.pinHalo, { borderColor: pinColor }]} />
                      <View style={[styles.pin, { backgroundColor: pinColor }]}>
                        <View style={styles.pinDot} />
                      </View>
                    </View>
                  </PointAnnotation>
                );
              })}
            </MapView>
          </View>
        ) : (
          <View style={styles.mapMissingContainer}>
            <Ionicons name="map-outline" size={30} color={colors.primary} />
            <Text style={styles.mapMissingTitle}>MapTiler key not configured</Text>
            <Text style={styles.mapMissingText}>
              Set `EXPO_PUBLIC_MAPTILER_KEY` and rebuild the mobile app.
            </Text>
            <TouchableOpacity
              style={styles.mapMissingButton}
              onPress={() => navigation.navigate('PropertyList')}
            >
              <Text style={styles.mapMissingButtonText}>Open List View</Text>
            </TouchableOpacity>
          </View>
        )}

        {HAS_MAPTILER_KEY ? (
          <View style={styles.mapControls}>
            <View style={styles.mapTypeToggle}>
              {MAP_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.mapTypeOption, mapType === type && styles.mapTypeOptionActive]}
                  onPress={() => setMapType(type)}
                >
                  <Text style={[styles.mapTypeText, mapType === type && styles.mapTypeTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.locationButton} onPress={handleLocate}>
              <Ionicons
                name={locating ? 'locate' : 'navigate'}
                size={18}
                color={colors.white}
              />
              <Text style={styles.locationText}>{locating ? 'Locating...' : 'Current'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && mappableProperties.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyText}>
              {error ?? 'No mappable listings for your current filters.'}
            </Text>
          </View>
        )}
      </View>

      {showLocationNote && (
        <View style={styles.locationToast}>
          <Ionicons name="location" size={16} color={colors.white} />
          <Text style={styles.locationToastText}>Centered on your location</Text>
        </View>
      )}

      {selectedProperty && (
        <Card style={styles.previewCard} padding={16}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewTitle}>{selectedProperty.title}</Text>
              <Text style={styles.previewSubtitle}>
                {selectedProperty.neighborhood} - {selectedProperty.city}
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
              {selectedProperty.bedrooms} bd - {selectedProperty.bathrooms} ba
            </Text>
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
              placeholder="e.g. Westlands apartments"
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
  refreshButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendCard: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.white,
  },
  legendAreaDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mapContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mapWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  pinWrapper: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHalo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    opacity: 0.35,
  },
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 8,
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  mapMissingContainer: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  mapMissingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  mapMissingText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mapMissingButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  mapMissingButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  mapControls: {
    position: 'absolute',
    right: 24,
    top: 20,
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
  emptyOverlay: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
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
