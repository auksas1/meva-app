
Užduotis: parašyti Vitest vienetų testus dviem TypeScript funkcijoms: dedupedPartCosts ir totalActualSpent.

Projektas: React Native / Expo, TypeScript.

Naudoti įrankius:
- Vitest 5.0.5
- TypeScript
- Jokių papildomų bibliotekų nediegti.

Taisyklės:
1. Padengti visus sakinius ir visas logines šakas (100 % Statement ir Branch Coverage).
2. Vienas testas turi tikrinti vieną aiškią elgseną.
3. Testų pavadinimai turi būti informatyvūs.
4. Įtraukti teigiamus, neigiamus ir ribinius atvejus.
5. Nerašyti besidubliuojančių testų.
6. Testuoti grąžinamas reikšmes ir duomenų struktūras.
7. Nekeisti tiriamų funkcijų kodo.
8. Netaisyti galimų funkcijų klaidų, o testuoti faktinę jų elgseną.
9. Nenaudoti mock objektų, jeigu jie nereikalingi.
10. Testai turi veikti su pateiktomis funkcijomis.

Funkcija Nr. 1:
Failas: src/utils/dedupedPartCosts.ts

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

Funkcija Nr. 2:
Failas: src/utils/totalActualSpent.ts

import type { AnalysisSession } from '../types/analysis';

export function totalActualSpent(session: AnalysisSession): number | null {
  const repairs = session.repairs ?? [];
  let total = 0; let any = false;
  for (const r of repairs) if (typeof r.actualCost === 'number') { total += r.actualCost; any = true; }
  return any ? total : null;
}

Duomenų struktūra:
- AnalysisSession turi photos masyvą ir neprivalomą repairs masyvą.
- photos elementai turi result objektą.
- result.affected_parts gali turėti objektus su name (string) ir estimated_cost (number arba nenurodyta).
- repairs elementai turi neprivalomą actualCost (number).
- Testiniams objektams galima naudoti "as unknown as AnalysisSession", kad nereikėtų užpildyti kitų su šiomis funkcijomis nesusijusių laukų.

Importų keliai:
- '../src/utils/dedupedPartCosts'
- '../src/utils/totalActualSpent'

Išvesties formatas:
Pateik tik du pilnus TypeScript failus, kiekvieną atskirame kodo bloke:

1. tests/dedupedPartCosts.llm.test.ts
2. tests/totalActualSpent.llm.test.ts

Jokių paaiškinimų už kodo blokų ribų.
