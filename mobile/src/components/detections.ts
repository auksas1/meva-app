// Reader/format helpers for the AI analysis contract.
// Kept tolerant: the endpoint is preliminary, so these normalize either the new
// `detections`/`summary`/`recommendation` shape or the legacy `damage_zones` shape.

import type { AnalysisResponse, Detection } from '../services/api';
import type { Tokens } from '../theme/tokens';

const LABEL_OVERRIDES: Record<string, string> = {
  Rust_Corrision: 'Rust / corrosion',
  'Paint Damage': 'Paint damage',
  'Broken Part': 'Broken part',
  'Tire Damage': 'Tire damage',
};

/** "Rust_Corrision" -> "Rust / corrosion", "Paint Damage" -> "Paint damage". */
export function prettifyLabel(label: string): string {
  if (!label) return '—';
  if (LABEL_OVERRIDES[label]) return LABEL_OVERRIDES[label];
  // Generic fallback: underscores -> spaces, collapse, sentence-case first letter.
  const cleaned = label.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** New `detections`, falling back to legacy `damage_zones`. */
export function getDetections(r: AnalysisResponse): Detection[] {
  return r.detections ?? r.damage_zones ?? [];
}

/** Reported count, falling back to the detections array length. */
export function detectionCount(r: AnalysisResponse): number {
  return r.summary?.detections_count ?? getDetections(r).length;
}

/** Primary damage type (prettified), or the highest-confidence detection. */
export function primaryDamage(r: AnalysisResponse): string | null {
  if (r.summary?.primary_damage) return prettifyLabel(r.summary.primary_damage);
  const dets = getDetections(r);
  if (dets.length === 0) return null;
  const top = dets.reduce((best, d) => (d.confidence > best.confidence ? d : best), dets[0]);
  return prettifyLabel(top.label);
}

export function getRecommendation(r: AnalysisResponse): string | null {
  return r.recommendation?.message ?? null;
}

export function requiresReview(r: AnalysisResponse): boolean {
  return r.summary?.requires_manual_review === true;
}

/** An image the backend has already annotated with boxes/frame, if any. */
export function getAnnotatedImage(r: AnalysisResponse): string | null {
  return r.annotated_image_url ?? r.annotated_image_uri ?? r.annotated_image ?? null;
}

type ConfidenceTier = 'high' | 'medium' | 'low' | 'insufficient';

function confidenceTier(d: Detection): ConfidenceTier {
  const text = d.confidence_text?.toLowerCase() ?? '';
  if (text.includes('high')) return 'high';
  if (text.includes('medium')) return 'medium';
  if (text.includes('insufficient')) return 'insufficient';
  if (text.includes('low')) return 'low';
  // Derive from the numeric confidence when no worded value is provided.
  const c = d.confidence ?? 0;
  if (c >= 0.66) return 'high';
  if (c >= 0.4) return 'medium';
  if (c >= 0.2) return 'low';
  return 'insufficient';
}

/** Worded confidence, e.g. "High confidence". */
export function confidenceLabel(d: Detection): string {
  const tier = confidenceTier(d);
  return {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
    insufficient: 'Insufficient confidence',
  }[tier];
}

/** Small muted percentage shown next to the worded label, e.g. "87%". */
export function confidencePercent(d: Detection): string {
  return `${Math.round((d.confidence ?? 0) * 100)}%`;
}

/** StatusBadge color variant for a detection's confidence. */
export function confidenceColor(d: Detection): 'success' | 'warning' | 'neutral' {
  const tier = confidenceTier(d);
  if (tier === 'high') return 'success';
  if (tier === 'medium') return 'warning';
  return 'neutral';
}

/** True when a detection is low or insufficient confidence. */
export function lowConfidence(d: Detection): boolean {
  const tier = confidenceTier(d);
  return tier === 'low' || tier === 'insufficient';
}

/** True when there are detections and every one is low/insufficient confidence. */
export function allLowConfidence(r: AnalysisResponse): boolean {
  const dets = getDetections(r);
  return dets.length > 0 && dets.every(lowConfidence);
}

export type AnalysisState = 'damage' | 'no_damage' | 'low_confidence' | 'poor_quality';

/**
 * The user-facing result state. Prefers the backend `status` string, falling
 * back to summary/detections so it works before the endpoint is final.
 * (The "analyzing image" state lives in the upload overlay, not here.)
 */
export function analysisState(r: AnalysisResponse): AnalysisState {
  const status = r.status?.toLowerCase() ?? '';
  if (status) {
    if (status.includes('no_damage') || status.includes('no damage')) return 'no_damage';
    if (status.includes('poor') || status.includes('quality')) return 'poor_quality';
    if (status.includes('low_confidence') || status.includes('low confidence') || status.includes('review')) return 'low_confidence';
    if (status.includes('damage')) return 'damage';
  }
  // Fallback: infer from summary + detections.
  if (detectionCount(r) === 0) return 'no_damage';
  const quality = r.summary?.analysis_quality?.toLowerCase() ?? '';
  if (quality.includes('poor') || quality.includes('low')) return 'poor_quality';
  if (requiresReview(r) || allLowConfidence(r)) return 'low_confidence';
  return 'damage';
}

export type AnalysisNotice = {
  tone: 'success' | 'warning' | 'neutral';
  text: string;
};

/**
 * A one-line banner for the analysis state. Returns null for a normal damage
 * result. Uses `recommendation.message` when present, else a per-state default.
 */
export function analysisNotice(r: AnalysisResponse): AnalysisNotice | null {
  const recommendation = getRecommendation(r);
  switch (analysisState(r)) {
    case 'no_damage':
      return { tone: 'success', text: recommendation ?? 'No visible damage was detected.' };
    case 'poor_quality':
      return { tone: 'warning', text: recommendation ?? 'Consider uploading a clearer image.' };
    case 'low_confidence':
      return {
        tone: 'warning',
        text: recommendation ?? 'Low-confidence result. Please review the highlighted areas or upload a clearer image.',
      };
    default:
      return null;
  }
}

export function noticeColors(tone: AnalysisNotice['tone'], t: Tokens): { fg: string; bg: string } {
  if (tone === 'success') return { fg: t.success, bg: t.successSoft };
  if (tone === 'warning') return { fg: t.warning, bg: t.warningSoft };
  return { fg: t.fg4, bg: t.surface2 };
}
