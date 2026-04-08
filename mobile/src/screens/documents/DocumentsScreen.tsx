import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../config/api';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { Document } from '../../types';

export const DocumentsScreen = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/documents');
      setDocuments(response.data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Unable to load documents right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const handleOpen = async (doc: Document) => {
    if (!doc.fileUrl) {
      if (doc.type === 'lease') {
        navigation.navigate('Tenancy', { screen: 'LeasePreview' });
      } else {
        Alert.alert('Unavailable', 'This document does not have a file link yet.');
      }
      return;
    }

    const url = doc.fileUrl;

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Unsupported link', 'Unable to open this document link.');
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDocuments} />}
    >
      {error && (
        <Card style={styles.noticeCard} padding={16}>
          <Text style={styles.noticeText}>{error}</Text>
        </Card>
      )}

      {documents.length === 0 ? (
        <Card style={styles.emptyCard} padding={16}>
          <Ionicons name="document-text-outline" size={32} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptyText}>Leases, receipts, and notices will appear here.</Text>
        </Card>
      ) : (
        documents.map((doc) => (
          <Card key={doc.id} style={styles.docCard} padding={16}>
            <View style={styles.docHeader}>
              <View style={styles.docTitleWrap}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docType}>{doc.type.toUpperCase()}</Text>
              </View>
              <TouchableOpacity style={styles.openButton} onPress={() => handleOpen(doc)}>
                <Ionicons name="open-outline" size={16} color={colors.primary} />
                <Text style={styles.openText}>Open</Text>
              </TouchableOpacity>
            </View>
            {doc.description ? <Text style={styles.docDescription}>{doc.description}</Text> : null}
            <Text style={styles.docMeta}>Uploaded {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}</Text>
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
  noticeCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warning + '14',
  },
  noticeText: {
    color: colors.text,
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  docCard: {
    marginBottom: 12,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  docType: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  docDescription: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  docMeta: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textLight,
  },
});
