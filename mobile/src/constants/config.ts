// Default backend URL.
// - Android emulator reaches host PC via 10.0.2.2 (mapped loopback).
// - iOS simulator / web can use http://localhost:8000.
// - Physical Expo Go device must use your LAN IP (set in Settings later).
export const DEFAULT_BACKEND_URL = 'http://10.0.2.2:8000';

export const REQUEST_TIMEOUT_MS = 30_000;

export type ImageQuality = 'low' | 'medium' | 'high';

export const IMAGE_QUALITY_PRESETS: Record<ImageQuality, number> = {
  low: 0.5,
  medium: 0.7,
  high: 0.9,
};

export const DEFAULT_IMAGE_QUALITY: ImageQuality = 'medium';

export const VALIDATION = {
  minWidth: 640,
  minHeight: 480,
  maxFileSizeBytes: 10 * 1024 * 1024,
};
