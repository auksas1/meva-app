import type { AnalysisSession } from '../types/analysis';

export function totalActualSpent(session: AnalysisSession): number | null {
  const repairs = session.repairs ?? [];
  let total = 0; let any = false;
  for (const r of repairs) if (typeof r.actualCost === 'number') { total += r.actualCost; any = true; }
  return any ? total : null;
}