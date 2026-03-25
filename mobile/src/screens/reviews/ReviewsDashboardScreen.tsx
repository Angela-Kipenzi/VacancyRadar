import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useReviews } from '../../contexts/ReviewsContext';
import { StarRating } from '../../components/reviews/StarRating';
import { useAuth } from '../../contexts/AuthContext';

export const ReviewsDashboardScreen = ({ navigation }: any) => {
  const { reviews } = useReviews();
  const { user } = useAuth();
  const myReviews = reviews.filter((review) => review.authorId === (user?.id ?? 'user-unknown'));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reviews</Text>
        <Text style={styles.subtitle}>Verified-only reviews you have submitted.</Text>
      </View>

      {myReviews.length === 0 ? (
        <Card style={styles.emptyCard} padding={16}>
          <Text style={styles.emptyText}>You haven't submitted any reviews yet.</Text>
        </Card>
      ) : (
        myReviews.map((review) => (
          <Card key={review.id} style={styles.card} padding={16}>
            <TouchableOpacity onPress={() => navigation.navigate('ReviewDetail', { reviewId: review.id })}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.propertyName}>{review.propertyName}</Text>
                  <Text style={styles.propertyAddress}>{review.propertyAddress}</Text>
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
                <Text style={styles.ratingText}>{review.ratings.overall.toFixed(1)} / 5</Text>
              </View>
              <Text style={styles.metaText}>Status: {review.status}</Text>
              {review.landlordResponse && (
                <Text style={styles.responseText}>Landlord responded</Text>
              )}
            </TouchableOpacity>
          </Card>
        ))
      )}
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
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propertyName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  propertyAddress: {
    fontSize: 12,
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
    gap: 8,
    marginTop: 10,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  responseText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
