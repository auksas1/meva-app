# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-requirements.spec.ts >> 2 REIKALAVIMAS: Serviso sąskaitų ir remonto dokumentų įkėlimas >> TC-REQ2-04: Remonto įrašų izoliacija tarp skirtingų automobilių
- Location: tests\app-requirements.spec.ts:149:7

# Error details

```
Error: expect(locator).not.toContainText(expected) failed

Locator: locator('.repair-history-list')
Expected substring: not "Stabdžių diskai"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "not toContainText" locator('.repair-history-list') with timeout 5000ms
  - waiting for locator('.repair-history-list')

```

```yaml
- heading "Analyze" [level=1]
- text: AI vehicle inspection Analyze   AI Damage Scan Take a photo Capture the damaged area — we'll detect zones, parts and an estimated repair cost.  Choose from Gallery Selected photos  No photos yet Add at least one photo of the damaged vehicle to start an analysis. Submit / Analyze  Photos are sent to the MEVA AI service for analysis.
- tablist:
  - tab "  Analyze" [selected]
  - tab "  History"
  - tab "  Settings"
```

# Test source

```ts
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
  67  |     await page.click('text="Choose from Gallery"');
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
> 157 |     await expect(historyList).not.toContainText('Stabdžių diskai'); 
      |                                   ^ Error: expect(locator).not.toContainText(expected) failed
  158 |   });
  159 | });
```