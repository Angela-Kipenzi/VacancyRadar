import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useSearch } from '../../contexts/SearchContext';
import { buildSearchSummary } from '../../utils/search';

export const SearchHistoryScreen = ({ navigation }: any) => {
  const { history, viewed, setFilters, clearHistory } = useSearch();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearText}>Clear History</Text>
          </TouchableOpacity>
        </View>
        {history.length === 0 ? (
          <Card style={styles.emptyCard} padding={16}>
            <Text style={styles.emptyText}>No recent searches yet.</Text>
          </Card>
        ) : (
          history.map((item) => (
            <Card key={item.id} style={styles.historyCard} padding={16}>
              <View style={styles.historyRow}>
                <View style={styles.historyIcon}>
                  <Ionicons name="search" size={16} color={colors.primary} />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{item.label}</Text>
                  <Text style={styles.historySubtitle}>{buildSearchSummary(item.filters)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setFilters(item.filters);
                    navigation.navigate('SearchMap');
                  }}
                >
                  <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <Text style={styles.sectionTitle}>Viewed Properties</Text>
        {viewed.length === 0 ? (
          <Card style={styles.emptyCard} padding={16}>
            <Text style={styles.emptyText}>No viewed properties yet.</Text>
          </Card>
        ) : (
          viewed.map((item) => (
            <Card key={item.id} style={styles.historyCard} padding={16}>
              <TouchableOpacity
                style={styles.historyRow}
                onPress={() => navigation.navigate('PropertyDetails', { propertyId: item.propertyId })}
              >
                <View style={styles.historyIcon}>
                  <Ionicons name="home" size={16} color={colors.primary} />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historySubtitle}>Recently viewed</Text>
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  clearText: {
    color: colors.primary,
    fontWeight: '600',
  },
  historyCard: {
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  historySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
