import { Trophy } from "lucide-react";
import { useState } from "react";
import SimilarityBar from "../SimilarityBar.jsx";

const VisualEntityCard = ({ entity, rank, onClick, loading }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (loading) {
    return (
      <div className="group relative rounded-2xl overflow-hidden border border-white/5 animate-pulse bg-white/5 aspect-[4/3]">
        <div className="absolute bottom-0 inset-x-0 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-2 w-10 bg-white/10 rounded" />
            <div className="h-2 w-8 bg-white/10 rounded" />
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full" />
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
                  hover:scale-[1.03] hover:shadow-[0_20px_48px_rgba(0,0,0,0.5)]
                  ${isTop
                    ? "border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                    : "border-white/[0.07]"
                  }`}
    >
      {/* Rank badge */}
      {hasSimilarity && (
        <div
          className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1
                      text-[11px] font-bold backdrop-blur-md border
                      ${isTop
                        ? "bg-cyan-400/20 border-cyan-400/40 text-cyan-400"
                        : "bg-black/40 border-white/10 text-white/70"
                      }`}
        >
          {isTop && <Trophy className="h-3 w-3" />}
          #{rank}
        </div>
      )}

      {/* Image — fills the card completely */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        {/* Spinner while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
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
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold">
                Match
              </span>
              <span className={`text-sm font-bold ${isTop ? "text-cyan-400" : "text-white/80"}`}>
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
