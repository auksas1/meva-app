# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-requirements.spec.ts >> TC-REQ1-02: Neleidžiama išsaugoti įvertinimo be nuotraukos
- Location: tests\app-requirements.spec.ts:65:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text="Choose from Gallery"')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import path from 'path';
  3   | 
  4   | // ============================================================================
  5   | // 1 REIKALAVIMAS: Kosmetinės žalos įvertinimo istorija
  6   | // ============================================================================
  7   | test.describe('1 REIKALAVIMAS: Kosmetinės žalos kainos įvertinimo istorija (Brave naršyklė)', () => {
  8   | 
  9   |   test('TC-REQ1-01: Paspausti "choose from gallery", įkelti nuotrauką ir spausti "Analyze 1 photo"', async ({ page }) => {
  10  | // 1. Pereikite į puslapį, kuriame atliekamas įvertinimas
  11  |     await page.goto('http://localhost:8081/'); // ✏️ Pakeiskite maršrutą pagal savo programą
  12  | 
  13  |     // 2. Dešiniajame viršutiniame kampe paspaudžiame "dev" mygtuką
  14  |     // ✏️ PAKEISKITE: Jei mygtukas turi specifinį selektorių, galite patikslinti (pvz., await page.click('text="dev"');')
  15  |     await page.click('text="</>Dev"');
  16  |     // await page.click('button:has-text("</> Dev")')
  17  | 
  18  |     // 3. Atsidariusiame meniu pasirinkame "Demo user"
  19  |     await page.click('text="Demo user"');
  20  |     
  21  |     // 4. Palaukiame sekundę arba kol sistema nukreipia į pagrindinį langą (dashboard / vehicles)
  22  |     await page.waitForLoadState('networkidle');
  23  | 
  24  |     // 2. Paspausti mygtuką "choose from gallery"
  25  |     await page.click('text="choose from gallery"');
  26  | 
  27  |     // 3. Pasirinkti ir įkelti reikalaujamą fotografiją
  28  |     const photoPath = path.join(__dirname, 'C:/Users/37064/auto-testai/test-data/car_damage.jpg');
  29  |     
  30  |     // Surandame paslėptą arba matomą failo įkėlimo input elementą ir įkeliame nuotrauką
  31  |     const fileInput = page.locator('input[type="file"]');
  32  |     await fileInput.setInputFiles(photoPath);
  33  | 
  34  |     // 4. Paspausti mygtuką "Analyze 1 photo"
  35  |     await page.click('text="Analyze 1 photo"');
  36  | 
  37  |     // Patikriname, kad rodoma įkelta nuotrauka
  38  |     await expect(page.locator('img.damage-result-photo')).toBeVisible();
  39  |   });
  40  | 
  41  |   test('TC-REQ1-02: Nuotrauka neįkelta – bandyti spausti analyze/submit, bet testas turi praeiti, kai niekas neįvyksta', async ({ page }) => {
  42  |     // 1. Pereikite į įvertinimo puslapį neįkeliant jokios nuotraukos
  43  |     // await page.goto('/analyze'); // ✏️ Pakeiskite maršrutą
  44  | 
  45  |     // Užfiksuojame pradinį URL arba puslapio būseną
  46  |     const urlBeforeClick = page.url();
  47  | 
  48  |     // 2. Bandome paspausti mygtuką "Analyze 1 photo" arba "submit / analyze"
  49  |     const analyzeButton = page.locator('text="Analyze 1 photo"'); // arba 'text="submit"'
  50  |     
  51  |     // Naudojame saugų paspaudimą (jei mygtukas neaktyvus / disabled, Playwright bandys paspausti arba pagaus išimtį)
  52  |     if (await analyzeButton.isVisible()) {
  53  |       await analyzeButton.click({ timeout: 2000 }).catch(() => {
  54  |         // Ignoruojame klaidą, jei mygtukas nepaspaudžiamas ar elementas blokuojamas
  55  |       });
  56  |     }
  57  | 
  58  |     // 3. Patvirtiname, kad nieko neįvyko (sistema liko tame pačiame puslapyje, neįvyko nukreipimas)
  59  |     // Tai užtikrina, kad testas sėkmingai praeina (*passed*), kai be nuotraukos veiksmas blokuojamas
  60  |     expect(page.url()).toBe(urlBeforeClick);
  61  |   });
  62  | 
  63  | });
  64  | 
  65  |   test('TC-REQ1-02: Neleidžiama išsaugoti įvertinimo be nuotraukos', async ({ page }) => {
  66  |     // ✏️ PAKEISKITE: Maršrutas į įvertinimo puslapį
> 67  |     await page.click('text="Choose from Gallery"');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  68  | 
  69  |     // Mėginame išsaugoti neįkėlę nuotraukos
  70  |     // ✏️ PAKEISKITE: Mygtuko "Išsaugoti" selektorius
  71  |     await page.locator('button:has-text("Submit / Analyze")').click(); 
  72  | 
  73  |     // Patikriname, kad sistema parodo įspėjimą / klaidą
  74  |     // ✏️ PAKEISKITE: Klaidos pranešimo elemento selektorius ir tikslus tekstas
  75  |     // const errorMessage = page.locator('.error-banner'); 
  76  |     // await expect(errorMessage).toBeVisible();
  77  |     // await expect(errorMessage).toContainText('Privaloma įkelti bent vieną automobilio kosmetinės žalos nuotrauką'); 
  78  |   });
  79  | 
  80  | // ============================================================================
  81  | // 2 REIKALAVIMAS: Serviso sąskaitos, remonto dokumentai ir istorija
  82  | // ============================================================================
  83  | test.describe('2 REIKALAVIMAS: Serviso sąskaitų ir remonto dokumentų įkėlimas', () => {
  84  | 
  85  |   test('TC-REQ2-01 & TC-REQ2-03: Remonto įrašo sukūrimas su dokumentu ir jo peržiūra', async ({ page }) => {
  86  |     // ✏️ PAKEISKITE: Maršrutas į automobilių garažą / sąrašą
  87  |     await page.click('text="Vehicles"');
  88  | 
  89  |     // Pasirenkame automobilį
  90  |     // ✏️ PAKEISKITE: Automobilio kortelės selektorius arba tekstas
  91  |     await page.locator('.vehicle-card:has-text("Audi A4")').click(); 
  92  | 
  93  |     // Spustelime mygtuką pridėti remonto įrašą
  94  |     // ✏️ PAKEISKITE: Mygtuko "Pridėti remonto įrašą" selektorius
  95  |     await page.locator('button:has-text("Pridėti remonto įrašą")').click(); 
  96  | 
  97  |     // ✏️ PAKEISKITE: Įveskite formos laukų selektorius ir norimus testinius duomenis
  98  |     await page.locator('input[name="repairDate"]').fill('2026-10-05'); // Remonto data
  99  |     await page.locator('input[name="mileage"]').fill('185000');         // Automobilio rida
  100 |     await page.locator('input[name="parts"]').fill('Stabdžių diskai'); // Pakeistos detalės
  101 |     await page.locator('textarea[name="description"]').fill('Priekinių diskų ir kaladėlių keitimas'); // Aprašas
  102 |     await page.locator('input[name="cost"]').fill('280.00');             // Remonto kaina
  103 | 
  104 |     // Įkeliame serviso sąskaitą / PDF dokumentą
  105 |     // ✏️ PAKEISKITE: Kelias iki testinio PDF/dokumenta failo jūsų kompiuteryje
  106 |     const documentPath = path.join(__dirname, 'C:/Users/37064/auto-testai/test-data/20269508487-10239928_17225347.pdf'); 
  107 |     // ✏️ PAKEISKITE: Dokumento įkėlimo lauko selektorius
  108 |     await page.locator('input[type="file"]').setInputFiles(documentPath); 
  109 | 
  110 |     // Išsaugome įrašą
  111 |     // ✏️ PAKEISKITE: Išsaugojimo mygtuko selektorius
  112 |     await page.locator('button:has-text("Išsaugoti remonto įrašą")').click(); 
  113 | 
  114 |     // Patikriname, ar įrašas atsirado remonto istorijoje
  115 |     // ✏️ PAKEISKITE: Remonto istorijos įrašo elemento selektorius
  116 |     const repairRecord = page.locator('.repair-history-item').first(); 
  117 |     await expect(repairRecord).toContainText('Stabdžių diskai');
  118 |     await expect(repairRecord).toContainText('280.00');
  119 | 
  120 |     // TC-REQ2-03: Tikriname, ar galime peržiūrėti / atverti pridėtą dokumentą
  121 |     // ✏️ PAKEISKITE: Nuorodos arba piktogramos peržiūrėti dokumentą selektorius
  122 |     const docLink = repairRecord.locator('a.document-view-link'); 
  123 |     await expect(docLink).toBeVisible();
  124 |     await docLink.click();
  125 |   });
  126 | 
  127 |   test('TC-REQ2-02: Neleidžiama sukurti remonto įrašo be serviso sąskaitos / dokumento', async ({ page }) => {
  128 |     // ✏️ PAKEISKITE: Maršrutas į konkretų automobilį arba remonto formą
  129 |     await page.goto('/garage/vehicle-1/add-repair'); 
  130 | 
  131 |     // Užpildome tekstinius laukus, bet NEĮKELIAME jokio dokumento
  132 |     // ✏️ PAKEISKITE: Laukų selektoriai
  133 |     await page.locator('input[name="repairDate"]').fill('2026-10-05');
  134 |     await page.locator('input[name="mileage"]').fill('185000');
  135 |     await page.locator('input[name="parts"]').fill('Tepalų keitimas');
  136 |     await page.locator('input[name="cost"]').fill('90.00');
  137 | 
  138 |     // Mėginame išsaugoti
  139 |     // ✏️ PAKEISKITE: Mygtuko selektorius
  140 |     await page.locator('button:has-text("Išsaugoti remonto įrašą")').click(); 
  141 | 
  142 |     // Patikriname klaidos pranešimą
  143 |     // ✏️ PAKEISKITE: Klaidos pranešimo elemento selektorius ir tekstas
  144 |     const errorMessage = page.locator('.form-error-message'); 
  145 |     await expect(errorMessage).toBeVisible();
  146 |     await expect(errorMessage).toContainText('Privaloma įkelti bent vieną serviso sąskaitą arba remonto dokumentą');
  147 |   });
  148 | 
  149 |   test('TC-REQ2-04: Remonto įrašų izoliacija tarp skirtingų automobilių', async ({ page }) => {
  150 |     // Naviguojame į KITO automobilio (pvz., BMW X5) remonto istoriją
  151 |     // ✏️ PAKEISKITE: Maršrutas į kito automobilio istoriją
  152 |     await page.goto('/Vehicles/BMW X5/repair-history'); 
  153 | 
  154 |     // Patikriname, kad čia NEATSIRODĖ kito automobilio (Audi A4) remonto įrašas
  155 |     // ✏️ PAKEISKITE: Įrašo kortelės selektorius ir tekstas, kurio neturi būti
  156 |     const historyList = page.locator('.repair-history-list'); 
  157 |     await expect(historyList).not.toContainText('Stabdžių diskai'); 
  158 |   });
  159 | });
```