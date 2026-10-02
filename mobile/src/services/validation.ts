import { Image } from 'react-native';
import { VALIDATION } from '../constants/config';

export type ValidationResult = { valid: true } | { valid: false; reason: string };

function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
    );
  });
}

async function getFileSize(uri: string): Promise<number | null> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return blob.size;
  } catch {
    return null;
  }
}

export async function validateImage(uri: string): Promise<ValidationResult> {
  let dims: { width: number; height: number };
  try {
    dims = await getImageDimensions(uri);
  } catch {
    return { valid: false, reason: 'Could not read image dimensions.' };
  }

  if (dims.width < VALIDATION.minWidth || dims.height < VALIDATION.minHeight) {
    return {
      valid: false,
      reason: `Image too small (${dims.width}x${dims.height}). Minimum ${VALIDATION.minWidth}x${VALIDATION.minHeight}.`,
    };
  }

  const size = await getFileSize(uri);
  if (size !== null && size > VALIDATION.maxFileSizeBytes) {
    const mb = (size / (1024 * 1024)).toFixed(1);
    const maxMb = (VALIDATION.maxFileSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, reason: `Image too large (${mb} MB). Maximum ${maxMb} MB.` };
  }

  return { valid: true };
}
