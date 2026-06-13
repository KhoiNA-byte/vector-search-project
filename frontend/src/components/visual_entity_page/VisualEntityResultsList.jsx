import { useState } from "react";
import { motion } from "framer-motion";
import VisualEntityCard from "./VisualEntityCard.jsx";
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
        {[...Array(6)].map((_, i) => <VisualEntityCard key={i} loading />)}
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
      <motion.div
        key={currentPage}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        {currentResults.map((item, idx) => (
          <motion.div key={item.id || startIndex + idx} variants={cardVariants} layout>
            <VisualEntityCard
              entity={item}
              rank={startIndex + idx + 1}
              onClick={onEntityClick}
            />
          </motion.div>
        ))}
      </motion.div>

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

