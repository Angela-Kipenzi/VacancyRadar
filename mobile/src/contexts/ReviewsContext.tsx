import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Review, ReviewCategoryRatings } from '../types';
import { mockProperties } from '../data/mockProperties';

const STORAGE_KEY = 'tenant_reviews';

const sampleReviews: Review[] = [
  {
    id: 'review-1001',
    propertyId: mockProperties[0]?.id ?? 'prop-1001',
    propertyName: mockProperties[0]?.title ?? 'Maple Court Studio',
    propertyAddress: `${mockProperties[0]?.address ?? '214 Maple Court'}, ${
      mockProperties[0]?.city ?? 'Brookside'
    }`,
    ratings: {
      overall: 4,
      landlordResponsiveness: 5,
      maintenanceQuality: 4,
      buildingCleanliness: 4,
      noiseLevel: 3,
      safetySecurity: 4,
      valueForMoney: 4,
    },
    pros: ['Responsive landlord', 'Clean hallways'],
    cons: ['Street noise on weekends'],
    details: 'Overall a solid experience with quick maintenance fixes.',
    photos: [],
    anonymous: false,
    authorId: 'user-unknown',
    authorName: 'John Doe',
    status: 'published',
    verified: true,
    createdAt: '2026-03-12',
    flagged: false,
  },
];

interface ReviewsContextValue {
  reviews: Review[];
  submitReview: (review: Review) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  flagReview: (id: string) => void;
  getReviewById: (id: string) => Review | undefined;
  getPropertyReviews: (propertyId: string) => Review[];
  getAverageRatings: (propertyId: string) => ReviewCategoryRatings | null;
  canEditReview: (review: Review) => boolean;
}

const ReviewsContext = createContext<ReviewsContextValue | undefined>(undefined);

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const withinDays = (date: string, days: number) => {
  const created = new Date(date).getTime();
  const limit = created + days * 24 * 60 * 60 * 1000;
  return Date.now() <= limit;
};

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>(sampleReviews);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        const stored = safeParse<Review[]>(value, sampleReviews);
        setReviews(stored);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reviews)).catch(() => undefined);
  }, [reviews]);

  const submitReview = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
  };

  const updateReview = (id: string, updates: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter((item) => item.id !== id));
  };

  const flagReview = (id: string) => {
    updateReview(id, { flagged: true });
  };

  const getReviewById = (id: string) => reviews.find((item) => item.id === id);

  const getPropertyReviews = (propertyId: string) =>
    reviews.filter((review) => review.propertyId === propertyId && review.status !== 'hidden');

  const getAverageRatings = (propertyId: string) => {
    const items = getPropertyReviews(propertyId);
    if (items.length === 0) return null;
    const totals = items.reduce(
      (acc, review) => ({
        overall: acc.overall + review.ratings.overall,
        landlordResponsiveness: acc.landlordResponsiveness + review.ratings.landlordResponsiveness,
        maintenanceQuality: acc.maintenanceQuality + review.ratings.maintenanceQuality,
        buildingCleanliness: acc.buildingCleanliness + review.ratings.buildingCleanliness,
        noiseLevel: acc.noiseLevel + review.ratings.noiseLevel,
        safetySecurity: acc.safetySecurity + review.ratings.safetySecurity,
        valueForMoney: acc.valueForMoney + review.ratings.valueForMoney,
      }),
      {
        overall: 0,
        landlordResponsiveness: 0,
        maintenanceQuality: 0,
        buildingCleanliness: 0,
        noiseLevel: 0,
        safetySecurity: 0,
        valueForMoney: 0,
      }
    );
    const count = items.length;
    return {
      overall: totals.overall / count,
      landlordResponsiveness: totals.landlordResponsiveness / count,
      maintenanceQuality: totals.maintenanceQuality / count,
      buildingCleanliness: totals.buildingCleanliness / count,
      noiseLevel: totals.noiseLevel / count,
      safetySecurity: totals.safetySecurity / count,
      valueForMoney: totals.valueForMoney / count,
    };
  };

  const canEditReview = (review: Review) =>
    withinDays(review.createdAt, 7) && !review.landlordResponse;

  const value = useMemo(
    () => ({
      reviews,
      submitReview,
      updateReview,
      deleteReview,
      flagReview,
      getReviewById,
      getPropertyReviews,
      getAverageRatings,
      canEditReview,
    }),
    [reviews]
  );

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error('useReviews must be used within ReviewsProvider');
  }
  return context;
};
