import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { PropertyListing } from '../types';
import { API_BASE_URL } from '../config/api';

interface ListingsContextValue {
  listings: PropertyListing[];
  loading: boolean;
  error: string | null;
  refreshListings: () => Promise<void>;
  getListingById: (id: string) => PropertyListing | undefined;
  fetchListingById: (id: string) => Promise<PropertyListing | null>;
}

const CITY_CENTER_LOOKUP: Record<string, { lat: number; lng: number }> = {
  nairobi: { lat: -1.286389, lng: 36.817223 },
  mombasa: { lat: -4.043477, lng: 39.668206 },
  kisumu: { lat: -0.1022, lng: 34.7617 },
  nakuru: { lat: -0.3031, lng: 36.08 },
  eldoret: { lat: 0.5143, lng: 35.2698 },
  thika: { lat: -1.0333, lng: 37.0693 },
  'los angeles': { lat: 34.052235, lng: -118.243683 },
  'san diego': { lat: 32.715736, lng: -117.161087 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
};

const isValidCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180 &&
  !(lat === 0 && lng === 0);

const hashToUnit = (value: string, seed: number) => {
  let hash = seed;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return (hash % 1000) / 1000;
};

const normalizeLocation = (listing: PropertyListing) => {
  const lat = Number(listing.location?.lat);
  const lng = Number(listing.location?.lng);
  if (isValidCoordinate(lat, lng)) {
    return {
      ...listing.location,
      lat,
      lng,
    };
  }

  const normalizedCity = (listing.city || '').trim().toLowerCase();
  const base = CITY_CENTER_LOOKUP[normalizedCity] || CITY_CENTER_LOOKUP.nairobi;

  const mapX =
    typeof listing.location?.mapX === 'number' && Number.isFinite(listing.location.mapX)
      ? listing.location.mapX
      : hashToUnit(listing.id || listing.title || 'listing', 17);
  const mapY =
    typeof listing.location?.mapY === 'number' && Number.isFinite(listing.location.mapY)
      ? listing.location.mapY
      : hashToUnit(listing.id || listing.title || 'listing', 43);

  const latOffset = (mapY - 0.5) * 0.08;
  const lngOffset = (mapX - 0.5) * 0.08;

  return {
    ...listing.location,
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset,
    mapX,
    mapY,
  };
};

// Helper to fix localhost image URLs saved by web dashboard
const fixUrls = (listing: PropertyListing): PropertyListing => {
  const fixUrl = (url?: string) => {
    if (!url) return url;
    if (url.startsWith('/uploads')) {
      return API_BASE_URL.replace('/api', '') + url;
    }
    if (__DEV__ && url.includes('localhost:5000')) {
      return url.replace('http://localhost:5000', API_BASE_URL.replace('/api', ''));
    }
    return url;
  };

  return {
    ...listing,
    images: listing.images?.map(fixUrl) as string[],
    virtualTourUrl: fixUrl(listing.virtualTourUrl),
    videoTourUrl: fixUrl(listing.videoTourUrl),
    floorPlanUrl: fixUrl(listing.floorPlanUrl),
    location: normalizeLocation(listing),
  };
};

const ListingsContext = createContext<ListingsContextValue | undefined>(undefined);

export const ListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/listings');
      setListings((response.data || []).map(fixUrls));
    } catch (err: any) {
      console.error('Error loading listings:', err);
      setError('Unable to load listings right now.');
    } finally {
      setLoading(false);
    }
  };

  // Wait until the auth token is present in storage before fetching,
  // to avoid firing the request before the token is available.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Poll briefly for the token (max ~3s) before giving up and fetching anyway
      let attempts = 0;
      while (attempts < 6) {
        const token = await AsyncStorage.getItem('auth_token');
        if (token || attempts >= 5) break;
        await new Promise((r) => setTimeout(r, 500));
        attempts += 1;
      }
      if (!cancelled) {
        refreshListings().catch(() => undefined);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const getListingById = (id: string) => listings.find((item) => item.id === id);

  const fetchListingById = async (id: string) => {
    const existing = getListingById(id);
    if (existing) return existing;
    try {
      const response = await api.get(`/listings/${id}`);
      const listing = fixUrls(response.data as PropertyListing);
      setListings((prev) => [listing, ...prev.filter((item) => item.id !== id)]);
      return listing;
    } catch (error) {
      console.error('Error loading listing:', error);
      return null;
    }
  };

  const value = useMemo(
    () => ({
      listings,
      loading,
      error,
      refreshListings,
      getListingById,
      fetchListingById,
    }),
    [listings, loading, error]
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
};

export const useListings = () => {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error('useListings must be used within ListingsProvider');
  }
  return context;
};
