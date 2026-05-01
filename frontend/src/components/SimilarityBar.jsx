const SimilarityBar = ({ value, highlight }) => {
  // value is now 0-100 from BE
  const normalizedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-full ${
            highlight ? 'bg-gradient-primary shadow-glow' : 'bg-primary/40'
          }`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
};

export default SimilarityBar;
