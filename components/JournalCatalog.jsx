import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── TF-IDF Abstract Matcher ───────────────────────────────────────────────────

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2);
}

function computeTF(tokens) {
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const total = tokens.length || 1;
  const tf = {};
  for (const [k, v] of Object.entries(freq)) tf[k] = v / total;
  return tf;
}

function computeIDF(queryTokens, corpus) {
  const idf = {};
  const N = corpus.length || 1;
  for (const term of queryTokens) {
    const df = corpus.filter(doc => doc.includes(term)).length;
    idf[term] = Math.log((N + 1) / (df + 1)) + 1;
  }
  return idf;
}

function tfidfScore(queryTokens, docTokens, idf) {
  const tf = computeTF(docTokens);
  let score = 0;
  for (const term of queryTokens) {
    if (tf[term]) score += tf[term] * (idf[term] || 1);
  }
  return score;
}

function matchJournalsToAbstract(abstract, journals) {
  if (!abstract.trim()) return journals.map(j => ({ ...j, matchScore: 0, matchPct: 0 }));

  const queryTokens = tokenize(abstract);
  const corpus = journals.map(j =>
    tokenize([j.title, j.aims, ...(j.keywords || []), ...(j.subDomains || [])].join(' '))
  );
  const idf = computeIDF(queryTokens, corpus);

  const scored = journals.map((j, i) => {
    const score = tfidfScore(queryTokens, corpus[i], idf);
    return { ...j, matchScore: score };
  });

  const maxScore = Math.max(...scored.map(j => j.matchScore), 0.001);
  return scored
    .map(j => ({ ...j, matchPct: Math.round((j.matchScore / maxScore) * 100) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({ children, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    amber: 'bg-amber-100 text-amber-800',
    slate: 'bg-slate-100 text-slate-700',
    indigo: 'bg-indigo-100 text-indigo-800',
    rose: 'bg-rose-100 text-rose-800',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
}

function MatchBar({ pct }) {
  const color =
    pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-slate-300';
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Abstract Match</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuartileChip({ q }) {
  const map = {
    Q1: 'bg-emerald-500 text-white',
    Q2: 'bg-blue-500 text-white',
    Q3: 'bg-amber-500 text-white',
    Q4: 'bg-rose-400 text-white',
    'N/A': 'bg-slate-200 text-slate-500',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${map[q] || map['N/A']}`}>
      {q}
    </span>
  );
}

function JournalCard({ journal, onClick, showMatch }) {
  const typeIcon = journal.type === 'conference' ? '🎤' : '📄';
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col"
      onClick={() => onClick(journal)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{typeIcon}</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
            {journal.abbreviation}
          </span>
        </div>
        <QuartileChip q={journal.quartile} />
      </div>

      <h3 className="text-sm font-semibold text-slate-800 mb-1 leading-snug line-clamp-2">
        {journal.title}
      </h3>
      <p className="text-xs text-slate-500 mb-3 truncate">{journal.publisher}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        <Badge color="blue">{journal.domain}</Badge>
        {journal.apc === 'Free' && <Badge color="green">Free APC</Badge>}
        {(journal.indexing || []).slice(0, 2).map(idx => (
          <Badge key={idx} color="indigo">{idx}</Badge>
        ))}
      </div>

      <p className="text-xs text-slate-400 line-clamp-2 flex-1">{journal.aims}</p>

      {showMatch && <MatchBar pct={journal.matchPct || 0} />}
    </div>
  );
}

function DetailModal({ journal, onClose }) {
  if (!journal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                {journal.type === 'conference' ? 'Conference' : 'Journal'} · {journal.abbreviation}
              </p>
              <h2 className="text-xl font-bold leading-snug">{journal.title}</h2>
              <p className="text-sm text-slate-300 mt-1">{journal.publisher}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'ISSN', value: journal.issn },
              { label: 'Quartile', value: journal.quartile },
              { label: 'APC', value: journal.apc },
              { label: 'Country', value: journal.publisher_country },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value || 'N/A'}</p>
              </div>
            ))}
          </div>

          {/* Domain + indexing */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Domain &amp; Indexing</p>
            <div className="flex flex-wrap gap-2">
              <Badge color="blue">{journal.domain}</Badge>
              {(journal.subDomains || []).map(s => <Badge key={s} color="slate">{s}</Badge>)}
              {(journal.indexing || []).map(i => <Badge key={i} color="indigo">{i}</Badge>)}
              {journal.apc === 'Free' && <Badge color="green">Free APC</Badge>}
            </div>
          </div>

          {/* Aims */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Aims &amp; Scope</p>
            <p className="text-sm text-slate-600 leading-relaxed">{journal.aims}</p>
          </div>

          {/* Keywords */}
          {(journal.keywords || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {journal.keywords.map(k => (
                  <span key={k} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {journal.url && journal.url !== '#' && (
            <a
              href={journal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition"
            >
              Visit Journal Website →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSidebar({ filters, onChange, journals }) {
  const domains = useMemo(() => {
    const s = new Set(journals.map(j => j.domain).filter(Boolean));
    return Array.from(s).sort();
  }, [journals]);

  const indexingOptions = useMemo(() => {
    const s = new Set();
    journals.forEach(j => (j.indexing || []).forEach(i => s.add(i)));
    return Array.from(s).sort();
  }, [journals]);

  const Field = ({ label, name, options }) => (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <select
        value={filters[name]}
        onChange={e => onChange({ ...filters, [name]: e.target.value })}
        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sticky top-4">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>🔍</span> Filters
        </h2>
        <Field label="Type" name="type" options={['journal', 'conference']} />
        <Field label="Domain" name="domain" options={domains} />
        <Field label="Indexing" name="indexing" options={indexingOptions} />
        <Field label="Quartile" name="quartile" options={['Q1', 'Q2', 'Q3', 'Q4', 'N/A']} />
        <button
          onClick={() => onChange({ type: '', domain: '', indexing: '', quartile: '' })}
          className="w-full text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium"
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function JournalCatalog() {
  const [journals, setJournals] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [abstract, setAbstract] = useState('');
  const [filters, setFilters] = useState({ type: '', domain: '', indexing: '', quartile: '' });
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [abstractMode, setAbstractMode] = useState(false);

  useEffect(() => {
    fetch('/api/journals')
      .then(r => r.json())
      .then(data => {
        setJournals(data.journals || []);
        setLastUpdated(data.lastUpdated);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load journal data.');
        setLoading(false);
      });
  }, []);

  // Apply filters + search
  const baseFiltered = useMemo(() => {
    let list = journals;

    if (filters.type) list = list.filter(j => j.type === filters.type);
    if (filters.domain) list = list.filter(j => j.domain?.toLowerCase().includes(filters.domain.toLowerCase()));
    if (filters.indexing) list = list.filter(j => (j.indexing || []).some(i => i.toLowerCase().includes(filters.indexing.toLowerCase())));
    if (filters.quartile) list = list.filter(j => j.quartile?.toLowerCase() === filters.quartile.toLowerCase());

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.publisher?.toLowerCase().includes(q) ||
        j.domain?.toLowerCase().includes(q) ||
        j.aims?.toLowerCase().includes(q) ||
        (j.keywords || []).some(k => k.toLowerCase().includes(q)) ||
        (j.subDomains || []).some(s => s.toLowerCase().includes(q))
      );
    }

    return list;
  }, [journals, filters, search]);

  // Abstract matching (TF-IDF)
  const displayJournals = useMemo(() => {
    if (!abstractMode || !abstract.trim()) return baseFiltered.map(j => ({ ...j, matchPct: 0 }));
    return matchJournalsToAbstract(abstract, baseFiltered);
  }, [baseFiltered, abstract, abstractMode]);

  const handleAbstractSubmit = useCallback(e => {
    e.preventDefault();
    setAbstractMode(!!abstract.trim());
  }, [abstract]);

  const clearAbstract = useCallback(() => {
    setAbstract('');
    setAbstractMode(false);
  }, []);

  // ── Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-6xl mb-4">⚠️</p>
          <h2 className="text-2xl font-bold mb-2">Data Unavailable</h2>
          <p className="text-slate-400">{error}</p>
          <p className="text-sm text-slate-500 mt-2">
            Run:{' '}
            <code className="bg-slate-800 px-2 py-1 rounded">npm run fetch-journals</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-10 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                📚 OpenAccess Scholar
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Discover free-to-publish journals and conferences — Scopus &amp; WoS indexed
              </p>
            </div>
            <div className="text-right text-sm text-slate-400">
              <p>{loading ? '...' : `${journals.length} venues indexed`}</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔎</span>
            <input
              type="text"
              placeholder="Search journals, domains, publishers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 transition"
            />
          </div>

          {/* Abstract matcher */}
          <form onSubmit={handleAbstractSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Abstract Matcher (TF-IDF)
            </label>
            <textarea
              rows={3}
              placeholder="Paste your paper abstract here to find the best-matching journals…"
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm transition"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
              >
                Find Matches
              </button>
              {abstractMode && (
                <button
                  type="button"
                  onClick={clearAbstract}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </header>

      {/* ── Body */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Last Updated banner */}
        {lastUpdated && (
          <div className="text-xs text-slate-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
            Data last updated:{' '}
            {new Date(lastUpdated).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            <span className="ml-auto text-slate-500">Auto-refreshes every Sunday</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <FilterSidebar filters={filters} onChange={setFilters} journals={journals} />

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Result count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                {loading
                  ? 'Loading…'
                  : `Showing ${displayJournals.length} result${displayJournals.length !== 1 ? 's' : ''}${abstractMode ? ' · sorted by abstract match' : ''}`}
              </p>
              {abstractMode && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  TF-IDF Active
                </span>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse space-y-3">
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && displayJournals.length === 0 && (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🔭</p>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No results found</h3>
                <p className="text-sm text-slate-400">Try adjusting your search or clearing filters.</p>
              </div>
            )}

            {/* Grid */}
            {!loading && displayJournals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayJournals.map(j => (
                  <JournalCard
                    key={j.id}
                    journal={j}
                    onClick={setSelectedJournal}
                    showMatch={abstractMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <DetailModal journal={selectedJournal} onClose={() => setSelectedJournal(null)} />
    </div>
  );
}
