import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useSearch } from '../../contexts/SearchContext';
import { useListings } from '../../contexts/ListingsContext';
import { formatCurrency, matchesFilters } from '../../utils/search';
import { PropertyListing } from '../../types';

type SortOption = 'newest' | 'price_low' | 'price_high' | 'relevant' | 'distance';

const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price (low)', value: 'price_low' },
  { label: 'Price (high)', value: 'price_high' },
  { label: 'Most relevant', value: 'relevant' },
  { label: 'Nearest', value: 'distance' },
];

const getStatusColor = (status: PropertyListing['status']) => {
  if (status === 'available') return colors.success;
  if (status === 'pending') return colors.warning;
  return colors.gray[400];
};

const distanceScore = (property: PropertyListing) => {
  const dx = property.location.mapX - 0.5;
  const dy = property.location.mapY - 0.5;
  return Math.sqrt(dx * dx + dy * dy);
};

export const PropertyListScreen = ({ navigation }: any) => {
  const { filters, savedPropertyIds, toggleSavedProperty, recordViewedProperty } = useSearch();
  const { listings, loading } = useListings();
  const [sortBy, setSortBy] = useState<SortOption>('relevant');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const selectedSort = useMemo(
    () => sortOptions.find((option) => option.value === sortBy) ?? sortOptions[0],
    [sortBy]
  );

  const filtered = useMemo(
    () => listings.filter((property) => matchesFilters(property, filters)),
    [filters, listings]
  );

  const sorted = useMemo(() => {
    const items = [...filtered];
    if (sortBy === 'newest') {
      return items.sort((a, b) => a.daysOnPlatform - b.daysOnPlatform);
    }
    if (sortBy === 'price_low') {
      return items.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price_high') {
      return items.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'distance') {
      return items.sort((a, b) => distanceScore(a) - distanceScore(b));
    }
    return items.sort((a, b) => {
      const statusScore = (item: PropertyListing) =>
        item.status === 'available' ? 0 : item.status === 'pending' ? 1 : 2;
      const savedBoost = (item: PropertyListing) =>
        savedPropertyIds.includes(item.id) ? -0.5 : 0;
      return statusScore(a) + savedBoost(a) - (statusScore(b) + savedBoost(b));
    });
  }, [filtered, sortBy, savedPropertyIds]);

  const openDetails = (property: PropertyListing) => {
    recordViewedProperty(property);
    navigation.navigate('PropertyDetails', { propertyId: property.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property List</Text>
        <TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate('SearchMap')}>
          <Ionicons name="map-outline" size={16} color={colors.primary} />
          <Text style={styles.mapButtonText}>Map View</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by</Text>
        <TouchableOpacity style={styles.sortDropdown} onPress={() => setSortMenuOpen(true)}>
          <Text style={styles.sortDropdownText}>{selectedSort.label}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={sortMenuOpen}
        onRequestClose={() => setSortMenuOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setSortMenuOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {sortOptions.map((option) => {
              const isActive = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.modalItem, isActive && styles.modalItemActive]}
                  onPress={() => {
                    setSortBy(option.value);
                    setSortMenuOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                    {option.label}
                  </Text>
                  {isActive && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.list}>
        {sorted.map((property) => {
          const isSaved = savedPropertyIds.includes(property.id);
          return (
            <Card key={property.id} style={styles.card} padding={12}>
              <TouchableOpacity style={styles.cardRow} onPress={() => openDetails(property)}>
                <View style={styles.photo}>
                  <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
                  <Text style={styles.photoText}>Photo</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.price}>
                      {formatCurrency(property.price, property.currency)}
                    </Text>
                    <TouchableOpacity onPress={() => toggleSavedProperty(property.id)}>
                      <Ionicons
                        name={isSaved ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isSaved ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.address}>
                    {property.address}, {property.city}
                  </Text>
                  <Text style={styles.meta}>
                    {property.bedrooms} bd · {property.bathrooms} ba · {property.sqft}{' '}
                    {property.sqftUnit}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(property.status) + '22' },
                      ]}
                    >
                      <Text style={styles.statusText}>{property.status}</Text>
                    </View>
                    <Text style={styles.daysText}>{property.daysOnPlatform} days on platform</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          );
        })}
        {!loading && sorted.length === 0 && (
          <Card style={styles.emptyCard} padding={16}>
            <Text style={styles.emptyText}>No listings match your filters yet.</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  sortRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortDropdownText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalItemActive: {
    backgroundColor: colors.primary + '12',
  },
  modalItemText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalItemTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyCard: {
    marginTop: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  card: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  address: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    color: colors.text,
    textTransform: 'capitalize',
  },
  daysText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
