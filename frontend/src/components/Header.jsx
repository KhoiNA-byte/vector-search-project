import { Search, Citrus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = ({ query, setQuery, onSearch, loading }) => {
  return (
    <header className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Citrus className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white m-0 tracking-tight">
              Fruit <span className="text-purple-600">Vector</span> Search
            </h1>
          </Link>

          <form onSubmit={onSearch} className="relative flex-1 max-w-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fruits (e.g. 'tropical yellow fruit from asia')"
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-zinc-700 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              {loading ? '...' : 'Search'}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;

