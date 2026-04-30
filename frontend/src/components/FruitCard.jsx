import { MapPin, Calendar, Sparkles, Utensils, Tag, Trophy } from "lucide-react";
import SimilarityBar from "./SimilarityBar";

const Row = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="text-foreground font-medium">{value}</span>
      </div>
    </div>
  );
};

const FruitCard = ({ fruit, rank, similarity }) => {
  const pct = Math.round(similarity * 100);
  const isTop = rank === 1;

  return (
    <div
      className={`group relative bg-card rounded-2xl p-6 pt-7 shadow-soft hover:shadow-card border transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${
        isTop ? "border-primary/40 ring-2 ring-primary/20" : "border-border/60"
      }`}
    >
      {/* Rank badge */}
      <div
        className={`absolute -top-3 -left-3 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-card ${
          isTop
            ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
            : "bg-card border border-border text-foreground"
        }`}
      >
        {isTop && <Trophy className="h-3 w-3" />}
        #{rank}
      </div>

      <div className="flex items-start justify-between mb-2 gap-3">
        <h3 className="font-display text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
          {fruit.name}
        </h3>
        {fruit.price !== undefined && (
          <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-sm font-semibold shrink-0">
            ${fruit.price}
          </span>
        )}
      </div>

      {/* Similarity */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Match</span>
          <span className={`text-sm font-bold ${isTop ? "text-primary" : "text-foreground"}`}>{pct}%</span>
        </div>
        <SimilarityBar value={similarity} highlight={isTop} />
      </div>

      <div className="space-y-2.5">
        <Row icon={MapPin} label="Origin" value={fruit.origin} />
        <Row icon={Calendar} label="Season" value={fruit.season} />
        <Row icon={Sparkles} label="Texture" value={fruit.texture} />
        <Row icon={Tag} label="Flavor" value={fruit.flavor} />
        <Row icon={Utensils} label="Best for" value={fruit.bestFor} />
      </div>
    </div>
  );
};

export default FruitCard;

