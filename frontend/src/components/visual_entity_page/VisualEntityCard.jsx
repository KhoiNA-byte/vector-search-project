import { Trophy } from "lucide-react";
import { useState } from "react";
import SimilarityBar from "../SimilarityBar.jsx";

const VisualEntityCard = ({ entity, rank, onClick, loading }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (loading) {
    return (
      <div className="group relative rounded-2xl overflow-hidden border border-amber-800/10 animate-pulse bg-stone-100/40 aspect-[4/3]">
        <div className="absolute bottom-0 inset-x-0 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-2 w-10 bg-amber-800/25 rounded" />
            <div className="h-2 w-8 bg-amber-800/25 rounded" />
          </div>
          <div className="h-1.5 w-full bg-amber-800/15 rounded-full" />
        </div>
      </div>
    );
  }

  const similarity = entity.similarity;
  const hasSimilarity = typeof similarity === "number" && similarity > 0;
  const isTop = rank === 1 && hasSimilarity;

  return (
    <div
      onClick={() => onClick?.(entity)}
      className={`group relative rounded-2xl overflow-hidden border cursor-pointer
                  transition-all duration-300 ease-out
                  hover:scale-[1.03] hover:shadow-[0_20px_48px_var(--color-amber-800/0.12)]
                  ${isTop
                    ? "border-amber-800/40 shadow-[0_8px_32px_var(--color-amber-800/0.08)]"
                    : "border-stone-200"
                  }`}
    >
      {/* Rank badge */}
      {hasSimilarity && (
        <div
          className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1
                      text-[11px] font-bold backdrop-blur-md border
                      ${isTop
                        ? "bg-amber-800/20 border-amber-800/35 text-stone-900"
                        : "bg-white/85 border-stone-200 text-amber-800"
                      }`}
        >
          {isTop && <Trophy className="h-3 w-3 text-amber-800" />}
          #{rank}
        </div>
      )}

      {/* Image — fills the card completely */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100/40">
        {/* Spinner while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-stone-200 border-t-amber-800 rounded-full animate-spin" />
          </div>
        )}

        <img
          src={entity.img}
          alt={`Visual entity ${rank}`}
          onLoad={() => setImageLoaded(true)}
          className={`block w-full h-full object-cover transition-all duration-500
                      group-hover:scale-[1.04]
                      ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        />

        {/* Subtle gradient — only at the very bottom, light touch */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Similarity info — overlaid on the image bottom, only when present */}
        {hasSimilarity && (
          <div className="absolute bottom-0 inset-x-0 px-4 py-3
                          bg-gradient-to-t from-black/70 via-black/30 to-transparent">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/60 font-bold">
                Match
              </span>
              <span className={`text-sm font-bold ${isTop ? "text-lime-400" : "text-white/90"}`}>
                {similarity}%
              </span>
            </div>
            <SimilarityBar value={similarity} highlight={isTop} type="visual" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualEntityCard;
