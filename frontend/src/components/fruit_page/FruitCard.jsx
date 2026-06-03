import { MapPin, Calendar, Sparkles, Utensils, Tag, Trophy, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SimilarityBar from "../SimilarityBar.jsx";
import { parseColors, buildColorClasses } from "../../lib/colorUtils.js";

// ─── Row component ────────────────────────────────────────────────────────────

const Row = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-stone-500">{label}: </span>
        <span className="text-stone-800 font-medium">{value}</span>
      </div>
    </div>
  );
};

// ─── FruitCard ────────────────────────────────────────────────────────────────

const FruitCard = ({ fruit, rank, similarity }) => {
  const navigate = useNavigate();
  const hasSimilarity = typeof similarity === "number" && similarity > 0;
  const isTop = rank === 1 && hasSimilarity;

  const { bg, hoverBg } = buildColorClasses(parseColors(fruit.colorOutside));

  return (
    <div
      onClick={() => navigate(`/fruit/${fruit.id}`)}
      className={[
        "group relative rounded-2xl p-6 pt-7 cursor-pointer select-none",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-2",
        isTop ? "ring-2 ring-emerald-400/50" : "",
        bg,
        hoverBg,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        border: "1px solid rgba(160, 215, 180, 0.45)",
        boxShadow: isTop
          ? "0 8px 32px -6px rgba(34, 130, 70, 0.22), 0 2px 8px -2px rgba(34, 130, 70, 0.12), 0 0 0 1px rgba(82, 192, 65, 0.15)"
          : "0 4px 20px -4px rgba(34, 100, 60, 0.14), 0 1px 4px -1px rgba(34, 100, 60, 0.08)",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* ── Rank badge ───────────────────────────────────────────── */}
      {hasSimilarity && (
        <div
          className="absolute -top-3 -left-3 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
          style={isTop ? {
            background: "linear-gradient(135deg, #1a5c35 0%, #27ae60 100%)",
            color: "#fff",
            boxShadow: "0 4px 14px -2px rgba(34, 140, 70, 0.45), 0 0 0 2px rgba(82, 192, 65, 0.25)",
          } : {
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(160,215,180,0.5)",
            color: "#2d5a3e",
            boxShadow: "0 2px 8px -2px rgba(34, 100, 60, 0.15)",
          }}
        >
          {isTop && <Trophy className="h-3 w-3" />}
          #{rank}
        </div>
      )}

      {/* ── Header row: name + price + slide-in button ───────────── */}
      <div className="flex items-start justify-between mb-2 gap-3">
        <h3 className="font-display text-2xl font-bold text-stone-900 leading-tight">
          {fruit.name}
        </h3>

        <div className="flex items-center gap-2 shrink-0">
          {/* Price badge */}
          {fruit.price !== undefined && (
            <span className="bg-white/70 border border-stone-200 text-stone-700 rounded-full px-3 py-1 text-sm font-semibold">
              ${fruit.price}
            </span>
          )}

          {/* View Details — slides in from the right on hover */}
          <div
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
              "bg-stone-800 text-white shadow-md",
              "opacity-0 translate-x-3",
              "group-hover:opacity-100 group-hover:translate-x-0",
              "transition-all duration-300 ease-out",
              "pointer-events-none",
            ].join(" ")}
          >
            View Details
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* ── Color chips ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3 text-xs font-medium text-stone-500">
        {fruit.colorOutside && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-stone-200 shadow-sm" style={{ backgroundColor: fruit.colorOutside.split('/')[0] === 'white' ? '#f5f5f4' : fruit.colorOutside.split('/')[0] }} />
            <span className="capitalize">{fruit.colorOutside} (Skin)</span>
          </div>
        )}
        {fruit.colorInside && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-stone-200 shadow-sm" style={{ backgroundColor: fruit.colorInside.split('/')[0] === 'white' ? '#f5f5f4' : fruit.colorInside.split('/')[0] }} />
            <span className="capitalize">{fruit.colorInside} (Flesh)</span>
          </div>
        )}
      </div>


      {/* ── Similarity bar ───────────────────────────────────────── */}
      {hasSimilarity && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#4a8c62", letterSpacing: "0.08em" }}>
              Match
            </span>
            <span
              className="text-sm font-black"
              style={isTop ? {
                background: "linear-gradient(135deg, #1a5c35, #27ae60)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              } : { color: "#2d5a3e" }}
            >
              {similarity}%
            </span>
          </div>
          <SimilarityBar
            value={similarity}
            highlight={isTop}
            gradient={
              isTop
                ? "linear-gradient(90deg, #1a5c35 0%, #27ae60 50%, #52c041 100%)"
                : "linear-gradient(90deg, #2e8b57 0%, #4aad6a 60%, #7ed56a 100%)"
            }
            glowColor="rgba(82, 192, 65, 0.55)"
            trackColor="rgba(160, 215, 180, 0.25)"
          />
        </div>
      )}

      {/* ── Detail rows ──────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <Row icon={MapPin}   label="Origin"   value={fruit.origin}  />
        <Row icon={Calendar} label="Season"   value={fruit.season}  />
        <Row icon={Sparkles} label="Texture"  value={fruit.texture} />
        <Row icon={Tag}      label="Flavor"   value={fruit.flavor}  />
        <Row icon={Utensils} label="Best for" value={fruit.bestFor} />
      </div>
    </div>
  );
};

export default FruitCard;
