import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { useSearch } from '../../contexts/SearchContext';
import { buildSearchSummary } from '../../utils/search';

const cycleEmailFrequency = (value: 'off' | 'daily' | 'weekly') => {
  if (value === 'off') return 'daily';
  if (value === 'daily') return 'weekly';
  return 'off';
};

export const SavedSearchesScreen = ({ navigation }: any) => {
  const { savedSearches, updateSavedSearch, deleteSavedSearch, setFilters } = useSearch();
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const openEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(name);
  };

  const handleRename = () => {
    if (!editId) return;
    updateSavedSearch(editId, { name: editName.trim() || 'Saved search' });
    setEditId(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {savedSearches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No saved searches yet</Text>
            <Text style={styles.emptySubtitle}>Save a search to get alerts and re-run fast.</Text>
          </View>
        ) : (
          savedSearches.map((search) => (
            <Card key={search.id} style={styles.card} padding={16}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{search.name}</Text>
                  <Text style={styles.cardSubtitle}>{buildSearchSummary(search.filters)}</Text>
                </View>
                <TouchableOpacity onPress={() => openEdit(search.id, search.name)}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setFilters(search.filters);
                    navigation.navigate('SearchMap');
                  }}
                >
                  <Ionicons name="play" size={16} color={colors.white} />
                  <Text style={styles.actionText}>Run Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.outlineButton]}
                  onPress={() => navigation.navigate('SearchFilters', { savedSearchId: search.id })}
                >
                  <Ionicons name="options" size={16} color={colors.primary} />
                  <Text style={styles.outlineText}>Edit Criteria</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.alertRow}>
                <Text style={styles.alertLabel}>Push Notifications</Text>
                <Switch
                  value={search.alerts.push}
                  onValueChange={(value) =>
                    updateSavedSearch(search.id, {
                      alerts: { ...search.alerts, push: value },
                    })
                  }
                />
              </View>
              <View style={styles.alertRow}>
                <Text style={styles.alertLabel}>Email Digest</Text>
                <TouchableOpacity
                  style={styles.emailToggle}
                  onPress={() =>
                    updateSavedSearch(search.id, {
                      alerts: {
                        ...search.alerts,
                        emailFrequency: cycleEmailFrequency(search.alerts.emailFrequency),
                      },
                    })
                  }
                >
                  <Text style={styles.emailText}>{search.alerts.emailFrequency}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.alertRow}>
                <Text style={styles.alertLabel}>Price Drop Alerts</Text>
                <Switch
                  value={search.alerts.priceDrop}
                  onValueChange={(value) =>
                    updateSavedSearch(search.id, {
                      alerts: { ...search.alerts, priceDrop: value },
                    })
                  }
                />
              </View>
              <View style={styles.alertRow}>
                <Text style={styles.alertLabel}>New in Area</Text>
                <Switch
                  value={search.alerts.newInArea}
                  onValueChange={(value) =>
                    updateSavedSearch(search.id, {
                      alerts: { ...search.alerts, newInArea: value },
                    })
                  }
                />
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteSavedSearch(search.id)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal transparent visible={!!editId} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename saved search</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Search name"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setEditId(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleRename}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    color: colors.white,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
    fontWeight: '600',
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  alertLabel: {
    fontSize: 14,
    color: colors.text,
  },
  emailToggle: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emailText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  deleteButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteText: {
    color: colors.error,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancel: {
    backgroundColor: colors.backgroundGray,
  },
  modalButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
