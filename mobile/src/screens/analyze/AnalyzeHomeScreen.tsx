import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
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
import { useTheme } from '../../theme';
import ScanTile from '../../components/ScanTile';
import SecondaryButton from '../../components/SecondaryButton';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import Card from '../../components/Card';

type Props = NativeStackScreenProps<AnalyzeStackParamList, 'AnalyzeHome'>;
type SubmitPhase = 'validating' | 'uploading';

export default function AnalyzeHomeScreen({ navigation }: Props) {
  const { tokens: t } = useTheme();
  const { photos, addPhotos, removePhoto, clear } = useSelectedPhotos();
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<SubmitPhase>('validating');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const hasPhotos = photos.length > 0;

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
      if (!res.valid) return `Photo ${i + 1}: ${res.reason}`;
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
    if (!hasPhotos || submitting) return;
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
      Alert.alert('Upload failed', `${message}\n\nCheck the backend URL in Settings and try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.screenPad, paddingBottom: 30 }}>
        {/* Screen title overline */}
        <Text style={{
          fontFamily: t.font, fontSize: t.fs.overline, fontWeight: t.fw.semibold,
          color: t.fg5, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 8, marginBottom: 4,
        }}>AI vehicle inspection</Text>
        <Text style={{
          fontFamily: t.font, fontSize: t.fs.h1, fontWeight: t.fw.bold,
          color: t.fg1, letterSpacing: -0.4, marginBottom: 18,
        }}>Analyze</Text>

        {/* Hero scan CTA */}
        <ScanTile onPress={() => navigation.navigate('Camera')} />

        {/* Secondary action */}
        <View style={{ marginTop: 12 }}>
          <SecondaryButton leftIcon="images-outline" onPress={handleChooseFromGallery} disabled={submitting}>
            Choose from Gallery
          </SecondaryButton>
        </View>

        {/* Section: selected photos */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 10 }}>
          <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body, color: t.fg1 }}>Selected photos</Text>
          {hasPhotos && (
            <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5 }}>
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </Text>
          )}
        </View>

        {!hasPhotos ? (
          <EmptyState
            icon="image-outline"
            title="No photos yet"
            body="Add at least one photo of the damaged vehicle to start an analysis."
          />
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

        {/* Submit */}
        <View style={{ marginTop: 24 }}>
          <PrimaryButton
            large
            disabled={!hasPhotos || submitting}
            onPress={handleSubmit}
            leftIcon={hasPhotos && !submitting ? 'scan-outline' : undefined}
          >
            {submitting ? 'Analyzing…' : hasPhotos ? `Analyze ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}` : 'Submit / Analyze'}
          </PrimaryButton>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
            <Ionicons name="shield-checkmark-outline" size={12} color={t.fg5} />
            <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginLeft: 6 }}>
              Photos are sent to the MEVA AI service for analysis.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Upload overlay */}
      {submitting && (
        <View style={[StyleSheet.absoluteFillObject, {
          backgroundColor: t.scrim,
          alignItems: 'center', justifyContent: 'center',
        }]}>
          <Card padding={22} elevated style={{ alignItems: 'center', minWidth: 240 }}>
            <ActivityIndicator size="large" color={t.primary} />
            <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.bodySm, color: t.fg1, marginTop: 14 }}>
              {phase === 'validating' ? 'Validating photos…' : `Uploading ${progress.current} of ${progress.total}…`}
            </Text>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 4 }}>
              {phase === 'validating' ? 'Checking size and resolution' : 'Running damage detection model'}
            </Text>
          </Card>
        </View>
      )}
    </View>
  );
}
