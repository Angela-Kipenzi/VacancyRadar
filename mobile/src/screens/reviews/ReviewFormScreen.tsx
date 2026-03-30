import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { StarRating } from '../../components/reviews/StarRating';
import { useReviews } from '../../contexts/ReviewsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTenancy } from '../../contexts/TenancyContext';
import { useListings } from '../../contexts/ListingsContext';
import { ReviewCategoryRatings, ReviewPhoto } from '../../types';

const prosSuggestions = ['Responsive landlord', 'Great location', 'Quiet building', 'Clean common areas'];
const consSuggestions = ['Street noise', 'Slow maintenance', 'Limited parking', 'Elevator delays'];

const buildArrayFromLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);

export const ReviewFormScreen = ({ navigation, route }: any) => {
  const { propertyId } = route.params;
  const { submitReview } = useReviews();
  const { user } = useAuth();
  const { checkOut } = useTenancy();
  const { getListingById, fetchListingById } = useListings();
  const [property, setProperty] = useState(() => getListingById(propertyId));

  useEffect(() => {
    const existing = getListingById(propertyId);
    if (existing) {
      setProperty(existing);
      return;
    }
    fetchListingById(propertyId)
      .then((item) => setProperty(item ?? undefined))
      .catch(() => undefined);
  }, [propertyId, getListingById, fetchListingById]);

  const [ratings, setRatings] = useState<ReviewCategoryRatings>({
    overall: 0,
    landlordResponsiveness: 0,
    maintenanceQuality: 0,
    buildingCleanliness: 0,
    noiseLevel: 0,
    safetySecurity: 0,
    valueForMoney: 0,
  });
  const [prosText, setProsText] = useState('');
  const [consText, setConsText] = useState('');
  const [details, setDetails] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [photos, setPhotos] = useState<ReviewPhoto[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const eligible = checkOut.unitStatus === 'available';

  const addSuggestion = (value: string, field: 'pros' | 'cons') => {
    if (field === 'pros') {
      setProsText((prev) => (prev ? `${prev}\n• ${value}` : `• ${value}`));
    } else {
      setConsText((prev) => (prev ? `${prev}\n• ${value}` : `• ${value}`));
    }
  };

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Photo permission', 'Photo access is required to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      allowsEditing: false,
      selectionLimit: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhotos((prev) => [
        { id: `photo-${Date.now()}`, uri: asset.uri },
        ...prev,
      ]);
    }
  };

  const handleSubmit = () => {
    if (!property) {
      Alert.alert('Missing property', 'Please select a property.');
      return;
    }
    if (!eligible) {
      Alert.alert('Not eligible', 'You can only review after completing occupancy.');
      return;
    }
    const allRatings = Object.values(ratings);
    if (allRatings.some((value) => value === 0)) {
      Alert.alert('Missing rating', 'Please rate each category before submitting.');
      return;
    }
    const review = {
      id: `review-${Date.now()}`,
      propertyId: property.id,
      propertyName: property.title,
      propertyAddress: `${property.address}, ${property.city}`,
      ratings,
      pros: buildArrayFromLines(prosText),
      cons: buildArrayFromLines(consText),
      details: details.trim() || undefined,
      photos,
      anonymous,
      authorId: user?.id ?? 'user-unknown',
      authorName: `${user?.firstName ?? 'Anonymous'} ${user?.lastName ?? ''}`.trim(),
      status: 'pending' as const,
      verified: true,
      createdAt: new Date().toISOString(),
      flagged: false,
    };
    submitReview(review);
    Alert.alert('Review submitted', 'Thanks for sharing your experience.');
    navigation.goBack();
  };

  if (!property) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Property not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!eligible && (
        <Card style={styles.warningCard} padding={16}>
          <Text style={styles.warningTitle}>Verified only</Text>
          <Text style={styles.warningText}>
            Reviews are available once your check-out is completed.
          </Text>
        </Card>
      )}

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Rate your experience</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Overall experience</Text>
          <StarRating value={ratings.overall} onChange={(value) => setRatings({ ...ratings, overall: value })} />
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Landlord responsiveness</Text>
          <StarRating
            value={ratings.landlordResponsiveness}
            onChange={(value) => setRatings({ ...ratings, landlordResponsiveness: value })}
          />
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Maintenance quality</Text>
          <StarRating
            value={ratings.maintenanceQuality}
            onChange={(value) => setRatings({ ...ratings, maintenanceQuality: value })}
          />
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Building cleanliness</Text>
          <StarRating
            value={ratings.buildingCleanliness}
            onChange={(value) => setRatings({ ...ratings, buildingCleanliness: value })}
          />
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Noise level</Text>
          <StarRating
            value={ratings.noiseLevel}
            onChange={(value) => setRatings({ ...ratings, noiseLevel: value })}
          />
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Safety/security</Text>
          <StarRating
            value={ratings.safetySecurity}
            onChange={(value) => setRatings({ ...ratings, safetySecurity: value })}
          />
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Value for money</Text>
          <StarRating
            value={ratings.valueForMoney}
            onChange={(value) => setRatings({ ...ratings, valueForMoney: value })}
          />
        </View>
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Pros</Text>
        <View style={styles.chipRow}>
          {prosSuggestions.map((item) => (
            <TouchableOpacity key={item} style={styles.chip} onPress={() => addSuggestion(item, 'pros')}>
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={prosText}
          onChangeText={setProsText}
          placeholder="• Great location"
          style={[styles.input, styles.textArea]}
          multiline
        />
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Cons</Text>
        <View style={styles.chipRow}>
          {consSuggestions.map((item) => (
            <TouchableOpacity key={item} style={styles.chip} onPress={() => addSuggestion(item, 'cons')}>
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={consText}
          onChangeText={setConsText}
          placeholder="• Limited parking"
          style={[styles.input, styles.textArea]}
          multiline
        />
      </Card>

      <Card style={styles.card} padding={16}>
        <Text style={styles.sectionTitle}>Detailed experience (optional)</Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Share anything else that could help future tenants."
          style={[styles.input, styles.textArea]}
          multiline
        />
      </Card>

      <Card style={styles.card} padding={16}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Photo upload</Text>
          <TouchableOpacity style={styles.photoButton} onPress={handleAddPhoto}>
            <Ionicons name="camera" size={16} color={colors.primary} />
            <Text style={styles.photoButtonText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
        {photos.length > 0 ? (
          <View style={styles.photoList}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoChip}>
                <Ionicons name="image-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.photoText}>Photo</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyHint}>No photos attached.</Text>
        )}
      </Card>

      <Card style={styles.card} padding={16}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Anonymous</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} />
        </View>
        <Text style={styles.helperText}>
          If enabled, your name will not appear publicly.
        </Text>
      </Card>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.previewButton} onPress={() => setPreviewOpen(true)}>
          <Text style={styles.previewText}>Preview Review</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, !eligible && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!eligible}
        >
          <Text style={styles.submitText}>Submit Review</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={previewOpen} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Review Preview</Text>
            <Text style={styles.modalSubtitle}>{property.title}</Text>
            <StarRating value={ratings.overall} readonly />
            <Text style={styles.modalSection}>Pros</Text>
            {buildArrayFromLines(prosText).map((item) => (
              <Text key={item} style={styles.modalText}>
                • {item}
              </Text>
            ))}
            <Text style={styles.modalSection}>Cons</Text>
            {buildArrayFromLines(consText).map((item) => (
              <Text key={item} style={styles.modalText}>
                • {item}
              </Text>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewOpen(false)}>
              <Text style={styles.modalCloseText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  warningCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
  },
  warningText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingLabel: {
    fontSize: 12,
    color: colors.textSecondary,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginTop: 10,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  photoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundGray,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  actions: {
    gap: 10,
  },
  previewButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  previewText: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.white,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modalSection: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  modalText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalClose: {
    marginTop: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    padding: 16,
    color: colors.textSecondary,
  },
});
