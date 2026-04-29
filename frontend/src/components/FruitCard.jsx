import { Globe, Calendar, Palette } from 'lucide-react';

const FruitCard = ({ fruit }) => {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-gray-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{fruit.Name}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
          <Globe className="w-4 h-4" />
          <span>Origin: {fruit.Origin}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
          <Calendar className="w-4 h-4" />
          <span>Season: {fruit.Season}</span>
        </div>
        {fruit.color && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
            <Palette className="w-4 h-4" />
            <span>Color: {fruit.Color}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FruitCard;

