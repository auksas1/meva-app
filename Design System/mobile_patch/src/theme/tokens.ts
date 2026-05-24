// AutoDamage design tokens — light + dark.
// Mirrors `--ad-*` CSS variables from the design system.

import { Platform } from 'react-native';

export type Tokens = typeof lightTokens;

const SHARED = {
  // Spacing scale (4-multiple)
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s7: 32, s8: 40, s9: 56,
  screenPad: 20,

  // Radii
  rSm: 8, rMd: 12, rLg: 16, rXl: 20, rPill: 999,

  // Hit targets
  touch: 48,

  // Type — use Inter when loaded, fall back to system
  font: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
  fontMono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,

  // Type scale
  fs: {
    display: 28, h1: 24, h2: 18, h3: 16, body: 15, bodySm: 14,
    meta: 13, caption: 12, overline: 11,
  },
  fw: {
    regular: '400' as const, medium: '500' as const,
    semibold: '600' as const, bold: '700' as const, black: '800' as const,
  },
};

export const lightTokens = {
  ...SHARED,
  mode: 'light' as const,
  // brand
  primary: '#2562ee',
  primaryHover: '#1d4ed8',
  primaryFg: '#ffffff',
  primarySubtle: '#eef3ff',
  primarySubtleFg: '#1d4ed8',
  cobalt400: '#5b94ff',
  // severity
  severe: '#ef4444',
  severeSoft: '#fee2e2',
  warning: '#f59e0b',
  warningSoft: '#fef3c7',
  success: '#22c55e',
  successSoft: '#dcfce7',
  // surfaces
  bg: '#f7f8fb',
  surface1: '#ffffff',
  surface2: '#f1f3f8',
  surface3: '#e8ecf3',
  hairline: '#e6e9f0',
  border: '#d9dde6',
  // text
  fg1: '#0b1220',
  fg2: '#1c2434',
  fg3: '#404a5e',
  fg4: '#5d6577',
  fg5: '#8c93a5',
  fg6: '#b3b9c8',
  // overlays
  scrim: 'rgba(15,22,40,0.55)',
  // gradients
  scanGradStart: '#2562ee',
  scanGradEnd: '#1d4ed8',
  // shadow rgba (for RN shadow* + elevation)
  shadowColor: '#0f1428',
};

export const darkTokens: typeof lightTokens = {
  ...SHARED,
  mode: 'dark' as any,
  primary: '#3b7bff',
  primaryHover: '#5b94ff',
  primaryFg: '#ffffff',
  primarySubtle: '#0f1a35',
  primarySubtleFg: '#90b4ff',
  cobalt400: '#5b94ff',
  severe: '#f87171',
  severeSoft: '#3b1d1d',
  warning: '#fbbf24',
  warningSoft: '#3a2a13',
  success: '#34d399',
  successSoft: '#163325',
  bg: '#0a0e16',
  surface1: '#121823',
  surface2: '#1a2230',
  surface3: '#232b3b',
  hairline: '#232b3a',
  border: '#2c3447',
  fg1: '#f1f4fa',
  fg2: '#dbe0eb',
  fg3: '#b8becc',
  fg4: '#8a91a4',
  fg5: '#6a7184',
  fg6: '#424a5d',
  scrim: 'rgba(0,0,0,0.7)',
  scanGradStart: '#3b7bff',
  scanGradEnd: '#1d4ed8',
  shadowColor: '#000000',
};
