import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

const FruitFilterBar = ({
  sortBy,
  setSortBy,
  resultsCount,
  hasSearchQuery
}) => {
  const handlePriceClick = () => {
    if (sortBy === "priceAsc") {
      setSortBy("priceDesc");
    } else if (sortBy === "priceDesc") {
      setSortBy("default");
    } else {
      setSortBy("priceAsc");
    }
  };

  const handleNameClick = () => {
    if (sortBy === "nameAsc") {
      setSortBy("nameDesc");
    } else if (sortBy === "nameDesc") {
      setSortBy("default");
    } else {
      setSortBy("nameAsc");
    }
  };

  const isPriceActive = sortBy === "priceAsc" || sortBy === "priceDesc";
  const isNameActive = sortBy === "nameAsc" || sortBy === "nameDesc";

  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/70 shadow-md p-4 transition-all duration-300">
      {/* Result Count Summary */}
      <span className="text-sm text-fruit-emerald-950 font-bold">
        Available fruits ({resultsCount})
      </span>

      {/* Sort Buttons */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1">
          Sort by:
        </span>

        {/* Default / Relevance Sort */}
        {hasSearchQuery && (
          <button
            onClick={() => setSortBy("default")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
              sortBy === "default"
                ? "bg-fruit-emerald-800 border-fruit-emerald-800 text-white shadow-fruit-emerald-800/10"
                : "bg-white/60 border-white/80 hover:bg-white text-fruit-emerald-700"
            }`}
          >
            Best Match
          </button>
        )}

        {/* Sort by Price */}
        <button
          onClick={handlePriceClick}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
            isPriceActive
              ? "bg-fruit-emerald-800 border-fruit-emerald-800 text-white shadow-fruit-emerald-800/10"
              : "bg-white/60 border-white/80 hover:bg-white text-fruit-emerald-700"
          }`}
        >
          Price
          {sortBy === "priceAsc" && <ArrowUp className="h-3.5 w-3.5" />}
          {sortBy === "priceDesc" && <ArrowDown className="h-3.5 w-3.5" />}
          {!isPriceActive && <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
        </button>

        {/* Sort by Name */}
        <button
          onClick={handleNameClick}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
            isNameActive
              ? "bg-fruit-emerald-800 border-fruit-emerald-800 text-white shadow-fruit-emerald-800/10"
              : "bg-white/60 border-white/80 hover:bg-white text-fruit-emerald-700"
          }`}
        >
          Name
          {sortBy === "nameAsc" && <ArrowUp className="h-3.5 w-3.5" />}
          {sortBy === "nameDesc" && <ArrowDown className="h-3.5 w-3.5" />}
          {!isNameActive && <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
        </button>
      </div>
    </div>
  );
};

export default FruitFilterBar;
