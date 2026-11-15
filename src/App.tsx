import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  formatDateRange,
  formatNumber,
  getImageUrl,
  getTagName,
  parseDreamSnaps,
  sortDreamSnaps,
  type DreamSnap,
  type DreamSnapSort,
} from './data';

type HighscoreKey = 'score' | 'ranking' | 'moonstones';

const highscoreLabels: Record<HighscoreKey, string> = {
  score: 'Højeste score',
  ranking: 'Bedste placering',
  moonstones: 'Flest Moonstones',
};

function Icon({
  name,
  className,
}: {
  name: 'sparkle' | 'home' | 'image' | 'trophy' | 'calendar' | 'medal' | 'moon';
  className?: string;
}) {
  const paths: Record<typeof name, ReactNode> = {
    sparkle: (
      <>
        <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      </>
    ),
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></>,
    trophy: <><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 7H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    medal: <><circle cx="12" cy="8" r="5" /><path d="m8.2 12-1.3 9 5.1-3 5.1 3-1.3-9" /></>,
    moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: 'image' | 'moon' | 'sparkle' | 'medal' | 'trophy';
  accent: string;
}) {
  return (
    <article className={`metric-card ${accent}`}>
      <div className="metric-heading">
        <span>{label}</span>
        <Icon name={icon} />
      </div>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </article>
  );
}

function SnapCard({
  snap,
  onOpen,
}: {
  snap: DreamSnap;
  onOpen: (snap: DreamSnap) => void;
}) {
  return (
    <li>
      <button className="snap-card" onClick={() => onOpen(snap)} type="button">
        <span className="snap-image-wrap">
          <span aria-hidden="true" className="image-placeholder">
            <Icon name="sparkle" />
            <span>DreamSnap</span>
          </span>
          <img
            alt={snap.theme === snap.title ? snap.title : `${snap.title} — ${snap.theme}`}
            className="snap-image"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
            src={getImageUrl(snap.image)}
          />
          <span className="snap-date">{formatDateRange(snap.date, snap.endDate)}</span>
        </span>
        <span className="snap-card-content">
          {snap.theme !== snap.title && <span className="snap-theme">{snap.theme}</span>}
          <span className="snap-title">{snap.title}</span>
          <span className="snap-meta">
            <span><Icon name="sparkle" /> {formatNumber(snap.score)}</span>
            <span><Icon name="medal" /> {snap.ranking > 0 ? `#${formatNumber(snap.ranking)}` : '—'}</span>
            <span><Icon name="moon" /> {formatNumber(snap.rewards.moonstones)}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

function EmptyState({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name="sparkle" /></span>
      <h3>{filtered ? 'Ingen DreamSnaps matcher' : 'Dit galleri venter på magi'}</h3>
      <p>
        {filtered
          ? 'Prøv at ændre søgning eller filtre.'
          : 'Når du tilføjer DreamSnaps i repository’et, dukker de op her.'}
      </p>
      {!filtered && <span className="empty-hint">Dine billeder forbliver dine — tilføj dem via Git.</span>}
    </div>
  );
}

function App() {
  const [dreamsnaps, setDreamsnaps] = useState<DreamSnap[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [invalidCount, setInvalidCount] = useState(0);
  const [selectedSnap, setSelectedSnap] = useState<DreamSnap | null>(null);
  const [search, setSearch] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sort, setSort] = useState<DreamSnapSort>('date');
  const [highscore, setHighscore] = useState<HighscoreKey>('score');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/dreamsnaps.json`);
        if (!response.ok) {
          throw new Error(`Datafilen kunne ikke indlæses (HTTP ${response.status}).`);
        }

        const parsed = parseDreamSnaps(await response.json());
        if (active) {
          setDreamsnaps(parsed.dreamsnaps);
          setInvalidCount(parsed.invalidCount);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : 'Der opstod en ukendt fejl ved indlæsning.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedSnap && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [selectedSnap]);

  const themes = useMemo(
    () => [...new Set(dreamsnaps.map((snap) => snap.theme))].sort((a, b) => a.localeCompare(b, 'da')),
    [dreamsnaps],
  );
  const tags = useMemo(
    () => [...new Set(dreamsnaps.flatMap((snap) => snap.tags.map(getTagName)))].sort((a, b) => a.localeCompare(b, 'da')),
    [dreamsnaps],
  );
  const filteredDreamSnaps = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('da');
    const filtered = dreamsnaps.filter((snap) => {
      const matchesQuery =
        !query ||
        [snap.title, snap.theme, ...snap.tags].some((value) =>
          value.toLocaleLowerCase('da').includes(query),
        );
      return (
        matchesQuery &&
        (!themeFilter || snap.theme === themeFilter) &&
        (!tagFilter || snap.tags.some((tag) => getTagName(tag) === tagFilter))
      );
    });
    return sortDreamSnaps(filtered, sort);
  }, [dreamsnaps, search, sort, tagFilter, themeFilter]);

  const metrics = useMemo(() => {
    const total = dreamsnaps.length;
    const totalMoonstones = dreamsnaps.reduce(
      (sum, snap) => sum + snap.rewards.moonstones,
      0,
    );
    const averageScore =
      total === 0
        ? 0
        : dreamsnaps.reduce((sum, snap) => sum + snap.score, 0) / total;
    const rankedSnaps = dreamsnaps.filter((snap) => snap.ranking > 0);
    const bestRanking = rankedSnaps.length
      ? rankedSnaps.reduce((best, snap) => Math.min(best, snap.ranking), Infinity)
      : null;
    const highestScore = dreamsnaps.reduce(
      (highest, snap) => Math.max(highest, snap.score),
      0,
    );

    return { total, totalMoonstones, averageScore, bestRanking, highestScore };
  }, [dreamsnaps]);

  const highscoreItems = useMemo(() => {
    const eligible =
      highscore === 'ranking'
        ? dreamsnaps.filter((snap) => snap.ranking > 0)
        : dreamsnaps;
    return sortDreamSnaps(
      eligible,
      highscore === 'moonstones' ? 'moonstones' : highscore,
    ).slice(0, 5);
  }, [dreamsnaps, highscore]);

  const hasActiveFilter = Boolean(search.trim() || themeFilter || tagFilter);

  function clearFilters() {
    setSearch('');
    setThemeFilter('');
    setTagFilter('');
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Gå til indhold</a>
      <div className="main-column">
        <header className="topbar">
          <nav aria-label="Hovednavigation" className="top-nav">
            <a className="nav-link" href="#dashboard">Overblik</a>
            <a className="nav-link" href="#gallery">Galleri</a>
            <a className="nav-link" href="#highscores">Highscores</a>
          </nav>
        </header>

        <main id="main-content">
          <section aria-labelledby="welcome-title" className="welcome-section">
            <div className="welcome-copy">
              <p className="eyebrow"><Icon name="sparkle" /> DIT PERSONLIGE DREAMLIGHT-ARKIV</p>
              <h1 id="welcome-title">Dine øjeblikke,<br /><span>gemt for altid.</span></h1>
              <p className="welcome-description">
                Et hjem til dine DreamSnaps, resultater og små magiske minder.
              </p>
              <a className="primary-link" href="#gallery">Udforsk galleriet <span aria-hidden="true">↗</span></a>
            </div>
            <div aria-hidden="true" className="welcome-art">
              <div className="art-glow" />
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <span className="art-star star-one">✦</span>
              <span className="art-star star-two">✧</span>
              <span className="art-star star-three">·</span>
              <span className="art-moon">☾</span>
              <span className="art-caption">a little bit of magic</span>
            </div>
          </section>

          <section aria-labelledby="dashboard-title" className="dashboard-section" id="dashboard">
            <div className="section-heading">
              <div>
                <p className="eyebrow">DIT ARKIV I TAL</p>
                <h2 id="dashboard-title">Et overblik</h2>
              </div>
              <span className="updated-note"><Icon name="calendar" /> Dine minder, samlet ét sted</span>
            </div>
            {loadError && <p className="notice notice-error" role="alert">{loadError}</p>}
            {!loadError && invalidCount > 0 && (
              <p className="notice" role="status">
                {invalidCount} ugyldige eller dublerede {invalidCount === 1 ? 'post' : 'poster'} blev sprunget over. Kontrollér dreamsnaps.json.
              </p>
            )}
            <div className="metrics-grid">
              <MetricCard accent="metric-lilac" detail="i dit galleri" icon="image" label="DreamSnaps" value={formatNumber(metrics.total)} />
              <MetricCard accent="metric-peach" detail="samlet fra dine resultater" icon="moon" label="Moonstones" value={formatNumber(metrics.totalMoonstones)} />
              <MetricCard accent="metric-blue" detail="på tværs af alle dine snaps" icon="sparkle" label="Gennemsnitlig score" value={formatNumber(metrics.averageScore)} />
              <MetricCard accent="metric-peach" detail="dit bedste resultat" icon="trophy" label="Højeste score" value={formatNumber(metrics.highestScore)} />
              <MetricCard accent="metric-green" detail="laveste placering vinder" icon="medal" label="Bedste placering" value={metrics.bestRanking === null ? '—' : `#${formatNumber(metrics.bestRanking)}`} />
            </div>
            {loading && <p className="loading-message" role="status">Henter dine DreamSnaps…</p>}
          </section>

          <section aria-labelledby="gallery-title" className="gallery-section" id="gallery">
            <div className="section-heading gallery-heading">
              <div>
                <p className="eyebrow">GEMTE ØJEBLIKKE</p>
                <h2 id="gallery-title">DreamSnap-galleri</h2>
              </div>
              <span className="result-count">{formatNumber(filteredDreamSnaps.length)} {filteredDreamSnaps.length === 1 ? 'snap' : 'snaps'}</span>
            </div>

            <search className="gallery-tools" aria-label="Søg og filtrér DreamSnaps">
              <label className="search-field">
                <span className="visually-hidden">Søg på titel, tema eller tag</span>
                <Icon name="image" />
                <input
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Søg i dine minder..."
                  type="search"
                  value={search}
                />
              </label>
              <label className="select-field">
                <span className="visually-hidden">Filtrér efter tema</span>
                <select onChange={(event) => setThemeFilter(event.target.value)} value={themeFilter}>
                  <option value="">Alle temaer</option>
                  {themes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
                </select>
              </label>
              <label className="select-field">
                <span className="visually-hidden">Filtrér efter tag</span>
                <select onChange={(event) => setTagFilter(event.target.value)} value={tagFilter}>
                  <option value="">Alle tags</option>
                  {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </label>
              <label className="select-field sort-field">
                <span className="visually-hidden">Sortér DreamSnaps</span>
                <select onChange={(event) => setSort(event.target.value as DreamSnapSort)} value={sort}>
                  <option value="date">Nyeste først</option>
                  <option value="score">Højeste score</option>
                  <option value="ranking">Bedste placering</option>
                  <option value="moonstones">Flest Moonstones</option>
                </select>
              </label>
            </search>

            {hasActiveFilter && (
              <button className="clear-filters" onClick={clearFilters} type="button">
                Ryd filtre
              </button>
            )}
            {loading ? (
              <div className="gallery-loading" aria-hidden="true" />
            ) : filteredDreamSnaps.length ? (
              <ul className="snap-grid">
                {filteredDreamSnaps.map((snap) => (
                  <SnapCard key={snap.id} onOpen={setSelectedSnap} snap={snap} />
                ))}
              </ul>
            ) : (
              <EmptyState filtered={dreamsnaps.length > 0} />
            )}
          </section>

          <section aria-labelledby="highscores-title" className="highscores-section" id="highscores">
            <div className="section-heading">
              <div>
                <p className="eyebrow">DINE BEDSTE RESULTATER</p>
                <h2 id="highscores-title">Highscores</h2>
              </div>
              <Icon className="section-icon" name="trophy" />
            </div>
            <div aria-label="Vælg highscore-rangering" className="score-tabs" role="group">
              {(Object.keys(highscoreLabels) as HighscoreKey[]).map((key) => (
                <button
                  aria-pressed={highscore === key}
                  className={highscore === key ? 'score-tab is-active' : 'score-tab'}
                  key={key}
                  onClick={() => setHighscore(key)}
                  type="button"
                >
                  {highscoreLabels[key]}
                </button>
              ))}
            </div>
            {highscoreItems.length ? (
              <ol className="highscore-list">
                {highscoreItems.map((snap, index) => {
                  const score =
                    highscore === 'score'
                      ? formatNumber(snap.score)
                      : highscore === 'ranking'
                        ? `#${formatNumber(snap.ranking)}`
                        : formatNumber(snap.rewards.moonstones);
                  return (
                    <li className="highscore-row" key={snap.id}>
                      <span className={`rank-badge rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
                      <span className="highscore-copy">
                        <strong>{snap.title}</strong>
                        <span>
                          {snap.theme !== snap.title && `${snap.theme} · `}
                          {formatDateRange(snap.date, snap.endDate)}
                        </span>
                      </span>
                      <span className="highscore-value">{score}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState />
            )}
          </section>
        </main>

        <footer className="page-footer">
          <span>Lav plads til lidt mere magi <span aria-hidden="true">✦</span></span>
          <span>Dreamlight Valley · Personligt arkiv</span>
        </footer>
      </div>

      <dialog
        aria-labelledby="dialog-title"
        className="snap-dialog"
        onClose={() => setSelectedSnap(null)}
        ref={dialogRef}
      >
        {selectedSnap && (
          <article>
            <button
              aria-label="Luk detaljer"
              className="dialog-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              ×
            </button>
            <div className="dialog-image-wrap">
              <span aria-hidden="true" className="image-placeholder">
                <Icon name="sparkle" />
                <span>DreamSnap</span>
              </span>
              <img
                alt={
                  selectedSnap.theme === selectedSnap.title
                    ? selectedSnap.title
                    : `${selectedSnap.title} — ${selectedSnap.theme}`
                }
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
                src={getImageUrl(selectedSnap.image)}
              />
            </div>
            <div className="dialog-content">
              {selectedSnap.theme !== selectedSnap.title && (
                <p className="eyebrow">{selectedSnap.theme}</p>
              )}
              <h2 id="dialog-title">{selectedSnap.title}</h2>
              <p className="dialog-date">
                {formatDateRange(selectedSnap.date, selectedSnap.endDate)}
              </p>
              {selectedSnap.description && (
                <p className="dialog-description">{selectedSnap.description}</p>
              )}
              <dl className="detail-grid">
                <div><dt>Score</dt><dd>{formatNumber(selectedSnap.score)}</dd></div>
                <div><dt>Placering</dt><dd>{selectedSnap.ranking > 0 ? `#${formatNumber(selectedSnap.ranking)}` : '—'}</dd></div>
                <div><dt>Moonstones</dt><dd>{formatNumber(selectedSnap.rewards.moonstones)}</dd></div>
              </dl>
              {selectedSnap.mandatoryTags.length > 0 && (
                <div className="tag-group">
                  <h3 className="tag-heading">Obligatoriske tags</h3>
                  <ul className="tag-list">
                    {selectedSnap.mandatoryTags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                </div>
              )}
              {selectedSnap.bonusTags.length > 0 && (
                <div className="tag-group">
                  <h3 className="tag-heading">Bonus-tags</h3>
                  <ul className="tag-list">
                    {selectedSnap.bonusTags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </article>
        )}
      </dialog>
    </div>
  );
}

export default App;
