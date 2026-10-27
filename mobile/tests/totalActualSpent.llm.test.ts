
import { describe, it, expect } from 'vitest';
import type { AnalysisSession } from '../src/types/analysis';
import { totalActualSpent } from '../src/utils/totalActualSpent';

const makeSession = (repairs: unknown): AnalysisSession =>
  ({ photos: [], repairs } as unknown as AnalysisSession);

describe('totalActualSpent', () => {
  it('returns null when the repairs property is missing', () => {
    const session = {
      photos: [],
    } as unknown as AnalysisSession;

    expect(totalActualSpent(session)).toBeNull();
  });

  it('returns null when repairs is null', () => {
    const session = makeSession(null);

    expect(totalActualSpent(session)).toBeNull();
  });

  it('returns null when repairs is an empty array', () => {
    const session = makeSession([]);

    expect(totalActualSpent(session)).toBeNull();
  });

  it('returns null when no repair has a numeric actualCost', () => {
    const session = makeSession([
      {},
      { actualCost: undefined },
      { actualCost: null },
      { actualCost: '100' },
    ]);

    expect(totalActualSpent(session)).toBeNull();
  });

  it('returns the actual cost of a single repair', () => {
    const session = makeSession([
      { actualCost: 150 },
    ]);

    expect(totalActualSpent(session)).toBe(150);
  });

  it('sums actual costs across multiple repairs', () => {
    const session = makeSession([
      { actualCost: 100 },
      { actualCost: 200 },
      { actualCost: 50 },
    ]);

    expect(totalActualSpent(session)).toBe(350);
  });

  it('returns zero instead of null when a repair has an actualCost of zero', () => {
    const session = makeSession([
      { actualCost: 0 },
    ]);

    expect(totalActualSpent(session)).toBe(0);
  });

  it('includes negative actual costs in the total', () => {
    const session = makeSession([
      { actualCost: -50 },
    ]);

    expect(totalActualSpent(session)).toBe(-50);
  });

  it('sums numeric costs while ignoring repairs with non-numeric costs', () => {
    const session = makeSession([
      { actualCost: 150 },
      {},
      { actualCost: '200' },
      { actualCost: -30 },
      { actualCost: null },
      { actualCost: 20 },
    ]);

    expect(totalActualSpent(session)).toBe(140);
  });

  it('correctly sums fractional actual costs', () => {
    const session = makeSession([
      { actualCost: 12.5 },
      { actualCost: 7.25 },
    ]);

    expect(totalActualSpent(session)).toBe(19.75);
  });

  it('returns NaN when a repair has an actualCost of NaN', () => {
    const session = makeSession([
      { actualCost: 100 },
      { actualCost: NaN },
    ]);

    expect(totalActualSpent(session)).toBeNaN();
  });
});
