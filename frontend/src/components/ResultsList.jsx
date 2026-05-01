import { useState } from "react";
import FruitCard from "./FruitCard";
import { Button } from "./ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SkeletonCard = () => (
  <div className="bg-card rounded-2xl p-6 shadow-soft border border-border/60 animate-pulse">
    <div className="h-7 w-2/3 bg-muted rounded mb-4" />
    <div className="h-2 w-full bg-muted rounded mb-4" />
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded w-full" />
      ))}
    </div>
  </div>
);

const ResultsList = ({ results, loading, error, hasSearched }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset to first page when results change
  const [prevResults, setPrevResults] = useState(results);
  if (results !== prevResults) {
    setPrevResults(results);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-destructive/20 shadow-soft">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-muted-foreground text-sm mt-2">
          Make sure the backend is running.
        </p>
      </div>
    );
  }

  if (hasSearched && results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🍃</div>
        <p className="text-lg font-medium text-foreground">No fruits found.</p>
        <p className="text-muted-foreground mt-1">Try a different description.</p>
      </div>
    );
  }

  if (!hasSearched) return null;

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = results.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {currentResults.map((fruit, idx) => (
          <FruitCard 
            key={fruit.id || startIndex + idx} 
            fruit={fruit} 
            rank={startIndex + idx + 1}
            similarity={fruit.similarity}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="outline"
            className="flex items-center gap-2 rounded-full px-4"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`h-8 w-8 rounded-full text-sm font-medium transition-all ${
                  currentPage === i + 1 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "bg-card border border-border hover:bg-accent"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            className="flex items-center gap-2 rounded-full px-4"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResultsList;
