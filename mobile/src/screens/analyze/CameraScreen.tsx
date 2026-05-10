import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type CameraType,
  type FlashMode,
} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AnalyzeStackParamList } from '../../navigation/types';
import { useSelectedPhotos } from '../../state/selectedPhotos';
import { IMAGE_QUALITY_PRESETS } from '../../constants/config';
import { getStoredImageQuality } from '../../services/storage';

type Props = NativeStackScreenProps<AnalyzeStackParamList, 'Camera'>;

export default function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturing, setCapturing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const { addPhoto } = useSelectedPhotos();

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          We need camera access to take photos of vehicle damage.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (previewUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.previewButton, styles.retakeButton]}
            onPress={() => setPreviewUri(null)}
          >
            <Ionicons name="refresh" size={22} color="#fff" />
            <Text style={styles.previewButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.previewButton, styles.confirmButton]}
            onPress={() => {
              addPhoto(previewUri, 'camera');
              navigation.goBack();
            }}
          >
            <Ionicons name="checkmark" size={22} color="#fff" />
            <Text style={styles.previewButtonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleFlash = () => {
    setFlash((f) => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'));
  };

  const toggleFacing = () => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

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
    <View style={styles.cameraContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
            <Ionicons name={flashIcon} size={26} color="#fff" />
            <Text style={styles.iconLabel}>{flash}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permissionText: { fontSize: 16, textAlign: 'center', marginBottom: 16, color: '#333' },
  primaryButton: {
    backgroundColor: '#1f6feb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  iconButton: { alignItems: 'center', padding: 8 },
  iconLabel: { color: '#fff', fontSize: 11, marginTop: 2, textTransform: 'uppercase' },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },

  previewContainer: { flex: 1, backgroundColor: '#000' },
  previewImage: { flex: 1, width: '100%' },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#000',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  previewButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  retakeButton: { backgroundColor: '#555' },
  confirmButton: { backgroundColor: '#1f8a3e' },
});
