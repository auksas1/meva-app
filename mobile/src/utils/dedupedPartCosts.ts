import type { AnalysisSession } from '../types/analysis';

export function dedupedPartCosts(session: AnalysisSession): Map<string, number> {
  const seen = new Map<string, number>();
  for (const p of session.photos) {
    for (const part of p.result.affected_parts ?? []) {
      if (typeof part.estimated_cost !== 'number') continue;
      const prev = seen.get(part.name) ?? 0;
      if (part.estimated_cost > prev) seen.set(part.name, part.estimated_cost);
    }
  }
  return seen;
}