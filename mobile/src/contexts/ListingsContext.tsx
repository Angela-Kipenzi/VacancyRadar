import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../config/api';
import { PropertyListing } from '../types';

interface ListingsContextValue {
  listings: PropertyListing[];
  loading: boolean;
  refreshListings: () => Promise<void>;
  getListingById: (id: string) => PropertyListing | undefined;
  fetchListingById: (id: string) => Promise<PropertyListing | null>;
}

const ListingsContext = createContext<ListingsContextValue | undefined>(undefined);

export const ListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshListings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/listings');
      setListings(response.data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshListings().catch(() => undefined);
  }, []);

  const getListingById = (id: string) => listings.find((item) => item.id === id);

  const fetchListingById = async (id: string) => {
    const existing = getListingById(id);
    if (existing) return existing;
    try {
      const response = await api.get(`/listings/${id}`);
      const listing = response.data as PropertyListing;
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
      refreshListings,
      getListingById,
      fetchListingById,
    }),
    [listings, loading]
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
