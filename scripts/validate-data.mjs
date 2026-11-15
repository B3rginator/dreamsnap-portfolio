import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dataPath = resolve(root, 'public/data/dreamsnaps.json');
const errors = [];
let data;

try {
  data = JSON.parse(readFileSync(dataPath, 'utf8'));
} catch (error) {
  console.error(`Kunne ikke læse gyldig JSON fra public/data/dreamsnaps.json: ${error.message}`);
  process.exit(1);
}

if (!data || !Array.isArray(data.dreamsnaps)) {
  errors.push('Filen skal indeholde et dreamsnaps-array.');
} else {
  const ids = new Set();

  for (const [index, snap] of data.dreamsnaps.entries()) {
    const label = `dreamsnaps[${index}]`;

    if (!snap || typeof snap !== 'object' || Array.isArray(snap)) {
      errors.push(`${label} skal være et objekt.`);
      continue;
    }

    if (!Number.isInteger(snap.id) || snap.id < 1) {
      errors.push(`${label}.id skal være et positivt heltal.`);
    } else if (ids.has(snap.id)) {
      errors.push(`${label}.id (${snap.id}) er ikke unikt.`);
    } else {
      ids.add(snap.id);
    }

    if (typeof snap.title !== 'string' || !snap.title.trim()) errors.push(`${label}.title mangler.`);
    if (typeof snap.theme !== 'string' || !snap.theme.trim()) errors.push(`${label}.theme mangler.`);
    if (typeof snap.brief !== 'string' || !snap.brief.trim()) errors.push(`${label}.brief mangler.`);

    const date = typeof snap.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(snap.date)
      ? new Date(`${snap.date}T12:00:00Z`)
      : null;
    if (!date || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== snap.date) {
      errors.push(`${label}.date skal være en gyldig dato i YYYY-MM-DD-format.`);
    }

    for (const field of ['score', 'ranking']) {
      if (typeof snap[field] !== 'number' || !Number.isFinite(snap[field]) || snap[field] < 0) {
        errors.push(`${label}.${field} skal være et ikke-negativt tal.`);
      }
    }

    if (
      !snap.rewards ||
      typeof snap.rewards.moonstones !== 'number' ||
      !Number.isFinite(snap.rewards.moonstones) ||
      snap.rewards.moonstones < 0
    ) {
      errors.push(`${label}.rewards.moonstones skal være et ikke-negativt tal.`);
    }

    if (!Array.isArray(snap.tags) || !snap.tags.every((tag) => typeof tag === 'string')) {
      errors.push(`${label}.tags skal være et array af strings.`);
    }

    if (
      typeof snap.image !== 'string' ||
      !snap.image.startsWith('/images/dreamsnaps/') ||
      snap.image.includes('..')
    ) {
      errors.push(`${label}.image skal pege på /images/dreamsnaps/.`);
    } else {
      const imagePath = resolve(root, 'public', `.${snap.image}`);
      if (!imagePath.startsWith(`${resolve(root, 'public', 'images', 'dreamsnaps')}${sep}`) || !existsSync(imagePath)) {
        errors.push(`${label}.image findes ikke: ${snap.image}`);
      }
    }
  }
}

if (errors.length) {
  console.error('DreamSnap-data indeholder fejl:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`DreamSnap-data er gyldige (${data.dreamsnaps.length} poster).`);
