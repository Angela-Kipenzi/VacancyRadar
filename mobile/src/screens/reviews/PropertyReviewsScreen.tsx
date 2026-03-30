import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useReviews } from '../../contexts/ReviewsContext';
import { useTenancy } from '../../contexts/TenancyContext';
import { StarRating } from '../../components/reviews/StarRating';

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';
type SortMode = 'recent' | 'relevance';

const ratingFilters: RatingFilter[] = ['all', '5', '4', '3', '2', '1'];

export const PropertyReviewsScreen = ({ navigation, route }: any) => {
  const { propertyId } = route.params;
  const { getPropertyReviews, getAverageRatings, flagReview, fetchPropertyReviews } = useReviews();
  const { checkOut } = useTenancy();
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  useEffect(() => {
    fetchPropertyReviews(propertyId).catch(() => undefined);
  }, [propertyId, fetchPropertyReviews]);

  const reviews = useMemo(() => getPropertyReviews(propertyId), [getPropertyReviews, propertyId]);
  const averages = useMemo(() => getAverageRatings(propertyId), [getAverageRatings, propertyId]);

  const filtered = useMemo(() => {
    let items = [...reviews];
    if (ratingFilter !== 'all') {
      const ratingValue = Number(ratingFilter);
      items = items.filter((review) => Math.round(review.ratings.overall) === ratingValue);
    }
    if (sortMode === 'recent') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      items.sort((a, b) => b.ratings.overall - a.ratings.overall);
    }
    return items;
  }, [reviews, ratingFilter, sortMode]);

  const canReview = checkOut.unitStatus === 'available';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>Property Reviews</Text>
        {averages ? (
          <>
            <View style={styles.averageRow}>
              <Text style={styles.averageScore}>{averages.overall.toFixed(1)}</Text>
              <StarRating value={Math.round(averages.overall)} readonly />
              <Text style={styles.averageCount}>{reviews.length} reviews</Text>
            </View>
            <View style={styles.breakdown}>
              {[
                ['Landlord responsiveness', averages.landlordResponsiveness],
                ['Maintenance quality', averages.maintenanceQuality],
                ['Building cleanliness', averages.buildingCleanliness],
                ['Noise level', averages.noiseLevel],
                ['Safety/security', averages.safetySecurity],
                ['Value for money', averages.valueForMoney],
              ].map(([label, value]) => (
                <View key={label as string} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{label}</Text>
                  <View style={styles.breakdownBar}>
                    <View
                      style={[
                        styles.breakdownFill,
                        { width: `${(Number(value) / 5) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.breakdownValue}>{Number(value).toFixed(1)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        )}
      </Card>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ratingFilters.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, ratingFilter === item && styles.filterChipActive]}
              onPress={() => setRatingFilter(item)}
            >
              <Text style={[styles.filterText, ratingFilter === item && styles.filterTextActive]}>
                {item === 'all' ? 'All ratings' : `${item} stars`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortChip, sortMode === 'recent' && styles.sortChipActive]}
            onPress={() => setSortMode('recent')}
          >
            <Text style={[styles.sortText, sortMode === 'recent' && styles.sortTextActive]}>
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortMode === 'relevance' && styles.sortChipActive]}
            onPress={() => setSortMode('relevance')}
          >
            <Text style={[styles.sortText, sortMode === 'relevance' && styles.sortTextActive]}>
              Relevance
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filtered.map((review) => (
        <Card key={review.id} style={styles.reviewCard} padding={16}>
          <View style={styles.reviewHeader}>
            <View>
              <Text style={styles.reviewAuthor}>
                {review.anonymous ? 'Anonymous' : review.authorName}
              </Text>
              <Text style={styles.reviewDate}>{new Date(review.createdAt).toDateString()}</Text>
            </View>
            {review.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            <StarRating value={review.ratings.overall} readonly />
            <Text style={styles.ratingText}>{review.ratings.overall.toFixed(1)}</Text>
          </View>
          {review.pros.length > 0 && (
            <View style={styles.bullets}>
              {review.pros.map((item) => (
                <Text key={item} style={styles.bulletText}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
          {review.cons.length > 0 && (
            <View style={styles.bullets}>
              {review.cons.map((item) => (
                <Text key={item} style={styles.bulletText}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.reportButton} onPress={() => flagReview(review.id)}>
            <Ionicons name="flag-outline" size={14} color={colors.error} />
            <Text style={styles.reportText}>Report review</Text>
          </TouchableOpacity>
        </Card>
      ))}

      <TouchableOpacity
        style={[styles.writeButton, !canReview && styles.writeButtonDisabled]}
        onPress={() => navigation.navigate('ReviewForm', { propertyId })}
        disabled={!canReview}
      >
        <Text style={styles.writeText}>Write a Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  averageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  averageScore: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  averageCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  breakdown: {
    marginTop: 12,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    flex: 1.6,
    fontSize: 11,
    color: colors.textSecondary,
  },
  breakdownBar: {
    flex: 2,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 999,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  breakdownValue: {
    width: 32,
    textAlign: 'right',
    fontSize: 11,
    color: colors.textSecondary,
  },
  filters: {
    marginBottom: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  sortChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sortTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  reviewCard: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bullets: {
    marginTop: 8,
  },
  bulletText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reportButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
  writeButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  writeButtonDisabled: {
    opacity: 0.5,
  },
  writeText: {
    color: colors.white,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
