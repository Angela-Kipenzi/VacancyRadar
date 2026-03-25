import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useSearch, defaultFilters } from '../../contexts/SearchContext';
import { Amenity, PropertyType, SearchFilters } from '../../types';

const bedroomOptions: Array<'studio' | '1' | '2' | '3' | '4+'> = [
  'studio',
  '1',
  '2',
  '3',
  '4+',
];
const bathroomOptions: Array<'1' | '1.5' | '2' | '2.5' | '3+'> = [
  '1',
  '1.5',
  '2',
  '2.5',
  '3+',
];
const propertyTypeOptions: PropertyType[] = ['apartment', 'house', 'condo', 'studio'];
const radiusOptions = [1, 3, 5, 10];
const currencyOptions = ['USD', 'KES', 'EUR'];
const availabilityOptions = [7, 14, 30];

const amenityOptions: { label: string; value: Amenity }[] = [
  { label: 'Parking (Street)', value: 'parking_street' },
  { label: 'Parking (Garage)', value: 'parking_garage' },
  { label: 'Parking (Dedicated)', value: 'parking_dedicated' },
  { label: 'Laundry (In-unit)', value: 'laundry_in_unit' },
  { label: 'Laundry (Building)', value: 'laundry_building' },
  { label: 'Laundry (None)', value: 'laundry_none' },
  { label: 'Air Conditioning', value: 'air_conditioning' },
  { label: 'Heating', value: 'heating' },
  { label: 'Pet Policy (Cats)', value: 'pet_cats' },
  { label: 'Pet Policy (Dogs)', value: 'pet_dogs' },
  { label: 'Pet Policy (Both)', value: 'pet_both' },
  { label: 'Pet Policy (None)', value: 'pet_none' },
  { label: 'Furnished', value: 'furnished' },
  { label: 'Unfurnished', value: 'unfurnished' },
  { label: 'Balcony/Patio', value: 'balcony' },
  { label: 'Gym/Fitness', value: 'gym' },
  { label: 'Pool', value: 'pool' },
  { label: 'Elevator', value: 'elevator' },
  { label: 'Wheelchair Access', value: 'wheelchair' },
  { label: 'Security System', value: 'security' },
  { label: 'Storage Unit', value: 'storage' },
];

const toggleValue = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const SearchFiltersScreen = ({ navigation, route }: any) => {
  const { filters, setFilters, recordSearch, savedSearches, updateSavedSearch } = useSearch();
  const savedSearchId = route?.params?.savedSearchId as string | undefined;
  const initialFilters = useMemo(() => {
    if (!savedSearchId) return filters;
    const match = savedSearches.find((item) => item.id === savedSearchId);
    return match?.filters ?? filters;
  }, [filters, savedSearchId, savedSearches]);

  const [draft, setDraft] = useState<SearchFilters>(initialFilters);

  useEffect(() => {
    setDraft(initialFilters);
  }, [initialFilters]);

  const applyFilters = () => {
    setFilters(draft);
    recordSearch(draft);
    if (savedSearchId) {
      updateSavedSearch(savedSearchId, { filters: draft });
    }
    navigation.goBack();
  };

  const clearFilters = () => {
    setDraft(defaultFilters);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="City"
            value={draft.city}
            onChangeText={(value) => setDraft({ ...draft, city: value })}
            style={styles.input}
          />
          <TextInput
            placeholder="Neighborhood"
            value={draft.neighborhood}
            onChangeText={(value) => setDraft({ ...draft, neighborhood: value })}
            style={styles.input}
          />
        </View>
        <Text style={styles.subTitle}>Radius</Text>
        <View style={styles.chipRow}>
          {radiusOptions.map((radius) => (
            <FilterChip
              key={radius}
              label={`${radius} km`}
              active={draft.radiusKm === radius}
              onPress={() => setDraft({ ...draft, radiusKm: radius })}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.drawButton, draft.drawAreaEnabled && styles.drawButtonActive]}
          onPress={() => setDraft({ ...draft, drawAreaEnabled: !draft.drawAreaEnabled })}
        >
          <Ionicons
            name={draft.drawAreaEnabled ? 'checkmark-circle' : 'map'}
            size={18}
            color={draft.drawAreaEnabled ? colors.white : colors.primary}
          />
          <Text
            style={[
              styles.drawButtonText,
              draft.drawAreaEnabled && styles.drawButtonTextActive,
            ]}
          >
            Draw area on map
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="Min"
            keyboardType="numeric"
            value={draft.priceMin}
            onChangeText={(value) => setDraft({ ...draft, priceMin: value })}
            style={styles.input}
          />
          <TextInput
            placeholder="Max"
            keyboardType="numeric"
            value={draft.priceMax}
            onChangeText={(value) => setDraft({ ...draft, priceMax: value })}
            style={styles.input}
          />
        </View>
        <Text style={styles.subTitle}>Currency</Text>
        <View style={styles.chipRow}>
          {currencyOptions.map((currency) => (
            <FilterChip
              key={currency}
              label={currency}
              active={draft.currency === currency}
              onPress={() => setDraft({ ...draft, currency })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Property Details</Text>
        <Text style={styles.subTitle}>Bedrooms</Text>
        <View style={styles.chipRow}>
          {bedroomOptions.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={draft.bedrooms.includes(option)}
              onPress={() => setDraft({ ...draft, bedrooms: toggleValue(draft.bedrooms, option) })}
            />
          ))}
        </View>
        <Text style={styles.subTitle}>Bathrooms</Text>
        <View style={styles.chipRow}>
          {bathroomOptions.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={draft.bathrooms.includes(option)}
              onPress={() => setDraft({ ...draft, bathrooms: toggleValue(draft.bathrooms, option) })}
            />
          ))}
        </View>
        <Text style={styles.subTitle}>Property Type</Text>
        <View style={styles.chipRow}>
          {propertyTypeOptions.map((type) => (
            <FilterChip
              key={type}
              label={type}
              active={draft.propertyTypes.includes(type)}
              onPress={() =>
                setDraft({
                  ...draft,
                  propertyTypes: toggleValue(draft.propertyTypes, type),
                })
              }
            />
          ))}
        </View>
        <Text style={styles.subTitle}>Square Footage</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="Min"
            keyboardType="numeric"
            value={draft.sqftMin}
            onChangeText={(value) => setDraft({ ...draft, sqftMin: value })}
            style={styles.input}
          />
          <TextInput
            placeholder="Max"
            keyboardType="numeric"
            value={draft.sqftMax}
            onChangeText={(value) => setDraft({ ...draft, sqftMax: value })}
            style={styles.input}
          />
        </View>
        <View style={styles.chipRow}>
          {(['sqft', 'm2'] as const).map((unit) => (
            <FilterChip
              key={unit}
              label={unit}
              active={draft.sqftUnit === unit}
              onPress={() => setDraft({ ...draft, sqftUnit: unit })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Available now</Text>
          <Switch
            value={draft.availableNow}
            onValueChange={(value) => setDraft({ ...draft, availableNow: value })}
          />
        </View>
        <Text style={styles.subTitle}>Available within</Text>
        <View style={styles.chipRow}>
          {availabilityOptions.map((days) => (
            <FilterChip
              key={days}
              label={`${days} days`}
              active={draft.availableWithinDays === days}
              onPress={() => setDraft({ ...draft, availableWithinDays: days })}
            />
          ))}
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Flexible dates</Text>
          <Switch
            value={draft.flexibleDates}
            onValueChange={(value) => setDraft({ ...draft, flexibleDates: value })}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {amenityOptions.map((amenity) => (
            <FilterChip
              key={amenity.value}
              label={amenity.label}
              active={draft.amenities.includes(amenity.value)}
              onPress={() =>
                setDraft({ ...draft, amenities: toggleValue(draft.amenities, amenity.value) })
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyText}>
            {savedSearchId ? 'Save Changes' : 'Apply Filters'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  drawButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawButtonActive: {
    backgroundColor: colors.primary,
  },
  drawButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  drawButtonTextActive: {
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.text,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: {
    color: colors.white,
    fontWeight: '600',
  },
});
