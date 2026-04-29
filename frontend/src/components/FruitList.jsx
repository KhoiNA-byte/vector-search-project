import FruitCard from '../components/FruitCard';
import { Search } from 'lucide-react';

const FruitList = ({ results, loading }) => {
  if (results.length === 0 && !loading) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">Start searching for fruits</h2>
        <p className="text-gray-500 dark:text-zinc-500 mt-2">Try searching by description, color, or origin</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((fruit, idx) => (
        <FruitCard key={fruit.ID || idx} fruit={fruit} />
      ))}
    </div>
  );
};

export default FruitList;

