# DreamSnaps – projektbeskrivelse

## Formål

En personlig, statisk hjemmeside til at gemme og vise mine Disney Dreamlight Valley DreamSnaps.

Hjemmesiden skal hostes med **GitHub Pages** fra et **public GitHub-repository**. Kun repository-ejeren skal kunne ændre kildekode og data via Git.

Der skal ikke være uploadfunktion, login eller backend på hjemmesiden. Nye DreamSnaps tilføjes ved at committe billedet og opdatere JSON-data i repository'et.

## Vigtigt om GitHub-plan og synlighed

- På GitHub Free skal repository'et være offentligt for at bruge GitHub Pages.
- Repository'et er public
- Alt indhold, der bliver publiceret på hjemmesiden – herunder DreamSnap-billeder og JSON-data – skal derfor betragtes som offentligt.
- Der må aldrig lægges hemmeligheder, tokens, adgangskoder eller private oplysninger i filer, der bliver deployet.

Se GitHubs dokumentation: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Overordnet løsning

- **Hosting:** GitHub Pages
- **Repository:** Public
- **Deployment:** GitHub Actions
- **Frontend:** Statisk hjemmeside (foreslået: React + TypeScript + Vite)
- **Data:** JSON-filer i repository'et
- **Billeder:** Billedfiler i repository'et
- **Backend/database:** Ingen
- **Login/upload på hjemmesiden:** Ikke nødvendigt

Hjemmesiden skal kunne bygges som statiske HTML-, CSS- og JavaScript-filer og fungere på GitHub Pages uden en server.

## Foreslået repository-struktur

```text
/
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       └── deploy.yml
├── public/
│   ├── data/
│   │   └── dreamsnaps.json
│   └── images/
│       └── dreamsnaps/
│           ├── 001.jpg
│           ├── 002.jpg
│           └── ...
├── src/
│   ├── components/
│   ├── pages/
│   ├── types/
│   └── ...
├── index.html
├── package.json
└── README.md
```

Tilpas strukturen, hvis projektets eksisterende Vite-opsætning kræver det. Data og billeder, der skal være tilgængelige fra hjemmesiden, skal ligge i `public/` eller på anden måde blive kopieret med i build-outputtet.

## DreamSnap-data

Alle DreamSnaps gemmes i `public/data/dreamsnaps.json`.

Eksempel:

```json
{
  "dreamsnaps": [
    {
      "id": 1,
      "title": "A Magical Winter",
      "theme": "Winter Wonderland",
      "date": "2026-11-15",
      "image": "/images/dreamsnaps/001.jpg",
      "score": 4500,
      "ranking": 125,
      "rewards": {
        "moonstones": 4000
      },
      "tags": ["Winter", "Magic", "Dreamy"]
    }
  ]
}
```

### Felter

| Felt | Type | Beskrivelse |
|---|---|---|
| `id` | number | Unikt, stabilt ID |
| `title` | string | Eget navn på DreamSnap |
| `theme` | string | Challenge-tema |
| `date` | string | Dato for resultatet i `YYYY-MM-DD` format |
| `image` | string | Relativ URL til billedet |
| `score` | number | Score |
| `ranking` | number | Placering; lavere tal er bedre |
| `rewards.moonstones` | number | Modtagne Moonstones |
| `tags` | string[] | Egne tags til filtrering |

Brug datoformatet `YYYY-MM-DD`. Gem tal som tal og ikke som tekst. `id` må ikke genbruges.

## Funktioner på hjemmesiden

### Dashboard
- Antal DreamSnaps.
- Samlede Moonstones.
- Gennemsnitlig score.
- Bedste placering.
- Højeste score.

### DreamSnap-galleri
- Vis DreamSnaps som billedkort.
- Vis titel, tema, dato, score, ranking og Moonstones.
- Mulighed for at åbne et DreamSnap og se detaljerne.
- Sortering efter dato, score, ranking og rewards.
- Filtrering efter tema og tags, hvis det er relevant.

### Highscores
- Rangér efter højeste score.
- Rangér efter bedste placering (laveste ranking-tal).
- Rangér efter flest Moonstones.
- Vis tydeligt, hvilken sortering der er aktiv.

## Regler for beregninger

- Højeste score: største `score`-værdi.
- Bedste ranking: mindste `ranking`-værdi.
- Samlede Moonstones: summen af `rewards.moonstones`.
- Gennemsnitlig score: gennemsnittet af alle `score`-værdier.

Hvis to DreamSnaps har samme værdi, skal sorteringen have en stabil sekundær sortering, eksempelvis nyeste dato først.

## GitHub Pages og deployment

- Brug GitHub Actions til at installere dependencies, bygge projektet og publicere build-outputtet til GitHub Pages.
- Brug den officielle `actions/upload-pages-artifact` og `actions/deploy-pages`-proces eller en opdateret officiel GitHub Pages workflow-skabelon.
- Deployment skal ske ved push til den valgte standardbranch.
- Konfigurer Vite's `base` korrekt til repository-navnet, hvis hjemmesiden publiceres som et project site på `https://<owner>.github.io/<repository>/`.
- Brug relative eller base-aware asset paths, så billeder virker på GitHub Pages.
- GitHub Actions workflowet skal have mindst mulige nødvendige permissions.

## Ikke en del af første version

- Upload via browseren.
- Login eller brugeradministration.
- Backend/API.
- Database som SQLite eller PostgreSQL.
- Automatisk hentning af DreamSnap-resultater fra spillet.

## Kvalitetskrav

- Responsivt design til mobil og desktop.
- Tilgængelige labels og god kontrast.
- Vis en pæn tom tilstand, hvis JSON-listen er tom.
- Håndtér manglende eller ugyldige data uden at crashe siden.
- Billeder skal have beskrivende `alt`-tekst.
- Undgå at tilføje unødvendige dependencies.
- JSON skal valideres, og alle billedstier skal pege på eksisterende filer.
- Brug modern web guidance skills
