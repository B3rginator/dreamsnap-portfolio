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

type HighscoreKey = 'score' | 'ranking';

const DREAMSNAPS_PAGE_SIZE = 12;
const HISTORY_CHART_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});

const highscoreLabels: Record<HighscoreKey, string> = {
  score: 'Highest score',
  ranking: 'Best rank',
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
  icon,
  accent,
}: {
  label: string;
  value: string;
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
    </article>
  );
}

function HistoryChart({
  dreamsnaps,
  metric,
}: {
  dreamsnaps: DreamSnap[];
  metric: HighscoreKey;
}) {
  const metricLabel = metric === 'score' ? 'Score' : 'Best rank';
  const chartTitle = `${metricLabel} history over time`;
  const chartSnaps = dreamsnaps
    .filter((snap) => snap[metric] > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!chartSnaps.length) {
    return (
      <figure className="history-chart">
        <figcaption>{chartTitle}</figcaption>
        <p className="history-chart-empty">No {metric === 'score' ? 'score' : 'rank'} history yet.</p>
      </figure>
    );
  }

  const plot = { left: 86, right: 816, top: 28, bottom: 260 };
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const values = chartSnaps.map((snap) => snap[metric]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const rankPadding = Math.max(1, (maximum - minimum) * 0.08);
  const domainMinimum = metric === 'score' ? 0 : Math.max(1, minimum - rankPadding);
  const domainMaximum =
    metric === 'score' ? Math.max(100, Math.ceil(maximum / 10) * 10) : maximum + rankPadding;
  const domainRange = Math.max(1, domainMaximum - domainMinimum);
  const timestamps = chartSnaps.map((snap) => new Date(`${snap.date}T00:00:00Z`).getTime());
  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];
  const timeRange = Math.max(1, lastTimestamp - firstTimestamp);
  const points = chartSnaps.map((snap, index) => {
    const value = snap[metric];
    const x =
      chartSnaps.length === 1
        ? plot.left + plotWidth / 2
        : plot.left + ((timestamps[index] - firstTimestamp) / timeRange) * plotWidth;
    const y =
      plot.top +
      (metric === 'score'
        ? (domainMaximum - value) / domainRange
        : (value - domainMinimum) / domainRange) *
        plotHeight;
    return { snap, value, x, y };
  });
  const yTicks = Array.from({ length: 5 }, (_, index) =>
    metric === 'score'
      ? domainMaximum - (domainRange * index) / 4
      : domainMinimum + (domainRange * index) / 4,
  );
  const dateTickRatios = chartSnaps.length === 1 ? [0.5] : [0, 1 / 3, 2 / 3, 1];
  const xTicks = dateTickRatios.map((ratio) => {
    const timestamp = firstTimestamp + timeRange * ratio;
    return {
      x: plot.left + plotWidth * ratio,
      label: HISTORY_CHART_DATE_FORMATTER.format(new Date(timestamp)),
    };
  });
  const chartDescription = [
    `${chartSnaps.length} DreamSnaps from ${formatDateRange(chartSnaps[0].date, chartSnaps[0].endDate)} through ${formatDateRange(chartSnaps[chartSnaps.length - 1].date, chartSnaps[chartSnaps.length - 1].endDate)}.`,
    metric === 'ranking' ? 'Lower rank values are better.' : 'Scores are shown from 0 to 100.',
    'Each plotted point represents one DreamSnap result.',
  ].join(' ');

  return (
    <figure className="history-chart">
      <figcaption>{chartTitle}</figcaption>
      <div className="history-chart-scroll">
        <svg
          aria-labelledby="history-chart-title history-chart-description"
          className="history-chart-svg"
          role="img"
          viewBox="0 0 840 332"
        >
          <title id="history-chart-title">{chartTitle}</title>
          <desc id="history-chart-description">{chartDescription}</desc>
          {yTicks.map((tick, index) => {
            const y = plot.top + (plotHeight * index) / 4;
            return (
              <g key={index}>
                <line className="history-chart-grid" x1={plot.left} x2={plot.right} y1={y} y2={y} />
                <text className="history-chart-tick" textAnchor="end" x={plot.left - 10} y={y + 4}>
                  {formatNumber(Math.round(tick))}
                </text>
              </g>
            );
          })}
          <line className="history-chart-axis" x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} />
          <line className="history-chart-axis" x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} />
          <text
            className="history-chart-axis-label"
            textAnchor="middle"
            transform={`rotate(-90 18 ${(plot.top + plot.bottom) / 2})`}
            x="18"
            y={(plot.top + plot.bottom) / 2}
          >
            {metricLabel}
          </text>
          {points.length > 1 && (
            <polyline
              className="history-chart-line"
              points={points.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
          )}
          {points.map(({ snap, value, x, y }) => (
            <circle className="history-chart-point" cx={x} cy={y} key={snap.id} r="3.5">
              <title>{`${snap.title}: ${metric === 'ranking' ? `#${formatNumber(value)}` : formatNumber(value)} on ${formatDateRange(snap.date, snap.endDate)}`}</title>
            </circle>
          ))}
          {xTicks.map((tick) => (
            <g key={`${tick.x}-${tick.label}`}>
              <line className="history-chart-axis" x1={tick.x} x2={tick.x} y1={plot.bottom} y2={plot.bottom + 5} />
              <text className="history-chart-tick" textAnchor="middle" x={tick.x} y={plot.bottom + 22}>
                {tick.label}
              </text>
            </g>
          ))}
          <text className="history-chart-axis-label" textAnchor="middle" x={(plot.left + plot.right) / 2} y="326">
            Challenge date
          </text>
        </svg>
      </div>
      <table className="visually-hidden">
        <caption>{chartTitle}</caption>
        <thead>
          <tr>
            <th scope="col">Challenge</th>
            <th scope="col">Date</th>
            <th scope="col">{metricLabel}</th>
          </tr>
        </thead>
        <tbody>
          {chartSnaps.map((snap) => (
            <tr key={snap.id}>
              <th scope="row">{snap.title}</th>
              <td>{formatDateRange(snap.date, snap.endDate)}</td>
              <td>{metric === 'ranking' ? `#${formatNumber(snap.ranking)}` : formatNumber(snap.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
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
      <h3>{filtered ? 'No DreamSnaps match' : 'Your gallery is waiting for magic'}</h3>
      <p>
        {filtered
          ? 'Try changing your search or filters.'
          : 'DreamSnaps you add to the repository will appear here.'}
      </p>
      {!filtered && <span className="empty-hint">Your images stay yours — add them through Git.</span>}
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
  const [participatedOnly, setParticipatedOnly] = useState(true);
  const [visibleCount, setVisibleCount] = useState(DREAMSNAPS_PAGE_SIZE);
  const [highscore, setHighscore] = useState<HighscoreKey>('score');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/dreamsnaps.json`);
        if (!response.ok) {
          throw new Error(`The data file could not be loaded (HTTP ${response.status}).`);
        }

        const parsed = parseDreamSnaps(await response.json());
        if (active) {
          setDreamsnaps(parsed.dreamsnaps);
          setInvalidCount(parsed.invalidCount);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : 'An unknown error occurred while loading.',
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
    () => [...new Set(dreamsnaps.map((snap) => snap.theme))].sort((a, b) => a.localeCompare(b, 'en')),
    [dreamsnaps],
  );
  const tags = useMemo(
    () => [...new Set(dreamsnaps.flatMap((snap) => snap.tags.map(getTagName)))].sort((a, b) => a.localeCompare(b, 'en')),
    [dreamsnaps],
  );
  const filteredDreamSnaps = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('en');
    const filtered = dreamsnaps.filter((snap) => {
      const matchesQuery =
        !query ||
        [snap.title, snap.theme, ...snap.tags].some((value) =>
          value.toLocaleLowerCase('en').includes(query),
        );
      return (
        matchesQuery &&
        (!participatedOnly || snap.score > 0) &&
        (!themeFilter || snap.theme === themeFilter) &&
        (!tagFilter || snap.tags.some((tag) => getTagName(tag) === tagFilter))
      );
    });
    return sortDreamSnaps(filtered, sort);
  }, [dreamsnaps, participatedOnly, search, sort, tagFilter, themeFilter]);
  const visibleDreamSnaps = filteredDreamSnaps.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(DREAMSNAPS_PAGE_SIZE);
  }, [participatedOnly, search, sort, tagFilter, themeFilter]);

  const metrics = useMemo(() => {
    const total = dreamsnaps.length;
    const participatedCount = dreamsnaps.filter((snap) => snap.score > 0).length;
    const totalMoonstones = dreamsnaps.reduce(
      (sum, snap) => sum + snap.rewards.moonstones,
      0,
    );
    const averageScore =
      total === 0
        ? 0
        : dreamsnaps.reduce((sum, snap) => sum + snap.score, 0) / total;
    const rankedSnaps = dreamsnaps.filter((snap) => snap.ranking > 0);
    const bestRankingSnap = rankedSnaps.reduce<DreamSnap | null>(
      (best, snap) => (best === null || snap.ranking < best.ranking ? snap : best),
      null,
    );
    const highestScore = dreamsnaps.reduce(
      (highest, snap) => Math.max(highest, snap.score),
      0,
    );

    return { total, participatedCount, totalMoonstones, averageScore, bestRankingSnap, highestScore };
  }, [dreamsnaps]);

  const highscoreItems = useMemo(() => {
    const eligible =
      highscore === 'ranking'
        ? dreamsnaps.filter((snap) => snap.ranking > 0)
        : dreamsnaps;
    return sortDreamSnaps(eligible, highscore).slice(0, 10);
  }, [dreamsnaps, highscore]);

  const hasActiveFilter = Boolean(search.trim() || themeFilter || tagFilter || participatedOnly);

  function clearFilters() {
    setSearch('');
    setThemeFilter('');
    setTagFilter('');
    setParticipatedOnly(false);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="main-column">
        <header className="topbar">
          <nav aria-label="Main navigation" className="top-nav">
            <a className="nav-link" href="#dashboard">Overview</a>
            <a className="nav-link" href="#gallery">Gallery</a>
            <a className="nav-link" href="#highscores">High Scores</a>
          </nav>
        </header>

        <main id="main-content">
          <section aria-labelledby="dashboard-title" className="dashboard-section" id="dashboard">
            <div className="dashboard-layout">
              <div className="dashboard-overview">
                <div className="section-heading">
                  <h1 id="dashboard-title">Overview</h1>
                </div>
                {loadError && <p className="notice notice-error" role="alert">{loadError}</p>}
                {!loadError && invalidCount > 0 && (
                  <p className="notice" role="status">
                    {invalidCount} invalid or duplicate {invalidCount === 1 ? 'entry was' : 'entries were'} skipped. Check dreamsnaps.json.
                  </p>
                )}
                <div className="metrics-grid">
                  <MetricCard accent="metric-lilac" icon="image" label="DreamSnaps" value={formatNumber(metrics.participatedCount)} />
                  <MetricCard accent="metric-peach" icon="moon" label="Moonstones" value={formatNumber(metrics.totalMoonstones)} />
                  <MetricCard accent="metric-blue" icon="sparkle" label="Average score" value={formatNumber(metrics.averageScore)} />
                  <MetricCard accent="metric-peach" icon="trophy" label="Highest score" value={formatNumber(metrics.highestScore)} />
                </div>
                {loading && <p className="loading-message" role="status">Loading your DreamSnaps…</p>}
              </div>
              <figure aria-labelledby="best-ranking-caption" className="best-ranking-feature">
                {metrics.bestRankingSnap ? (
                  <img
                    alt={metrics.bestRankingSnap.title}
                    className="best-ranking-image"
                    fetchPriority="high"
                    height={1079}
                    src={getImageUrl(metrics.bestRankingSnap.image)}
                    width={1919}
                  />
                ) : (
                  <div aria-hidden="true" className="best-ranking-image-placeholder" />
                )}
                <figcaption className="best-ranking-caption" id="best-ranking-caption">
                  <span className="best-ranking-label">BEST RANK</span>
                  {metrics.bestRankingSnap ? (
                    <>
                      <strong>#{formatNumber(metrics.bestRankingSnap.ranking)}</strong>
                      <span className="best-ranking-title">{metrics.bestRankingSnap.title}</span>
                    </>
                  ) : (
                    <span className="best-ranking-title">
                      {loading ? 'Loading rank…' : 'No ranks recorded'}
                    </span>
                  )}
                </figcaption>
              </figure>
            </div>
          </section>

          <section aria-labelledby="gallery-title" className="gallery-section" id="gallery">
            <div className="section-heading gallery-heading">
              <div>
                <h2 id="gallery-title">DreamSnap Gallery</h2>
              </div>
              <span className="result-count">{formatNumber(filteredDreamSnaps.length)} {filteredDreamSnaps.length === 1 ? 'snap' : 'snaps'}</span>
            </div>

            <search className="gallery-tools" aria-label="Search and filter DreamSnaps">
              <label className="search-field">
                <span className="visually-hidden">Search by title, theme, or tag</span>
                <Icon name="image" />
                <input
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your memories..."
                  type="search"
                  value={search}
                />
              </label>
              <label className="select-field">
                <span className="visually-hidden">Filter by theme</span>
                <select onChange={(event) => setThemeFilter(event.target.value)} value={themeFilter}>
                  <option value="">All themes</option>
                  {themes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
                </select>
              </label>
              <label className="select-field">
                <span className="visually-hidden">Filter by tag</span>
                <select onChange={(event) => setTagFilter(event.target.value)} value={tagFilter}>
                  <option value="">All tags</option>
                  {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </label>
              <div className="sort-controls">
                <label className="select-field sort-field">
                  <span className="visually-hidden">Sort DreamSnaps</span>
                  <select onChange={(event) => setSort(event.target.value as DreamSnapSort)} value={sort}>
                    <option value="date">Newest first</option>
                    <option value="score">Highest score</option>
                    <option value="ranking">Best rank</option>
                    <option value="moonstones">Most Moonstones</option>
                  </select>
                </label>
                <label className="participation-filter">
                  <input
                    checked={participatedOnly}
                    name="participatedOnly"
                    onChange={(event) => setParticipatedOnly(event.target.checked)}
                    type="checkbox"
                  />
                  <span>My entries only</span>
                </label>
              </div>
            </search>

            {hasActiveFilter && (
              <button className="clear-filters" onClick={clearFilters} type="button">
                Clear filters
              </button>
            )}
            {loading ? (
              <div className="gallery-loading" aria-hidden="true" />
            ) : filteredDreamSnaps.length ? (
              <>
                <ul className="snap-grid" id="dreamsnap-grid">
                  {visibleDreamSnaps.map((snap) => (
                    <SnapCard key={snap.id} onOpen={setSelectedSnap} snap={snap} />
                  ))}
                </ul>
                {visibleDreamSnaps.length < filteredDreamSnaps.length && (
                  <button
                    aria-controls="dreamsnap-grid"
                    className="load-more"
                    onClick={() => setVisibleCount((count) => count + DREAMSNAPS_PAGE_SIZE)}
                    type="button"
                  >
                    Show more
                  </button>
                )}
              </>
            ) : (
              <EmptyState filtered={dreamsnaps.length > 0} />
            )}
          </section>

          <section aria-labelledby="highscores-title" className="highscores-section" id="highscores">
            <div className="section-heading">
              <div>
                <h2 id="highscores-title">High Scores</h2>
              </div>
              <Icon className="section-icon" name="trophy" />
            </div>
            <div aria-label="Choose a high score ranking" className="score-tabs" role="group">
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
                      : `#${formatNumber(snap.ranking)}`;
                  return (
                    <li className="highscore-row" key={snap.id}>
                      <button
                        aria-haspopup="dialog"
                        className="highscore-row-button"
                        onClick={() => setSelectedSnap(snap)}
                        type="button"
                      >
                        <span className={`rank-badge rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
                        <span className="highscore-copy">
                          <strong>{snap.title}</strong>
                          <span>
                            {snap.theme !== snap.title && `${snap.theme} · `}
                            {formatDateRange(snap.date, snap.endDate)}
                          </span>
                        </span>
                        <span className="highscore-value">{score}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState />
            )}
            <HistoryChart dreamsnaps={dreamsnaps} metric={highscore} />
          </section>
        </main>

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
              aria-label="Close details"
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
                <div><dt>Rank</dt><dd>{selectedSnap.ranking > 0 ? `#${formatNumber(selectedSnap.ranking)}` : '—'}</dd></div>
                <div><dt>Moonstones</dt><dd>{formatNumber(selectedSnap.rewards.moonstones)}</dd></div>
              </dl>
              {selectedSnap.mandatoryTags.length > 0 && (
                <div className="tag-group">
                  <h3 className="tag-heading">Required tags</h3>
                  <ul className="tag-list">
                    {selectedSnap.mandatoryTags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                </div>
              )}
              {selectedSnap.bonusTags.length > 0 && (
                <div className="tag-group">
                  <h3 className="tag-heading">Bonus tags</h3>
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
