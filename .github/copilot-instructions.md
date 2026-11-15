# GitHub Copilot instructions – DreamSnaps

Disse instruktioner gælder for hele DreamSnaps-projektet.

## Projektets arkitektur

- Projektet er en statisk hjemmeside, der deployes til GitHub Pages.
- Repository'et er public.
- Der findes ingen backend, database, login eller browserbaseret uploadfunktion.
- Alt DreamSnap-indhold vedligeholdes gennem Git.
- DreamSnap-metadata ligger i `public/data/dreamsnaps.json`.
- DreamSnap-billeder ligger i `public/images/dreamsnaps/`.
- Hjemmesiden læser JSON-dataene og viser dem i brugergrænsefladen.
- Bevar den eksisterende teknologistak og projektstruktur. Hvis projektet endnu ikke er oprettet, så brug React, TypeScript og Vite.

## Sådan tilføjes et nyt DreamSnap

Når brugeren beder om at tilføje et DreamSnap, skal du følge denne procedure:

1. Find det næste ledige numeriske ID i `public/data/dreamsnaps.json`.
2. Find det næste ledige billednummer i `public/images/dreamsnaps/`.
   - Brug tre cifre med foranstillede nuller: `001.jpg`, `002.jpg`, `003.jpg` osv.
   - Hvis billederne bruger et andet format, så fortsæt med det eksisterende format.
3. Kopiér eller flyt ikke automatisk et billede, medmindre brugeren har leveret billedet eller angivet dets placering.
4. Hvis brugeren har leveret et billede, så placér det i `public/images/dreamsnaps/` med det næste ledige nummer.
5. Tilføj et nyt objekt i `dreamsnaps`-arrayet med følgende struktur:

```json
{
  "id": 6,
  "title": "DreamSnap title",
  "theme": "Challenge theme",
  "date": "2026-11-15",
  "image": "/images/dreamsnaps/006.jpg",
  "score": 0,
  "ranking": 0,
  "rewards": {
    "moonstones": 0
  },
  "tags": []
}
```

6. Udfyld kun værdier, som brugeren har oplyst.
   - Spørg efter manglende nødvendige oplysninger i stedet for at opfinde score, ranking, dato eller rewards.
   - Hvis brugeren ikke har valgt en titel, må du gerne foreslå en titel, men gør det tydeligt, at den er et forslag.
   - Brug datoformatet `YYYY-MM-DD`.
   - `score`, `ranking`, `id` og `moonstones` skal være numeriske værdier.
   - `tags` skal være et array af strings.
7. Indsæt objektet i arrayet uden at overskrive eksisterende DreamSnaps.
8. Kontrollér, at ID'et er unikt, at JSON-filen er gyldig, og at billedstien matcher filnavnet.
9. Kontrollér, at billedet ligger i den publicerede `public/`-mappe, så det bliver inkluderet i GitHub Pages-buildet.
10. Opsummér hvilke filer der er tilføjet eller ændret.

## Datakonventioner

- `id`: Unikt, stigende heltal. Genbrug aldrig et eksisterende ID.
- `title`: Eget navn på billedet.
- `theme`: Challenge-temaets navn.
- `date`: Datoen for resultatet i `YYYY-MM-DD`.
- `image`: Sti relativt til websitets public root, eksempelvis `/images/dreamsnaps/006.jpg`. Tag højde for Vite `base`-konfigurationen i frontend-koden.
- `score`: DreamSnap-score som tal.
- `ranking`: Placering som tal. Lavere tal betyder bedre placering.
- `rewards.moonstones`: Antal modtagne Moonstones som tal.
- `tags`: Array med nul eller flere tags.

## Sikkerhed og publicering

- Læg aldrig adgangskoder, tokens, API-nøgler eller andre hemmeligheder i projektet.
- Antag, at alt i `public/` bliver offentligt tilgængeligt.
- Forsøg ikke at implementere upload, login eller database, medmindre brugeren udtrykkeligt ændrer projektets arkitektur.
- Tilføj ikke serverafhængigheder. GitHub Pages kan kun hoste statiske filer.
- Bevar alle eksisterende data, medmindre brugeren udtrykkeligt beder om at rette eller slette dem.

## Før du afslutter

- Validér JSON.
- Kontrollér unikke ID'er.
- Kontrollér at billedfilen findes.
- Kontrollér at billedstien i JSON stemmer med filens placering.
- Fortæl brugeren, hvis noget mangler, eller hvis en kontrol ikke kunne udføres.
