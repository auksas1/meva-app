import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalysisSession, AnalyzedPhoto, RepairRecord } from '../types/analysis';
import { patchAnalysis } from './api';
import { createVehicle, getVehicles } from './vehicleStorage';

const KEY = 'meva.history';
const MAX_SESSIONS = 100;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function writeAll(sessions: AnalysisSession[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

type LegacySession = AnalysisSession & {
  vehicleOverride?: {
    brand?: string;
    model?: string;
    year?: number;
    licensePlate?: string;
  };
};

export async function getSessions(): Promise<AnalysisSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnalysisSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getSession(id: string): Promise<AnalysisSession | null> {
  const sessions = await getSessions();
  return sessions.find((s) => s.id === id) ?? null;
}

export async function getSessionsForVehicle(vehicleId: string): Promise<AnalysisSession[]> {
  // Sessions are owned locally. We intentionally do NOT synthesize extra sessions
  // from backend analyses: that produced phantom "empty" sessions (blank thumbnail,
  // un-openable) alongside the real one. The real session already carries the photos.
  return (await getSessions())
    .filter((s) => s.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveSession(
  vehicleId: string,
  photos: AnalyzedPhoto[],
): Promise<AnalysisSession> {
  const session: AnalysisSession = {
    id: makeId(),
    vehicleId,
    createdAt: new Date().toISOString(),
    photos,
  };
  const existing = await getSessions();
  const next = [session, ...existing].slice(0, MAX_SESSIONS);
  await writeAll(next);

  // Link each backend analysis to this vehicle (best-effort, fire-and-forget).
  const vehicleIdNum = Number(vehicleId);
  if (!Number.isNaN(vehicleIdNum)) {
    for (const photo of photos) {
      patchAnalysis(photo.result.id, { vehicle_id: vehicleIdNum }).catch(() => {});
    }
  }

  return session;
}

export async function updateSession(
  id: string,
  patch: Partial<Omit<AnalysisSession, 'id'>>,
): Promise<AnalysisSession | null> {
  const sessions = await getSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated = { ...sessions[idx], ...patch };
  sessions[idx] = updated;
  await writeAll(sessions);
  return updated;
}

export async function appendPhotosToSession(
  id: string,
  photos: AnalyzedPhoto[],
): Promise<AnalysisSession | null> {
  const session = await getSession(id);
  if (!session) return null;
  return updateSession(id, { photos: [...session.photos, ...photos] });
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions();
  await writeAll(sessions.filter((s) => s.id !== id));
}

/**
 * Removes one photo (by index) from a session. If it was the last photo, the
 * whole session is deleted. The removed photo's backend analysis is unlinked
 * from its vehicle (best-effort) so it doesn't resurface as an orphan session.
 */
export async function deletePhotoFromSession(
  sessionId: string,
  photoIndex: number,
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  const removed = session.photos[photoIndex];
  const photos = session.photos.filter((_, i) => i !== photoIndex);
  if (photos.length === 0) {
    await deleteSession(sessionId);
  } else {
    await updateSession(sessionId, { photos });
  }
  if (removed) {
    patchAnalysis(removed.result.id, { vehicle_id: null }).catch(() => {});
  }
}

export async function addRepair(
  sessionId: string,
  repair: Omit<RepairRecord, 'id'>,
): Promise<RepairRecord | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const record: RepairRecord = { ...repair, id: makeId() };
  await updateSession(sessionId, {
    repairs: [...(session.repairs ?? []), record],
  });
  return record;
}

export async function updateRepair(
  sessionId: string,
  repairId: string,
  patch: Partial<Omit<RepairRecord, 'id'>>,
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  const repairs = (session.repairs ?? []).map((r) =>
    r.id === repairId ? { ...r, ...patch } : r,
  );
  await updateSession(sessionId, { repairs });
}

export async function deleteRepair(sessionId: string, repairId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  await updateSession(sessionId, {
    repairs: (session.repairs ?? []).filter((r) => r.id !== repairId),
  });
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

/**
 * Migrates pre-vehicle sessions: any session without vehicleId is linked to a
 * Vehicle entity created from its legacy vehicleOverride (or AI guess from first photo).
 * Idempotent — runs on app boot.
 */
export async function migrateLegacySessions(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const sessions = JSON.parse(raw) as LegacySession[];
    if (!Array.isArray(sessions)) return;

    let changed = false;
    const existingVehicles = await getVehicles();

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (s.vehicleId) continue;

      const ov = s.vehicleOverride ?? {};
      const firstResult = s.photos?.[0]?.result;
      const brand = ov.brand ?? firstResult?.vehicle_brand;
      const model = ov.model ?? firstResult?.vehicle_model;
      const year = ov.year ?? firstResult?.vehicle_year;

      const match = existingVehicles.find(
        (v) => v.brand === brand && v.model === model && v.year === year,
      );
      let vehicleId: string;
      if (match) {
        vehicleId = match.id;
      } else {
        const created = await createVehicle({
          brand,
          model,
          year,
          licensePlate: ov.licensePlate,
        });
        existingVehicles.unshift(created);
        vehicleId = created.id;
      }

      const cleaned = { ...s, vehicleId };
      delete (cleaned as Partial<LegacySession>).vehicleOverride;
      sessions[i] = cleaned as AnalysisSession;
      changed = true;
    }

    if (changed) {
      await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
    }
  } catch {
    // Silent — bad data shouldn't crash the app.
  }
}
