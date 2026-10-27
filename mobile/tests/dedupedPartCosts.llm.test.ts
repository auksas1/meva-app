
import { describe, it, expect } from 'vitest';
import type { AnalysisSession } from '../src/types/analysis';
import { dedupedPartCosts } from '../src/utils/dedupedPartCosts';

const makeSession = (photos: unknown[]): AnalysisSession =>
  ({ photos } as unknown as AnalysisSession);

describe('dedupedPartCosts', () => {
  it('returns an empty Map when the session has no photos', () => {
    const result = dedupedPartCosts(makeSession([]));

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('returns an empty Map when affected_parts is undefined', () => {
    const session = makeSession([
      { result: {} },
    ]);

    expect(dedupedPartCosts(session)).toEqual(new Map());
  });

  it('returns an empty Map when affected_parts is null', () => {
    const session = makeSession([
      { result: { affected_parts: null } },
    ]);

    expect(dedupedPartCosts(session)).toEqual(new Map());
  });

  it('ignores parts with missing or non-numeric estimated costs', () => {
    const session = makeSession([
      {
        result: {
          affected_parts: [
            { name: 'Door' },
            { name: 'Bumper', estimated_cost: '150' },
            { name: 'Mirror', estimated_cost: null },
          ],
        },
      },
    ]);

    expect(dedupedPartCosts(session)).toEqual(new Map());
  });

  it('returns a Map containing numeric costs for distinct parts', () => {
    const session = makeSession([
      {
        result: {
          affected_parts: [
            { name: 'Door', estimated_cost: 150 },
            { name: 'Bumper', estimated_cost: 250 },
          ],
        },
      },
      {
        result: {
          affected_parts: [
            { name: 'Mirror', estimated_cost: 75 },
          ],
        },
      },
    ]);

    const result = dedupedPartCosts(session);

    expect(result).toBeInstanceOf(Map);
    expect([...result.entries()]).toEqual([
      ['Door', 150],
      ['Bumper', 250],
      ['Mirror', 75],
    ]);
  });

  it('replaces an existing cost when a duplicate part has a higher cost', () => {
    const session = makeSession([
      {
        result: {
          affected_parts: [
            { name: 'Door', estimated_cost: 100 },
          ],
        },
      },
      {
        result: {
          affected_parts: [
            { name: 'Door', estimated_cost: 300 },
          ],
        },
      },
    ]);

    expect(dedupedPartCosts(session)).toEqual(
      new Map([['Door', 300]]),
    );
  });

  it('preserves the highest cost when duplicate parts have lower or equal costs', () => {
    const session = makeSession([
      {
        result: {
          affected_parts: [
            { name: 'Bumper', estimated_cost: 300 },
          ],
        },
      },
      {
        result: {
          affected_parts: [
            { name: 'Bumper', estimated_cost: 100 },
            { name: 'Bumper', estimated_cost: 300 },
          ],
        },
      },
    ]);

    expect(dedupedPartCosts(session)).toEqual(
      new Map([['Bumper', 300]]),
    );
  });

  it('excludes new parts with zero or negative estimated costs', () => {
    const session = makeSession([
      {
        result: {
          affected_parts: [
            { name: 'Door', estimated_cost: 0 },
            { name: 'Mirror', estimated_cost: -50 },
          ],
        },
      },
    ]);

    expect(dedupedPartCosts(session)).toEqual(new Map());
  });

  it('does not add parts whose estimated cost is NaN', () => {
    const session = makeSession([
      {
        result: {
          affected_parts: [
            { name: 'Door', estimated_cost: NaN },
          ],
        },
      },
    ]);

    expect(dedupedPartCosts(session)).toEqual(new Map());
  });
});
