export type DreamSnap = {
  id: number;
  title: string;
  theme: string;
  brief: string;
  date: string;
  image: string;
  score: number;
  ranking: number;
  rewards: {
    moonstones: number;
  };
  tags: string[];
};

export type DreamSnapSort = 'date' | 'score' | 'ranking' | 'moonstones';

type ParsedDreamSnaps = {
  dreamsnaps: DreamSnap[];
  invalidCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isDreamSnap(value: unknown): value is DreamSnap {
  if (!isRecord(value) || !isRecord(value.rewards)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    typeof value.theme === 'string' &&
    value.theme.trim().length > 0 &&
    typeof value.brief === 'string' &&
    value.brief.trim().length > 0 &&
    isValidDate(value.date) &&
    typeof value.image === 'string' &&
    /^\/images\/dreamsnaps\/(?!.*\.\.)[^?#]+$/i.test(value.image) &&
    typeof value.score === 'number' &&
    Number.isFinite(value.score) &&
    value.score >= 0 &&
    typeof value.ranking === 'number' &&
    Number.isFinite(value.ranking) &&
    value.ranking >= 0 &&
    typeof value.rewards.moonstones === 'number' &&
    Number.isFinite(value.rewards.moonstones) &&
    value.rewards.moonstones >= 0 &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string')
  );
}

export function parseDreamSnaps(payload: unknown): ParsedDreamSnaps {
  if (!isRecord(payload) || !Array.isArray(payload.dreamsnaps)) {
    throw new TypeError('Datafilen skal indeholde et dreamsnaps-array.');
  }

  const ids = new Set<number>();
  const dreamsnaps: DreamSnap[] = [];
  let invalidCount = 0;

  for (const entry of payload.dreamsnaps) {
    if (!isDreamSnap(entry) || ids.has(entry.id)) {
      invalidCount += 1;
      continue;
    }

    ids.add(entry.id);
    dreamsnaps.push(entry);
  }

  return { dreamsnaps, invalidCount };
}

export function sortDreamSnaps(
  dreamsnaps: DreamSnap[],
  sort: DreamSnapSort,
): DreamSnap[] {
  return [...dreamsnaps].sort((a, b) => {
    let comparison = 0;

    if (sort === 'date') {
      comparison = b.date.localeCompare(a.date);
    } else if (sort === 'score') {
      comparison = b.score - a.score;
    } else if (sort === 'ranking') {
      comparison = (a.ranking || Infinity) - (b.ranking || Infinity);
    } else {
      comparison = b.rewards.moonstones - a.rewards.moonstones;
    }

    return comparison || b.date.localeCompare(a.date) || a.id - b.id;
  });
}

export function getImageUrl(image: string): string {
  return `${import.meta.env.BASE_URL}${image.replace(/^\/+/, '')}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}
