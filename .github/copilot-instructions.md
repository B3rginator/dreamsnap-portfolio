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
2. Find billedet med et filnavn, der matcher DreamSnap-titlen, i `public/images/dreamsnaps/`.
   - Filnavne kan bruge bindestreger eller underscore i stedet for mellemrum; bevar det faktiske filnavn og filformat.
   - Hvis der ikke findes et match, så brug den fælles placeholder `/images/dreamsnaps/placeholder.svg`. Opret ikke en separat placeholder til hver challenge.
3. Kopiér eller flyt ikke automatisk et billede, medmindre brugeren har leveret billedet eller angivet dets placering.
4. Hvis brugeren har leveret et billede, så placér det i `public/images/dreamsnaps/` med et filnavn baseret på titlen.
5. Tilføj et nyt objekt i `dreamsnaps`-arrayet med følgende struktur:

```json
{
  "id": 6,
  "title": "DreamSnap title",
  "theme": "Challenge theme",
  "date": "2026-11-15",
  "endDate": "2026-11-22",
  "description": "Challenge description",
  "image": "/images/dreamsnaps/DreamSnap-title.png",
  "score": 0,
  "ranking": 0,
  "rewards": {
    "moonstones": 0
  },
  "tags": [],
  "mandatoryTags": [],
  "bonusTags": []
}
```

6. Brug oplyste værdier; håndtér manglende resultattal som angivet nedenfor.
   - Sæt manglende score, ranking og Moonstones til `0`; opfind ikke andre oplysninger.
   - Hvis brugeren ikke har valgt en titel, må du gerne foreslå en titel, men gør det tydeligt, at den er et forslag.
   - Brug datoformatet `YYYY-MM-DD`; `date` er startdatoen, og `endDate` er valgfri slutdato.
   - `description` er valgfri og skal kun udfyldes, hvis brugeren har oplyst en beskrivelse.
   - `score`, `ranking`, `id` og `moonstones` skal være numeriske værdier.
   - `tags`, `mandatoryTags` og `bonusTags` skal være arrays af strings.
   - `tags` indeholder alle tags til søgning og filtrering; hold samtidig obligatoriske og bonus-tags adskilt i hver deres felt.
   - Skriv korte, originale opsummeringer af challenge-beskrivelser; kopier ikke længere tekst ordret.
7. Indsæt objektet i arrayet uden at overskrive eksisterende DreamSnaps.
8. Kontrollér, at ID'et er unikt, at JSON-filen er gyldig, og at billedstien matcher filnavnet.
9. Kontrollér, at billedet ligger i den publicerede `public/`-mappe, så det bliver inkluderet i GitHub Pages-buildet.
10. Opsummér hvilke filer der er tilføjet eller ændret.

## Datakonventioner

- `id`: Unikt, stigende heltal. Genbrug aldrig et eksisterende ID.
- `title`: Eget navn på billedet.
- `theme`: Challenge-temaets navn.
- `date`: Challenge-startdato i `YYYY-MM-DD`; bruges til tidslinjesortering.
- `endDate`: Valgfri challenge-slutdato i `YYYY-MM-DD`.
- `description`: Valgfri challenge-beskrivelse.
- `image`: Sti relativt til websitets public root, med filnavn baseret på titlen; brug `/images/dreamsnaps/placeholder.svg`, hvis billedet mangler. Tag højde for Vite `base`-konfigurationen i frontend-koden.
- `score`: DreamSnap-score som tal; brug `0`, hvis den mangler.
- `ranking`: Placering som tal. Lavere tal betyder bedre placering; brug `0`, hvis den mangler.
- `rewards.moonstones`: Antal modtagne Moonstones som tal; brug `0`, hvis de mangler.
- `tags`: Array med alle tags til søgning og filtrering.
- `mandatoryTags`: Array med obligatoriske challenge-tags.
- `bonusTags`: Array med bonus-tags.

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
