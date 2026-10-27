// 5c – unit tests for analysisNotice (mobile/src/components/detections.ts:131).
// Requirements: KAN-4 AC4 (no damage -> message, no price), KAN-1 AC4 (low confidence -> review / clearer image).
import { analysisNotice } from '../src/components/detections';
import type { AnalysisResponse } from '../src/services/api';

const NO_DAMAGE = 'No visible damage was detected.';
const POOR_QUALITY = 'Consider uploading a clearer image.';
const LOW_CONFIDENCE = 'Low-confidence result. Please review the highlighted areas or upload a clearer image.';
const RECOMMENDATION = 'Retake the photo from about 1 m.';

function response(overrides: Partial<AnalysisResponse> = {}): AnalysisResponse {
  return { id: 1, image_filename: 'car.jpg', created_at: '2026-10-17T10:00:00Z', ...overrides };
}

describe('analysisNotice', () => {
  describe('without a backend recommendation', () => {
    it.each([
      ['no_damage', 'success', NO_DAMAGE],
      ['poor_quality', 'warning', POOR_QUALITY],
      ['low_confidence', 'warning', LOW_CONFIDENCE],
    ])('status "%s" shows the default %s notice', (status, tone, text) => {
      const notice = analysisNotice(response({ status }));

      expect(notice).toEqual({ tone, text });
    });
  });

  describe('with a backend recommendation', () => {
    it.each([
      ['no_damage', 'success'],
      ['poor_quality', 'warning'],
      ['low_confidence', 'warning'],
    ])('status "%s" shows the recommendation instead of the default text', (status, tone) => {
      const notice = analysisNotice(response({ status, recommendation: { message: RECOMMENDATION } }));

      expect(notice).toEqual({ tone, text: RECOMMENDATION });
    });
  });

  it('returns no notice for a normal damage result', () => {
    const r = response({ status: 'damage', detections: [{ label: 'Dent', confidence: 0.9, bbox: [0, 0, 1, 1] }] });

    expect(analysisNotice(r)).toBeNull();
  });

  it('shows the no-damage notice for a completed analysis without detections (KAN-4)', () => {
    // The backend answers with status "completed", so the state is inferred from the detections.
    const r = response({ status: 'completed', detections: [] });

    expect(analysisNotice(r)).toEqual({ tone: 'success', text: NO_DAMAGE });
  });

  it('shows the low-confidence notice when every detection is below 40 % confidence (KAN-1)', () => {
    const r = response({ status: 'completed', detections: [{ label: 'Scratch', confidence: 0.3, bbox: [0, 0, 1, 1] }] });

    expect(analysisNotice(r)).toEqual({ tone: 'warning', text: LOW_CONFIDENCE });
  });

  it('keeps an empty recommendation as the text (current behaviour, possible defect)', () => {
    // `??` only replaces null/undefined, so an empty message produces an empty banner.
    const r = response({ status: 'no_damage', recommendation: { message: '' } });

    expect(analysisNotice(r)?.text).toBe('');
  });
});
