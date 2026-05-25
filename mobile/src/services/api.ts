import { DEFAULT_BACKEND_URL, REQUEST_TIMEOUT_MS } from '../constants/config';

// A single damage detection from the model.
// `bbox` is assumed normalized [x1, y1, x2, y2] in 0..1 — confirm against the
// real YOLO endpoint when it lands. Reserved for a possible future client-side
// overlay; NOT drawn now, since the backend is expected to return an image that
// already has the boxes/frame baked in (see `annotated_image_*` below).
export type Detection = {
  label: string; // raw model class, e.g. "Dent", "Rust_Corrision"
  confidence: number; // 0..1
  confidence_text?: string; // "high confidence" | "medium confidence" | ...
  bbox: [number, number, number, number];
};

// Legacy alias — older backend responses used `damage_zones`. Kept for back-compat.
export type DamageZone = Detection;

export type AnalysisSummary = {
  detections_count?: number;
  primary_damage?: string;
  analysis_quality?: string; // e.g. "good" | "poor"
  requires_manual_review?: boolean;
};

export type AffectedPart = {
  name: string;
  estimated_cost?: number;
};

export type AnalysisResponse = {
  id: number;
  vehicle_id?: number | null;
  image_filename: string;
  status?: string;
  created_at: string;

  // New AI contract
  summary?: AnalysisSummary;
  detections?: Detection[];
  recommendation?: { message?: string };

  // Optional: an image the backend has already annotated with boxes/frame.
  // If present, the UI shows this instead of the user's local photo. (Exact
  // field name TBD — we accept any of the three the team might use.)
  annotated_image_url?: string;
  annotated_image_uri?: string;
  annotated_image?: string;

  // Cost ledger (kept)
  affected_parts?: AffectedPart[];
  total_estimated_cost?: number;

  // Legacy / back-compat (tolerated, read only via helpers; never shown as severity)
  damage_zones?: DamageZone[];
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
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
    if (res.status === 204) return undefined as T;
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

export async function patchAnalysis(id: number, data: { vehicle_id?: number | null }): Promise<AnalysisResponse> {
  return request<AnalysisResponse>(`/analysis/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function listAnalysesForVehicle(vehicleId: number): Promise<AnalysisResponse[]> {
  const res = await request<{ items: AnalysisResponse[]; total: number }>(
    `/analysis/?vehicle_id=${vehicleId}&limit=200`,
  );
  return res.items;
}

// --- Vehicles ---

export type VehicleApiResponse = {
  id: number;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  license_plate?: string | null;
  notes?: string | null;
  created_at: string;
};

export type VehiclePayload = {
  brand?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  notes?: string;
};

export async function listVehicles(skip = 0, limit = 200): Promise<VehicleApiResponse[]> {
  const res = await request<{ items: VehicleApiResponse[]; total: number }>(
    `/vehicles/?skip=${skip}&limit=${limit}`,
  );
  return res.items;
}

export async function getVehicleById(id: number): Promise<VehicleApiResponse> {
  return request<VehicleApiResponse>(`/vehicles/${id}`);
}

export async function createVehicleApi(data: VehiclePayload): Promise<VehicleApiResponse> {
  return request<VehicleApiResponse>('/vehicles/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateVehicleApi(id: number, data: VehiclePayload): Promise<VehicleApiResponse> {
  return request<VehicleApiResponse>(`/vehicles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteVehicleApi(id: number): Promise<void> {
  return request<void>(`/vehicles/${id}`, { method: 'DELETE' });
}

// --- Health ---

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await request<{ status: string }>('/health');
    return res.status === 'ok';
  } catch {
    return false;
  }
}
