import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import FruitList from '../components/FruitList';
import { fruitService } from '../services/fruitService';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearchParams({ q: query });
    
    setLoading(true);
    setError(null);
    try {
      const data = await fruitService.search(query);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      // Trigger search if query exists in URL on load
      fruitService.search(q)
        .then(setResults)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-orange-500 dark:bg-zinc-900 transition-colors duration-200">
      <Header 
        query={query} 
        setQuery={setQuery} 
        onSearch={handleSearch} 
        loading={loading} 
      />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <FruitList results={results} loading={loading} />
      </main>
    </div>
  );
};

export default SearchPage;

