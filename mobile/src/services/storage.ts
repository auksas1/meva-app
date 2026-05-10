import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_BACKEND_URL,
  DEFAULT_IMAGE_QUALITY,
  type ImageQuality,
} from '../constants/config';
import { setBaseUrl } from './api';

const KEYS = {
  backendUrl: 'meva.backend_url',
  imageQuality: 'meva.image_quality',
} as const;

const VALID_QUALITIES: ImageQuality[] = ['low', 'medium', 'high'];

export async function getStoredBackendUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(KEYS.backendUrl);
  return stored && stored.trim().length > 0 ? stored : DEFAULT_BACKEND_URL;
}

export async function setStoredBackendUrl(url: string): Promise<void> {
  const cleaned = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(KEYS.backendUrl, cleaned);
  setBaseUrl(cleaned);
}

export async function getStoredImageQuality(): Promise<ImageQuality> {
  const stored = await AsyncStorage.getItem(KEYS.imageQuality);
  if (stored && (VALID_QUALITIES as string[]).includes(stored)) {
    return stored as ImageQuality;
  }
  return DEFAULT_IMAGE_QUALITY;
}

export async function setStoredImageQuality(quality: ImageQuality): Promise<void> {
  await AsyncStorage.setItem(KEYS.imageQuality, quality);
}

export async function hydrateSettings(): Promise<void> {
  const url = await getStoredBackendUrl();
  setBaseUrl(url);
}
