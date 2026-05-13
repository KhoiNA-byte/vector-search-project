import { useState } from "react";
import SearchBar from "../../../components/SearchBar.jsx";
import FruitResultsList from "../../../components/fruit_page/FruitResultsList.jsx";
import { fruitService } from "../../../services/fruitService.js";
import { useNavigate } from "react-router-dom";

import "./FruitPage.css";

const SUGGESTIONS = [
  "sweet yellow fruit",
  "refreshing fruit for summer",
  "fruit for smoothies",
  "exotic tropical fruit",
];

const FruitPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchAllFruits = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setQuery("");

    try {
      const data = await fruitService.getAllFruits();
      setResults(data);
    } catch (e) {
      setError(e?.message?.includes("fetch") ? "Couldn't reach the backend service." : `Something went wrong: ${e.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (q) => {
    const searchTerm = (q ?? query).trim();
    if (!searchTerm) return;
    if (q !== undefined) setQuery(q);

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await fruitService.searchFruits(searchTerm);
      setResults(data);
    } catch (e) {
      setError(e?.message?.includes("fetch") ? "Couldn't reach the search service." : `Something went wrong: ${e.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fruit-page-container">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="fruit-hero-badge">
            <span className="h-2 w-2 rounded-full bg-primary-glow animate-pulse" />
            AI-powered semantic search
          </div>
          <h1 className="fruit-hero-title">
            Find your perfect <span className="italic text-primary">fruit</span>.
          </h1>
          <p className="fruit-hero-subtitle">
            Describe a flavor, a craving, a moment — we'll match it with nature's best.
          </p>
        </header>

        {/* Search */}
        <div className="flex flex-col gap-4">
          <SearchBar 
            value={query} 
            onChange={setQuery} 
            onSearch={() => runSearch()} 
            loading={loading}
            placeholder="Search for fruits..."
            className="fruit-searchbar-container"
            buttonClassName="fruit-searchbar-button"
          />
          <div className="flex justify-center">
            <button
              onClick={fetchAllFruits}
              disabled={loading}
              className="fruit-explore-btn"
            >
              Explore all available fruits
            </button>
            <button
                onClick={() => navigate(`/fruit/create`)}
                disabled={loading}
                className="fruit-explore-btn"
            >
              Add Fruit
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => runSearch(s)}
              className="fruit-suggestion-btn"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results */}
        <section className="mt-14 max-w-7xl mx-auto">
          <FruitResultsList results={results} loading={loading} error={error} hasSearched={hasSearched} />
        </section>
      </div>
    </main>
  );
};

export default FruitPage;

