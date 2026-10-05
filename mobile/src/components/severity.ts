import type { Tokens } from '../theme/tokens';

export function scoreColor(score: number, t: Tokens): string {
  if (score >= 0.66) return t.severe;
  if (score >= 0.33) return t.warning;
  return t.success;
}

export function scoreSoft(score: number, t: Tokens): string {
  if (score >= 0.66) return t.severeSoft;
  if (score >= 0.33) return t.warningSoft;
  return t.successSoft;
}

export function severityLabel(score: number): string {
  if (score >= 0.66) return 'Significant';
  if (score >= 0.33) return 'Moderate';
  if (score > 0) return 'Minor';
  return 'None';
}
