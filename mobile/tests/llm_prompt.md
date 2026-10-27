# DKM užklausos (8 užduotis)

| | |
|---|---|
| Modelis | Claude Sonnet 5.5 (`claude-sonnet-5-5`), Anthropic |
| Planas | Mokamas (Claude prenumerata, per Claude Code, VS Code) |
| Data | 2026-10-21 |
| Kontekstas | Kiekvienai funkcijai naujas pokalbis, 1 bandymas. DKM matė tik promptą, ne projektą. |

Sugeneruoti testai: `analysisNotice_llm.test.ts` (12 testų) ir `sessionPrimaryDamage_llm.test.ts` (16 testų).
Neredaguoti DKM atsakymai: `llm_response_analysisNotice.md`, `llm_response_sessionPrimaryDamage.md`.

Generavimo metu testų failai buvo `mobile/lab2/tests/ai/`. Juos perkėlus į `mobile/tests/`, pakeistas tik importo kelias (`../../../src/` → `../src/`). Promptai žemiau pateikti tokie, kokie buvo išsiųsti.

---

## 1. `analysisNotice`

Sugeneruok Jest unit testus TypeScript funkcijai analysisNotice.

Kontekstas:
- Projektas: React Native (Expo), TypeScript, testai su Jest (jest-expo).
- Testų failas bus mobile/lab2/tests/ai/analysisNotice.test.ts, funkciją importuok taip:
  import { analysisNotice } from '../../../src/components/detections';
- analysisState ir getRecommendation yra tame pačiame faile, jų nemockink.
  analysisState(r) būseną nustato pagal r.status ('no_damage', 'poor_quality', 'low_confidence', 'damage').
  getRecommendation(r) grąžina r.recommendation?.message arba null.

Funkcija:
```ts
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
```

Tipai:
```ts
type Detection = {
  label: string;
  confidence: number;
  confidence_text?: string;
  bbox: [number, number, number, number];
};

type AnalysisResponse = {
  id: number;
  image_filename: string;
  created_at: string;
  status?: string;
  detections?: Detection[];
  recommendation?: { message?: string };
};

type AnalysisNotice = {
  tone: 'success' | 'warning' | 'neutral';
  text: string;
};
```

Taisyklės:
1. Kiekvienas testas tikrina vieną dalyką ir turi bent vieną expect.
2. Naudok Arrange–Act–Assert struktūrą.
3. Testai turi padengti visas šakas: kiekvieną case, default ir abu ?? variantus.
4. Neturi būti test smell'ų: Assertion Roulette, Eager Test, Mystery Guest, Magic Number, Conditional Test Logic, Empty Test, Redundant Assertion, Duplicate Assert.

Išvesties formatas: vienas TypeScript failas su testais, tik kodas be paaiškinimų.

---

## 2. `sessionPrimaryDamage`

Sugeneruok Jest unit testus TypeScript funkcijai sessionPrimaryDamage.

Kontekstas:
- Projektas: React Native (Expo), TypeScript, testai su Jest (jest-expo).
- Testų failas bus mobile/lab2/tests/ai/sessionPrimaryDamage.test.ts, funkciją importuok taip:
  import { sessionPrimaryDamage } from '../../../src/components/SessionDetailView';
- getDetections ir prettifyLabel importuojamos iš failo detections.ts (kodas žemiau), jų nemockink.

Funkcija:
```ts
export function sessionPrimaryDamage(session: AnalysisSession): string | null {
  let topLabel: string | null = null;
  let topConf = -1;
  for (const p of session.photos) {
    for (const d of getDetections(p.result)) {
      if (d.confidence > topConf) { topConf = d.confidence; topLabel = d.label; }
    }
  }
  return topLabel ? prettifyLabel(topLabel) : null;
}
```

Naudojamos funkcijos (detections.ts):
```ts
const LABEL_OVERRIDES: Record<string, string> = {
  Rust_Corrision: 'Rust / corrosion',
  'Paint Damage': 'Paint damage',
  'Broken Part': 'Broken part',
  'Tire Damage': 'Tire damage',
};

export function prettifyLabel(label: string): string {
  if (!label) return '—';
  if (LABEL_OVERRIDES[label]) return LABEL_OVERRIDES[label];
  const cleaned = label.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function getDetections(r: AnalysisResponse): Detection[] {
  return r.detections ?? r.damage_zones ?? [];
}
```

Tipai:
```ts
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
```

Taisyklės:
1. Kiekvienas testas tikrina vieną dalyką ir turi bent vieną expect.
2. Naudok Arrange–Act–Assert struktūrą.
3. Testai turi padengti visas šakas: abu if variantus, abu ternary variantus, ciklus su tuščiu ir netuščiu sąrašu.
4. Neturi būti test smell'ų: Assertion Roulette, Eager Test, Mystery Guest, Magic Number, Conditional Test Logic, Empty Test, Redundant Assertion, Duplicate Assert.

Išvesties formatas: vienas TypeScript failas su testais, tik kodas be paaiškinimų.
