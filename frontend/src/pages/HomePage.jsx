import { useState } from "react";
import SearchBar from "../components/SearchBar";
import ResultsList from "../components/ResultsList";

const SUGGESTIONS = [
  "sweet yellow fruit",
  "refreshing fruit for summer",
  "fruit for smoothies",
  "exotic tropical fruit",
];

const API_BASE = import.meta.env.VITE_BASE_URL;

const HomePage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async (q) => {
    const searchTerm = (q ?? query).trim();
    if (!searchTerm) return;
    if (q !== undefined) setQuery(q);

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results ?? data.fruits ?? [];
      setResults(list);
    } catch (e) {
      setError(e?.message?.includes("fetch") ? "Couldn't reach the search service." : `Something went wrong: ${e.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-hero">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft mb-6">
            <span className="h-2 w-2 rounded-full bg-primary-glow animate-pulse" />
            AI-powered semantic search
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[1.05]">
            Find your perfect <span className="italic text-primary">fruit</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Describe a flavor, a craving, a moment — we'll match it with nature's best.
          </p>
        </header>

        {/* Search */}
        <SearchBar value={query} onChange={setQuery} onSearch={() => runSearch()} loading={loading} />

        {/* Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => runSearch(s)}
              className="text-sm px-3.5 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 hover:bg-accent text-foreground transition-all shadow-soft"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results */}
        <section className="mt-14 max-w-7xl mx-auto">
          <ResultsList results={results} loading={loading} error={error} hasSearched={hasSearched} />
        </section>
      </div>
    </main>
  );
};

export default HomePage;

