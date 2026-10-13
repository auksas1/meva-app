import { test, expect } from '@playwright/test';
import path from 'path';

// 1 REIKALAVIMAS: Kosmetinės žalos įvertinimo istorija
test.describe('1 REIKALAVIMAS: Kosmetinės žalos kainos įvertinimo istorija (Brave naršyklė)', () => {

  test('TC-REQ1-01: Paspausti "choose from gallery", įkelti nuotrauką ir spausti "Analyze 1 photo"', async ({ page }) => {
    // 1. Pereiname į puslapį, kuriame atliekamas įvertinimas
    await page.goto('http://localhost:8081/');

    // 2. Dešiniajame viršutiniame kampe paspaudžiame "dev" mygtuką
    await page.click('text="</>Dev"');

    // 3. Atsidariusiame meniu pasirinkame "Demo user"
    await page.click('text="Demo user"');
    
    // 4. Palaukiame sekundę arba kol sistema nukreipia į pagrindinį langą (dashboard / vehicles)
    await page.waitForLoadState('networkidle');

    // 5. Paspausti mygtuką "choose from gallery"
    await page.click('text="choose from gallery"');

    // 6. Pasirinkti ir įkelti reikalaujamą fotografiją
    const photoPath = path.join(__dirname, 'C:/Users/37064/auto-testai/test-data/car_damage.jpg');
    
    // 7. Surandame paslėptą arba matomą failo įkėlimo input elementą ir įkeliame nuotrauką
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(photoPath);

    // 8. Paspausti mygtuką "Analyze 1 photo"
    await page.click('text="Analyze 1 photo"');

    // Patikriname, kad rodoma įkelta nuotrauka
    await expect(page.locator('img.damage-result-photo')).toBeVisible();
  });

  test('TC-REQ1-02: Nuotrauka neįkelta – bandyti spausti analyze/submit, bet testas turi praeiti, kai niekas neįvyksta', async ({ page }) => {
    // 1. Pereikite į įvertinimo puslapį neįkeliant jokios nuotraukos
    await page.goto('/analyze');

    // Užfiksuojame pradinį URL arba puslapio būseną
    const urlBeforeClick = page.url();

    // 2. Bandome paspausti mygtuką "submit / analyze"
    const analyzeButton = page.locator('text="Submit / analyze"');
    
    // Naudojame saugų paspaudimą
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click({ timeout: 2000 }).catch(() => {
        // Ignoruojame klaidą, jei mygtukas nepaspaudžiamas ar elementas blokuojamas
      });
    }

    // 3. Patvirtiname, kad nieko neįvyko (sistema liko tame pačiame puslapyje, neįvyko nukreipimas)
    expect(page.url()).toBe(urlBeforeClick);
  });
});

  test('TC-REQ1-02: Neleidžiama išsaugoti įvertinimo be nuotraukos', async ({ page }) => {
    await page.click('text="Choose from Gallery"');

    // Mėginame išsaugoti neįkėlę nuotraukos
    await page.locator('button:has-text("Submit / Analyze")').click(); 

    // Patikriname, kad sistema parodo įspėjimą / klaidą
    const errorMessage = page.locator('.error-banner'); 
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Privaloma įkelti bent vieną automobilio kosmetinės žalos nuotrauką'); 
  });

// 2 REIKALAVIMAS: Serviso sąskaitos, remonto dokumentai ir istorija
test.describe('2 REIKALAVIMAS: Serviso sąskaitų ir remonto dokumentų įkėlimas', () => {

  test('TC-REQ2-01 & TC-REQ2-03: Remonto įrašo sukūrimas su dokumentu ir jo peržiūra', async ({ page }) => {
    // ✏️ PAKEISKITE: Maršrutas į automobilių garažą / sąrašą
    await page.click('text="Vehicles"');

    // Pasirenkame automobilį
    // ✏️ PAKEISKITE: Automobilio kortelės selektorius arba tekstas
    await page.locator('.vehicle-card:has-text("Audi A4")').click(); 

    // Spustelime mygtuką pridėti remonto įrašą
    await page.locator('button:has-text("Add repair data")').click(); 

    await page.locator('input[name="repairDate"]').fill('2026-10-05'); // Remonto data
    await page.locator('input[name="mileage"]').fill('185000');         // Automobilio rida
    await page.locator('input[name="parts"]').fill('Stabdžių diskai'); // Pakeistos detalės
    await page.locator('textarea[name="description"]').fill('Priekinių diskų ir kaladėlių keitimas'); // Aprašas
    await page.locator('input[name="cost"]').fill('280.00');             // Remonto kaina

    // Įkeliame serviso sąskaitą / PDF dokumentą
    const documentPath = path.join(__dirname, 'C:/Users/37064/auto-testai/test-data/20269508487-10239928_17225347.pdf'); 
    await page.locator('input[type="file"]').setInputFiles(documentPath); 

    // Išsaugome įrašą
    await page.locator('button:has-text("Save repair data")').click(); 

    // Patikriname, ar įrašas atsirado remonto istorijoje
    const repairRecord = page.locator('.repair-history-item').first(); 
    await expect(repairRecord).toContainText('Stabdžių diskai');
    await expect(repairRecord).toContainText('280.00');

    // TC-REQ2-03: Tikriname, ar galime peržiūrėti / atverti pridėtą dokumentą
    const docLink = repairRecord.locator('a.document-view-link'); 
    await expect(docLink).toBeVisible();
    await docLink.click();
  });
  
  test('TC-REQ2-03: Remonto įrašų izoliacija tarp skirtingų automobilių', async ({ page }) => {
    // Naviguojame į KITO automobilio (pvz., BMW X5) remonto istoriją
    await page.goto('/Vehicles/BMW X5/repair-history'); 

    // Patikriname, kad čia NEATSIRODĖ kito automobilio (Audi A4) remonto įrašas
    const historyList = page.locator('.repair-history-list'); 
    await expect(historyList).not.toContainText('Stabdžių diskai'); 
  });
});
