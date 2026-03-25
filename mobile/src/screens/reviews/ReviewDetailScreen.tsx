import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useReviews } from '../../contexts/ReviewsContext';
import { StarRating } from '../../components/reviews/StarRating';

export const ReviewDetailScreen = ({ navigation, route }: any) => {
  const { reviewId } = route.params;
  const { getReviewById, updateReview, deleteReview, canEditReview } = useReviews();
  const review = getReviewById(reviewId);
  const [editMode, setEditMode] = useState(false);
  const [details, setDetails] = useState(review?.details ?? '');

  const editable = review ? canEditReview(review) : false;

  const handleSave = () => {
    if (!review) return;
    updateReview(review.id, { details });
    setEditMode(false);
  };

  if (!review) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Review not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>{review.propertyName}</Text>
        <Text style={styles.subtitle}>{review.propertyAddress}</Text>
        <View style={styles.ratingRow}>
          <StarRating value={review.ratings.overall} readonly />
          <Text style={styles.ratingText}>{review.ratings.overall.toFixed(1)} / 5</Text>
        </View>
        <Text style={styles.metaText}>Status: {review.status}</Text>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Pros</Text>
        {review.pros.map((item) => (
          <Text key={item} style={styles.listItem}>
            • {item}
          </Text>
        ))}
        <Text style={styles.sectionTitle}>Cons</Text>
        {review.cons.map((item) => (
          <Text key={item} style={styles.listItem}>
            • {item}
          </Text>
        ))}
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Detailed Experience</Text>
        {editMode ? (
          <TextInput
            value={details}
            onChangeText={setDetails}
            style={styles.textArea}
            multiline
          />
        ) : (
          <Text style={styles.detailText}>{review.details || 'No additional details.'}</Text>
        )}
      </Card>

      {review.landlordResponse && (
        <Card style={styles.card} padding={16}>
          <Text style={styles.sectionTitle}>Landlord Response</Text>
          <Text style={styles.detailText}>{review.landlordResponse.message}</Text>
        </Card>
      )}

      <View style={styles.actions}>
        {editable && !editMode && (
          <TouchableOpacity style={styles.actionButton} onPress={() => setEditMode(true)}>
            <Text style={styles.actionText}>Edit Review</Text>
          </TouchableOpacity>
        )}
        {editable && editMode && (
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Text style={styles.actionText}>Save Changes</Text>
          </TouchableOpacity>
        )}
        {editable && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteReview(review.id)}>
            <Text style={styles.deleteText}>Delete Review</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
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
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  listItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    color: colors.text,
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    color: colors.white,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: {
    color: colors.error,
    fontWeight: '600',
  },
  backButton: {
    borderRadius: 12,
    backgroundColor: colors.gray[300],
    paddingVertical: 12,
    alignItems: 'center',
  },
  backText: {
    color: colors.text,
    fontWeight: '600',
  },
  emptyText: {
    padding: 16,
    color: colors.textSecondary,
  },
});
