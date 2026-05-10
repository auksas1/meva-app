import React, { useState } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AnalyzeStackParamList } from '../../navigation/types';
import { useSelectedPhotos, type SelectedPhoto } from '../../state/selectedPhotos';
import { validateImage } from '../../services/validation';
import { uploadImage, ApiError } from '../../services/api';
import { getStoredImageQuality } from '../../services/storage';
import { IMAGE_QUALITY_PRESETS } from '../../constants/config';
import type { AnalyzedPhoto } from '../../types/analysis';

type Props = NativeStackScreenProps<AnalyzeStackParamList, 'AnalyzeHome'>;

type SubmitPhase = 'validating' | 'uploading';

export default function AnalyzeHomeScreen({ navigation }: Props) {
  const { photos, addPhotos, removePhoto, clear } = useSelectedPhotos();
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<SubmitPhase>('validating');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleChooseFromGallery = async () => {
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
      if (uris.length > 0) addPhotos(uris, 'gallery');
    }
  };

  const validateAll = async (items: SelectedPhoto[]): Promise<string | null> => {
    for (let i = 0; i < items.length; i++) {
      const res = await validateImage(items[i].uri);
      if (!res.valid) {
        return `Photo ${i + 1}: ${res.reason}`;
      }
    }
    return null;
  };

  const uploadAll = async (items: SelectedPhoto[]): Promise<AnalyzedPhoto[]> => {
    const results: AnalyzedPhoto[] = [];
    for (let i = 0; i < items.length; i++) {
      setProgress({ current: i + 1, total: items.length });
      const result = await uploadImage(items[i].uri);
      results.push({ localUri: items[i].uri, result });
    }
    return results;
  };

  const handleSubmit = async () => {
    if (photos.length === 0 || submitting) return;
    setSubmitting(true);
    setPhase('validating');
    setProgress({ current: 0, total: photos.length });

    try {
      const error = await validateAll(photos);
      if (error) {
        Alert.alert('Validation failed', `${error}\n\nNo photos were uploaded.`);
        return;
      }

      setPhase('uploading');
      const analyzed = await uploadAll(photos);
      clear();
      navigation.navigate('PickVehicle', { photos: analyzed });
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

  const canSubmit = photos.length > 0 && !submitting;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>MEVA AutoDamage</Text>
        <Text style={styles.subtitle}>
          Analyze vehicle damage from photos. Take pictures of the damaged car or choose photos
          from your gallery.
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Camera')}
            disabled={submitting}
          >
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleChooseFromGallery}
            disabled={submitting}
          >
            <Ionicons name="images" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Selected photos</Text>
        <Text style={styles.counter}>
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} selected
        </Text>

        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={40} color="#bbb" />
            <Text style={styles.emptyStateText}>No photos selected yet.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {photos.map((p) => (
              <View key={p.id} style={styles.thumbWrapper}>
                <Image source={{ uri: p.uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(p.id)}
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
          <Text style={styles.submitButtonText}>Submit / Analyze</Text>
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
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 20, lineHeight: 20 },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonSecondary: { backgroundColor: '#3a7afc' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  counter: { fontSize: 13, color: '#666', marginBottom: 12 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 20,
  },
  emptyStateText: { color: '#888', marginTop: 8, fontSize: 14 },

  thumbRow: { marginBottom: 20 },
  thumbWrapper: {
    marginRight: 10,
    position: 'relative',
  },
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
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
