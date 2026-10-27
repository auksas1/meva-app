import { analysisNotice } from '../src/components/detections';

type AnalysisResponse = Parameters<typeof analysisNotice>[0];

const RECOMMENDATION_MESSAGE = 'Custom recommendation message.';

function buildResponse(overrides: Partial<AnalysisResponse> = {}): AnalysisResponse {
  return {
    id: 1,
    image_filename: 'car.jpg',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('analysisNotice', () => {
  describe('no_damage state', () => {
    it('returns success tone when status is no_damage', () => {
      // Arrange
      const response = buildResponse({ status: 'no_damage' });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.tone).toBe('success');
    });

    it('returns recommendation message as text when no_damage has a recommendation', () => {
      // Arrange
      const response = buildResponse({
        status: 'no_damage',
        recommendation: { message: RECOMMENDATION_MESSAGE },
      });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.text).toBe(RECOMMENDATION_MESSAGE);
    });

    it('returns default text when no_damage has no recommendation', () => {
      // Arrange
      const response = buildResponse({ status: 'no_damage' });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.text).toBe('No visible damage was detected.');
    });
  });

  describe('poor_quality state', () => {
    it('returns warning tone when status is poor_quality', () => {
      // Arrange
      const response = buildResponse({ status: 'poor_quality' });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.tone).toBe('warning');
    });

    it('returns recommendation message as text when poor_quality has a recommendation', () => {
      // Arrange
      const response = buildResponse({
        status: 'poor_quality',
        recommendation: { message: RECOMMENDATION_MESSAGE },
      });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.text).toBe(RECOMMENDATION_MESSAGE);
    });

    it('returns default text when poor_quality has no recommendation', () => {
      // Arrange
      const response = buildResponse({ status: 'poor_quality' });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.text).toBe('Consider uploading a clearer image.');
    });
  });

  describe('low_confidence state', () => {
    it('returns warning tone when status is low_confidence', () => {
      // Arrange
      const response = buildResponse({ status: 'low_confidence' });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.tone).toBe('warning');
    });

    it('returns recommendation message as text when low_confidence has a recommendation', () => {
      // Arrange
      const response = buildResponse({
        status: 'low_confidence',
        recommendation: { message: RECOMMENDATION_MESSAGE },
      });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.text).toBe(RECOMMENDATION_MESSAGE);
    });

    it('returns default text when low_confidence has no recommendation', () => {
      // Arrange
      const response = buildResponse({ status: 'low_confidence' });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice?.text).toBe(
        'Low-confidence result. Please review the highlighted areas or upload a clearer image.',
      );
    });
  });

  describe('default branch', () => {
    it('returns null when status is damage', () => {
      // Arrange
      const response = buildResponse({ status: 'damage' });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice).toBeNull();
    });

    it('returns null when status is undefined', () => {
      // Arrange
      const response = buildResponse();

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice).toBeNull();
    });

    it('returns null when damage status has a recommendation', () => {
      // Arrange
      const response = buildResponse({
        status: 'damage',
        recommendation: { message: RECOMMENDATION_MESSAGE },
      });

      // Act
      const notice = analysisNotice(response);

      // Assert
      expect(notice).toBeNull();
    });
  });
});
