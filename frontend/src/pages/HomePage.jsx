import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fruitService } from '../services/fruitService';

const HomePage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isHealthy = await fruitService.checkHealth();
        setHealth(isHealthy ? 'Healthy' : 'Unhealthy');
      } catch (err) {
        setHealth('Error');
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-orange-500 dark:bg-zinc-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-5xl font-bold mb-8 italic">Fruit Searcher</h1>
      
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/20 flex flex-col items-center">
        <div className="mb-6 flex items-center space-x-2">
          <span className="text-xl">System Status:</span>
          {loading ? (
            <span className="text-gray-300">Checking...</span>
          ) : (
            <span className={`font-bold px-3 py-1 rounded-full text-sm ${
              health === 'Healthy' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {health}
            </span>
          )}
        </div>

        <Link 
          to="/search" 
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105"
        >
          Go to Search
        </Link>
      </div>
      
      <p className="mt-8 text-white/60">Search for your favorite fruits with vector embeddings.</p>
    </div>
  );
};

export default HomePage;

