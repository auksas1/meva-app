# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-requirements.spec.ts >> 1 REIKALAVIMAS: Kosmetinės žalos kainos įvertinimo istorija (Brave naršyklė) >> TC-REQ1-01: Paspausti "choose from gallery", įkelti nuotrauką ir spausti "Analyze 1 photo"
- Location: tests\app-requirements.spec.ts:9:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text="</>Dev"')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e10]:
    - heading "Analyze" [level=1] [ref=e12]
    - generic [ref=e17]:
      - generic [ref=e18]: AI vehicle inspection
      - generic [ref=e19]: Analyze
      - generic [ref=e21] [cursor=pointer]:
        - generic [ref=e22]: 
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]: 
            - generic [ref=e27]: AI Damage Scan
          - generic [ref=e28]: Take a photo
          - generic [ref=e29]: Capture the damaged area — we'll detect zones, parts and an estimated repair cost.
      - generic [ref=e31] [cursor=pointer]:
        - generic [ref=e32]: 
        - generic [ref=e33]: Choose from Gallery
      - generic [ref=e34]: Selected photos
      - generic [ref=e36]:
        - generic [ref=e37]: 
        - generic [ref=e39]: No photos yet
        - generic [ref=e40]: Add at least one photo of the damaged vehicle to start an analysis.
      - generic [ref=e41]:
        - generic: Submit / Analyze
        - generic [ref=e43]:
          - generic [ref=e44]: 
          - generic [ref=e45]: Photos are sent to the MEVA AI service for analysis.
  - tablist [ref=e47]:
    - tab "  Analyze" [selected] [ref=e49] [cursor=pointer]:
      - generic [ref=e50]:
        - generic [ref=e51]: 
        - generic [ref=e53]: 
      - generic [ref=e55]: Analyze
    - tab "  History" [ref=e57] [cursor=pointer]:
      - generic [ref=e58]:
        - generic [ref=e59]: 
        - generic [ref=e61]: 
      - generic [ref=e63]: History
    - tab "  Settings" [ref=e65] [cursor=pointer]:
      - generic [ref=e66]:
        - generic [ref=e67]: 
        - generic [ref=e69]: 
      - generic [ref=e71]: Settings
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
> 15  |     await page.click('text="</>Dev"');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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
```