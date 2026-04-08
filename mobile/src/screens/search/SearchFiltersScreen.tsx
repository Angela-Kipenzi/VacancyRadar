import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useSearch, defaultFilters } from '../../contexts/SearchContext';
import { Amenity, PropertyType, SearchFilters } from '../../types';

type SelectOption<T> = { label: string; value: T };

const bedroomOptions: SelectOption<'studio' | '1' | '2' | '3' | '4+'>[] = [
  { label: 'Studio', value: 'studio' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4+', value: '4+' },
];
const bathroomOptions: SelectOption<'1' | '1.5' | '2' | '2.5' | '3+'>[] = [
  { label: '1', value: '1' },
  { label: '1.5', value: '1.5' },
  { label: '2', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3+', value: '3+' },
];
const propertyTypeOptions: SelectOption<PropertyType>[] = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Condo', value: 'condo' },
  { label: 'Studio', value: 'studio' },
];
const radiusOptions: SelectOption<number>[] = [
  { label: '1 km', value: 1 },
  { label: '3 km', value: 3 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
];
const currencyOptions: SelectOption<string>[] = [
  { label: 'USD', value: 'USD' },
  { label: 'KES', value: 'KES' },
  { label: 'EUR', value: 'EUR' },
];
const availabilityOptions: SelectOption<number | null>[] = [
  { label: 'Any time', value: null },
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
];
const sqftUnitOptions: SelectOption<'sqft' | 'm2'>[] = [
  { label: 'sqft', value: 'sqft' },
  { label: 'm2', value: 'm2' },
];

const amenityOptions: SelectOption<Amenity>[] = [
  { label: 'Parking', value: 'Parking' },
  { label: 'Laundry', value: 'Laundry' },
  { label: 'Gym', value: 'Gym' },
  { label: 'Pool', value: 'Pool' },
  { label: 'Security', value: 'Security' },
  { label: 'Elevator', value: 'Elevator' },
  { label: 'Rooftop Deck', value: 'Rooftop Deck' },
  { label: 'Storage', value: 'Storage' },
  { label: 'Pet Friendly', value: 'Pet Friendly' },
  { label: 'Concierge', value: 'Concierge' },
];

const toggleValue = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const getOptionLabel = <T,>(options: SelectOption<T>[], value: T | null | undefined) =>
  options.find((option) => option.value === value)?.label ?? '';

const summarizeMulti = <T,>(options: SelectOption<T>[], values: T[]) => {
  if (!values.length) return '';
  const labels = values
    .map((value) => getOptionLabel(options, value))
    .filter((label) => label.length > 0);
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
};

const DropdownField = ({
  label,
  valueText,
  placeholder,
  onPress,
}: {
  label: string;
  valueText: string;
  placeholder: string;
  onPress: () => void;
}) => (
  <View style={styles.dropdownField}>
    <Text style={styles.subTitle}>{label}</Text>
    <TouchableOpacity style={styles.dropdownButton} onPress={onPress}>
      <Text
        style={[
          styles.dropdownValue,
          !valueText.length && styles.dropdownPlaceholder,
        ]}
      >
        {valueText.length ? valueText : placeholder}
      </Text>
      <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

const SingleSelectDropdown = <T,>({
  label,
  options,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  options: SelectOption<T>[];
  value: T | null | undefined;
  placeholder: string;
  onChange: (value: T) => void;
}) => {
  const [open, setOpen] = useState(false);
  const valueText = getOptionLabel(options, value);

  return (
    <View>
      <DropdownField
        label={label}
        valueText={valueText}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
      />
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {options.map((option) => {
                const isActive = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                      {option.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const MultiSelectDropdown = <T,>({
  label,
  options,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  options: SelectOption<T>[];
  values: T[];
  placeholder: string;
  onChange: (values: T[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const summary = summarizeMulti(options, values);

  return (
    <View>
      <DropdownField
        label={label}
        valueText={summary}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
      />
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {options.map((option) => {
                const isActive = values.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => onChange(toggleValue(values, option.value))}
                  >
                    <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                      {option.label}
                    </Text>
                    <Ionicons
                      name={isActive ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isActive ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalDoneButton} onPress={() => setOpen(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

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
            placeholder="City / County (e.g. Nairobi)"
            value={draft.city}
            onChangeText={(value) => setDraft({ ...draft, city: value })}
            style={styles.input}
          />
          <TextInput
            placeholder="Town / Estate (e.g. Westlands)"
            value={draft.neighborhood}
            onChangeText={(value) => setDraft({ ...draft, neighborhood: value })}
            style={styles.input}
          />
        </View>
        <Text style={styles.helperText}>
          Tip: You can type part of a name. Leave both blank to see all listings.
        </Text>
        <SingleSelectDropdown
          label="Radius"
          options={radiusOptions}
          value={draft.radiusKm}
          placeholder="Select radius"
          onChange={(value) => setDraft({ ...draft, radiusKm: value })}
        />
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
        <SingleSelectDropdown
          label="Currency"
          options={currencyOptions}
          value={draft.currency}
          placeholder="Select currency"
          onChange={(value) => setDraft({ ...draft, currency: value })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Property Details</Text>
        <MultiSelectDropdown
          label="Bedrooms"
          options={bedroomOptions}
          values={draft.bedrooms}
          placeholder="Any"
          onChange={(values) => setDraft({ ...draft, bedrooms: values })}
        />
        <MultiSelectDropdown
          label="Bathrooms"
          options={bathroomOptions}
          values={draft.bathrooms}
          placeholder="Any"
          onChange={(values) => setDraft({ ...draft, bathrooms: values })}
        />
        <MultiSelectDropdown
          label="Property Type"
          options={propertyTypeOptions}
          values={draft.propertyTypes}
          placeholder="Any"
          onChange={(values) => setDraft({ ...draft, propertyTypes: values })}
        />
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
        <SingleSelectDropdown
          label="Square Foot Unit"
          options={sqftUnitOptions}
          value={draft.sqftUnit}
          placeholder="Select unit"
          onChange={(value) => setDraft({ ...draft, sqftUnit: value })}
        />
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
        <SingleSelectDropdown
          label="Available within"
          options={availabilityOptions}
          value={draft.availableWithinDays}
          placeholder="Any time"
          onChange={(value) => setDraft({ ...draft, availableWithinDays: value })}
        />
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
        <MultiSelectDropdown
          label="Amenities"
          options={amenityOptions}
          values={draft.amenities}
          placeholder="Any"
          onChange={(values) => setDraft({ ...draft, amenities: values })}
        />
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
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  dropdownField: {
    marginTop: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  dropdownValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  dropdownPlaceholder: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  drawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  drawButtonActive: {
    backgroundColor: colors.primary,
  },
  drawButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
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
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 28,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  clearText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  applyButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
  },
  applyText: {
    color: colors.white,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalList: {
    maxHeight: 360,
  },
  modalListContent: {
    paddingBottom: 4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  modalDoneButton: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalDoneText: {
    color: colors.white,
    fontWeight: '700',
  },
});
