import FruitCard from "./FruitCard";

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

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {results.map((fruit, idx) => (
        <FruitCard 
          key={fruit.id || idx} 
          fruit={fruit} 
          rank={idx + 1}
          similarity={fruit.similarity} 
        />
      ))}
    </div>
  );
};

export default ResultsList;
