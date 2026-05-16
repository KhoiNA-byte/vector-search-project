import { useState } from "react";
import VisualEntityCard from "./VisualEntityCard.jsx";
import { Button } from "../ui/Button.jsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SkeletonCard = () => (
  <div className="aspect-square bg-[#121212] rounded-3xl overflow-hidden border border-white/5 animate-pulse flex flex-col">
    <div className="flex-1 bg-white/5" />
    <div className="p-6 space-y-3">
      <div className="flex justify-between">
        <div className="h-2 w-10 bg-white/10 rounded" />
        <div className="h-2 w-8 bg-white/10 rounded" />
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full" />
    </div>
  </div>
);

const VisualEntityResultsList = ({ results, loading, error, hasSearched, onEntityClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Reset to first page when results change
  const [prevResults, setPrevResults] = useState(results);
  if (results !== prevResults) {
    setPrevResults(results);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20">
        {error}
      </div>
    );
  }

  if (hasSearched && results.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground font-light tracking-wide">
        No visual matches found for your description.
      </div>
    );
  }

  if (!hasSearched) return null;

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = results.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {currentResults.map((item, idx) => (
          <VisualEntityCard
            key={item.id || startIndex + idx}
            entity={item}
            rank={startIndex + idx + 1}
            onClick={onEntityClick}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12 relative z-30">
          <Button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="outline"
            className="flex items-center gap-2 rounded-full px-5 py-2 border-white/10 bg-black-600 text-white/70 hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`h-9 w-9 rounded-full text-sm font-medium transition-all ${
                  currentPage === i + 1 
                    ? "bg-gradient-visual text-white shadow-glow-visual" 
                    : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20 hover:text-white"
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
            className="flex items-center gap-2 rounded-full px-5 py-2 border-white/10 bg-black-600 text-white/70 hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VisualEntityResultsList;

