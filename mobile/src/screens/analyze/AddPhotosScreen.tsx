import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AnalyzedPhoto } from '../../types/analysis';
import { validateImage } from '../../services/validation';
import { uploadImage, ApiError } from '../../services/api';
import { appendPhotosToSession } from '../../services/historyStorage';
import { getStoredImageQuality } from '../../services/storage';
import { IMAGE_QUALITY_PRESETS } from '../../constants/config';

type AddPhotosRoute = RouteProp<{ AddPhotos: { sessionId: string } }, 'AddPhotos'>;

type LocalPhoto = { id: string; uri: string };

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type SubmitPhase = 'validating' | 'uploading';

export default function AddPhotosScreen() {
  const route = useRoute<AddPhotosRoute>();
  const navigation = useNavigation();
  const { sessionId } = route.params;

  const [items, setItems] = useState<LocalPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<SubmitPhase>('validating');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const addUris = useCallback((uris: string[]) => {
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.uri));
      const additions = uris.filter((u) => !seen.has(u)).map((uri) => ({ id: makeId(), uri }));
      return [...prev, ...additions];
    });
  }, []);

  const handleGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const quality = IMAGE_QUALITY_PRESETS[await getStoredImageQuality()];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri).filter(Boolean) as string[];
      if (uris.length > 0) addUris(uris);
    }
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (items.length === 0 || submitting) return;
    setSubmitting(true);
    setPhase('validating');
    setProgress({ current: 0, total: items.length });

    try {
      for (let i = 0; i < items.length; i++) {
        const res = await validateImage(items[i].uri);
        if (!res.valid) {
          Alert.alert(
            'Validation failed',
            `Photo ${i + 1}: ${res.reason}\n\nNo photos were added.`,
          );
          return;
        }
      }

      setPhase('uploading');
      const analyzed: AnalyzedPhoto[] = [];
      for (let i = 0; i < items.length; i++) {
        setProgress({ current: i + 1, total: items.length });
        const result = await uploadImage(items[i].uri);
        analyzed.push({ localUri: items[i].uri, result });
      }

      await appendPhotosToSession(sessionId, analyzed);
      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unknown error';
      Alert.alert(
        'Upload failed',
        `${message}\n\nCheck the backend URL in Settings and try again.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = items.length > 0 && !submitting;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add photos to this session</Text>
        <Text style={styles.subtitle}>
          New photos will be analyzed and appended to the existing session.
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGallery}
          disabled={submitting}
        >
          <Ionicons name="images" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>

        <Text style={styles.counter}>
          {items.length} {items.length === 1 ? 'photo' : 'photos'} ready
        </Text>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={40} color="#bbb" />
            <Text style={styles.emptyStateText}>No photos selected yet.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {items.map((p) => (
              <View key={p.id} style={styles.thumbWrapper}>
                <Image source={{ uri: p.uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(p.id)}
                  disabled={submitting}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>Upload and append</Text>
        </TouchableOpacity>
      </ScrollView>

      {submitting && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>
              {phase === 'validating'
                ? 'Validating photos…'
                : `Uploading ${progress.current} of ${progress.total}…`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#555', marginBottom: 18, lineHeight: 18 },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  counter: { fontSize: 13, color: '#666', marginBottom: 12 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 20,
  },
  emptyStateText: { color: '#888', marginTop: 8, fontSize: 14 },

  thumbRow: { marginBottom: 20 },
  thumbWrapper: { marginRight: 10, position: 'relative' },
  thumb: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#eee' },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d12f2f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  submitButton: {
    backgroundColor: '#1f8a3e',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: '#bbb' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBox: {
    backgroundColor: 'rgba(20,20,20,0.92)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 220,
  },
  overlayText: { color: '#fff', marginTop: 14, fontSize: 15, fontWeight: '500' },
});
