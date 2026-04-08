import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';

export const PlaceholderScreen = ({ route }: any) => {
  const title = route?.params?.title ?? route?.name ?? 'Details';
  const description =
    route?.params?.description ??
    'This section is not configured yet. Please check back soon.';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} padding={16}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </Card>
      <View style={styles.tip}>
        <Text style={styles.tipText}>Need something specific here? Let us know.</Text>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tip: {
    paddingHorizontal: 4,
  },
  tipText: {
    fontSize: 12,
    color: colors.textLight,
  },
});
