import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../config/api';
import { Review, ReviewCategoryRatings } from '../types';

interface ReviewsContextValue {
  reviews: Review[];
  submitReview: (review: Review) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  flagReview: (id: string) => void;
  getReviewById: (id: string) => Review | undefined;
  getPropertyReviews: (propertyId: string) => Review[];
  fetchPropertyReviews: (propertyId: string) => Promise<void>;
  getAverageRatings: (propertyId: string) => ReviewCategoryRatings | null;
  canEditReview: (review: Review) => boolean;
}

const ReviewsContext = createContext<ReviewsContextValue | undefined>(undefined);

const withinDays = (date: string, days: number) => {
  const created = new Date(date).getTime();
  const limit = created + days * 24 * 60 * 60 * 1000;
  return Date.now() <= limit;
};

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  const mergeReviews = (incoming: Review[]) => {
    setReviews((prev) => {
      const next = [...prev];
      incoming.forEach((item) => {
        const index = next.findIndex((review) => review.id === item.id);
        if (index >= 0) {
          next[index] = { ...next[index], ...item };
        } else {
          next.push(item);
        }
      });
      return [...next];
    });
  };

  const loadMyReviews = async () => {
    try {
      const response = await api.get('/reviews/me');
      mergeReviews(response.data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  useEffect(() => {
    loadMyReviews().catch(() => undefined);
  }, []);

  const submitReview = (review: Review) => {
    void (async () => {
      try {
        const response = await api.post('/reviews', {
          propertyId: review.propertyId,
          ratings: review.ratings,
          pros: review.pros,
          cons: review.cons,
          details: review.details,
          photos: review.photos,
          anonymous: review.anonymous,
        });
        if (response.data?.review) {
          mergeReviews([response.data.review]);
        } else {
          mergeReviews([review]);
        }
      } catch (error) {
        console.error('Error submitting review:', error);
      }
    })();
  };

  const updateReview = (id: string, updates: Partial<Review>) => {
    void (async () => {
      try {
        const response = await api.patch(`/reviews/${id}`, updates);
        if (response.data?.review) {
          mergeReviews([response.data.review]);
        } else {
          setReviews((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                : item
            )
          );
        }
      } catch (error) {
        console.error('Error updating review:', error);
      }
    })();
  };

  const deleteReview = (id: string) => {
    void (async () => {
      try {
        await api.delete(`/reviews/${id}`);
        setReviews((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    })();
  };

  const flagReview = (id: string) => {
    void (async () => {
      try {
        await api.post(`/reviews/${id}/flag`);
        updateReview(id, { flagged: true });
      } catch (error) {
        console.error('Error flagging review:', error);
      }
    })();
  };

  const getReviewById = (id: string) => reviews.find((item) => item.id === id);

  const fetchPropertyReviews = async (propertyId: string) => {
    try {
      const response = await api.get(`/reviews?propertyId=${propertyId}`);
      mergeReviews(response.data || []);
    } catch (error) {
      console.error('Error loading property reviews:', error);
    }
  };

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
      fetchPropertyReviews,
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
