# MEVA KAN-15 / KAN-20 – duomenų rinkiniai

## TC-KAN-15-01 – EP · Nuotraukų pridėjimas ir pateikimas analizei

| Rinkinys | Nuotraukos šaltinis | Formatas | Laukiamas rezultatas | Būsena |
|---|---|---|---|---|
| D1 | Įrenginys | JPEG | Nuotrauka pridėta, išsiųsta ir išanalizuota; rezultatas susietas su testiniu žalos atveju; rodomas patvirtinimas | FAIL (DEF-08, DEF-09) |
| D2 | Kamera | PNG | Nuotrauka pridėta, išsiųsta ir išanalizuota; rezultatas susietas su testiniu žalos atveju; rodomas patvirtinimas | FAIL (DEF-08, DEF-09) |

## TC-KAN-15-02 – EP, BVA · Nuotraukos formato ir dydžio tikrinimas

| Rinkinys | Formatas | Dydis | Laukiamas rezultatas | Būsena |
|---|---|---|---|---|
| D1 | JPEG | 10 485 759 B (riba − 1) | Priimama | PASS |
| D2 | JPEG | 10 485 760 B (riba) | Priimama | PASS |
| D3 | JPEG | 10 485 761 B (riba + 1) | Atmetama dėl dydžio | FAIL (DEF-01) |
| D4 | PNG | 1 MB | Priimama | PASS |
| D5 | GIF | 1 MB | Atmetama dėl formato | FAIL (DEF-01) |

## TC-KAN-15-03 – BVA · Nuotraukų kiekio riba

| Rinkinys | Pradinis kiekis | Galutinis kiekis | Laukiamas rezultatas | Būsena |
|---|---|---|---|---|
| D1 | 8 | 9 | Nuotrauka pridėta | PASS |
| D2 | 9 | 10 | Nuotrauka pridėta | PASS |
| D3 | 10 | 10 | Nuotrauka nepridėta; rodoma kiekio ribos priežastis | FAIL (DEF-02) |

## TC-KAN-15-04 – DT · Peržiūra, pašalinimas ir siuntimo mygtuko būsena

| Rinkinys | Pradinis kiekis | Kiekis pašalinus | Veiksmas | Laukiamas rezultatas | Būsena |
|---|---|---|---|---|---|
| D1 | 1 | 0 | Bandyti siųsti | Mygtukas neaktyvus; niekas nesiunčiama | FAIL (DEF-03) |
| D2 | 2 | 1 | Siųsti likusią nuotrauką | Mygtukas aktyvus; perduodama tik likusi nuotrauka | FAIL (DEF-03) |

## TC-KAN-15-05 – EP · Siuntimo atšaukimas, klaidos ir pakartojimas

| Rinkinys | Įvykis | Laukiamas rezultatas | Būsena |
|---|---|---|---|
| D1 | Naudotojas atšaukia siuntimą | Siuntimas atšauktas | FAIL (DEF-04, DEF-05) |
| D2 | Nutrūksta interneto ryšys | Ryšio klaida | FAIL (DEF-05) |
| D3 | Serveris grąžina klaidą | Serverio klaida | FAIL (DEF-05) |

## TC-KAN-20-01 – EP · Kameros leidimai ir klaidų apdorojimas

| Rinkinys | Aplinkos būsena | Naudotojo atsakymas | Laukiamas rezultatas | Būsena |
|---|---|---|---|---|
| D1 | Leidimas suteiktas; kamera veikia | Nereikia | Atidaromas kameros vaizdas | PASS |
| D2 | Leidimo nėra; galima prašyti | Suteikti | Rodomas prašymas; suteikus atidaroma kamera | PASS |
| D3 | Leidimo nėra; galima prašyti | Atmesti | Rodomas prašymas; kamera neatidaroma | PASS |
| D4 | Leidimas atmestas visam laikui | Nereikia | Konkreti leidimo klaida ir tinkamas atkūrimo veiksmas | BLOCKED |
| D5 | Leidimas suteiktas; kamera nepasiekiama | Nereikia | Konkreti kameros klaida ir tinkamas atkūrimo veiksmas | FAIL (DEF-07) |
| D6 | Kamera veikia; nuotraukos išsaugoti nepavyksta | Nereikia | Konkreti išsaugojimo klaida ir tinkamas atkūrimo veiksmas | BLOCKED |

## TC-KAN-20-02 – DT · Peržiūros pasirinkimai ir formato tinkamumas

| Rinkinys | Formatas | Veiksmas | Laukiamas rezultatas | Būsena |
|---|---|---|---|---|
| D1 | JPEG | Naudoti | Nuotrauka pridėta prie testinio žalos atvejo | FAIL (DEF-06) |
| D2 | PNG | Naudoti | Nuotrauka pridėta prie testinio žalos atvejo | FAIL (DEF-06) |
| D3 | GIF | Naudoti | Nuotrauka nepridėta; rodoma formato priežastis | FAIL (DEF-06, DEF-01) |
| D4 | JPEG | Perfotografuoti | Nuotrauka nepridėta; galima fotografuoti iš naujo | FAIL (DEF-06) |
| D5 | GIF | Perfotografuoti | Nuotrauka nepridėta; galima fotografuoti iš naujo | FAIL (DEF-06) |
| D6 | JPEG | Atšaukti | Nuotrauka nepridėta | FAIL (DEF-06) |
| D7 | GIF | Atšaukti | Nuotrauka nepridėta | FAIL (DEF-06) |

## TC-KAN-20-03 – BVA · Fotografuotos nuotraukos dydis ir raiška

| Rinkinys | Dydis | Plotis, px | Aukštis, px | Laukiamas rezultatas | Būsena |
|---|---|---|---|---|---|
| D1 | 10 485 759 B (riba − 1) | 1920 | 1080 | Priimama | PASS |
| D2 | 10 485 760 B (riba) | 1920 | 1080 | Priimama | PASS |
| D3 | 10 485 761 B (riba + 1) | 1920 | 1080 | Atmetama dėl dydžio | FAIL (DEF-01) |
| D4 | 1 MB | 1279 | 1080 | Atmetama dėl raiškos | FAIL (DEF-01) |
| D5 | 1 MB | 1280 | 1080 | Priimama | PASS |
| D6 | 1 MB | 1281 | 1080 | Priimama | PASS |
| D7 | 1 MB | 1920 | 719 | Atmetama dėl raiškos | FAIL (DEF-01) |
| D8 | 1 MB | 1920 | 720 | Priimama | PASS |
| D9 | 1 MB | 1920 | 721 | Priimama | PASS |

## TC-KAN-20-04 – BVA · Fotografavimas ties nuotraukų kiekio riba

| Rinkinys | Pradinis kiekis | Galutinis kiekis | Laukiamas rezultatas | Būsena |
|---|---|---|---|---|
| D1 | 8 | 9 | Nuotrauka pridėta | PASS |
| D2 | 9 | 10 | Nuotrauka pridėta | PASS |
| D3 | 10 | 10 | Nuotrauka nepridėta; rodoma kiekio ribos priežastis | FAIL (DEF-02) |

## TC-KAN-20-05 – EP · Fotografuotos nuotraukos pašalinimas ir analizė

| Rinkinys | Veiksmas | Laukiamas rezultatas | Būsena |
|---|---|---|---|
| D1 | Pašalinti naują fotografuotą nuotrauką prieš siuntimą | Perduodama tik anksčiau iš įrenginio įkelta nuotrauka | FAIL (DEF-08, DEF-09) |
| D2 | Palikti naują fotografuotą nuotrauką sąraše | Perduodamos abi: nauja fotografuota ir anksčiau iš įrenginio įkelta | FAIL (DEF-08, DEF-09) |