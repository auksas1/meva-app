# Lab 2 – testai ir kokybės matavimai (mobile)

## Įrankių diegimas

Iš `mobile/` aplanko, **viena komanda**. `--no-save` neįrašo įrankių į `package.json`. Po kiekvieno įprasto `npm install` komandą reikia paleisti iš naujo.

```
npm install --no-save jest@29.7.0 jest-expo@54.0.18 @types/jest@29.5.14 eslint@9.39.5 typescript-eslint@8.71.2 eslint-plugin-sonarjs@4.2.2 @stryker-mutator/core@8.7.1 @stryker-mutator/jest-runner@8.7.1 typhonjs-escomplex@0.1.0 cloc@2.6.0-cloc
```

| Įrankis | Užduotis |
|---|---|
| eslint, typescript-eslint, eslint-plugin-sonarjs | 5a, 5b – ciklomatinis ir kognityvinis sudėtingumas |
| jest, jest-expo, @types/jest | 5c, 8.1b, 8.2a – testai ir padengiamumas |
| @stryker-mutator/core, @stryker-mutator/jest-runner | 5c, 8.2b – mutacijos |
| typhonjs-escomplex | 6a – prižiūrimumo indeksas (TypeScript) |
| cloc | 3 – eilučių skaičiavimas |

Python įrankiai (radon, lizard) – `backend/requirements-dev.txt`.

## Failai

| Failas | Užduotis |
|---|---|
| `analysisNotice.test.ts`, `sessionPrimaryDamage.test.ts` | 5c – mano testai |
| `analysisNotice_llm.test.ts`, `sessionPrimaryDamage_llm.test.ts` | 8 – DKM sugeneruoti testai |
| `llm_prompt.md` | 8 – DKM informacija ir užklausos |
| `llm_response_*.md` | 8 – neredaguoti DKM atsakymai |

## Paleidimas (PowerShell, iš `mobile/`)

`TEST_SET`: `human` (5c) arba `llm` (8). Jei nenurodytas, paleidžiami visi testai.

| Ką | Komanda |
|---|---|
| 5a sudėtingumas | `npx eslint -c eslint.metrics.config.mjs src/components/detections.ts src/components/SessionDetailView.tsx` |
| Testai | `$env:TEST_SET="human"; npx jest --verbose` |
| Padengiamumas metodui | `npx jest --coverage`, po to `node scripts/quality/method-coverage.js human` |
| Mutacijos | `npx stryker run stryker.config.mjs --concurrency 1`, po to `node scripts/quality/mutation-matrix.js human` |
| 8.1a kompiliavimas | `npx tsc --noEmit` |
| 8.1b kiekvieno testo rezultatas | `$env:TEST_SET="llm"; npx jest --json --outputFile=reports/jest/llm.json`, po to `node scripts/quality/test-results.js llm` |
| 8.2b DKM testams | `$env:TEST_SKIP_NAME="returns null when status is undefined"` (Stryker reikalauja, kad visi testai praeitų), tada mutacijų komanda su `llm` |
| 6a MI | `node scripts/quality/maintainability.js` |
| 3 eilutės | `& "C:\Program Files\Git\usr\bin\perl.exe" node_modules\cloc\lib\cloc ../backend/app src` |
