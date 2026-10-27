// 5c – unit tests for sessionPrimaryDamage (mobile/src/components/SessionDetailView.tsx:36).
// Behaviour: the session summary shows the damage type with the highest confidence across all photos.
import { sessionPrimaryDamage } from '../src/components/SessionDetailView';
import type { AnalysisResponse, Detection } from '../src/services/api';
import type { AnalysisSession, AnalyzedPhoto } from '../src/types/analysis';

function detection(label: string, confidence: number): Detection {
  return { label, confidence, bbox: [0, 0, 1, 1] };
}

function photo(detections: Detection[] | undefined, legacyZones?: Detection[]): AnalyzedPhoto {
  const result: AnalysisResponse = {
    id: 1,
    image_filename: 'car.jpg',
    created_at: '2026-10-17T10:00:00Z',
    detections,
    damage_zones: legacyZones,
  };
  return { localUri: 'file:///car.jpg', result };
}

function session(...photos: AnalyzedPhoto[]): AnalysisSession {
  return { id: 'session-1', vehicleId: 'vehicle-1', createdAt: '2026-10-17T10:00:00Z', photos };
}

describe('sessionPrimaryDamage', () => {
  it('returns null for a session without photos', () => {
    expect(sessionPrimaryDamage(session())).toBeNull();
  });

  it('returns null when no photo has detections', () => {
    expect(sessionPrimaryDamage(session(photo([]), photo([])))).toBeNull();
  });

  it('returns the prettified label of a single detection', () => {
    const s = session(photo([detection('Rust_Corrision', 0.7)]));

    expect(sessionPrimaryDamage(s)).toBe('Rust / corrosion');
  });

  it('picks the most confident detection across all photos', () => {
    const s = session(photo([detection('Dent', 0.6)]), photo([detection('Scratch', 0.9)]));

    expect(sessionPrimaryDamage(s)).toBe('Scratch');
  });

  it('keeps the stronger detection when a weaker one comes later', () => {
    const s = session(photo([detection('Scratch', 0.9), detection('Dent', 0.5)]));

    expect(sessionPrimaryDamage(s)).toBe('Scratch');
  });

  it('keeps the first detection when two have the same confidence', () => {
    const s = session(photo([detection('Dent', 0.8)]), photo([detection('Crack', 0.8)]));

    expect(sessionPrimaryDamage(s)).toBe('Dent');
  });

  it('counts a detection with zero confidence', () => {
    const s = session(photo([detection('Crack', 0)]));

    expect(sessionPrimaryDamage(s)).toBe('Crack');
  });

  it('reads legacy damage_zones when a photo has no detections field', () => {
    const s = session(photo(undefined, [detection('Paint Damage', 0.5)]));

    expect(sessionPrimaryDamage(s)).toBe('Paint damage');
  });

  it('returns null when the most confident detection has an empty label', () => {
    const s = session(photo([detection('', 0.9)]));

    expect(sessionPrimaryDamage(s)).toBeNull();
  });
});
