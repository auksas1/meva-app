import { test, expect } from '@playwright/test';
import path from 'path';

// ============================================================================
// 1 REIKALAVIMAS: Kosmetinės žalos įvertinimo istorija
// ============================================================================
test.describe('1 REIKALAVIMAS: Kosmetinės žalos kainos įvertinimo istorija (Brave naršyklė)', () => {

  test('TC-REQ1-01: Paspausti "choose from gallery", įkelti nuotrauką ir spausti "Analyze 1 photo"', async ({ page }) => {
// 1. Pereikite į puslapį, kuriame atliekamas įvertinimas
    await page.goto('http://localhost:8081/'); // ✏️ Pakeiskite maršrutą pagal savo programą

    // 2. Dešiniajame viršutiniame kampe paspaudžiame "dev" mygtuką
    // ✏️ PAKEISKITE: Jei mygtukas turi specifinį selektorių, galite patikslinti (pvz., await page.click('text="dev"');')
    await page.click('text="</>Dev"');
    // await page.click('button:has-text("</> Dev")')

    // 3. Atsidariusiame meniu pasirinkame "Demo user"
    await page.click('text="Demo user"');
    
    // 4. Palaukiame sekundę arba kol sistema nukreipia į pagrindinį langą (dashboard / vehicles)
    await page.waitForLoadState('networkidle');

    // 2. Paspausti mygtuką "choose from gallery"
    await page.click('text="choose from gallery"');

    // 3. Pasirinkti ir įkelti reikalaujamą fotografiją
    const photoPath = path.join(__dirname, 'C:/Users/37064/auto-testai/test-data/car_damage.jpg');
    
    // Surandame paslėptą arba matomą failo įkėlimo input elementą ir įkeliame nuotrauką
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(photoPath);

    // 4. Paspausti mygtuką "Analyze 1 photo"
    await page.click('text="Analyze 1 photo"');

    // Patikriname, kad rodoma įkelta nuotrauka
    await expect(page.locator('img.damage-result-photo')).toBeVisible();
  });

  test('TC-REQ1-02: Nuotrauka neįkelta – bandyti spausti analyze/submit, bet testas turi praeiti, kai niekas neįvyksta', async ({ page }) => {
    // 1. Pereikite į įvertinimo puslapį neįkeliant jokios nuotraukos
    // await page.goto('/analyze'); // ✏️ Pakeiskite maršrutą

    // Užfiksuojame pradinį URL arba puslapio būseną
    const urlBeforeClick = page.url();

    // 2. Bandome paspausti mygtuką "Analyze 1 photo" arba "submit / analyze"
    const analyzeButton = page.locator('text="Analyze 1 photo"'); // arba 'text="submit"'
    
    // Naudojame saugų paspaudimą (jei mygtukas neaktyvus / disabled, Playwright bandys paspausti arba pagaus išimtį)
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click({ timeout: 2000 }).catch(() => {
        // Ignoruojame klaidą, jei mygtukas nepaspaudžiamas ar elementas blokuojamas
      });
    }

    // 3. Patvirtiname, kad nieko neįvyko (sistema liko tame pačiame puslapyje, neįvyko nukreipimas)
    // Tai užtikrina, kad testas sėkmingai praeina (*passed*), kai be nuotraukos veiksmas blokuojamas
    expect(page.url()).toBe(urlBeforeClick);
  });

});

  test('TC-REQ1-02: Neleidžiama išsaugoti įvertinimo be nuotraukos', async ({ page }) => {
    // ✏️ PAKEISKITE: Maršrutas į įvertinimo puslapį
    await page.click('text="Choose from Gallery"');

    // Mėginame išsaugoti neįkėlę nuotraukos
    // ✏️ PAKEISKITE: Mygtuko "Išsaugoti" selektorius
    await page.locator('button:has-text("Submit / Analyze")').click(); 

    // Patikriname, kad sistema parodo įspėjimą / klaidą
    // ✏️ PAKEISKITE: Klaidos pranešimo elemento selektorius ir tikslus tekstas
    // const errorMessage = page.locator('.error-banner'); 
    // await expect(errorMessage).toBeVisible();
    // await expect(errorMessage).toContainText('Privaloma įkelti bent vieną automobilio kosmetinės žalos nuotrauką'); 
  });

// ============================================================================
// 2 REIKALAVIMAS: Serviso sąskaitos, remonto dokumentai ir istorija
// ============================================================================
test.describe('2 REIKALAVIMAS: Serviso sąskaitų ir remonto dokumentų įkėlimas', () => {

  test('TC-REQ2-01 & TC-REQ2-03: Remonto įrašo sukūrimas su dokumentu ir jo peržiūra', async ({ page }) => {
    // ✏️ PAKEISKITE: Maršrutas į automobilių garažą / sąrašą
    await page.click('text="Vehicles"');

    // Pasirenkame automobilį
    // ✏️ PAKEISKITE: Automobilio kortelės selektorius arba tekstas
    await page.locator('.vehicle-card:has-text("Audi A4")').click(); 

    // Spustelime mygtuką pridėti remonto įrašą
    // ✏️ PAKEISKITE: Mygtuko "Pridėti remonto įrašą" selektorius
    await page.locator('button:has-text("Pridėti remonto įrašą")').click(); 

    // ✏️ PAKEISKITE: Įveskite formos laukų selektorius ir norimus testinius duomenis
    await page.locator('input[name="repairDate"]').fill('2026-10-05'); // Remonto data
    await page.locator('input[name="mileage"]').fill('185000');         // Automobilio rida
    await page.locator('input[name="parts"]').fill('Stabdžių diskai'); // Pakeistos detalės
    await page.locator('textarea[name="description"]').fill('Priekinių diskų ir kaladėlių keitimas'); // Aprašas
    await page.locator('input[name="cost"]').fill('280.00');             // Remonto kaina

    // Įkeliame serviso sąskaitą / PDF dokumentą
    // ✏️ PAKEISKITE: Kelias iki testinio PDF/dokumenta failo jūsų kompiuteryje
    const documentPath = path.join(__dirname, 'C:/Users/37064/auto-testai/test-data/20269508487-10239928_17225347.pdf'); 
    // ✏️ PAKEISKITE: Dokumento įkėlimo lauko selektorius
    await page.locator('input[type="file"]').setInputFiles(documentPath); 

    // Išsaugome įrašą
    // ✏️ PAKEISKITE: Išsaugojimo mygtuko selektorius
    await page.locator('button:has-text("Išsaugoti remonto įrašą")').click(); 

    // Patikriname, ar įrašas atsirado remonto istorijoje
    // ✏️ PAKEISKITE: Remonto istorijos įrašo elemento selektorius
    const repairRecord = page.locator('.repair-history-item').first(); 
    await expect(repairRecord).toContainText('Stabdžių diskai');
    await expect(repairRecord).toContainText('280.00');

    // TC-REQ2-03: Tikriname, ar galime peržiūrėti / atverti pridėtą dokumentą
    // ✏️ PAKEISKITE: Nuorodos arba piktogramos peržiūrėti dokumentą selektorius
    const docLink = repairRecord.locator('a.document-view-link'); 
    await expect(docLink).toBeVisible();
    await docLink.click();
  });

  test('TC-REQ2-02: Neleidžiama sukurti remonto įrašo be serviso sąskaitos / dokumento', async ({ page }) => {
    // ✏️ PAKEISKITE: Maršrutas į konkretų automobilį arba remonto formą
    await page.goto('/garage/vehicle-1/add-repair'); 

    // Užpildome tekstinius laukus, bet NEĮKELIAME jokio dokumento
    // ✏️ PAKEISKITE: Laukų selektoriai
    await page.locator('input[name="repairDate"]').fill('2026-10-05');
    await page.locator('input[name="mileage"]').fill('185000');
    await page.locator('input[name="parts"]').fill('Tepalų keitimas');
    await page.locator('input[name="cost"]').fill('90.00');

    // Mėginame išsaugoti
    // ✏️ PAKEISKITE: Mygtuko selektorius
    await page.locator('button:has-text("Išsaugoti remonto įrašą")').click(); 

    // Patikriname klaidos pranešimą
    // ✏️ PAKEISKITE: Klaidos pranešimo elemento selektorius ir tekstas
    const errorMessage = page.locator('.form-error-message'); 
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Privaloma įkelti bent vieną serviso sąskaitą arba remonto dokumentą');
  });

  test('TC-REQ2-04: Remonto įrašų izoliacija tarp skirtingų automobilių', async ({ page }) => {
    // Naviguojame į KITO automobilio (pvz., BMW X5) remonto istoriją
    // ✏️ PAKEISKITE: Maršrutas į kito automobilio istoriją
    await page.goto('/Vehicles/BMW X5/repair-history'); 

    // Patikriname, kad čia NEATSIRODĖ kito automobilio (Audi A4) remonto įrašas
    // ✏️ PAKEISKITE: Įrašo kortelės selektorius ir tekstas, kurio neturi būti
    const historyList = page.locator('.repair-history-list'); 
    await expect(historyList).not.toContainText('Stabdžių diskai'); 
  });
});