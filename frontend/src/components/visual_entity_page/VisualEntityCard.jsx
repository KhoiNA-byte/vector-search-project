import { Trophy } from "lucide-react";
import SimilarityBar from "../SimilarityBar.jsx";

const VisualEntityCard = ({ entity, rank }) => {
  const similarity = entity.similarity;
  const hasSimilarity = typeof similarity === 'number' && similarity > 0;
  const isTop = rank === 1 && hasSimilarity;

  return (
    <div
      className={`group relative bg-[#121212] rounded-3xl overflow-hidden border transition-all duration-500 hover:-translate-y-2 ${
        isTop ? "border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.4)]" : "border-white/5"
      }`}
    >
      {/* Rank badge */}
      {hasSimilarity && (
        <div
          className={`absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-md border ${
            isTop
              ? "bg-cyan-400/20 border-cyan-400/40 text-cyan-400"
              : "bg-black/40 border-white/10 text-white/70"
          }`}
        >
          {isTop && <Trophy className="h-3 w-3" />}
          #{rank}
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={entity.img}
          alt={`Visual entity ${rank}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-transparent to-transparent opacity-80" />
      </div>

      {/* Content Area */}
      <div className="p-6 pt-2">
        {/* Similarity Match */}
        {hasSimilarity && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-bold">Match</span>
              <span className={`text-sm font-bold ${isTop ? "text-cyan-400" : "text-white/80"}`}>{similarity}%</span>
            </div>
            <SimilarityBar value={similarity} highlight={isTop} type="visual" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualEntityCard;
