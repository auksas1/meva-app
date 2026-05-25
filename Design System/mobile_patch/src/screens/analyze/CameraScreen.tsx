import React, { useRef, useState } from 'react';
import { View, Text, Image, Alert, ActivityIndicator, Pressable } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelectedPhotos } from '../../state/selectedPhotos';
import { IMAGE_QUALITY_PRESETS } from '../../constants/config';
import { getStoredImageQuality } from '../../services/storage';
import { useTheme } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';

export default function CameraScreen() {
  const { tokens: t } = useTheme();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const { addPhoto } = useSelectedPhotos();

  if (!permission) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: t.bg }}>
        <Ionicons name="camera-outline" size={48} color={t.fg5} style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: t.font, fontSize: t.fs.body, textAlign: 'center', color: t.fg2, marginBottom: 6 }}>
          Camera access required
        </Text>
        <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, textAlign: 'center', color: t.fg5, marginBottom: 20 }}>
          We use the camera to capture photos of vehicle damage for analysis.
        </Text>
        <PrimaryButton onPress={requestPermission}>Grant permission</PrimaryButton>
      </View>
    );
  }

  if (previewUri) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Image source={{ uri: previewUri }} style={{ flex: 1, width: '100%' }} resizeMode="contain" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, backgroundColor: '#000' }}>
          <Pressable onPress={() => setPreviewUri(null)} style={{
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 12,
            borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)',
          }}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 8, fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body }}>Retake</Text>
          </Pressable>
          <Pressable onPress={() => { addPhoto(previewUri, 'camera'); navigation.goBack(); }} style={{
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 12,
            borderRadius: 12, backgroundColor: t.primary,
          }}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 8, fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body }}>Use photo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const toggleFlash = () => setFlash((f) => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'));
  const toggleFacing = () => setFacing((f) => (f === 'back' ? 'front' : 'back'));

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const quality = IMAGE_QUALITY_PRESETS[await getStoredImageQuality()];
      const photo = await cameraRef.current.takePictureAsync({ quality });
      if (photo?.uri) setPreviewUri(photo.uri);
    } catch (err) {
      Alert.alert('Capture failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCapturing(false);
    }
  };

  const flashIcon: React.ComponentProps<typeof Ionicons>['name'] =
    flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off';

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} flash={flash}>
        {/* Top controls */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={glassChip}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
          <View style={[glassChip, { flexDirection: 'row', paddingHorizontal: 12 }]}>
            <Ionicons name="sparkles" size={14} color={t.cobalt400} />
            <Text style={{ color: '#fff', fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.caption, marginLeft: 6 }}>AI Scan</Text>
          </View>
          <Pressable onPress={toggleFacing} style={glassChip}>
            <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Scan reticle (corner brackets) */}
        <View style={{ flex: 1, alignItems: 'stretch', justifyContent: 'center', marginHorizontal: 60 }}>
          <View style={{ aspectRatio: 4 / 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', borderRadius: 16 }}>
            <Corner pos="tl" color={t.cobalt400} />
            <Corner pos="tr" color={t.cobalt400} />
            <Corner pos="bl" color={t.cobalt400} />
            <Corner pos="br" color={t.cobalt400} />
          </View>
        </View>

        {/* Bottom controls */}
        <View style={{ alignItems: 'center', paddingBottom: 28 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: t.font, fontSize: t.fs.caption, marginBottom: 12, fontWeight: t.fw.medium }}>
            Center the damaged area inside the frame
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Pressable onPress={toggleFlash} style={[glassChip, { position: 'absolute', left: -90 }]}>
              <Ionicons name={flashIcon} size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleCapture}
              disabled={capturing}
              style={{
                width: 76, height: 76, borderRadius: 38,
                borderWidth: 4, borderColor: '#fff',
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {capturing ? <ActivityIndicator color="#fff" /> : <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' }} />}
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const glassChip = {
  width: 40, height: 40, borderRadius: 20,
  backgroundColor: 'rgba(0,0,0,0.45)',
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

function Corner({ pos, color }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const base = { position: 'absolute' as const, width: 22, height: 22, borderColor: color };
  if (pos === 'tl') return <View style={[base, { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 }]} />;
  if (pos === 'tr') return <View style={[base, { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 }]} />;
  if (pos === 'bl') return <View style={[base, { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 }]} />;
  return <View style={[base, { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 }]} />;
}
