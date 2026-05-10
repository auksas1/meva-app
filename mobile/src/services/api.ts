import { DEFAULT_BACKEND_URL, REQUEST_TIMEOUT_MS } from '../constants/config';

export type DamageZone = {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
};

export type AffectedPart = {
  name: string;
  estimated_cost?: number;
};

export type AnalysisResponse = {
  id: number;
  image_filename: string;
  damage_score: number;
  damage_zones: DamageZone[];
  status: string;
  created_at: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  affected_parts?: AffectedPart[];
  total_estimated_cost?: number;
  repair_recommendation?: string;
};

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

let baseUrlOverride: string | null = null;

export function setBaseUrl(url: string | null): void {
  baseUrlOverride = url && url.trim().length > 0 ? url.replace(/\/+$/, '') : null;
}

export function getBaseUrl(): string {
  return baseUrlOverride ?? DEFAULT_BACKEND_URL;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail: unknown;
      try {
        detail = await res.json();
      } catch {
        detail = await res.text().catch(() => undefined);
      }
      const message =
        (detail && typeof detail === 'object' && 'detail' in detail
          ? String((detail as { detail: unknown }).detail)
          : null) ?? `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status, detail);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 0);
    }
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function uploadImage(uri: string): Promise<AnalysisResponse> {
  const formData = new FormData();

  if (uri.startsWith('blob:') || uri.startsWith('data:')) {
    // Web: blob/data URIs must be fetched into a real Blob before appending
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('file', blob, 'upload.jpg');
  } else {
    // React Native: { uri, name, type } is handled by RN's fetch polyfill
    formData.append('file', { uri, name: 'upload.jpg', type: 'image/jpeg' } as unknown as Blob);
  }

  return request<AnalysisResponse>('/analysis/analyze', {
    method: 'POST',
    body: formData,
  });
}

export async function getAnalysis(id: number): Promise<AnalysisResponse> {
  return request<AnalysisResponse>(`/analysis/${id}`);
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await request<{ status: string }>('/health');
    return res.status === 'ok';
  } catch {
    return false;
  }
}
