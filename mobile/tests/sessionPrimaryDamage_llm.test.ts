import { sessionPrimaryDamage } from '../src/components/SessionDetailView';

type Detection = {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
};

type AnalysisResponse = {
  id: number;
  image_filename: string;
  created_at: string;
  detections?: Detection[];
  damage_zones?: Detection[];
};

type AnalyzedPhoto = { localUri: string; result: AnalysisResponse };

type AnalysisSession = {
  id: string;
  vehicleId: string;
  createdAt: string;
  photos: AnalyzedPhoto[];
};

const BBOX: [number, number, number, number] = [0, 0, 10, 10];
const LOW_CONFIDENCE = 0.3;
const MID_CONFIDENCE = 0.6;
const HIGH_CONFIDENCE = 0.9;

function makeDetection(label: string, confidence: number): Detection {
  return { label, confidence, bbox: BBOX };
}

function makePhoto(result: Partial<AnalysisResponse>, index = 1): AnalyzedPhoto {
  return {
    localUri: `file:///photo${index}.jpg`,
    result: {
      id: index,
      image_filename: `photo${index}.jpg`,
      created_at: '2024-01-01T00:00:00Z',
      ...result,
    },
  };
}

function makeSession(photos: AnalyzedPhoto[]): AnalysisSession {
  return {
    id: 'session-1',
    vehicleId: 'vehicle-1',
    createdAt: '2024-01-01T00:00:00Z',
    photos,
  };
}

describe('sessionPrimaryDamage', () => {
  it('returns null when the session has no photos', () => {
    // Arrange
    const session = makeSession([]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when the photo has no detections and no damage zones', () => {
    // Arrange
    const session = makeSession([makePhoto({})]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when the photo has an empty detections array', () => {
    // Arrange
    const session = makeSession([makePhoto({ detections: [] })]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBeNull();
  });

  it('returns the prettified label for a single detection', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ detections: [makeDetection('dent', MID_CONFIDENCE)] }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Dent');
  });

  it('returns the label with the highest confidence within one photo', () => {
    // Arrange
    const session = makeSession([
      makePhoto({
        detections: [
          makeDetection('scratch', LOW_CONFIDENCE),
          makeDetection('dent', HIGH_CONFIDENCE),
          makeDetection('crack', MID_CONFIDENCE),
        ],
      }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Dent');
  });

  it('returns the label with the highest confidence across multiple photos', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ detections: [makeDetection('scratch', LOW_CONFIDENCE)] }, 1),
      makePhoto({ detections: [makeDetection('dent', HIGH_CONFIDENCE)] }, 2),
      makePhoto({ detections: [makeDetection('crack', MID_CONFIDENCE)] }, 3),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Dent');
  });

  it('keeps the first label when two detections have equal confidence', () => {
    // Arrange
    const session = makeSession([
      makePhoto({
        detections: [
          makeDetection('scratch', MID_CONFIDENCE),
          makeDetection('dent', MID_CONFIDENCE),
        ],
      }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Scratch');
  });

  it('does not replace the top label when a later detection has lower confidence', () => {
    // Arrange
    const session = makeSession([
      makePhoto({
        detections: [
          makeDetection('dent', HIGH_CONFIDENCE),
          makeDetection('scratch', LOW_CONFIDENCE),
        ],
      }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Dent');
  });

  it('uses damage_zones when detections are missing', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ damage_zones: [makeDetection('crack', MID_CONFIDENCE)] }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Crack');
  });

  it('prefers detections over damage_zones when both are present', () => {
    // Arrange
    const session = makeSession([
      makePhoto({
        detections: [makeDetection('dent', LOW_CONFIDENCE)],
        damage_zones: [makeDetection('crack', HIGH_CONFIDENCE)],
      }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Dent');
  });

  it('skips photos without detections and uses a later photo with detections', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ detections: [] }, 1),
      makePhoto({}, 2),
      makePhoto({ detections: [makeDetection('scratch', MID_CONFIDENCE)] }, 3),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Scratch');
  });

  it('accepts a detection with zero confidence', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ detections: [makeDetection('dent', 0)] }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Dent');
  });

  it('returns null when the only detection has an empty label', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ detections: [makeDetection('', HIGH_CONFIDENCE)] }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBeNull();
  });

  it('maps Rust_Corrision to its override label', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ detections: [makeDetection('Rust_Corrision', MID_CONFIDENCE)] }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Rust / corrosion');
  });

  it('maps Paint Damage to its override label', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ detections: [makeDetection('Paint Damage', MID_CONFIDENCE)] }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Paint damage');
  });

  it('replaces underscores with spaces and capitalizes a label without override', () => {
    // Arrange
    const session = makeSession([
      makePhoto({ detections: [makeDetection('glass_shatter', MID_CONFIDENCE)] }),
    ]);

    // Act
    const result = sessionPrimaryDamage(session);

    // Assert
    expect(result).toBe('Glass shatter');
  });
});
