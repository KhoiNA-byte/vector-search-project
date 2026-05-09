import { useState } from "react";
import SearchBar from "../../components/SearchBar";
import VisualEntityResultsList from "../../components/visual_entity_page/VisualEntityResultsList.jsx";
import { visualEntityService } from "../../services/visualEntityService";
import "./VisualEntityPage.css";

const SUGGESTIONS = [
  "warm sunset over mountains",
  "blue ocean scenery",
  "snowy winter landscape",
  "pink spring flowers",
  "city at night",
];

const VisualEntityPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setQuery("");

    try {
      const data = await visualEntityService.getAllVisualEntities();
      setResults(data);
    } catch (e) {
      setError(`Failed to load images: ${e.message}`);
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
      const data = await visualEntityService.searchVisualEntities(searchTerm);
      setResults(data);
    } catch (e) {
      setError(`Search failed: ${e.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="visual-page-container">
      <div className="container mx-auto px-4 relative">
        {/* Glow Effects */}
        <div className="visual-page-glow-purple" />
        <div className="visual-page-glow-blue" />

        {/* Header */}
        <header className="text-center max-w-4xl mx-auto mb-16 relative z-10">
          <div className="visual-hero-badge">
            <span className="visual-hero-badge-dot" />
            CLIP-style image embedding demo
          </div>
          
          <h1 className="visual-hero-title">
            Search images by <br />
            <span className="visual-hero-vibe">vibe.</span>
          </h1>
          
          <p className="visual-hero-subtitle">
            Describe a scene, mood, or aesthetic — vectors find the closest visual match.
          </p>
        </header>

        {/* Search Section */}
        <div className="max-w-3xl mx-auto mb-20 relative z-20">
          <div className="flex flex-col gap-4">
            <SearchBar 
              value={query} 
              onChange={setQuery} 
              onSearch={() => runSearch()} 
              loading={loading} 
              placeholder="Find your scenery"
              className="visual-searchbar-container"
              buttonClassName="visual-searchbar-button"
            />
            <div className="flex justify-center">
              <button
                onClick={fetchAll}
                disabled={loading}
                className="visual-explore-btn"
              >
                Explore all available visuals
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mr-2">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => runSearch(s)}
                className="visual-suggestion-btn"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <section className="mt-12">
          <VisualEntityResultsList 
            results={results}
            loading={loading}
            error={error}
            hasSearched={hasSearched}
          />
        </section>
      </div>
    </main>
  );
};

export default VisualEntityPage;

