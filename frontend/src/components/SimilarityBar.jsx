const SimilarityBar = ({ value, highlight }) => {
  const percentage = Math.round(value * 100);
  
  return (
    <div className="w-full">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 rounded-full ${
            highlight ? 'bg-gradient-primary shadow-glow' : 'bg-primary/40'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SimilarityBar;

