import { useState } from "react";
import { motion } from "framer-motion";
import FruitCard from "./FruitCard.jsx";
import { Button } from "../ui/Button.jsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 85,
      damping: 14,
      mass: 0.8
    }
  }
};

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

const FruitResultsList = ({ results, loading, error, hasSearched }) => {
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
      <motion.div
        key={currentPage}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2"
      >
        {currentResults.map((fruit, idx) => (
          <motion.div key={fruit.id || startIndex + idx} variants={cardVariants} layout>
            <FruitCard
              fruit={fruit}
              rank={startIndex + idx + 1}
              similarity={fruit.similarity}
            />
          </motion.div>
        ))}
      </motion.div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="outline"
            className="flex items-center gap-2 rounded-full px-5 py-2 border-fruit-emerald-100/60 bg-fruit-emerald-100 text-fruit-emerald-700 hover:bg-fruit-emerald-100/80 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`h-9 w-9 rounded-full text-sm font-medium transition-all ${currentPage === i + 1
                    ? "bg-fruit-emerald-800 text-white shadow-md"
                    : "bg-fruit-emerald-100 border border-fruit-emerald-100/60 text-fruit-emerald-700 hover:bg-fruit-emerald-100/80"
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
            className="flex items-center gap-2 rounded-full px-5 py-2 border-fruit-emerald-100/60 bg-fruit-emerald-100 text-fruit-emerald-700 hover:bg-fruit-emerald-100/80 disabled:opacity-30"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FruitResultsList;
