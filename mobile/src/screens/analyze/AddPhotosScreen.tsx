import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, ActivityIndicator, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  type RouteProp,
  type NavigationProp,
} from '@react-navigation/native';
import type { AnalyzedPhoto } from '../../types/analysis';
import { validateImage } from '../../services/validation';
import { uploadImage, ApiError } from '../../services/api';
import { appendPhotosToSession, saveSession } from '../../services/historyStorage';
import { getStoredImageQuality } from '../../services/storage';
import { IMAGE_QUALITY_PRESETS } from '../../constants/config';
import { useSelectedPhotos } from '../../state/selectedPhotos';
import type { AddPhotosParams } from '../../navigation/types';
import { useTheme } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import EmptyState from '../../components/EmptyState';
import Card from '../../components/Card';

type AddPhotosRoute = RouteProp<{ AddPhotos: AddPhotosParams }, 'AddPhotos'>;

type SubmitPhase = 'validating' | 'uploading';

export default function AddPhotosScreen() {
  const { tokens: t } = useTheme();
  const route = useRoute<AddPhotosRoute>();
  const navigation = useNavigation<NavigationProp<{ Camera: undefined }>>();
  const params = route.params;
  const isNewSession = 'vehicleId' in params;

  // Shared with the Camera screen, which appends captured photos to this list.
  const { photos, addPhotos, removePhoto, clear } = useSelectedPhotos();
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<SubmitPhase>('validating');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Start from an empty selection each time this screen opens. Runs once on mount,
  // so photos captured during a Camera round-trip (which re-focuses, not re-mounts)
  // are preserved.
  useEffect(() => {
    clear();
  }, [clear]);

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
      if (uris.length > 0) addPhotos(uris, 'gallery');
    }
  };

  const handleSubmit = async () => {
    if (photos.length === 0 || submitting) return;
    setSubmitting(true);
    setPhase('validating');
    setProgress({ current: 0, total: photos.length });

    try {
      for (let i = 0; i < photos.length; i++) {
        const res = await validateImage(photos[i].uri);
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
      for (let i = 0; i < photos.length; i++) {
        setProgress({ current: i + 1, total: photos.length });
        const result = await uploadImage(photos[i].uri);
        analyzed.push({ localUri: photos[i].uri, result });
      }

      if (isNewSession) {
        await saveSession(params.vehicleId, analyzed);
      } else {
        await appendPhotosToSession(params.sessionId, analyzed);
      }
      clear();
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

  const canSubmit = photos.length > 0 && !submitting;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.screenPad, paddingBottom: 40 }}>
        <Text style={{ fontFamily: t.font, fontSize: t.fs.h1, fontWeight: t.fw.bold, color: t.fg1, letterSpacing: -0.4, marginTop: 4, marginBottom: 6 }}>
          {isNewSession ? 'New session' : 'Add photos to this session'}
        </Text>
        <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg4, marginBottom: 20, lineHeight: 20 }}>
          {isNewSession
            ? 'Photos will be analyzed and saved as a new session for this vehicle.'
            : 'New photos will be analyzed and appended to the existing session.'}
        </Text>

        <View style={{ gap: 10 }}>
          <PrimaryButton leftIcon="camera" onPress={() => navigation.navigate('Camera')} disabled={submitting}>
            Take Photo
          </PrimaryButton>
          <SecondaryButton leftIcon="images-outline" onPress={handleGallery} disabled={submitting}>
            Choose from Gallery
          </SecondaryButton>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 10 }}>
          <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body, color: t.fg1 }}>Selected photos</Text>
          {photos.length > 0 && (
            <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5 }}>
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </Text>
          )}
        </View>

        {photos.length === 0 ? (
          <EmptyState icon="image-outline" title="No photos yet" body="Take a photo or choose from your gallery to continue." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {photos.map((p) => (
              <View key={p.id} style={{ position: 'relative' }}>
                <Image source={{ uri: p.uri }} style={{
                  width: 92, height: 92, borderRadius: 14, backgroundColor: t.surface3,
                  borderWidth: 1, borderColor: t.hairline,
                }} />
                <Pressable
                  onPress={() => removePhoto(p.id)}
                  disabled={submitting}
                  hitSlop={8}
                  style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: t.surface1,
                    borderWidth: 1, borderColor: t.border,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: t.shadowColor, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
                    elevation: 3,
                  }}
                >
                  <Ionicons name="close" size={14} color={t.fg2} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={{ marginTop: 24 }}>
          <PrimaryButton large disabled={!canSubmit} onPress={handleSubmit}>
            {isNewSession ? 'Upload and save session' : 'Upload and append'}
          </PrimaryButton>
        </View>
      </ScrollView>

      {submitting && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: t.scrim, alignItems: 'center', justifyContent: 'center' }]}>
          <Card padding={22} elevated style={{ alignItems: 'center', minWidth: 240 }}>
            <ActivityIndicator size="large" color={t.primary} />
            <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.bodySm, color: t.fg1, marginTop: 14 }}>
              {phase === 'validating' ? 'Validating photos…' : `Uploading ${progress.current} of ${progress.total}…`}
            </Text>
          </Card>
        </View>
      )}
    </View>
  );
}
