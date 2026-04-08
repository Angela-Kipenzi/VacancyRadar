import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Amenity,
  SearchFilters,
  SavedSearch,
  SearchHistoryItem,
  ViewedPropertyItem,
  PropertyListing,
} from '../types';

const STORAGE_KEYS = {
  filters: 'search_filters',
  savedSearches: 'search_saved_searches',
  history: 'search_history',
  viewed: 'search_viewed_properties',
  savedProperties: 'search_saved_properties',
};

const defaultFilters: SearchFilters = {
  city: '',
  neighborhood: '',
  radiusKm: 3,
  priceMin: '',
  priceMax: '',
  currency: 'USD',
  bedrooms: [],
  bathrooms: [],
  propertyTypes: [],
  sqftMin: '',
  sqftMax: '',
  sqftUnit: 'sqft',
  availableNow: false,
  availableWithinDays: null,
  flexibleDates: false,
  amenities: [],
  drawAreaEnabled: false,
};

const amenityAlias: Record<string, Amenity> = {
  parking_street: 'Parking',
  parking_garage: 'Parking',
  parking_dedicated: 'Parking',
  laundry_in_unit: 'Laundry',
  laundry_building: 'Laundry',
  laundry_none: 'Laundry',
  gym: 'Gym',
  pool: 'Pool',
  security: 'Security',
  elevator: 'Elevator',
  storage: 'Storage',
  pet_cats: 'Pet Friendly',
  pet_dogs: 'Pet Friendly',
  pet_both: 'Pet Friendly',
  pet_none: 'Pet Friendly',
};

const amenityValues: Amenity[] = [
  'Parking',
  'Laundry',
  'Gym',
  'Pool',
  'Security',
  'Elevator',
  'Rooftop Deck',
  'Storage',
  'Pet Friendly',
  'Concierge',
];

const normalizeAmenities = (values: string[] = []): Amenity[] => {
  const normalized = values
    .map((value) => (amenityAlias[value] ?? (amenityValues.includes(value as Amenity) ? (value as Amenity) : null)))
    .filter((value): value is Amenity => Boolean(value));
  return Array.from(new Set(normalized));
};

const sanitizeFilters = (filters: SearchFilters): SearchFilters => ({
  ...filters,
  amenities: normalizeAmenities(filters.amenities as string[]),
});

interface SearchContextValue {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  savedSearches: SavedSearch[];
  saveSearch: (name: string, filters: SearchFilters) => void;
  updateSavedSearch: (id: string, updates: Partial<SavedSearch>) => void;
  deleteSavedSearch: (id: string) => void;
  savedPropertyIds: string[];
  toggleSavedProperty: (id: string) => void;
  history: SearchHistoryItem[];
  viewed: ViewedPropertyItem[];
  recordSearch: (filters: SearchFilters) => void;
  recordViewedProperty: (property: PropertyListing) => void;
  clearHistory: () => void;
  resetFilters: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [viewed, setViewed] = useState<ViewedPropertyItem[]>([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const [
        storedFilters,
        storedSaved,
        storedHistory,
        storedViewed,
        storedSavedProps,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.filters),
        AsyncStorage.getItem(STORAGE_KEYS.savedSearches),
        AsyncStorage.getItem(STORAGE_KEYS.history),
        AsyncStorage.getItem(STORAGE_KEYS.viewed),
        AsyncStorage.getItem(STORAGE_KEYS.savedProperties),
      ]);

      const parsedFilters = safeParse(storedFilters, defaultFilters);
      setFiltersState(sanitizeFilters(parsedFilters));
      const parsedSaved = safeParse(storedSaved, []);
      setSavedSearches(
        parsedSaved.map((item: SavedSearch) => ({
          ...item,
          filters: sanitizeFilters(item.filters),
        }))
      );
      setHistory(safeParse(storedHistory, []));
      setViewed(safeParse(storedViewed, []));
      setSavedPropertyIds(safeParse(storedSavedProps, []));
    };

    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters)).catch(() => undefined);
  }, [filters]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.savedSearches, JSON.stringify(savedSearches)).catch(
      () => undefined
    );
  }, [savedSearches]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history)).catch(() => undefined);
  }, [history]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.viewed, JSON.stringify(viewed)).catch(() => undefined);
  }, [viewed]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.savedProperties, JSON.stringify(savedPropertyIds)).catch(
      () => undefined
    );
  }, [savedPropertyIds]);

  const setFilters = (next: SearchFilters) => {
    setFiltersState(sanitizeFilters(next));
  };

  const saveSearch = (name: string, nextFilters: SearchFilters) => {
    const now = new Date().toISOString();
    const normalizedFilters = sanitizeFilters(nextFilters);
    const newSearch: SavedSearch = {
      id: `saved-${Date.now()}`,
      name,
      filters: normalizedFilters,
      alerts: {
        push: true,
        emailFrequency: 'weekly',
        priceDrop: true,
        newInArea: false,
      },
      createdAt: now,
      updatedAt: now,
    };
    setSavedSearches((prev) => [newSearch, ...prev]);
  };

  const updateSavedSearch = (id: string, updates: Partial<SavedSearch>) => {
    setSavedSearches((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const deleteSavedSearch = (id: string) => {
    setSavedSearches((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleSavedProperty = (id: string) => {
    setSavedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]
    );
  };

  const recordSearch = (nextFilters: SearchFilters) => {
    const now = new Date().toISOString();
    const labelParts = [nextFilters.city, nextFilters.neighborhood].filter(Boolean);
    const label =
      labelParts.join(', ') || (nextFilters.radiusKm ? `${nextFilters.radiusKm} km radius` : 'All');
    const item: SearchHistoryItem = {
      id: `search-${Date.now()}`,
      label,
      filters: nextFilters,
      createdAt: now,
    };
    setHistory((prev) => [item, ...prev].slice(0, 20));
  };

  const recordViewedProperty = (property: PropertyListing) => {
    const now = new Date().toISOString();
    const item: ViewedPropertyItem = {
      id: `viewed-${Date.now()}`,
      propertyId: property.id,
      title: property.title,
      createdAt: now,
    };
    setViewed((prev) => [item, ...prev].slice(0, 30));
  };

  const clearHistory = () => {
    setHistory([]);
    setViewed([]);
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
  };

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      savedSearches,
      saveSearch,
      updateSavedSearch,
      deleteSavedSearch,
      savedPropertyIds,
      toggleSavedProperty,
      history,
      viewed,
      recordSearch,
      recordViewedProperty,
      clearHistory,
      resetFilters,
    }),
    [filters, savedSearches, savedPropertyIds, history, viewed]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
};

export { defaultFilters };
